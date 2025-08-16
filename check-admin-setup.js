const axios = require('axios');

const PRODUCTION_URL = 'https://thanksdoc-be-production.up.railway.app';

async function checkAdminSetup() {
  console.log('🔍 Checking Strapi Admin Setup Status');
  console.log('🎯 Target:', PRODUCTION_URL);
  console.log('=' .repeat(60));

  try {
    // Check if admin setup is needed
    console.log('\n🏗️  Checking if admin setup is required...');
    
    const setupResponse = await axios.get(`${PRODUCTION_URL}/admin/init`);
    console.log('✅ Admin setup response:', setupResponse.status);
    console.log('📋 Setup data:', JSON.stringify(setupResponse.data, null, 2));
    
    if (setupResponse.data?.hasAdmin === false) {
      console.log('\n🎯 SOLUTION FOUND!');
      console.log('✅ Admin setup is required and available!');
      console.log('🔗 Please visit: ' + PRODUCTION_URL + '/admin');
      console.log('📝 Complete the setup wizard to create your first admin user');
      console.log('');
      console.log('💡 Recommended credentials:');
      console.log('   📧 Email: admin@uberdoc.com');
      console.log('   🔑 Password: Admin123!');
      console.log('   👤 Name: Admin User');
      console.log('');
      console.log('✨ After completing setup, your admin dashboard will work properly!');
    } else {
      console.log('\n🤔 Admin setup shows hasAdmin: true');
      console.log('This means an admin user should already exist.');
    }
    
  } catch (error) {
    console.log(`❌ Admin init check failed: ${error.response?.status} - ${error.message}`);
    
    // Try to access admin panel directly
    try {
      console.log('\n🌐 Trying to access admin panel directly...');
      const adminResponse = await axios.get(`${PRODUCTION_URL}/admin`);
      console.log('✅ Admin panel accessible:', adminResponse.status);
    } catch (adminError) {
      console.log(`❌ Admin panel access failed: ${adminError.response?.status}`);
    }
  }

  console.log('\n🎯 RECOMMENDED ACTIONS:');
  console.log('1. 🌐 Open: ' + PRODUCTION_URL + '/admin');
  console.log('2. 📝 Complete the Strapi admin setup wizard');
  console.log('3. 🔐 Create your first admin user');
  console.log('4. 🔄 Try accessing your admin dashboard again');
  console.log('');
  console.log('💡 This will create the missing admin user and fix the 401 errors!');
}

checkAdminSetup().catch(console.error);
