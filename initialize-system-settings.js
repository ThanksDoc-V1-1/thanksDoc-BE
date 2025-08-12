const axios = require('axios');

// Configuration
const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const ADMIN_JWT = process.env.ADMIN_JWT || '';

const api = axios.create({
  baseURL: STRAPI_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(ADMIN_JWT && { 'Authorization': `Bearer ${ADMIN_JWT}` })
  }
});

async function initializeSystemSettings() {
  console.log('🔧 Initializing system settings...');

  try {
    // Initialize booking fee setting
    const bookingFeeSetting = {
      key: 'booking_fee',
      value: '3.00',
      dataType: 'number',
      description: 'Service booking fee charged to businesses for each service request',
      category: 'pricing',
      isPublic: true // Make it publicly accessible so frontend can fetch it
    };

    console.log('💰 Creating booking fee setting:', bookingFeeSetting);

    const response = await api.put(`/api/system-settings/key/${bookingFeeSetting.key}`, bookingFeeSetting);
    console.log('✅ Booking fee setting created/updated:', response.data);

    // Initialize other useful settings
    const otherSettings = [
      {
        key: 'platform_name',
        value: 'Uber Doc',
        dataType: 'string',
        description: 'Name of the platform',
        category: 'general',
        isPublic: true
      },
      {
        key: 'min_service_duration',
        value: '1',
        dataType: 'number',
        description: 'Minimum service duration in hours',
        category: 'services',
        isPublic: true
      },
      {
        key: 'max_service_duration',
        value: '12',
        dataType: 'number',
        description: 'Maximum service duration in hours',
        category: 'services',
        isPublic: true
      },
      {
        key: 'currency_symbol',
        value: '£',
        dataType: 'string',
        description: 'Currency symbol used throughout the platform',
        category: 'pricing',
        isPublic: true
      }
    ];

    for (const setting of otherSettings) {
      console.log(`🔧 Creating setting: ${setting.key}`);
      try {
        const response = await api.put(`/api/system-settings/key/${setting.key}`, setting);
        console.log(`✅ Setting created/updated: ${setting.key}`);
      } catch (error) {
        console.error(`❌ Error creating setting ${setting.key}:`, error.response?.data || error.message);
      }
    }

    console.log('✅ All system settings initialized successfully!');

  } catch (error) {
    console.error('❌ Error initializing system settings:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      console.log('💡 To run this script, either:');
      console.log('   1. Make sure Strapi is running and the system-setting content type is created');
      console.log('   2. Set ADMIN_JWT environment variable with a valid admin JWT token');
      console.log('   3. Or run this script after logging in to the admin panel');
    }
  }
}

// Test function to verify settings
async function testSettings() {
  console.log('\n🧪 Testing system settings...');

  try {
    // Test public settings endpoint
    const publicResponse = await axios.get(`${STRAPI_URL}/api/system-settings/public`);
    console.log('📊 Public settings:', publicResponse.data);

    // Test specific setting
    const bookingFeeResponse = await api.get('/api/system-settings/key/booking_fee');
    console.log('💰 Booking fee setting:', bookingFeeResponse.data);

  } catch (error) {
    console.error('❌ Error testing settings:', error.response?.data || error.message);
  }
}

// Run initialization
if (require.main === module) {
  initializeSystemSettings()
    .then(() => testSettings())
    .then(() => {
      console.log('\n🎉 System settings initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Failed to initialize system settings:', error);
      process.exit(1);
    });
}

module.exports = { initializeSystemSettings, testSettings };
