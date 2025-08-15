// Simple test to check if the API endpoints work
const axios = require('axios');

async function simpleAPITest() {
  console.log('🔍 Simple API Test');
  console.log('==================\n');

  const baseURL = 'http://localhost:1337/api';

  try {
    // Test professional-references endpoint first
    console.log('1. Testing professional-references endpoint...');
    const refResponse = await axios.get(`${baseURL}/professional-references`, { timeout: 5000 });
    console.log(`✅ professional-references: ${refResponse.status} (${refResponse.data.data?.length || 0} records)\n`);

    // Test professional-reference-submissions endpoint
    console.log('2. Testing professional-reference-submissions endpoint...');
    try {
      const subResponse = await axios.get(`${baseURL}/professional-reference-submissions`, { timeout: 5000 });
      console.log(`✅ professional-reference-submissions: ${subResponse.status} (${subResponse.data.data?.length || 0} records)`);
      
      if (subResponse.data.data && subResponse.data.data.length > 0) {
        console.log('📋 Recent submissions:');
        subResponse.data.data.slice(0, 3).forEach((sub, index) => {
          console.log(`   ${index + 1}. ID: ${sub.id}, Token: ${sub.attributes.referenceToken}, Email Sent: ${sub.attributes.isEmailSent ? '✅' : '❌'}`);
        });
      }
    } catch (subError) {
      console.log(`❌ professional-reference-submissions: ${subError.response?.status || 'ERROR'} - ${subError.message}`);
    }

    console.log('\n3. Testing reference submission process...');
    
    // Test the reference save endpoint that should trigger email
    const testSubmission = {
      doctorId: 1,
      documentType: 'professional-references',
      references: [
        {
          firstName: 'Test',
          lastName: 'Reference',
          position: 'Consultant',
          organisation: 'Test Hospital',
          email: 'arafats144@gmail.com'
        }
      ]
    };

    console.log('📤 Submitting test reference...');
    const saveResponse = await axios.post(`${baseURL}/professional-references/save`, testSubmission, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 30000
    });

    console.log(`✅ Reference save: ${saveResponse.status}`);
    console.log(`📧 Message: ${saveResponse.data.message}`);

    // Wait a moment and check if submission was created
    console.log('\n4. Checking if submission was created...');
    setTimeout(async () => {
      try {
        const checkResponse = await axios.get(`${baseURL}/professional-reference-submissions?sort=createdAt:desc&pagination[limit]=1`, { timeout: 5000 });
        
        if (checkResponse.data.data && checkResponse.data.data.length > 0) {
          const latest = checkResponse.data.data[0];
          console.log('📝 Latest submission:');
          console.log(`   ID: ${latest.id}`);
          console.log(`   Token: ${latest.attributes.referenceToken}`);
          console.log(`   Email Sent: ${latest.attributes.isEmailSent ? '✅ YES' : '❌ NO'}`);
          console.log(`   Created: ${new Date(latest.attributes.createdAt).toLocaleString()}`);
        } else {
          console.log('❌ No submissions found - email service not working!');
        }
      } catch (err) {
        console.log('❌ Could not check submissions:', err.message);
      }
    }, 3000);

  } catch (error) {
    console.log('❌ API Test failed:', error.message);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
      console.log(`   Data:`, error.response.data);
    }
  }
}

simpleAPITest();
