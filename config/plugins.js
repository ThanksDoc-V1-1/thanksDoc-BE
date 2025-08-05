module.exports = ({ env }) => ({
  // AWS S3 Upload configuration
  upload: {
    config: {
      provider: 'aws-s3',
      providerOptions: {
        s3Options: {
          accessKeyId: env('AWS_ACCESS_KEY_ID'),
          secretAccessKey: env('AWS_SECRET_ACCESS_KEY'),
          region: env('AWS_REGION', 'us-east-1'),
          params: {
            Bucket: env('AWS_S3_BUCKET', 'thanksdoc-compliance-documents'),
            ACL: 'private', // Keep documents private
          },
        }
      },
      actionOptions: {
        upload: {},
        uploadStream: {},
        delete: {},
      },
    },
  },
});
