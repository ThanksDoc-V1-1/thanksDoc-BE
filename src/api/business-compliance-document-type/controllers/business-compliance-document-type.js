// @ts-nocheck
'use strict';

/**
 * business-compliance-document-type controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::business-compliance-document-type.business-compliance-document-type', ({ strapi }) => ({
  
  // GET /api/business-compliance-document-types
  async find(ctx) {
    try {
      console.log('📝 GET business-compliance-document-types endpoint called');
      
      const entities = await strapi.entityService.findMany('api::business-compliance-document-type.business-compliance-document-type', {
        sort: { displayOrder: 'asc', name: 'asc' },
        filters: ctx.query.filters,
        populate: ctx.query.populate,
      });
      
      console.log('✅ Found business compliance document types:', entities.length);
      
      return {
        data: entities,
        meta: {
          pagination: {
            total: entities.length
          }
        }
      };
    } catch (error) {
      console.error('❌ Error in find business-compliance-document-types:', error);
      ctx.throw(500, 'Failed to fetch business compliance document types');
    }
  },

  // GET /api/business-compliance-document-types/:id
  async findOne(ctx) {
    try {
      console.log('📝 GET business-compliance-document-type endpoint called:', ctx.params.id);
      
      const { id } = ctx.params;
      const entity = await strapi.entityService.findOne('api::business-compliance-document-type.business-compliance-document-type', id, {
        populate: ctx.query.populate,
      });
      
      if (!entity) {
        return ctx.notFound('Business compliance document type not found');
      }
      
      console.log('✅ Found business compliance document type:', entity.name);
      
      return {
        data: entity
      };
    } catch (error) {
      console.error('❌ Error in findOne business-compliance-document-type:', error);
      ctx.throw(500, 'Failed to fetch business compliance document type');
    }
  },

  // POST /api/business-compliance-document-types
  async create(ctx) {
    try {
      console.log('📝 POST business-compliance-document-type endpoint called');
      console.log('Request data:', ctx.request.body);
      
      const entity = await strapi.entityService.create('api::business-compliance-document-type.business-compliance-document-type', {
        data: ctx.request.body.data || ctx.request.body
      });
      
      console.log('✅ Created business compliance document type:', entity);
      
      return {
        data: entity
      };
    } catch (error) {
      console.error('❌ Error in create business-compliance-document-type:', error);
      
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        ctx.throw(400, 'A business compliance document type with this key already exists');
      }
      
      ctx.throw(500, 'Failed to create business compliance document type');
    }
  },

  // PUT /api/business-compliance-document-types/:id
  async update(ctx) {
    try {
      console.log('📝 PUT business-compliance-document-type endpoint called:', ctx.params.id);
      console.log('Request data:', ctx.request.body);
      
      const { id } = ctx.params;
      const entity = await strapi.entityService.update('api::business-compliance-document-type.business-compliance-document-type', id, {
        data: ctx.request.body.data || ctx.request.body
      });
      
      console.log('✅ Updated business compliance document type:', entity);
      
      return {
        data: entity
      };
    } catch (error) {
      console.error('❌ Error in update business-compliance-document-type:', error);
      
      if (error.message.includes('duplicate') || error.message.includes('unique')) {
        ctx.throw(400, 'A business compliance document type with this key already exists');
      }
      
      ctx.throw(500, 'Failed to update business compliance document type');
    }
  },

  // DELETE /api/business-compliance-document-types/:id
  async delete(ctx) {
    try {
      console.log('📝 DELETE business-compliance-document-type endpoint called:', ctx.params.id);
      
      const { id } = ctx.params;
      
      // Check if any business compliance documents are using this type
      const documentsUsingType = await strapi.entityService.findMany('api::business-compliance-document.business-compliance-document', {
        filters: { documentType: id }
      });
      
      if (documentsUsingType.length > 0) {
        return ctx.badRequest('Cannot delete document type that is being used by existing documents');
      }
      
      const entity = await strapi.entityService.delete('api::business-compliance-document-type.business-compliance-document-type', id);
      
      console.log('✅ Deleted business compliance document type:', entity);
      
      return {
        data: entity
      };
    } catch (error) {
      console.error('❌ Error in delete business-compliance-document-type:', error);
      ctx.throw(500, 'Failed to delete business compliance document type');
    }
  },

  // GET /api/business-compliance-document-types/active
  async getActive(ctx) {
    try {
      console.log('📝 GET active business-compliance-document-types endpoint called');
      
      const entities = await strapi.entityService.findMany('api::business-compliance-document-type.business-compliance-document-type', {
        filters: { isActive: true },
        sort: { displayOrder: 'asc', name: 'asc' }
      });
      
      console.log('✅ Found active business compliance document types:', entities.length);
      
      return {
        data: entities,
        meta: {
          pagination: {
            total: entities.length
          }
        }
      };
    } catch (error) {
      console.error('❌ Error in getActive business-compliance-document-types:', error);
      ctx.throw(500, 'Failed to fetch active business compliance document types');
    }
  }

}));
