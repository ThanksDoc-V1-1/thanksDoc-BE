const axios = require('axios');

async function debugServicesAPI() {
  try {
    console.log('🔍 Debugging services API...');
    
    // Get all services without any filters
    const response = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
    const allServices = response.data.data || response.data;
    
    console.log(`📋 Total services in database: ${allServices.length}`);
    
    // Group by category
    const byCategory = {};
    const byServiceType = {};
    
    allServices.forEach(service => {
      // By category
      const cat = service.category || 'NO_CATEGORY';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(service);
      
      // By serviceType
      const type = service.serviceType || 'NO_TYPE';
      if (!byServiceType[type]) byServiceType[type] = [];
      byServiceType[type].push(service);
    });
    
    console.log('\n📊 All services by category:');
    Object.keys(byCategory).forEach(category => {
      console.log(`\n🏷️ ${category.toUpperCase()}: ${byCategory[category].length} services`);
      byCategory[category].forEach(service => {
        console.log(`   - ${service.name} (Type: ${service.serviceType || 'N/A'}, Price: £${service.price || 'N/A'})`);
      });
    });
    
    console.log('\n📊 All services by serviceType:');
    Object.keys(byServiceType).forEach(type => {
      console.log(`\n🔖 ${type}: ${byServiceType[type].length} services`);
      if (type === 'subcategory') {
        const subcatByCategory = {};
        byServiceType[type].forEach(service => {
          const cat = service.category || 'NO_CATEGORY';
          if (!subcatByCategory[cat]) subcatByCategory[cat] = [];
          subcatByCategory[cat].push(service);
        });
        console.log('   Subcategory breakdown:');
        Object.keys(subcatByCategory).forEach(cat => {
          console.log(`     ${cat}: ${subcatByCategory[cat].length} services`);
        });
      }
    });
    
    // Search specifically for online and nhs services
    console.log('\n🔍 Searching for online and nhs services:');
    const onlineServices = allServices.filter(s => s.category === 'online');
    const nhsServices = allServices.filter(s => s.category === 'nhs');
    
    console.log(`\n💻 Online services found: ${onlineServices.length}`);
    onlineServices.forEach(service => {
      console.log(`   - ${service.name} (Type: ${service.serviceType || 'N/A'})`);
    });
    
    console.log(`\n🏛️ NHS services found: ${nhsServices.length}`);
    nhsServices.forEach(service => {
      console.log(`   - ${service.name} (Type: ${service.serviceType || 'N/A'})`);
    });
    
    // Test the filtered API directly
    console.log('\n🧪 Testing filtered API calls:');
    
    // Online subcategories
    try {
      const onlineSubcat = await axios.get('http://localhost:1337/api/services?filters[category][$eq]=online&filters[serviceType][$eq]=subcategory');
      console.log(`Online subcategories: ${onlineSubcat.data.data?.length || 0}`);
    } catch (error) {
      console.log('Error fetching online subcategories:', error.message);
    }
    
    // NHS subcategories
    try {
      const nhsSubcat = await axios.get('http://localhost:1337/api/services?filters[category][$eq]=nhs&filters[serviceType][$eq]=subcategory');
      console.log(`NHS subcategories: ${nhsSubcat.data.data?.length || 0}`);
    } catch (error) {
      console.log('Error fetching NHS subcategories:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

debugServicesAPI();
