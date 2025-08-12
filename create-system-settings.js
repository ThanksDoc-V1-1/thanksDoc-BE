const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:1337/api';

// Default system settings to create
const defaultSettings = [
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
  }
];

async function createSystemSettings() {
  console.log('🚀 Starting system settings initialization...');
  console.log('📡 API Base URL:', API_BASE_URL);
  
  try {
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    for (const setting of defaultSettings) {
      try {
        console.log(`\n📝 Creating setting: ${setting.key}...`);
        
        // Check if setting already exists
        try {
          const checkResponse = await axios.get(`${API_BASE_URL}/system-settings/key/${setting.key}`);
          if (checkResponse.data?.data) {
            console.log(`⏭️  Setting '${setting.key}' already exists, skipping...`);
            skipCount++;
            continue;
          }
        } catch (checkError) {
          // Setting doesn't exist, proceed with creation
          console.log(`🆕 Setting '${setting.key}' doesn't exist, creating...`);
        }

        // Create the setting
        const response = await axios.put(`${API_BASE_URL}/system-settings/key/${setting.key}`, setting);
        
        if (response.data?.data) {
          console.log(`✅ Successfully created setting '${setting.key}':`, {
            value: response.data.data.value,
            dataType: response.data.data.dataType,
            isPublic: response.data.data.isPublic
          });
          successCount++;
        } else {
          console.log(`⚠️  Unexpected response for setting '${setting.key}':`, response.data);
          errorCount++;
        }
      } catch (error) {
        console.error(`❌ Error creating setting '${setting.key}':`, {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        errorCount++;
      }
    }

    console.log('\n🏁 System settings initialization completed!');
    console.log('📊 Summary:');
    console.log(`  ✅ Successfully created: ${successCount}`);
    console.log(`  ⏭️  Skipped (already exist): ${skipCount}`);
    console.log(`  ❌ Errors: ${errorCount}`);

    // Test the public settings endpoint
    console.log('\n🔍 Testing public settings endpoint...');
    try {
      const publicResponse = await axios.get(`${API_BASE_URL}/system-settings/public`);
      console.log('✅ Public settings endpoint working:');
      console.log('📄 Public settings:', JSON.stringify(publicResponse.data.data, null, 2));
      
      // Specifically check booking fee
      const bookingFee = publicResponse.data.data?.booking_fee;
      if (bookingFee !== undefined) {
        console.log(`💰 Booking fee is accessible: £${bookingFee}`);
      } else {
        console.log('⚠️  Booking fee not found in public settings');
      }
    } catch (error) {
      console.error('❌ Error testing public settings endpoint:', error.message);
    }

  } catch (error) {
    console.error('❌ Fatal error during initialization:', error.message);
    process.exit(1);
  }
}

// Run the initialization
createSystemSettings()
  .then(() => {
    console.log('\n🎉 Initialization script completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Initialization script failed:', error.message);
    process.exit(1);
  });
