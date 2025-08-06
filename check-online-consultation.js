const axios = require('axios');

async function checkOnlineConsultation() {
  try {
    console.log('🔍 Investigating Online Consultation service...');
    
    // Get all services without filters
    const allResponse = await axios.get('http://localhost:1337/api/services?pagination[limit]=100');
    const allServices = allResponse.data.data || [];
    
    // Find all services with "consultation" in the name
    const consultationServices = allServices.filter(service => 
      service.name.toLowerCase().includes('consultation')
    );
    
    console.log(`\n📋 Found ${consultationServices.length} consultation services:`);
    consultationServices.forEach((service, index) => {
      console.log(`\n${index + 1}. ${service.name}`);
      console.log(`   ID: ${service.id}`);
      console.log(`   Category: ${service.category}`);
      console.log(`   ServiceType: ${service.serviceType || 'NOT SET'}`);
      console.log(`   Price: £${service.price || 'NOT SET'}`);
      console.log(`   Duration: ${service.duration || 'NOT SET'} min`);
      console.log(`   Active: ${service.isActive}`);
      console.log(`   Display Order: ${service.displayOrder}`);
    });
    
    // Check the filtered API that frontend uses
    console.log('\n🧪 Testing frontend API call...');
    const frontendResponse = await axios.get('http://localhost:1337/api/services?filters[serviceType][$eq]=subcategory&sort=category:asc,displayOrder:asc&pagination[limit]=100');
    const frontendServices = frontendResponse.data.data || [];
    
    const onlineServices = frontendServices.filter(s => s.category === 'online');
    console.log(`\n💻 Online services in frontend API: ${onlineServices.length}`);
    onlineServices.forEach(service => {
      console.log(`   - ${service.name} (Type: ${service.serviceType}, Price: £${service.price})`);
    });
    
    // Check if "Online Consultation" is in the frontend results
    const onlineConsultationInFrontend = frontendServices.find(s => 
      s.name.toLowerCase().includes('online consultation')
    );
    
    if (onlineConsultationInFrontend) {
      console.log('\n✅ Online Consultation found in frontend API');
    } else {
      console.log('\n❌ Online Consultation NOT found in frontend API');
      
      // Check why it's missing
      const onlineConsultationInAll = allServices.find(s => 
        s.name.toLowerCase().includes('online consultation')
      );
      
      if (onlineConsultationInAll) {
        console.log('\n🔍 Online Consultation exists but filtered out:');
        console.log(`   ServiceType: ${onlineConsultationInAll.serviceType || 'NOT SET'} (needs to be "subcategory")`);
        console.log(`   Active: ${onlineConsultationInAll.isActive} (needs to be true)`);
        console.log(`   Category: ${onlineConsultationInAll.category} (should be "online")`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

checkOnlineConsultation();
