'use strict';

/**
 * professional-reference service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::professional-reference.professional-reference', ({ strapi }) => ({
  
  // Find references by doctor with enhanced filtering
  async findByDoctorId(doctorId) {
    try {
      const references = await strapi.entityService.findMany('api::professional-reference.professional-reference', {
        filters: {
          doctor: doctorId,
          isActive: true
        },
        populate: {
          doctor: {
            select: ['id', 'firstName', 'lastName', 'email']
          }
        },
        sort: { createdAt: 'desc' }
      });
      
      return references || [];
    } catch (error) {
      console.error('Error in findByDoctorId service:', error);
      throw error;
    }
  },

  // Validate reference data
  validateReferenceData(referenceData) {
    const required = ['firstName', 'lastName', 'position', 'organisation', 'email'];
    const missing = required.filter(field => !referenceData[field] || !referenceData[field].trim());
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(referenceData.email)) {
      throw new Error('Invalid email format');
    }
    
    return true;
  },

  // Bulk save references for a doctor
  async bulkSaveReferences(doctorId, references, documentType = 'professional-references') {
    try {
      // Validate all references first
      references.forEach(ref => this.validateReferenceData(ref));
      
      // Delete existing references
      const existingReferences = await strapi.entityService.findMany('api::professional-reference.professional-reference', {
        filters: {
          doctor: doctorId,
          documentType: documentType
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
            documentType: documentType,
            isActive: true
          }
        });
        savedReferences.push(savedRef);
      }
      
      return savedReferences;
    } catch (error) {
      console.error('Error in bulkSaveReferences service:', error);
      throw error;
    }
  }
}));
