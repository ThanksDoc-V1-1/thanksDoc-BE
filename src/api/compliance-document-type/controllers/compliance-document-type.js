'use strict';

/**
 * compliance-document-type controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::compliance-document-type.compliance-document-type', ({ strapi }) => ({
  // GET /api/compliance-document-types
  async find(ctx) {
    try {
      ('📝 GET compliance-document-types endpoint called');
      
      const { data, meta } = await super.find(ctx);
      
      (`📝 Found ${data.length} document types`);
      
      return {
        data,
        meta
      };
    } catch (error) {
      console.error('❌ Error in find compliance-document-types:', error);
      ctx.throw(500, 'Error fetching compliance document types');
    }
  },

  // GET /api/compliance-document-types/:id
  async findOne(ctx) {
    try {
      ('📝 GET compliance-document-type by ID endpoint called:', ctx.params.id);
      
      const { data, meta } = await super.findOne(ctx);
      
      return {
        data,
        meta
      };
    } catch (error) {
      console.error('❌ Error in findOne compliance-document-type:', error);
      ctx.throw(500, 'Error fetching compliance document type');
    }
  },

  // POST /api/compliance-document-types
  async create(ctx) {
    try {
      ('📝 POST compliance-document-types endpoint called');
      ('📝 Request body:', ctx.request.body);
      
      const { data } = ctx.request.body;
      
      // Validate required fields
      if (!data.key || !data.name) {
        return ctx.badRequest('Key and name are required fields');
      }
      
      // Check if key already exists
      const existingType = await strapi.entityService.findMany('api::compliance-document-type.compliance-document-type', {
        filters: { key: data.key }
      });
      
      if (existingType.length > 0) {
        return ctx.badRequest('Document type key already exists');
      }
      
      // Create the document type
      const entity = await strapi.entityService.create('api::compliance-document-type.compliance-document-type', {
        data: {
          key: data.key,
          name: data.name,
          description: data.description || '',
          required: data.required !== undefined ? data.required : true,
          isActive: data.isActive !== undefined ? data.isActive : true,
          displayOrder: data.displayOrder || 0,
          allowedFileTypes: data.allowedFileTypes || ["pdf", "doc", "docx", "jpg", "jpeg", "png"],
          maxFileSize: data.maxFileSize || 10485760,
          autoExpiry: data.autoExpiry !== undefined ? data.autoExpiry : true, // Enable auto-expiry by default
          validityYears: data.validityYears || (data.autoExpiry !== false ? 3 : null), // Default to 3 years
          expiryWarningDays: data.expiryWarningDays || 30 // Default warning 30 days before expiry
        }
      });
      
      ('✅ Created compliance document type:', entity);
      
      return {
        data: entity
      };
    } catch (error) {
      console.error('❌ Error in create compliance-document-type:', error);
      ctx.throw(500, 'Error creating compliance document type');
    }
  },

  // PUT /api/compliance-document-types/:id
  async update(ctx) {
    try {
      ('📝 PUT compliance-document-type endpoint called:', ctx.params.id);
      ('📝 Request body:', ctx.request.body);
      
      const { id } = ctx.params;
      const { data } = ctx.request.body;
      
      // Don't allow changing the key after creation
      if (data.key) {
        delete data.key;
      }
      
      const entity = await strapi.entityService.update('api::compliance-document-type.compliance-document-type', id, {
        data: {
          name: data.name,
          description: data.description,
          required: data.required,
          isActive: data.isActive,
          displayOrder: data.displayOrder,
          allowedFileTypes: data.allowedFileTypes,
          maxFileSize: data.maxFileSize,
          autoExpiry: data.autoExpiry !== undefined ? data.autoExpiry : true, // Default to auto-expiry enabled
          validityYears: data.validityYears || (data.autoExpiry !== false ? 3 : null), // Default to 3 years
          expiryWarningDays: data.expiryWarningDays || 30 // Default warning 30 days before expiry
        }
      });
      
      ('✅ Updated compliance document type:', entity);
      
      return {
        data: entity
      };
    } catch (error) {
      console.error('❌ Error in update compliance-document-type:', error);
      ctx.throw(500, 'Error updating compliance document type');
    }
  },

  // DELETE /api/compliance-document-types/:id
  async delete(ctx) {
    try {
      ('📝 DELETE compliance-document-type endpoint called:', ctx.params.id);
      
      const { id } = ctx.params;
      
      // Check if any compliance documents are using this type
      const documentsUsingType = await strapi.entityService.findMany('api::compliance-document.compliance-document', {
        filters: { documentType: id }
      });
      
      if (documentsUsingType.length > 0) {
        return ctx.badRequest('Cannot delete document type that is being used by existing documents');
      }
      
      const entity = await strapi.entityService.delete('api::compliance-document-type.compliance-document-type', id);
      
      ('✅ Deleted compliance document type:', entity);
      
      return {
        data: entity
      };
    } catch (error) {
      console.error('❌ Error in delete compliance-document-type:', error);
      ctx.throw(500, 'Error deleting compliance document type');
    }
  },

  // POST /api/compliance-document-types/enable-auto-expiry
  async enableAutoExpiry(ctx) {
    try {
      ('🚀 Enable auto-expiry migration endpoint called');

      // Call the migration service
      const result = await strapi.service('api::compliance-document-type.auto-expiry-migration').enableAutoExpiryForAllDocuments();
      
      return {
        success: true,
        message: 'Auto-expiry tracking enabled for all compliance documents',
        result
      };
    } catch (error) {
      console.error('❌ Error in enable auto-expiry migration:', error);
      ctx.throw(500, 'Error enabling auto-expiry for documents');
    }
  }
}));
