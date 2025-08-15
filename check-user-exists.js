// Check if user exists across all user tables
require('dotenv').config();

async function checkUserExists() {
  console.log('🔍 Checking if user a.magezi44@gmail.com exists across all tables...\n');

  try {
    // We'll use a simple HTTP request to check via Strapi API
    const axios = require('axios');
    
    const email = 'a.magezi44@gmail.com';
    
    console.log('📧 Searching for email:', email);
    console.log('');

    // Check doctors table
    console.log('👨‍⚕️ Checking doctors table...');
    try {
      const doctorsResponse = await axios.get(`http://localhost:1337/api/doctors?filters[email][$eq]=${email}`);
      const doctors = doctorsResponse.data.data;
      
      if (doctors.length > 0) {
        console.log(`✅ Found ${doctors.length} doctor(s):`);
        doctors.forEach((doctor, index) => {
          console.log(`   ${index + 1}. ID: ${doctor.id}, Name: ${doctor.attributes.firstName} ${doctor.attributes.lastName}`);
          console.log(`      Email: ${doctor.attributes.email}`);
          console.log(`      Created: ${doctor.attributes.createdAt}`);
          console.log(`      Email Verified: ${doctor.attributes.isEmailVerified}`);
        });
      } else {
        console.log('❌ No doctors found');
      }
    } catch (error) {
      console.log('❌ Error checking doctors:', error.response?.status, error.response?.statusText);
    }
    
    console.log('');

    // Check businesses table
    console.log('🏢 Checking businesses table...');
    try {
      const businessesResponse = await axios.get(`http://localhost:1337/api/businesses?filters[email][$eq]=${email}`);
      const businesses = businessesResponse.data.data;
      
      if (businesses.length > 0) {
        console.log(`✅ Found ${businesses.length} business(es):`);
        businesses.forEach((business, index) => {
          console.log(`   ${index + 1}. ID: ${business.id}, Name: ${business.attributes.businessName || business.attributes.name}`);
          console.log(`      Email: ${business.attributes.email}`);
          console.log(`      Created: ${business.attributes.createdAt}`);
          console.log(`      Email Verified: ${business.attributes.isEmailVerified}`);
        });
      } else {
        console.log('❌ No businesses found');
      }
    } catch (error) {
      console.log('❌ Error checking businesses:', error.response?.status, error.response?.statusText);
    }
    
    console.log('');

    // Check admins table
    console.log('👑 Checking admins table...');
    try {
      const adminsResponse = await axios.get(`http://localhost:1337/api/admins?filters[email][$eq]=${email}`);
      const admins = adminsResponse.data.data;
      
      if (admins.length > 0) {
        console.log(`✅ Found ${admins.length} admin(s):`);
        admins.forEach((admin, index) => {
          console.log(`   ${index + 1}. ID: ${admin.id}, Name: ${admin.attributes.name}`);
          console.log(`      Email: ${admin.attributes.email}`);
          console.log(`      Created: ${admin.attributes.createdAt}`);
        });
      } else {
        console.log('❌ No admins found');
      }
    } catch (error) {
      console.log('❌ Error checking admins:', error.response?.status, error.response?.statusText);
    }

    console.log('\n💡 If user exists but you can\'t see them:');
    console.log('   1. They might have incomplete registration');
    console.log('   2. They might be in draft state (unpublished)');
    console.log('   3. Database might have stale data');
    console.log('\n🔧 Solutions:');
    console.log('   1. Delete the existing user record');
    console.log('   2. Complete the existing registration');
    console.log('   3. Use a different email address');
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkUserExists();
