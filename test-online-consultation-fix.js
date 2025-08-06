const axios = require('axios');

async function testOnlineConsultationFix() {
  try {
    console.log('🧪 Testing if Online Consultation now appears...');
    
    // Test the exact API call that frontend uses
    const response = await axios.get('http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&sort=category:asc,displayOrder:asc&pagination[limit]=100');
    const services = response.data.data || [];
    
    // Filter online services
    const onlineServices = services.filter(s => s.category === 'online');
    console.log(`\n💻 Online subcategory services found: ${onlineServices.length}`);
    
    onlineServices.forEach((service, index) => {
      console.log(`   ${index + 1}. ${service.name} - £${service.price} (${service.duration}min, Order: ${service.displayOrder})`);
    });
    
    // Check if Online Consultation is there
    const onlineConsultation = onlineServices.find(s => s.name === 'Online Consultation');
    
    if (onlineConsultation) {
      console.log('\n🎉 SUCCESS: Online Consultation is now available in the frontend!');
      console.log(`   Service: ${onlineConsultation.name}`);
      console.log(`   Price: £${onlineConsultation.price}`);
      console.log(`   Duration: ${onlineConsultation.duration} minutes`);
      console.log(`   Category: ${onlineConsultation.category}`);
      console.log(`   ServiceType: ${onlineConsultation.serviceType}`);
      console.log(`   Display Order: ${onlineConsultation.displayOrder}`);
    } else {
      console.log('\n❌ Online Consultation still not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testOnlineConsultationFix();
