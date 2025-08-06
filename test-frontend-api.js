const axios = require('axios');

async function testExactFrontendAPI() {
  try {
    console.log('🧪 Testing exact frontend API call...');
    
    // This is the exact API call from the frontend
    const url = 'http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&sort=category:asc,displayOrder:asc';
    
    console.log('📡 URL:', url);
    const response = await axios.get(url);
    
    console.log('✅ Status:', response.status);
    console.log('📊 Response structure:', {
      hasData: !!response.data,
      hasDataProperty: !!response.data.data,
      dataLength: response.data.data?.length || 0
    });
    
    const services = response.data.data || [];
    console.log(`📋 Services returned: ${services.length}`);
    
    // Count by category
    const categories = {};
    services.forEach(service => {
      const cat = service.category || 'unknown';
      if (!categories[cat]) categories[cat] = 0;
      categories[cat]++;
    });
    
    console.log('\n📊 Categories in API response:');
    Object.keys(categories).forEach(cat => {
      console.log(`   ${cat}: ${categories[cat]} services`);
    });
    
    // Test with different API parameters
    console.log('\n🧪 Testing alternative API calls:');
    
    // Without sort parameter
    try {
      const response2 = await axios.get('http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory');
      console.log(`Without sort: ${response2.data.data?.length || 0} services`);
    } catch (error) {
      console.log('Error without sort:', error.message);
    }
    
    // Test each category separately
    for (const category of ['online', 'nhs', 'in-person']) {
      try {
        const catResponse = await axios.get(`http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&filters[category][$eq]=${category}`);
        console.log(`${category}: ${catResponse.data.data?.length || 0} services`);
      } catch (error) {
        console.log(`Error with ${category}:`, error.message);
      }
    }
    
    // Test pagination
    try {
      const paginatedResponse = await axios.get('http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&pagination[limit]=100&sort=category:asc,displayOrder:asc');
      console.log(`With pagination limit 100: ${paginatedResponse.data.data?.length || 0} services`);
      
      const paginatedCategories = {};
      paginatedResponse.data.data.forEach(service => {
        const cat = service.category || 'unknown';
        if (!paginatedCategories[cat]) paginatedCategories[cat] = 0;
        paginatedCategories[cat]++;
      });
      
      console.log('Paginated categories:');
      Object.keys(paginatedCategories).forEach(cat => {
        console.log(`   ${cat}: ${paginatedCategories[cat]} services`);
      });
      
    } catch (error) {
      console.log('Error with pagination:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testExactFrontendAPI();
