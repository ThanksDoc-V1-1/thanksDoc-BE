module.exports = {
  routes: [
    // Upload compliance document
    {
      method: 'POST',
      path: '/compliance-documents/upload',
      handler: 'compliance-document.upload',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Upload a compliance document to S3',
        tags: ['Compliance Documents']
      }
    },

    // Get all compliance documents for a doctor
    {
      method: 'GET',
      path: '/compliance-documents/doctor/:doctorId',
      handler: 'compliance-document.getByDoctor',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Get all compliance documents for a specific doctor',
        tags: ['Compliance Documents']
      }
    },

    // Get compliance overview/stats for a doctor
    {
      method: 'GET',
      path: '/compliance-documents/doctor/:doctorId/overview',
      handler: 'compliance-document.getComplianceOverview',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Get compliance overview and statistics for a doctor',
        tags: ['Compliance Documents']
      }
    },

    // Update document dates
    {
      method: 'PUT',
      path: '/compliance-documents/:id/dates',
      handler: 'compliance-document.updateDates',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Update issue and expiry dates for a document',
        tags: ['Compliance Documents']
      }
    },

    // Delete compliance document
    {
      method: 'DELETE',
      path: '/compliance-documents/:id',
      handler: 'compliance-document.delete',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Delete a compliance document',
        tags: ['Compliance Documents']
      }
    },

    // Get download URL for document
    {
      method: 'GET',
      path: '/compliance-documents/:id/download',
      handler: 'compliance-document.getDownloadUrl',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Get signed download URL for a document',
        tags: ['Compliance Documents']
      }
    },

    // Verify document (admin only)
    {
      method: 'PUT',
      path: '/compliance-documents/:id/verify',
      handler: 'compliance-document.verifyDocument',
      config: {
        policies: [],
        middlewares: [],
        description: 'Verify or reject a compliance document',
        tags: ['Compliance Documents']
      }
    },

    // Update all expiry statuses (for cron job)
    {
      method: 'POST',
      path: '/compliance-documents/update-expiry-statuses',
      handler: 'compliance-document.updateExpiryStatuses',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Update expiry statuses for all documents (cron job)',
        tags: ['Compliance Documents']
      }
    },

    // Update doctor verification status
    {
      method: 'POST',
      path: '/compliance-documents/doctors/:doctorId/update-verification',
      handler: 'compliance-document.updateDoctorVerificationStatus',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Update doctor verification status based on compliance documents',
        tags: ['Compliance Documents', 'Doctor Verification']
      }
    },

    // Bulk update all doctors verification statuses
    {
      method: 'POST',
      path: '/compliance-documents/doctors/update-all-verification',
      handler: 'compliance-document.updateAllDoctorsVerificationStatus',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Bulk update verification status for all doctors',
        tags: ['Compliance Documents', 'Doctor Verification']
      }
    },

    // Update doctors without documents to unverified
    {
      method: 'POST',
      path: '/compliance-documents/doctors/update-without-documents',
      handler: 'compliance-document.updateDoctorsWithoutDocuments',
      config: {
        policies: [],
        middlewares: [],
        auth: false, // Allow public access for testing
        description: 'Set all doctors without compliance documents to unverified',
        tags: ['Compliance Documents', 'Doctor Verification']
      }
    }
  ]
};
