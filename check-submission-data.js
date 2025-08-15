// Direct database check for professional-reference-submissions
const axios = require('axios');

async function checkSubmissionData() {
  console.log('🔍 Direct Database Check for Submissions');
  console.log('========================================\n');

  try {
    // Get submissions with full population to see all data
    console.log('1. Checking submissions with full data population...');
    
    const response = await axios.get('http://localhost:1337/api/professional-reference-submissions', {
      params: {
        'populate': '*',
        'sort': 'createdAt:desc',
        'pagination[limit]': 3
      },
      timeout: 10000,
      validateStatus: function (status) { return status < 500; }
    });

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📊 Total submissions: ${response.data.data?.length || 0}`);

    if (response.status === 200 && response.data.data) {
      console.log('\n📝 Detailed submission analysis:');
      
      response.data.data.forEach((submission, index) => {
        console.log(`\n--- Submission ${index + 1} ---`);
        console.log(`ID: ${submission.id}`);
        console.log(`DocumentId: ${submission.documentId || 'N/A'}`);
        
        // Check if attributes exist and what they contain
        if (submission.attributes) {
          console.log('Attributes found:');
          const attrs = submission.attributes;
          
          Object.keys(attrs).forEach(key => {
            const value = attrs[key];
            if (typeof value === 'object' && value !== null) {
              console.log(`  ${key}: [Object] ${JSON.stringify(value).substring(0, 100)}...`);
            } else {
              console.log(`  ${key}: ${value}`);
            }
          });
        } else {
          console.log('❌ No attributes found!');
        }
        
        // Check the raw structure
        console.log('\nRaw structure keys:', Object.keys(submission));
      });

      // If we find a token, test the reference form endpoint
      const submissionWithToken = response.data.data.find(sub => 
        sub.attributes?.referenceToken || sub.referenceToken
      );
      
      if (submissionWithToken) {
        const token = submissionWithToken.attributes?.referenceToken || submissionWithToken.referenceToken;
        console.log(`\n2. Testing reference form with token: ${token?.substring(0, 10)}...`);
        
        try {
          const formResponse = await axios.get(
            `http://localhost:1337/api/professional-reference-submissions/token/${token}`,
            { 
              timeout: 10000,
              validateStatus: function (status) { return status < 500; }
            }
          );
          
          console.log(`✅ Reference form response: ${formResponse.status}`);
          if (formResponse.status === 200) {
            console.log('✅ Reference form is accessible!');
            console.log(`📋 Form data available: ${formResponse.data.data ? 'YES' : 'NO'}`);
          } else {
            console.log(`❌ Form access issue: ${formResponse.status}`);
            console.log('Response:', formResponse.data);
          }
        } catch (formError) {
          console.log(`❌ Reference form test failed: ${formError.message}`);
        }
      } else {
        console.log('\n2. ❌ No submission with token found for form testing');
      }

    } else {
      console.log('❌ Failed to get submissions:', response.data);
    }

  } catch (error) {
    console.log('❌ Database check failed:', error.message);
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Data:`, error.response.data);
    }
  }
}

checkSubmissionData();
