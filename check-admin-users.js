const axios = require('axios');

const PRODUCTION_URL = 'https://thanksdoc-be-production.up.railway.app';

async function checkAdminUsers() {
  console.log('🔍 Checking Admin Users in Production Database');
  console.log('🎯 Target:', PRODUCTION_URL);
  console.log('=' .repeat(60));

  try {
    // Check if we can access the admin API
    console.log('\n🔐 Testing admin API access...');
    
    // Try to access admin users (this will likely fail without auth)
    try {
      const adminResponse = await axios.get(`${PRODUCTION_URL}/admin/users`);
      console.log(`✅ Admin users endpoint accessible: ${adminResponse.status}`);
    } catch (error) {
      console.log(`❌ Admin users endpoint: ${error.response?.status} - ${error.message}`);
    }

    // Check regular users-permissions users
    console.log('\n👥 Checking users-permissions users...');
    try {
      const usersResponse = await axios.get(`${PRODUCTION_URL}/api/users`);
      console.log(`✅ Users endpoint: ${usersResponse.status} (${usersResponse.data?.length || 0} users)`);
      
      if (usersResponse.data && usersResponse.data.length > 0) {
        console.log('📋 Users found:');
        usersResponse.data.forEach(user => {
          console.log(`  - ${user.email || user.username} (ID: ${user.id})`);
        });
      }
    } catch (error) {
      console.log(`❌ Users endpoint: ${error.response?.status} - ${error.message}`);
    }

    // Check admins table directly
    console.log('\n👑 Checking admins table...');
    try {
      const adminsResponse = await axios.get(`${PRODUCTION_URL}/api/admins`);
      console.log(`✅ Admins endpoint: ${adminsResponse.status} (${adminsResponse.data?.data?.length || 0} admins)`);
      
      if (adminsResponse.data?.data && adminsResponse.data.data.length > 0) {
        console.log('📋 Admins found:');
        adminsResponse.data.data.forEach(admin => {
          console.log(`  - ${admin.email} (ID: ${admin.id})`);
        });
      }
    } catch (error) {
      console.log(`❌ Admins endpoint: ${error.response?.status} - ${error.message}`);
    }

    console.log('\n💡 Issue Analysis:');
    console.log('The problem appears to be that your admin dashboard is making');
    console.log('authenticated requests, but there might not be proper admin users');
    console.log('set up in the new database.');
    console.log('');
    console.log('🔧 Solutions:');
    console.log('1. Create an admin user in the new database');
    console.log('2. Copy admin users from the working database');
    console.log('3. Check if the JWT secret is the same between databases');

  } catch (error) {
    console.error('❌ Error during admin user check:', error.message);
  }
}

checkAdminUsers().catch(console.error);
