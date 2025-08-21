// @ts-nocheck
'use strict';

/**
 * professional-reference-submission service
 */

const { createCoreService } = require('@strapi/strapi').factories;
const crypto = require('crypto');

module.exports = createCoreService('api::professional-reference-submission.professional-reference-submission', ({ strapi }) => ({

  // Generate a unique token for reference submission
  generateReferenceToken() {
    return crypto.randomBytes(32).toString('hex');
  },

  // Create reference submission entries and send emails
  async createReferenceSubmissions(doctorId, professionalReferences) {
    try {
      ('🎯 Creating reference submissions for doctor:', doctorId);
      ('📝 Number of references:', professionalReferences?.length);

      const submissions = [];
      const EmailService = require('../../../services/email.service');
      const emailService = new EmailService();

      // Get doctor details
      const doctor = await strapi.entityService.findOne('api::doctor.doctor', doctorId, {
        fields: ['firstName', 'lastName', 'email']
      });

      if (!doctor) {
        throw new Error('Doctor not found');
      }

      for (const reference of professionalReferences) {
        try {
          // Generate unique token for this reference
          const token = this.generateReferenceToken();
          
          // Create submission entry
          const submission = await strapi.entityService.create('api::professional-reference-submission.professional-reference-submission', {
            data: {
              professionalReference: reference.id,
              doctor: doctorId,
              referenceToken: token,
              isSubmitted: false,
              isEmailSent: false
            }
          });

          // Send email to reference
          try {
            const emailResult = await emailService.sendReferenceRequestEmail(
              reference.email,
              reference.firstName + ' ' + reference.lastName,
              doctor.firstName + ' ' + doctor.lastName,
              token
            );

            // Update submission to mark email as sent
            await strapi.entityService.update('api::professional-reference-submission.professional-reference-submission', submission.id, {
              data: {
                isEmailSent: true,
                emailSentAt: new Date()
              }
            });

            ('✅ Email sent to reference:', reference.email);
          } catch (emailError) {
            console.error('❌ Failed to send email to reference:', reference.email, emailError);
          }

          submissions.push(submission);
        } catch (refError) {
          console.error('❌ Error creating submission for reference:', reference.email, refError);
          console.error('❌ Error details:', JSON.stringify(refError.details, null, 2));
        }
      }

      ('✅ Created reference submissions:', submissions.length);
      return submissions;

    } catch (error) {
      console.error('❌ Error in createReferenceSubmissions:', error);
      throw error;
    }
  },

  // Get submission statistics for a doctor
  async getSubmissionStats(doctorId) {
    try {
      const submissions = await strapi.entityService.findMany('api::professional-reference-submission.professional-reference-submission', {
        filters: {
          doctor: doctorId
        }
      });

      const stats = {
        total: submissions.length,
        emailsSent: submissions.filter(s => s.isEmailSent).length,
        submitted: submissions.filter(s => s.isSubmitted).length,
        pending: submissions.filter(s => s.isEmailSent && !s.isSubmitted).length
      };

      return stats;
    } catch (error) {
      console.error('❌ Error getting submission stats:', error);
      throw error;
    }
  }
}));
