// Test reference submission from frontend exactly as it happens
const axios = require('axios');

async function testReferenceSubmissionFlow() {
  console.log('🧪 Testing Reference Submission Flow - Live Test');
  console.log('=================================================\n');

  try {
    // First check if Strapi is running
    console.log('🔍 Checking if Strapi backend is accessible...');
    const healthCheck = await axios.get('http://localhost:1337/admin', { timeout: 5000 });
    console.log('✅ Strapi is running and accessible\n');

    // Test data that mimics what frontend sends
    const testDoctorId = 1; // Use existing doctor ID
    const testReferences = [
      {
        firstName: 'Test',
        lastName: 'Reference One',
        position: 'Senior Consultant',
        organisation: 'Test Hospital',
        email: 'arafats144@gmail.com'
      }
    ];

    console.log('📤 Simulating frontend reference submission...');
    console.log(`   Doctor ID: ${testDoctorId}`);
    console.log(`   References: ${testReferences.length}`);
    console.log(`   Reference Email: ${testReferences[0].email}\n`);

    // Make the same API call that the frontend makes
    const response = await axios.post('http://localhost:1337/api/professional-references/save', {
      doctorId: testDoctorId,
      documentType: 'professional-references',
      references: testReferences
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 second timeout for email processing
    });

    console.log('📋 Response Status:', response.status);
    console.log('📋 Response Data:', JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n✅ Reference submission completed successfully!');
      console.log('📧 Check arafats144@gmail.com for the reference request email');
      
      // Wait a moment then check if submission was created
      console.log('\n🔍 Checking if professional-reference-submission was created...');
      
      setTimeout(async () => {
        try {
          const submissionCheck = await axios.get('http://localhost:1337/api/professional-reference-submissions?populate=*&sort=createdAt:desc', {
            timeout: 10000
          });
          
          const recentSubmissions = submissionCheck.data.data.filter(sub => {
            const createdTime = new Date(sub.attributes.createdAt);
            const now = new Date();
            const diffMinutes = (now - createdTime) / (1000 * 60);
            return diffMinutes < 2; // Created within last 2 minutes
          });
          
          console.log(`📊 Found ${recentSubmissions.length} recent submissions`);
          
          if (recentSubmissions.length > 0) {
            const latestSub = recentSubmissions[0];
            console.log('📝 Latest submission details:');
            console.log(`   ID: ${latestSub.id}`);
            console.log(`   Email Sent: ${latestSub.attributes.isEmailSent ? '✅ YES' : '❌ NO'}`);
            console.log(`   Created: ${new Date(latestSub.attributes.createdAt).toLocaleString()}`);
            
            if (latestSub.attributes.emailSentAt) {
              console.log(`   Email Sent At: ${new Date(latestSub.attributes.emailSentAt).toLocaleString()}`);
            }
          }
          
        } catch (checkError) {
          console.log('❌ Could not check submissions:', checkError.message);
        }
      }, 2000);
      
    } else {
      console.log('❌ Reference submission failed:', response.data.message);
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to Strapi backend on port 1337');
      console.log('💡 Make sure Strapi is running: npm run develop');
    } else if (error.response) {
      console.log('❌ API Error:', error.response.status);
      console.log('❌ Error Details:', error.response.data);
    } else {
      console.log('❌ Request Error:', error.message);
    }
  }
}

console.log('🔧 Starting comprehensive reference submission test...\n');
testReferenceSubmissionFlow();
