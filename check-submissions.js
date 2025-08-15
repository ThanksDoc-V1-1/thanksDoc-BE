// Simple submission analysis
require('dotenv').config();

async function checkSubmissions() {
  console.log('📊 Checking reference submissions...\n');
  
  try {
    // Using a direct approach to check the database
    const { execSync } = require('child_process');
    
    console.log('🔍 Looking for recent submissions...');
    
    // Check if Strapi is running and accessible
    try {
      const result = execSync('curl -s http://localhost:1337/api/professional-reference-submissions?pagination[limit]=5', { encoding: 'utf8' });
      const data = JSON.parse(result);
      
      console.log(`📧 Found ${data.data.length} recent submissions:`);
      
      data.data.forEach((submission, index) => {
        console.log(`${index + 1}. ID: ${submission.id}`);
        console.log(`   Created: ${submission.attributes.createdAt}`);
        console.log(`   Email Sent: ${submission.attributes.isEmailSent ? '✅' : '❌'}`);
        console.log(`   Email Sent At: ${submission.attributes.emailSentAt || 'Never'}`);
        console.log('');
      });
      
    } catch (curlError) {
      console.log('📡 Strapi API not accessible, trying direct approach...');
      
      // Alternative: Check the Strapi logs directly
      console.log('💡 Recommendations:');
      console.log('1. Check Gmail spam folder for emails from noreply@thanksdoc.co.uk');
      console.log('2. Whitelist @thanksdoc.co.uk domain in Gmail');
      console.log('3. Check if Gmail is blocking automated emails');
      console.log('4. Try with a different email provider (Outlook, Yahoo)');
      console.log('');
      
      console.log('🧪 Manual test: Check your email now for recent test emails');
      console.log('   We just sent multiple test emails to arafats144@gmail.com');
      console.log('   They should be in inbox or spam folder');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
    
    console.log('\n💡 Quick Gmail troubleshooting:');
    console.log('1. Go to Gmail and search for: from:noreply@thanksdoc.co.uk');
    console.log('2. Check spam folder specifically');
    console.log('3. Look in "All Mail" folder');
    console.log('4. Check Gmail filters that might be auto-deleting');
  }
}

checkSubmissions();
