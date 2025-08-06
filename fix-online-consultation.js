const axios = require('axios');

async function fixOnlineConsultation() {
  try {
    console.log('🔧 Fixing Online Consultation service...');
    
    // Get the Online Consultation service that should be subcategory
    const response = await axios.get('http://localhost:1337/api/services?filters[name][$eq]=Online Consultation&filters[category][$eq]=online');
    const services = response.data.data || [];
    
    if (services.length === 0) {
      console.log('❌ No "Online Consultation" service found');
      return;
    }
    
    const service = services[0];
    console.log(`📋 Found service: ${service.name} (ID: ${service.id})`);
    console.log(`   Current serviceType: ${service.serviceType || 'NOT SET'}`);
    console.log(`   Current price: £${service.price || 'NOT SET'}`);
    console.log(`   Current duration: ${service.duration || 'NOT SET'} min`);
    
    // Update the service to be a subcategory with proper price and duration
    const updateData = {
      serviceType: 'subcategory',
      price: 50.00,
      duration: 30,
      displayOrder: 1 // Make it first in online services
    };
    
    console.log('\n🔄 Updating service...');
    const updateResponse = await axios.put(`http://localhost:1337/api/services/${service.documentId}`, {
      data: updateData
    });
    
    if (updateResponse.status === 200) {
      console.log('✅ Successfully updated Online Consultation service');
      console.log('   New serviceType: subcategory');
      console.log('   New price: £50.00');
      console.log('   New duration: 30 min');
      console.log('   New displayOrder: 1');
      
      // Test the frontend API to confirm it now appears
      console.log('\n🧪 Testing frontend API...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait a second
      
      const testResponse = await axios.get('http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&filters[category][$eq]=online&sort=displayOrder:asc');
      const onlineSubcategories = testResponse.data.data || [];
      
      console.log(`\n💻 Online subcategory services: ${onlineSubcategories.length}`);
      onlineSubcategories.forEach((service, index) => {
        console.log(`   ${index + 1}. ${service.name} - £${service.price} (${service.duration}min)`);
      });
      
      const onlineConsultationFound = onlineSubcategories.find(s => s.name === 'Online Consultation');
      if (onlineConsultationFound) {
        console.log('\n🎉 Online Consultation now appears in frontend API!');
      } else {
        console.log('\n❌ Online Consultation still not found');
      }
      
    } else {
      console.log('❌ Failed to update service');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

fixOnlineConsultation();
