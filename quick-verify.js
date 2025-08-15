// Quick verification for doctor ID 48
const axios = require('axios');

async function quickVerify() {
  try {
    console.log('🔍 Checking Doctor ID: 48 services...');
    
    const response = await axios.get('http://localhost:1337/api/doctors/48?populate=services');
    const doctor = response.data.data;
    
    console.log(`👨‍⚕️ Doctor: ${doctor.name} (${doctor.email})`);
    
    if (doctor.services && doctor.services.length > 0) {
      console.log('✅ SUCCESS! Services connected:');
      doctor.services.forEach(service => {
        console.log(`   - ID: ${service.id} - ${service.name}`);
      });
    } else {
      console.log('❌ No services connected');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

quickVerify();
