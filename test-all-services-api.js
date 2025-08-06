const axios = require('axios');

async function testAllServicesAPI() {
  try {
    console.log('🧪 Testing ALL services API endpoint...');
    
    // Test without any filters
    const url = 'http://localhost:1337/api/services?sort=category:asc,displayOrder:asc';
    console.log('📡 Fetching from:', url);
    
    const response = await axios.get(url);
    console.log('✅ Response status:', response.status);
    
    let services = [];
    if (response.data && Array.isArray(response.data.data)) {
      services = response.data.data;
    } else if (Array.isArray(response.data)) {
      services = response.data;
    }
    
    console.log('📋 Total services found:', services.length);
    
    // Group by category and serviceType
    const categories = {};
    const serviceTypes = {};
    
    services.forEach(service => {
      // By category
      if (!categories[service.category]) {
        categories[service.category] = [];
      }
      categories[service.category].push(service);
      
      // By serviceType
      const type = service.serviceType || 'NO_TYPE';
      if (!serviceTypes[type]) {
        serviceTypes[type] = [];
      }
      serviceTypes[type].push(service);
    });
    
    console.log('\n📊 Services by category:');
    Object.keys(categories).forEach(category => {
      console.log(`\n🏷️ ${category?.toUpperCase() || 'UNDEFINED'}: ${categories[category].length} services`);
      categories[category].slice(0, 5).forEach(service => {
        console.log(`   - ${service.name} (£${service.price}, Type: ${service.serviceType || 'N/A'})`);
      });
      if (categories[category].length > 5) {
        console.log(`   ... and ${categories[category].length - 5} more`);
      }
    });
    
    console.log('\n📊 Services by serviceType:');
    Object.keys(serviceTypes).forEach(type => {
      console.log(`\n🔖 ${type}: ${serviceTypes[type].length} services`);
    });
    
    // Check specifically for subcategory services by category
    const subcategoryServices = services.filter(s => s.serviceType === 'subcategory');
    console.log('\n🎯 SUBCATEGORY services by category:');
    const subcatByCategory = {};
    subcategoryServices.forEach(service => {
      if (!subcatByCategory[service.category]) {
        subcatByCategory[service.category] = [];
      }
      subcatByCategory[service.category].push(service);
    });
    
    Object.keys(subcatByCategory).forEach(category => {
      console.log(`   ${category}: ${subcatByCategory[category].length} services`);
    });
    
  } catch (error) {
    console.error('❌ Error testing API:', error.response?.data || error.message);
  }
}

testAllServicesAPI();
