// Test environment variables directly
require('dotenv').config();

console.log('=== Direct Environment Variable Test ===');
console.log('AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID);
console.log('AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY);
console.log('AWS_REGION:', process.env.AWS_REGION);
console.log('AWS_S3_BUCKET:', process.env.AWS_S3_BUCKET);
console.log('NODE_ENV:', process.env.NODE_ENV);

console.log('\n=== All AWS-related env vars ===');
Object.keys(process.env)
  .filter(key => key.startsWith('AWS'))
  .forEach(key => {
    console.log(`${key}: ${process.env[key]}`);
  });
