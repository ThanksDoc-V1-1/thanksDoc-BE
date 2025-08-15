// Better diagnostic test for reference submissions
const axios = require('axios');

async function diagnoseReferenceSubmissions() {
  console.log('🔍 Diagnosing Professional Reference Submissions');
  console.log('===============================================\n');

  try {
    // First, check basic API access
    console.log('1. Testing basic API access...');
    try {
      const healthResponse = await axios.get('http://localhost:1337/_health', { timeout: 5000 });
      console.log('✅ Backend is accessible');
    } catch (healthError) {
      console.log('❌ Backend not accessible:', healthError.message);
      return;
    }

    // Check if we can access professional-references (this should work)
    console.log('\n2. Testing professional-references endpoint...');
    try {
      const refsResponse = await axios.get('http://localhost:1337/api/professional-references?pagination[limit]=3', { timeout: 10000 });
      console.log(`✅ Professional references: ${refsResponse.status} (${refsResponse.data.data?.length || 0} records)`);
      
      if (refsResponse.data.data && refsResponse.data.data.length > 0) {
        console.log('📝 Recent references:');
        refsResponse.data.data.forEach((ref, index) => {
          const attrs = ref.attributes;
          console.log(`   ${index + 1}. Email: ${attrs.email}, Created: ${new Date(attrs.createdAt).toLocaleString()}`);
        });
      }
    } catch (refError) {
      console.log('❌ Professional references error:', refError.response?.status, refError.message);
    }

    // Check if we can access professional-reference-submissions
    console.log('\n3. Testing professional-reference-submissions endpoint...');
    try {
      const submissionsResponse = await axios.get('http://localhost:1337/api/professional-reference-submissions', { 
        timeout: 10000,
        validateStatus: function (status) {
          return status < 500; // Accept 4xx responses to see what they contain
        }
      });
      
      console.log(`📊 Submissions response: ${submissionsResponse.status}`);
      
      if (submissionsResponse.status === 200) {
        console.log(`✅ Submissions found: ${submissionsResponse.data.data?.length || 0}`);
        
        if (submissionsResponse.data.data && submissionsResponse.data.data.length > 0) {
          console.log('📝 Submissions structure:');
          submissionsResponse.data.data.slice(0, 2).forEach((sub, index) => {
            console.log(`   ${index + 1}. ID: ${sub.id}`);
            console.log(`      Attributes keys: ${Object.keys(sub.attributes || {}).join(', ')}`);
            if (sub.attributes?.referenceToken) {
              console.log(`      Token: ${sub.attributes.referenceToken.substring(0, 10)}...`);
              console.log(`      Email Sent: ${sub.attributes.isEmailSent ? '✅' : '❌'}`);
            }
            console.log('');
          });
        } else {
          console.log('📋 No submissions found - this explains why the form isn\'t working!');
          console.log('💡 Try submitting a reference through the compliance page first');
        }
      } else if (submissionsResponse.status === 403) {
        console.log('❌ Access forbidden - authentication/permissions issue');
        console.log('💡 Need to configure permissions in Strapi admin');
      } else if (submissionsResponse.status === 404) {
        console.log('❌ Endpoint not found - routes not properly configured');
      } else {
        console.log('❌ Unexpected response:', submissionsResponse.data);
      }
      
    } catch (submissionsError) {
      console.log('❌ Submissions request failed:', submissionsError.message);
      if (submissionsError.code === 'ECONNREFUSED') {
        console.log('💡 Backend is not running');
      }
    }

    // Test if we can create a manual submission to verify the email system
    console.log('\n4. Testing reference creation (to generate submissions)...');
    try {
      const testRef = {
        doctorId: 1,
        documentType: 'professional-references',
        references: [
          {
            firstName: 'Diagnostic',
            lastName: 'Test Reference',
            position: 'Senior Consultant',
            organisation: 'Test Hospital',
            email: 'arafats144@gmail.com'
          }
        ]
      };

      const createResponse = await axios.post('http://localhost:1337/api/professional-references/save', testRef, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      });

      console.log(`✅ Reference creation: ${createResponse.status}`);
      console.log(`📧 Result: ${createResponse.data.message}`);
      
      // Wait a moment then check if submission was created
      console.log('\n   Waiting for submission creation...');
      setTimeout(async () => {
        try {
          const checkResponse = await axios.get('http://localhost:1337/api/professional-reference-submissions?sort=createdAt:desc&pagination[limit]=1', { 
            timeout: 10000,
            validateStatus: function (status) { return status < 500; }
          });
          
          if (checkResponse.status === 200 && checkResponse.data.data?.length > 0) {
            const latest = checkResponse.data.data[0];
            console.log('✅ New submission created!');
            console.log(`   Token: ${latest.attributes?.referenceToken || 'NOT FOUND'}`);
            console.log(`   Email Sent: ${latest.attributes?.isEmailSent ? '✅' : '❌'}`);
          } else {
            console.log('❌ No new submissions found after creation');
          }
        } catch (checkError) {
          console.log('❌ Could not verify submission creation:', checkError.message);
        }
      }, 3000);

    } catch (createError) {
      console.log('❌ Reference creation failed:', createError.message);
      if (createError.response) {
        console.log(`   Status: ${createError.response.status}`);
        console.log(`   Data:`, createError.response.data);
      }
    }

  } catch (error) {
    console.log('❌ Diagnostic failed:', error.message);
  }
}

console.log('🚀 Starting comprehensive diagnosis...\n');
diagnoseReferenceSubmissions();
