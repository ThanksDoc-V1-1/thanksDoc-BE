// Check if admin user exists and create if needed

const axios = require('axios');

async function checkAndCreateAdmin() {
  try {
    // First check if we can access the admin endpoint directly
    console.log('🔍 Checking if admin exists...');
    
    // Try to trigger admin creation by checking the admin service
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Run a Strapi command to ensure admin is created
    console.log('🏗️ Running admin creation script...');
    
    try {
      const result = await execAsync('node -e "' +
        'const strapi = require(\"@strapi/strapi\");' +
        'strapi().load().then(async (app) => {' +
          'try {' +
            'await app.service(\"api::admin.admin\").ensureDefaultAdmin();' +
            'console.log(\"Admin check completed\");' +
            'process.exit(0);' +
          '} catch (e) {' +
            'console.error(\"Error:\", e.message);' +
            'process.exit(1);' +
          '}' +
        '});' +
      '"');
      console.log('✅ Admin creation result:', result.stdout);
    } catch (error) {
      console.log('⚠️ Admin creation script error:', error.message);
    }
    
    // Now try login again
    console.log('🔑 Attempting admin login...');
    const loginResponse = await axios.post('http://localhost:1337/api/auth/login', {
      email: 'admin@gmail.com',
      password: 'admin123'
    });
    
    console.log('✅ Admin login successful!');
    console.log('🔑 JWT Token:', loginResponse.data.jwt.substring(0, 50) + '...');
    console.log('👤 User:', loginResponse.data.user);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

checkAndCreateAdmin();
