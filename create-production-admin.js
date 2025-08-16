const axios = require('axios');

const PRODUCTION_URL = 'https://thanksdoc-be-production.up.railway.app';

// Admin user details (you can modify these)
const adminData = {
  email: 'admin@uberdoc.com',
  password: 'Admin123!',
  firstName: 'Admin',
  lastName: 'User',
  role: 'admin'
};

async function createProductionAdmin() {
  console.log('👑 Creating Admin User in Production Database');
  console.log('🎯 Target:', PRODUCTION_URL);
  console.log('📧 Email:', adminData.email);
  console.log('=' .repeat(60));

  try {
    // Method 1: Try creating via auth/register endpoint
    console.log('\n🔑 Method 1: Creating admin via auth/register...');
    
    const registerResponse = await axios.post(`${PRODUCTION_URL}/api/auth/register`, {
      email: adminData.email,
      password: adminData.password,
      firstName: adminData.firstName,
      lastName: adminData.lastName,
      type: 'admin' // This should create an admin user
    });
    
    if (registerResponse.data) {
      console.log('✅ Admin user created successfully via auth/register!');
      console.log('📧 Email:', adminData.email);
      console.log('🔑 Password:', adminData.password);
      console.log('🆔 User ID:', registerResponse.data.user?.id);
      
      return true;
    }
    
  } catch (error) {
    console.log(`❌ Auth/register failed: ${error.response?.status} - ${error.response?.data?.error?.message || error.message}`);
    
    // Method 2: Try creating via admins endpoint
    console.log('\n🔑 Method 2: Creating admin via admins endpoint...');
    
    try {
      const adminResponse = await axios.post(`${PRODUCTION_URL}/api/admins`, {
        data: {
          email: adminData.email,
          password: adminData.password,
          firstName: adminData.firstName,
          lastName: adminData.lastName,
          isActive: true
        }
      });
      
      if (adminResponse.data) {
        console.log('✅ Admin user created successfully via admins endpoint!');
        return true;
      }
      
    } catch (adminError) {
      console.log(`❌ Admins endpoint failed: ${adminError.response?.status} - ${adminError.response?.data?.error?.message || adminError.message}`);
    }
  }

  console.log('\n⚠️  Both methods failed. Let me try a different approach...');
  
  // Method 3: Create admin via users-permissions
  try {
    console.log('\n🔑 Method 3: Creating admin via users endpoint...');
    
    const userResponse = await axios.post(`${PRODUCTION_URL}/api/auth/local/register`, {
      username: adminData.email,
      email: adminData.email,
      password: adminData.password,
      role: 5 // Admin role ID from your roles check
    });
    
    if (userResponse.data) {
      console.log('✅ User created successfully!');
      console.log('🆔 User ID:', userResponse.data.user?.id);
      console.log('📧 Email:', adminData.email);
      return true;
    }
    
  } catch (userError) {
    console.log(`❌ Users endpoint failed: ${userError.response?.status} - ${userError.response?.data?.error?.message || userError.message}`);
  }

  console.log('\n❌ All methods failed. Manual admin creation needed.');
  console.log('\n💡 Manual Solution:');
  console.log('1. Access your Railway database directly');
  console.log('2. Insert admin user into admin_users table');
  console.log('3. Or use Strapi admin panel setup wizard');
  
  return false;
}

// Test login after creation
async function testAdminLogin() {
  console.log('\n🧪 Testing admin login...');
  
  try {
    const loginResponse = await axios.post(`${PRODUCTION_URL}/api/auth/local`, {
      identifier: adminData.email,
      password: adminData.password
    });
    
    if (loginResponse.data?.jwt) {
      console.log('✅ Admin login successful!');
      console.log('🎫 JWT token received');
      
      // Test authenticated request
      const token = loginResponse.data.jwt;
      const testResponse = await axios.get(`${PRODUCTION_URL}/api/system-settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('✅ Authenticated API call successful!');
      console.log(`📊 Retrieved ${testResponse.data?.data?.length || 0} system settings`);
      
      return true;
    }
    
  } catch (error) {
    console.log(`❌ Login test failed: ${error.response?.status} - ${error.message}`);
  }
  
  return false;
}

async function main() {
  const created = await createProductionAdmin();
  
  if (created) {
    await testAdminLogin();
    
    console.log('\n🎉 Success! Your admin user is ready.');
    console.log('🔗 You can now access your admin dashboard with:');
    console.log(`📧 Email: ${adminData.email}`);
    console.log(`🔑 Password: ${adminData.password}`);
  } else {
    console.log('\n❌ Failed to create admin user automatically.');
    console.log('Please create one manually via the Strapi admin panel.');
  }
}

main().catch(console.error);
