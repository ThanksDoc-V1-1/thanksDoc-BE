const axios = require('axios');

async function checkDoctorServices() {
  try {
    console.log('Checking doctor services in the database...');
    
    // First, let's see all doctors with services
    const doctorsResponse = await axios.get('http://localhost:1337/api/doctors?populate=services');
    
    console.log('All doctors with services:');
    doctorsResponse.data.data.forEach(doctor => {
      console.log(`- Doctor ${doctor.id} (${doctor.email}): ${doctor.services?.length || 0} services`);
      if (doctor.services) {
        doctor.services.forEach(service => {
          console.log(`  - ${service.name} (${service.category})`);
        });
      }
    });
    
    console.log('\n=== Detailed check for doctor ID 1 ===');
    
    // Now check doctor 1 specifically
    const doctorResponse = await axios.get('http://localhost:1337/api/doctors/1?populate=*');
    console.log('Doctor 1 full data:');
    console.log(JSON.stringify(doctorResponse.data.data, null, 2));
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

checkDoctorServices();
