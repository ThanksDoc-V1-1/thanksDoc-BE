// Simple API test for reference submissions
const axios = require('axios');

async function simpleAPITest() {
  console.log('🧪 Testing API connectivity...\n');
  
  try {
    console.log('1. Testing basic Strapi health...');
    const healthResponse = await axios.get('http://localhost:1337', { timeout: 5000 });
    console.log('✅ Strapi is accessible');
    
    console.log('\n2. Testing professional-reference-submissions API...');
    const submissionsResponse = await axios.get('http://localhost:1337/api/professional-reference-submissions', {
      timeout: 10000
    });
    
    console.log('✅ Submissions API accessible');
    console.log(`📊 Found ${submissionsResponse.data.data?.length || 0} submissions`);
    
    if (submissionsResponse.data.data && submissionsResponse.data.data.length > 0) {
      console.log('\n📋 Recent submissions:');
      submissionsResponse.data.data.slice(0, 3).forEach((submission, index) => {
        const attrs = submission.attributes;
        console.log(`${index + 1}. ID: ${submission.id}`);
        console.log(`   Created: ${new Date(attrs.createdAt).toLocaleString()}`);
        console.log(`   Email Sent: ${attrs.isEmailSent ? '✅' : '❌'}`);
        console.log(`   Token: ${attrs.referenceToken?.substring(0, 20)}...`);
        console.log('');
      });
    } else {
      console.log('ℹ️ No submissions found');
    }
    
  } catch (error) {
    console.error('❌ API Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Strapi is not running or not accessible on port 1337');
    } else if (error.response) {
      console.log('💡 API Error:', error.response.status, error.response.statusText);
    }
  }
}

simpleAPITest();
