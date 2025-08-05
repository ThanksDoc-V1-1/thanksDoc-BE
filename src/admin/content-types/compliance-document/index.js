module.exports = {
  config: {
    // Configure the edit view for compliance documents
    layouts: {
      edit: [
        [
          {
            name: 'doctor',
            size: 6,
          },
          {
            name: 'documentType',
            size: 6,
          },
        ],
        [
          {
            name: 'documentName',
            size: 12,
          },
        ],
        [
          {
            name: 'status',
            size: 4,
          },
          {
            name: 'verificationStatus',
            size: 4,
          },
          {
            name: 'isRequired',
            size: 4,
          },
        ],
        [
          {
            name: 'issueDate',
            size: 6,
          },
          {
            name: 'expiryDate',
            size: 6,
          },
        ],
        [
          {
            name: 'verifiedBy',
            size: 6,
          },
          {
            name: 'verifiedAt',
            size: 6,
          },
        ],
        [
          {
            name: 'notes',
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
      defaultSortBy: 'updatedAt',
      defaultSortOrder: 'DESC',
    },
  },
  options: {
    draftAndPublish: false,
  },
};
