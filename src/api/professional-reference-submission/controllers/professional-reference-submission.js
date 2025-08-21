'use strict';

/**
 * professional-reference-submission controller
 */

const { createCoreController } = require('@strapi/strapi').factories;
const crypto = require('crypto');

module.exports = createCoreController('api::professional-reference-submission.professional-reference-submission', ({ strapi }) => ({
  
  // Get reference submission by token (for the form)
  async findByToken(ctx) {
    try {
      const { token } = ctx.params;
      
      if (!token) {
        return ctx.badRequest('Token is required');
      }

      ('🔍 Finding reference submission by token:', token);
      
      const submission = await strapi.entityService.findMany('api::professional-reference-submission.professional-reference-submission', {
        filters: {
          referenceToken: token
        },
        populate: {
          professionalReference: {
            fields: ['firstName', 'lastName', 'position', 'organisation', 'email']
          },
          doctor: {
            fields: ['firstName', 'lastName', 'email']
          }
        },
        limit: 1
      });

      if (!submission || submission.length === 0) {
        return ctx.notFound('Reference submission not found or token invalid');
      }

      const referenceSubmission = submission[0];

      ctx.send({
        success: true,
        data: {
          submission: referenceSubmission,
          doctor: referenceSubmission.doctor,
          reference: referenceSubmission.professionalReference
        },
        message: 'Reference submission found'
      });

    } catch (error) {
      console.error('❌ Error finding reference submission by token:', error);
      ctx.internalServerError('Failed to find reference submission');
    }
  },

  // Submit the reference form
  async submitReference(ctx) {
    try {
      const { token } = ctx.params;
      const submissionData = ctx.request.body;
      
      ('📝 Submitting reference form for token:', token);
      
      if (!token) {
        return ctx.badRequest('Token is required');
      }

      // Find the submission by token
      const submissions = await strapi.entityService.findMany('api::professional-reference-submission.professional-reference-submission', {
        filters: {
          referenceToken: token,
          isSubmitted: false
        },
        limit: 1
      });

      if (!submissions || submissions.length === 0) {
        return ctx.notFound('Reference submission not found or already submitted');
      }

      const submission = submissions[0];

      // Validate required fields
      const requiredFields = [
        'clinicianName', 'clinicianPosition', 'clinicianEmail',
        'refereeName', 'refereePosition', 'refereeWorkPlace',
        'workDuration', 'refereeEmail',
        'prescribing', 'medicalRecordKeeping', 'recognisingLimitations',
        'keepingKnowledgeUpToDate', 'reviewingPerformance', 'teachingStudents',
        'supervisingColleagues', 'commitmentToCare', 'communicationWithPatients',
        'workingEffectivelyWithColleagues', 'effectiveTimeManagement',
        'respectsPatientConfidentiality', 'honestAndTrustworthy', 'performanceNotImpaired',
        'fitToPractice', 'lastWorkedWith'
      ];

      for (const field of requiredFields) {
        if (!submissionData[field]) {
          return ctx.badRequest(`${field} is required`);
        }
      }

      // Update the submission with the form data
      const updatedSubmission = await strapi.entityService.update(
        'api::professional-reference-submission.professional-reference-submission',
        submission.id,
        {
          data: {
            ...submissionData,
            isSubmitted: true,
            submittedAt: new Date()
          }
        }
      );

      ('✅ Reference form submitted successfully:', updatedSubmission.id);

      ctx.send({
        success: true,
        data: updatedSubmission,
        message: 'Reference form submitted successfully'
      });

    } catch (error) {
      console.error('❌ Error submitting reference form:', error);
      ctx.internalServerError('Failed to submit reference form');
    }
  },

  // Get all submissions for a doctor (admin/doctor view)
  async getSubmissionsByDoctor(ctx) {
    try {
      const { doctorId } = ctx.params;
      
      ('🔍 Getting reference submissions for doctor:', doctorId);
      
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

      ctx.send({
        success: true,
        data: {
          submissions: submissions || [],
          count: submissions?.length || 0
        },
        message: 'Reference submissions retrieved successfully'
      });

    } catch (error) {
      console.error('❌ Error getting reference submissions:', error);
      ctx.internalServerError('Failed to get reference submissions');
    }
  }
}));
