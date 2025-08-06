const axios = require('axios');

const baseURL = 'http://localhost:1337';

async function createMissingServices() {
  try {
    console.log('🔧 Creating missing Online and NHS services...');
    
    // Online services with correct category and serviceType
    const onlineServices = [
      {
        name: 'Online Consultation',
        description: 'Video/phone consultation with doctor',
        category: 'online',
        duration: 30,
        price: 50.00,
        serviceType: 'subcategory',
        isActive: true,
        displayOrder: 1
      },
      {
        name: 'Private Prescriptions Updated',
        description: 'Private prescription services online',
        category: 'online',
        duration: 15,
        price: 34.00,
        serviceType: 'subcategory',
        isActive: true,
        displayOrder: 2
      },
      {
        name: 'Letters - Referrals/Scans/Sick notes',
        description: 'Medical letters and certificates',
        category: 'online',
        duration: 15,
        price: 25.00,
        serviceType: 'subcategory',
        isActive: true,
        displayOrder: 3
      },
      {
        name: 'Specialist Clinics – menopause/mens health/TRT/derm',
        description: 'Specialist consultation services',
        category: 'online',
        duration: 45,
        price: 75.00,
        serviceType: 'subcategory',
        isActive: true,
        displayOrder: 4
      }
    ];

    // NHS services with correct category and serviceType
    const nhsServices = [
      {
        name: 'NHS Consultation',
        description: 'NHS medical consultation',
        category: 'nhs',
        duration: 30,
        price: 50.00,
        serviceType: 'subcategory',
        isActive: true,
        displayOrder: 1
      },
      {
        name: 'NHS Home Visit',
        description: 'NHS home visit service',
        category: 'nhs',
        duration: 60,
        price: 100.00,
        serviceType: 'subcategory',
        isActive: true,
        displayOrder: 2
      }
    ];

    console.log('💻 Creating Online services...');
    for (const service of onlineServices) {
      try {
        const response = await axios.post(`${baseURL}/api/services`, {
          data: service
        });
        console.log(`✅ Created: ${service.name} (online) - £${service.price}`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('unique')) {
          console.log(`⚠️ Already exists: ${service.name} (online)`);
        } else {
          console.error(`❌ Error creating ${service.name}:`, error.response?.data?.error?.message || error.message);
        }
      }
    }

    console.log('🏛️ Creating NHS services...');
    for (const service of nhsServices) {
      try {
        const response = await axios.post(`${baseURL}/api/services`, {
          data: service
        });
        console.log(`✅ Created: ${service.name} (nhs) - £${service.price}`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('unique')) {
          console.log(`⚠️ Already exists: ${service.name} (nhs)`);
        } else {
          console.error(`❌ Error creating ${service.name}:`, error.response?.data?.error?.message || error.message);
        }
      }
    }

    console.log('\n🧪 Testing API after creation...');
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a second
    
    const response = await axios.get(`${baseURL}/api/services?filters[serviceType][$eq]=subcategory&sort=category:asc,displayOrder:asc`);
    const services = response.data.data || response.data;
    
    const categories = {};
    services.forEach(service => {
      if (!categories[service.category]) {
        categories[service.category] = [];
      }
      categories[service.category].push(service);
    });
    
    console.log('\n📊 Final service categories:');
    Object.keys(categories).forEach(category => {
      console.log(`   ${category}: ${categories[category].length} services`);
    });

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

createMissingServices();
