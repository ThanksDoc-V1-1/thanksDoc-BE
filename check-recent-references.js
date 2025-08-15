// Check recent reference submissions and email status
require('dotenv').config();

async function checkRecentReferenceSubmissions() {
  console.log('🔍 Checking recent professional reference submissions...\n');
  
  try {
    // We'll need to access Strapi directly since we need to check the database
    const axios = require('axios');
    
    // Try to get recent submissions through the API first
    console.log('📡 Checking recent reference submissions...');
    
    // For now, let's create a simple database query script
    const { execSync } = require('child_process');
    
    try {
      // Check if we can access Strapi API
      const response = await axios.get('http://localhost:1337/api/professional-reference-submissions?populate=*&sort=createdAt:desc&pagination[limit]=5');
      
      if (response.data && response.data.data) {
        const submissions = response.data.data;
        
        console.log(`📊 Found ${submissions.length} recent submissions:\n`);
        
        submissions.forEach((submission, index) => {
          const attrs = submission.attributes;
          console.log(`${index + 1}. Submission ID: ${submission.id}`);
          console.log(`   Created: ${attrs.createdAt}`);
          console.log(`   Email Sent: ${attrs.isEmailSent ? '✅ Yes' : '❌ No'}`);
          console.log(`   Email Sent At: ${attrs.emailSentAt || 'Never'}`);
          console.log(`   Token: ${attrs.referenceToken || 'No token'}`);
          
          if (attrs.professionalReference && attrs.professionalReference.data) {
            const ref = attrs.professionalReference.data.attributes;
            console.log(`   Reference Email: ${ref.email}`);
            console.log(`   Reference Name: ${ref.firstName} ${ref.lastName}`);
          }
          
          if (attrs.doctor && attrs.doctor.data) {
            const doctor = attrs.doctor.data.attributes;
            console.log(`   Doctor: ${doctor.firstName} ${doctor.lastName}`);
          }
          
          if (attrs.emailError) {
            console.log(`   ❌ Email Error: ${attrs.emailError}`);
          }
          
          console.log('');
        });
        
        // Check for recent submissions without emails sent
        const failedEmails = submissions.filter(s => !s.attributes.isEmailSent);
        if (failedEmails.length > 0) {
          console.log('⚠️ Submissions without emails sent:');
          failedEmails.forEach(submission => {
            console.log(`   - ID ${submission.id}: Created at ${submission.attributes.createdAt}`);
          });
        }
        
      } else {
        console.log('❌ No submissions found or API not accessible');
      }
      
    } catch (apiError) {
      console.log('❌ Could not access Strapi API:', apiError.message);
      console.log('\n💡 Make sure Strapi backend is running on port 1337');
      console.log('💡 Try: npm run develop in the UBER-DOC-BE folder');
    }
    
  } catch (error) {
    console.error('❌ Error checking submissions:', error.message);
  }
  
  console.log('\n🔍 Debugging Steps:');
  console.log('1. Check if the reference was actually created');
  console.log('2. Look at Strapi backend logs for email errors');
  console.log('3. Verify the new email configuration is working');
  console.log('4. Check if the EmailService is being called properly');
}

checkRecentReferenceSubmissions();
