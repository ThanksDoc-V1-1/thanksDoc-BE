const axios = require('axios');

async function testServicesAPI() {
  try {
    console.log('🧪 Testing services API endpoint...');
    
    // Test the exact endpoint that the frontend uses
    const url = 'http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&sort=category:asc,displayOrder:asc';
    console.log('📡 Fetching from:', url);
    
    const response = await axios.get(url);
    console.log('✅ Response status:', response.status);
    console.log('📊 Response data structure:', {
      hasData: !!response.data,
      isArray: Array.isArray(response.data),
      hasDataProperty: !!response.data.data,
      dataIsArray: Array.isArray(response.data.data)
    });
    
    let services = [];
    if (response.data && Array.isArray(response.data.data)) {
      services = response.data.data;
      console.log('📊 Using data.data array:', services.length, 'services');
    } else if (Array.isArray(response.data)) {
      services = response.data;
      console.log('📊 Using data array:', services.length, 'services');
    }
    
    console.log('📋 Services found:', services.length);
    
    // Group by category
    const categories = {};
    services.forEach(service => {
      if (!categories[service.category]) {
        categories[service.category] = [];
      }
      categories[service.category].push(service);
    });
    
    console.log('\n📊 Services by category:');
    Object.keys(categories).forEach(category => {
      console.log(`\n🏷️ ${category.toUpperCase()}: ${categories[category].length} services`);
      categories[category].forEach(service => {
        console.log(`   - ${service.name} (£${service.price}, ${service.duration}min, Type: ${service.serviceType || 'N/A'})`);
      });
    });
    
    // Test if any services are missing serviceType
    const missingServiceType = services.filter(s => !s.serviceType);
    if (missingServiceType.length > 0) {
      console.log('\n⚠️ Services missing serviceType:');
      missingServiceType.forEach(service => {
        console.log(`   - ${service.name} (${service.category})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testServicesAPI();
