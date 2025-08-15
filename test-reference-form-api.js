// Test the reference form API endpoint
const axios = require('axios');

async function testReferenceFormAPI() {
  console.log('🧪 Testing Reference Form API');
  console.log('==============================\n');

  try {
    // First, let's get the latest submission token from a recent submission
    console.log('1. Getting recent submissions to find a token...');
    const submissionsResponse = await axios.get('http://localhost:1337/api/professional-reference-submissions?sort=createdAt:desc&pagination[limit]=1', { timeout: 10000 });

    if (submissionsResponse.data.data && submissionsResponse.data.data.length > 0) {
      const latestSubmission = submissionsResponse.data.data[0];
      const token = latestSubmission.attributes.referenceToken;
      
      console.log('✅ Found recent submission:');
      console.log(`   Token: ${token}`);
      console.log(`   Email Sent: ${latestSubmission.attributes.isEmailSent ? '✅' : '❌'}`);
      console.log(`   Created: ${new Date(latestSubmission.attributes.createdAt).toLocaleString()}\n`);

      // Test the reference form endpoint
      console.log('2. Testing reference form endpoint...');
      try {
        const formResponse = await axios.get(`http://localhost:1337/api/professional-reference-submissions/token/${token}`, { timeout: 10000 });
        
        console.log('✅ Reference form API working!');
        console.log(`   Status: ${formResponse.status}`);
        console.log(`   Form data available: ${formResponse.data.data ? 'YES' : 'NO'}`);
        
        if (formResponse.data.data) {
          console.log(`   Reference Name: ${formResponse.data.data.referenceName || 'N/A'}`);
          console.log(`   Doctor Name: ${formResponse.data.data.doctorName || 'N/A'}`);
        }
      } catch (formError) {
        if (formError.response?.status === 404) {
          console.log('❌ Reference form endpoint not found (404)');
          console.log('💡 Custom routes may not be loading properly');
        } else {
          console.log(`❌ Reference form API error: ${formError.response?.status} - ${formError.message}`);
        }
      }

    } else {
      console.log('❌ No submissions found. Need to submit a reference first.');
      console.log('💡 Go to compliance page and submit a reference to test.');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend not accessible - make sure Strapi is running');
    } else {
      console.log('❌ Test failed:', error.message);
      if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
      }
    }
  }
}

testReferenceFormAPI();
