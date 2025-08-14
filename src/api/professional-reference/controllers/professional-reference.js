'use strict';

/**
 * professional-reference controller
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::professional-reference.professional-reference', ({ strapi }) => ({
  // Get references for a specific doctor
  async findByDoctor(ctx) {
    try {
      const { doctorId } = ctx.params;
      
      console.log('🔍 Loading professional references for doctor:', doctorId);
      
      const references = await strapi.entityService.findMany('api::professional-reference.professional-reference', {
        filters: {
          doctor: doctorId,
          isActive: true
        },
        populate: {
          doctor: {
            fields: ['id', 'firstName', 'lastName', 'email']
          }
        },
        sort: { createdAt: 'desc' }
      });
      
      console.log('✅ Found references:', references?.length || 0);
      
      ctx.body = {
        success: true,
        data: {
          references: references || []
        }
      };
    } catch (error) {
      console.error('❌ Error fetching professional references:', error);
      ctx.throw(500, `Failed to fetch professional references: ${error.message}`);
    }
  },

  // Save multiple references for a doctor
  async saveReferences(ctx) {
    try {
      const { doctorId, documentType, references } = ctx.request.body;
      
      console.log('💾 Saving professional references for doctor:', doctorId);
      console.log('📝 References to save:', references?.length || 0);
      
      if (!doctorId || !references || !Array.isArray(references)) {
        return ctx.badRequest('Missing required fields: doctorId and references array');
      }
      
      // Validate each reference
      for (const ref of references) {
        if (!ref.firstName || !ref.lastName || !ref.position || !ref.organisation || !ref.email) {
          return ctx.badRequest('All reference fields are required: firstName, lastName, position, organisation, email');
        }
      }
      
      // Delete existing references for this doctor and document type
      const existingReferences = await strapi.entityService.findMany('api::professional-reference.professional-reference', {
        filters: {
          doctor: doctorId,
          documentType: documentType || 'professional-references'
        }
      });
      
      // Delete each existing reference individually
      for (const existingRef of existingReferences) {
        await strapi.entityService.delete('api::professional-reference.professional-reference', existingRef.id);
      }
      
      // Create new references
      const savedReferences = [];
      for (const ref of references) {
        const savedRef = await strapi.entityService.create('api::professional-reference.professional-reference', {
          data: {
            doctor: doctorId,
            firstName: ref.firstName.trim(),
            lastName: ref.lastName.trim(),
            position: ref.position.trim(),
            organisation: ref.organisation.trim(),
            email: ref.email.toLowerCase().trim(),
            documentType: documentType || 'professional-references',
            isActive: true
          }
        });
        savedReferences.push(savedRef);
      }
      
      console.log('✅ Successfully saved references:', savedReferences.length);
      
      // Create reference submission entries and send emails
      try {
        const submissionService = strapi.service('api::professional-reference-submission.professional-reference-submission');
        await submissionService.createReferenceSubmissions(doctorId, savedReferences);
        console.log('✅ Reference submission emails sent successfully');
      } catch (emailError) {
        console.error('❌ Error sending reference emails:', emailError);
        // Don't fail the entire request if emails fail
      }
      
      ctx.body = {
        success: true,
        data: {
          references: savedReferences,
          count: savedReferences.length
        },
        message: `Successfully saved ${savedReferences.length} professional references`
      };
    } catch (error) {
      console.error('❌ Error saving professional references:', error);
      ctx.throw(500, `Failed to save professional references: ${error.message}`);
    }
  },

  // Delete a specific reference
  async deleteReference(ctx) {
    try {
      const { id } = ctx.params;
      
      console.log('🗑️ Deleting professional reference:', id);
      
      const deletedRef = await strapi.entityService.delete('api::professional-reference.professional-reference', id);
      
      console.log('✅ Reference deleted successfully');
      
      ctx.body = {
        success: true,
        data: deletedRef,
        message: 'Professional reference deleted successfully'
      };
    } catch (error) {
      console.error('❌ Error deleting professional reference:', error);
      ctx.throw(500, `Failed to delete professional reference: ${error.message}`);
    }
  },

  // Get reference submissions for a doctor
  async getReferenceSubmissions(ctx) {
    try {
      const { doctorId } = ctx.params;
      
      console.log('🔍 Getting reference submissions for doctor:', doctorId);
      
      const submissions = await strapi.entityService.findMany('api::professional-reference-submission.professional-reference-submission', {
        filters: {
          doctor: doctorId
        },
        populate: {
          professionalReference: {
            fields: ['firstName', 'lastName', 'position', 'organisation', 'email']
          }
        },
        sort: { createdAt: 'desc' }
      });

      console.log('✅ Found reference submissions:', submissions?.length || 0);
      
      ctx.body = {
        success: true,
        data: {
          submissions: submissions || [],
          count: submissions?.length || 0
        },
        message: 'Reference submissions retrieved successfully'
      };

    } catch (error) {
      console.error('❌ Error getting reference submissions:', error);
      ctx.throw(500, `Failed to get reference submissions: ${error.message}`);
    }
  }
}));
