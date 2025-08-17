'use strict';

/**
 * system-setting controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::system-setting.system-setting', ({ strapi }) => ({
  // Standard update method for Strapi routes
  async update(ctx) {
    try {
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      
      const result = await strapi.entityService.update('api::system-setting.system-setting', id, {
        data
      });
      
      ctx.body = { data: result };
    } catch (error) {
      console.error('Error updating system setting:', error);
      ctx.badRequest('Error updating system setting');
    }
  },

  // Get a specific setting by key
  async findByKey(ctx) {
    try {
      const { key } = ctx.params;
      
      const setting = await strapi.entityService.findMany('api::system-setting.system-setting', {
        filters: { key },
        limit: 1
      });

      if (!setting || setting.length === 0) {
        return ctx.notFound('Setting not found');
      }

      // Parse the value based on dataType
      const settingData = setting[0];
      let parsedValue = settingData.value;

      switch (settingData.dataType) {
        case 'number':
          parsedValue = parseFloat(settingData.value);
          break;
        case 'boolean':
          parsedValue = settingData.value === 'true';
          break;
        case 'json':
          try {
            parsedValue = JSON.parse(settingData.value);
          } catch (e) {
            parsedValue = settingData.value;
          }
          break;
        default:
          parsedValue = settingData.value;
      }

      ctx.body = {
        data: {
          ...settingData,
          parsedValue
        }
      };
    } catch (error) {
      console.error('Error fetching setting:', error);
      ctx.badRequest('Error fetching setting');
    }
  },

  // Update or create a setting
  async upsertByKey(ctx) {
    try {
      const { key } = ctx.params;
      const { value, dataType = 'string', description, category = 'general', isPublic = false } = ctx.request.body;

      // Validate value based on dataType
      let validatedValue = value;
      if (dataType === 'number') {
        validatedValue = parseFloat(value);
        if (isNaN(validatedValue)) {
          return ctx.badRequest('Invalid number value');
        }
        validatedValue = validatedValue.toString(); // Store as string
      } else if (dataType === 'boolean') {
        validatedValue = Boolean(value).toString();
      } else if (dataType === 'json') {
        try {
          JSON.parse(value); // Validate JSON
          validatedValue = value;
        } catch (e) {
          return ctx.badRequest('Invalid JSON value');
        }
      }

      // Check if setting exists
      const existingSetting = await strapi.entityService.findMany('api::system-setting.system-setting', {
        filters: { key },
        limit: 1
      });

      let result;
      if (existingSetting && existingSetting.length > 0) {
        // Update existing setting
        result = await strapi.entityService.update('api::system-setting.system-setting', existingSetting[0].id, {
          data: {
            value: validatedValue,
            dataType,
            description,
            category,
            isPublic
          }
        });
      } else {
        // Create new setting
        result = await strapi.entityService.create('api::system-setting.system-setting', {
          data: {
            key,
            value: validatedValue,
            dataType,
            description,
            category,
            isPublic
          }
        });
      }

      ctx.body = { data: result };
    } catch (error) {
      console.error('Error upserting setting:', error);
      ctx.badRequest('Error saving setting');
    }
  },

  // Get public settings (no authentication required)
  async getPublicSettings(ctx) {
    try {
      const settings = await strapi.entityService.findMany('api::system-setting.system-setting', {
        filters: { isPublic: true }
      });

      // Parse values and return as key-value pairs
      const parsedSettings = {};
      settings.forEach(setting => {
        let parsedValue = setting.value;
        switch (setting.dataType) {
          case 'number':
            parsedValue = parseFloat(setting.value);
            break;
          case 'boolean':
            parsedValue = setting.value === 'true';
            break;
          case 'json':
            try {
              parsedValue = JSON.parse(setting.value);
            } catch (e) {
              parsedValue = setting.value;
            }
            break;
        }
        parsedSettings[setting.key] = parsedValue;
      });

      ctx.body = { data: parsedSettings };
    } catch (error) {
      console.error('Error fetching public settings:', error);
      ctx.badRequest('Error fetching public settings');
    }
  }
}));
