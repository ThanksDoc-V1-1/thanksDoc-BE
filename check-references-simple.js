// Check recent professional reference submissions safely
const axios = require('axios');

async function checkRecentReferences() {
  console.log('🔍 Checking Recent Professional Reference Submissions');
  console.log('====================================================\n');

  try {
    // Check if Strapi is running first
    const healthCheck = await axios.get('http://localhost:1337/admin', {
      timeout: 5000
    });
    
    console.log('✅ Strapi is accessible');

    // Get recent reference submissions
    const response = await axios.get('http://localhost:1337/api/professional-reference-submissions?populate=*&sort=createdAt:desc', {
      timeout: 10000
    });

    console.log(`📋 Found ${response.data.data.length} total reference submissions\n`);

    // Show the last 5 submissions
    const recentSubmissions = response.data.data.slice(0, 5);
    
    recentSubmissions.forEach((submission, index) => {
      const data = submission.attributes;
      console.log(`📝 Submission ${index + 1}:`);
      console.log(`   ID: ${submission.id}`);
      console.log(`   Doctor: ${data.doctorName || 'N/A'}`);
      console.log(`   Reference Email: ${data.referenceEmail}`);
      console.log(`   Reference Name: ${data.referenceName || 'N/A'}`);
      console.log(`   Token: ${data.token}`);
      console.log(`   Created: ${new Date(data.createdAt).toLocaleString()}`);
      console.log(`   Email Sent: ${data.emailSent ? '✅ YES' : '❌ NO'}`);
      if (data.emailSentAt) {
        console.log(`   Email Sent At: ${new Date(data.emailSentAt).toLocaleString()}`);
      }
      console.log('');
    });

    // Check if any recent submissions failed to send emails
    const failedEmails = recentSubmissions.filter(sub => !sub.attributes.emailSent);
    if (failedEmails.length > 0) {
      console.log('🚨 FOUND SUBMISSIONS WITHOUT EMAILS SENT:');
      failedEmails.forEach(sub => {
        console.log(`   - ID ${sub.id}: ${sub.attributes.referenceEmail} (${new Date(sub.attributes.createdAt).toLocaleString()})`);
      });
      console.log('\n💡 This suggests the email service is not being triggered properly!');
    } else {
      console.log('✅ All recent submissions have emails sent');
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to Strapi on port 1337');
      console.log('💡 Make sure Strapi is running: npm run develop');
    } else if (error.response?.status === 404) {
      console.log('❌ Professional reference submissions endpoint not found');
      console.log('💡 Check if the content type is properly registered');
    } else {
      console.log('❌ Error:', error.message);
    }
  }
}

console.log('🔍 Starting reference submission check...\n');
checkRecentReferences();
