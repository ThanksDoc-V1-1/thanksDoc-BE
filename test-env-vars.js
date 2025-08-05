// Load environment variables first
require('dotenv').config();

// Test environment variable loading
console.log('Environment Variable Test:');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);

// Import and instantiate S3Service to see debug output
const S3Service = require('./src/utils/s3-service.js');
console.log('Creating S3Service instance...');
const s3Service = new S3Service();
console.log('S3Service created successfully');
