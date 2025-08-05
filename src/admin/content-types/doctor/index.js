module.exports = {
  config: {
    // Configure the edit view for doctors
    layouts: {
      edit: [
        [
          {
            name: 'firstName',
            size: 6,
          },
          {
            name: 'lastName',
            size: 6,
          },
        ],
        [
          {
            name: 'email',
            size: 6,
          },
          {
            name: 'phone',
            size: 6,
          },
        ],
        [
          {
            name: 'specialization',
            size: 6,
          },
          {
            name: 'yearsOfExperience',
            size: 6,
          },
        ],
        [
          {
            name: 'isAvailable',
            size: 4,
          },
          {
            name: 'isVerified',
            size: 4,
          },
          {
            name: 'profileComplete',
            size: 4,
          },
        ],
        // Add compliance documents section
        [
          {
            name: 'complianceDocuments',
            size: 12,
          },
        ],
      ],
    },
    // Configure field options
    settings: {
      bulkable: true,
      filterable: true,
      searchable: true,
      pageSize: 10,
      defaultSortBy: 'lastName',
      defaultSortOrder: 'ASC',
    },
  },
  options: {
    draftAndPublish: true,
  },
};
