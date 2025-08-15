// Check recent submissions with detailed analysis
require('dotenv').config();

async function analyzeRecentSubmissions() {
  console.log('🔍 Analyzing recent reference submissions...\n');
  
  try {
    // Simple database query using node-fetch to call Strapi API
    const fetch = require('node-fetch');
    
    // Get submissions via API
    const response = await fetch('http://localhost:1337/api/professional-reference-submissions?populate=*&sort=createdAt:desc&pagination[limit]=10', {
      headers: {
        'Authorization': `Bearer ${process.env.STRAPI_API_TOKEN || 'your-token-here'}`
      }
    });
    
    if (!response.ok) {
      console.log('📡 API call failed, using direct database access...');
      
      // Direct Strapi access
      const strapi = require('./src');
      await strapi.load();
      
      const submissions = await strapi.entityService.findMany('api::professional-reference-submission.professional-reference-submission', {
        populate: {
          professionalReference: true,
          doctor: true
        },
        sort: { createdAt: 'desc' },
        limit: 10
      });
      
      console.log('📊 Recent Submissions Analysis:');
      console.log('='.repeat(60));
      
      submissions.forEach((submission, index) => {
        console.log(`${index + 1}. Submission ID: ${submission.id}`);
        console.log(`   Created: ${new Date(submission.createdAt).toLocaleString()}`);
        console.log(`   Email Sent: ${submission.isEmailSent ? '✅ Yes' : '❌ No'}`);
        console.log(`   Email Sent At: ${submission.emailSentAt ? new Date(submission.emailSentAt).toLocaleString() : 'Never'}`);
        console.log(`   Reference Email: ${submission.professionalReference?.email || 'Unknown'}`);
        console.log(`   Doctor: ${submission.doctor ? `${submission.doctor.firstName} ${submission.doctor.lastName}` : 'Unknown'}`);
        console.log(`   Token: ${submission.referenceToken}`);
        if (submission.emailError) {
          console.log(`   Email Error: ${submission.emailError}`);
        }
        console.log('');
      });
      
      // Focus on arafats144@gmail.com submissions
      const mySubmissions = submissions.filter(s => 
        s.professionalReference?.email === 'arafats144@gmail.com'
      );
      
      console.log(`🎯 Your Email (arafats144@gmail.com) Submissions: ${mySubmissions.length}`);
      console.log('='.repeat(60));
      
      mySubmissions.forEach((submission, index) => {
        console.log(`${index + 1}. Created: ${new Date(submission.createdAt).toLocaleString()}`);
        console.log(`   Status: ${submission.isEmailSent ? '✅ Sent' : '❌ Not sent'}`);
        console.log(`   Sent At: ${submission.emailSentAt ? new Date(submission.emailSentAt).toLocaleString() : 'Never'}`);
        console.log(`   Form URL: http://localhost:3000/reference-form/${submission.referenceToken}`);
        console.log('');
      });
      
      await strapi.destroy();
    }
    
  } catch (error) {
    console.error('❌ Analysis failed:', error.message);
  }
}

analyzeRecentSubmissions();
