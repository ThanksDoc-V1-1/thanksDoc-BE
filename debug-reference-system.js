// Simple test to check what's happening with reference submissions
const axios = require('axios');

async function debugReferenceSubmission() {
  console.log('🔍 Debug Reference Submission Process');
  console.log('====================================\n');

  try {
    // Check if backend is running
    const health = await axios.get('http://localhost:1337/_health', { timeout: 5000 });
    console.log('✅ Backend is running\n');
  } catch (error) {
    console.log('❌ Backend not accessible:', error.message);
    return;
  }

  try {
    // First, let's check what endpoints are available
    console.log('1. Checking available API endpoints...');
    
    // Test the professional-reference endpoint
    const refResponse = await axios.get('http://localhost:1337/api/professional-references', { timeout: 10000 });
    console.log(`✅ professional-references endpoint: ${refResponse.status} (${refResponse.data.data?.length || 0} records)`);
    
    // Test the professional-reference-submission endpoint
    try {
      const subResponse = await axios.get('http://localhost:1337/api/professional-reference-submissions', { timeout: 10000 });
      console.log(`✅ professional-reference-submissions endpoint: ${subResponse.status} (${subResponse.data.data?.length || 0} records)`);
    } catch (subError) {
      if (subError.response?.status === 404) {
        console.log('❌ professional-reference-submissions endpoint: NOT FOUND (404)');
        console.log('💡 This might be why emails aren\'t being tracked!');
      } else {
        console.log('❌ professional-reference-submissions endpoint error:', subError.message);
      }
    }

    console.log('\n2. Checking most recent professional references...');
    
    // Get the most recent references to see what we created
    const recentRefs = await axios.get('http://localhost:1337/api/professional-references?sort=createdAt:desc&pagination[limit]=5', { timeout: 10000 });
    
    console.log(`📝 Found ${recentRefs.data.data.length} recent references:`);
    
    recentRefs.data.data.forEach((ref, index) => {
      const attrs = ref.attributes;
      console.log(`   ${index + 1}. ID: ${ref.id}, Email: ${attrs.email}, Created: ${new Date(attrs.createdAt).toLocaleString()}`);
    });

    if (recentRefs.data.data.length > 0) {
      const latestRef = recentRefs.data.data[0];
      const refId = latestRef.id;
      
      console.log(`\n3. Checking if submissions were created for reference ID: ${refId}...`);
      
      try {
        // Try to check submissions by reference ID
        const submissionsCheck = await axios.get(`http://localhost:1337/api/professional-reference-submissions?filters[professionalReference][id]=${refId}`, { timeout: 10000 });
        console.log(`📊 Found ${submissionsCheck.data.data.length} submissions for this reference`);
        
        if (submissionsCheck.data.data.length > 0) {
          const submission = submissionsCheck.data.data[0];
          console.log('📝 Submission details:');
          console.log(`   Email Sent: ${submission.attributes.isEmailSent ? '✅ YES' : '❌ NO'}`);
          console.log(`   Token: ${submission.attributes.referenceToken}`);
          if (submission.attributes.emailSentAt) {
            console.log(`   Email Sent At: ${new Date(submission.attributes.emailSentAt).toLocaleString()}`);
          }
        } else {
          console.log('❌ No submissions found - this means emails are not being sent!');
          console.log('💡 Check the professional-reference-submission service');
        }
      } catch (subError) {
        console.log('❌ Error checking submissions:', subError.response?.status, subError.message);
      }
    }

  } catch (error) {
    console.log('❌ Error in debug process:', error.message);
    if (error.response) {
      console.log('   Status:', error.response.status);
      console.log('   Data:', error.response.data);
    }
  }
}

console.log('🚀 Starting reference submission debug...\n');
debugReferenceSubmission();
