const axios = require('axios');

// Configuration
const LOCAL_API_URL = process.env.LOCAL_API_URL || 'http://localhost:1337/api';
const PRODUCTION_API_URL = 'https://thanks-doc-be-production.up.railway.app/api';

// Add your production admin JWT token here if needed for authentication
const PRODUCTION_ADMIN_JWT = process.env.PRODUCTION_ADMIN_JWT || '';

// Create axios instances
const localAPI = axios.create({
  baseURL: LOCAL_API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

const productionAPI = axios.create({
  baseURL: PRODUCTION_API_URL,
  headers: {
    'Content-Type': 'application/json',
    ...(PRODUCTION_ADMIN_JWT && { 'Authorization': `Bearer ${PRODUCTION_ADMIN_JWT}` })
  }
});

// Fallback system settings if local is not available
const fallbackSettings = [
  {
    key: 'booking_fee',
    value: '3.00',
    dataType: 'number',
    description: 'Booking fee charged for each service request',
    category: 'pricing',
    isPublic: true
  },
  {
    key: 'platform_commission',
    value: '10.00',
    dataType: 'number',
    description: 'Platform commission percentage',
    category: 'pricing',
    isPublic: false
  },
  {
    key: 'max_cancellation_hours',
    value: '24',
    dataType: 'number',
    description: 'Maximum hours before service to allow cancellation',
    category: 'policies',
    isPublic: true
  },
  {
    key: 'maintenance_mode',
    value: 'false',
    dataType: 'boolean',
    description: 'Enable maintenance mode for the platform',
    category: 'system',
    isPublic: true
  },
  {
    key: 'support_email',
    value: 'support@uberdoc.com',
    dataType: 'string',
    description: 'Support email address',
    category: 'contact',
    isPublic: true
  },
  {
    key: 'support_phone',
    value: '+44 123 456 7890',
    dataType: 'string',
    description: 'Support phone number',
    category: 'contact',
    isPublic: true
  },
  {
    key: 'currency_symbol',
    value: '£',
    dataType: 'string',
    description: 'Currency symbol used in the application',
    category: 'general',
    isPublic: true
  },
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
    category: 'service',
    isPublic: true
  },
  {
    key: 'max_service_duration',
    value: '12',
    dataType: 'number',
    description: 'Maximum service duration in hours',
    category: 'service',
    isPublic: true
  }
];

async function fetchLocalSystemSettings() {
  console.log('🔍 Fetching system settings from local backend...');
  console.log('📡 Local API URL:', LOCAL_API_URL);
  
  try {
    // Try to fetch from local admin endpoint first
    const response = await localAPI.get('/system-settings');
    if (response.data?.data && Array.isArray(response.data.data)) {
      console.log(`✅ Found ${response.data.data.length} system settings in local backend`);
      return response.data.data;
    }
  } catch (error) {
    console.log('⚠️  Could not fetch from admin endpoint, trying public endpoint...');
    
    try {
      // Try public endpoint
      const publicResponse = await localAPI.get('/system-settings/public');
      if (publicResponse.data?.data) {
        console.log('✅ Found public system settings in local backend');
        // Convert public settings format to full format
        const publicData = publicResponse.data.data;
        const settings = Object.keys(publicData).map(key => ({
          key,
          value: String(publicData[key]),
          dataType: typeof publicData[key] === 'number' ? 'number' : 
                   typeof publicData[key] === 'boolean' ? 'boolean' : 'string',
          description: `Setting for ${key}`,
          category: 'general',
          isPublic: true
        }));
        console.log(`✅ Converted ${settings.length} public settings to full format`);
        return settings;
      }
    } catch (publicError) {
      console.log('⚠️  Could not fetch from public endpoint either');
    }
  }
  
  console.log('📦 Using fallback system settings');
  return fallbackSettings;
}

async function seedSettingToProduction(setting) {
  try {
    console.log(`\n📝 Seeding setting: ${setting.key}...`);
    
    // Check if setting already exists in production
    try {
      const checkResponse = await productionAPI.get(`/system-settings/key/${setting.key}`);
      if (checkResponse.data?.data) {
        console.log(`⏭️  Setting '${setting.key}' already exists in production, updating...`);
      }
    } catch (checkError) {
      console.log(`🆕 Setting '${setting.key}' doesn't exist in production, creating...`);
    }

    // Create or update the setting in production
    const settingData = {
      key: setting.key,
      value: setting.value,
      dataType: setting.dataType || 'string',
      description: setting.description || `System setting for ${setting.key}`,
      category: setting.category || 'general',
      isPublic: setting.isPublic !== undefined ? setting.isPublic : true
    };

    const response = await productionAPI.put(`/system-settings/key/${setting.key}`, settingData);
    
    if (response.data?.data) {
      console.log(`✅ Successfully seeded setting '${setting.key}':`, {
        value: response.data.data.value,
        dataType: response.data.data.dataType,
        isPublic: response.data.data.isPublic
      });
      return { success: true, setting: setting.key };
    } else {
      console.log(`⚠️  Unexpected response for setting '${setting.key}':`, response.data);
      return { success: false, setting: setting.key, error: 'Unexpected response' };
    }
  } catch (error) {
    console.error(`❌ Error seeding setting '${setting.key}':`, {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
    return { success: false, setting: setting.key, error: error.message };
  }
}

async function seedSystemSettingsToProduction() {
  console.log('🚀 Starting system settings seeding to production...');
  console.log('🎯 Production API URL:', PRODUCTION_API_URL);
  console.log('🔐 Using admin JWT:', PRODUCTION_ADMIN_JWT ? 'Yes' : 'No (public endpoints only)');
  
  try {
    // Step 1: Fetch local system settings
    const localSettings = await fetchLocalSystemSettings();
    
    if (!localSettings || localSettings.length === 0) {
      console.log('❌ No system settings found to seed');
      return;
    }

    // Step 2: Seed each setting to production
    console.log(`\n📡 Seeding ${localSettings.length} settings to production...`);
    
    let successCount = 0;
    let errorCount = 0;
    const errors = [];

    for (const setting of localSettings) {
      const result = await seedSettingToProduction(setting);
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
        errors.push(result);
      }
    }

    // Step 3: Summary and verification
    console.log('\n🏁 System settings seeding completed!');
    console.log('📊 Summary:');
    console.log(`  ✅ Successfully seeded: ${successCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    if (errors.length > 0) {
      console.log('\n❌ Failed settings:');
      errors.forEach(error => {
        console.log(`  - ${error.setting}: ${error.error}`);
      });
    }

    // Step 4: Test production public settings endpoint
    console.log('\n🔍 Testing production public settings endpoint...');
    try {
      const productionPublicResponse = await axios.get(`${PRODUCTION_API_URL}/system-settings/public`);
      console.log('✅ Production public settings endpoint working:');
      console.log('📄 Production public settings:', JSON.stringify(productionPublicResponse.data.data, null, 2));
      
      // Specifically check booking fee
      const bookingFee = productionPublicResponse.data.data?.booking_fee;
      if (bookingFee !== undefined) {
        console.log(`💰 Booking fee is accessible in production: £${bookingFee}`);
      } else {
        console.log('⚠️  Booking fee not found in production public settings');
      }
    } catch (error) {
      console.error('❌ Error testing production public settings endpoint:', error.message);
    }

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error.message);
    process.exit(1);
  }
}

// Run the seeding process
if (require.main === module) {
  seedSystemSettingsToProduction()
    .then(() => {
      console.log('\n🎉 System settings seeding completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 System settings seeding failed:', error.message);
      process.exit(1);
    });
}

module.exports = { seedSystemSettingsToProduction, fetchLocalSystemSettings };
