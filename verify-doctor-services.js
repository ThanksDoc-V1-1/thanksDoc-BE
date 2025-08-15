// Verify services are connected to doctor
const axios = require('axios');

async function verifyDoctorServices() {
  console.log('🔍 Verifying services connection for Doctor ID: 45...\n');

  try {
    // Get doctor with services populated
    const response = await axios.get('http://localhost:1337/api/doctors/45?populate=services');
    
    if (response.data && response.data.data) {
      const doctor = response.data.data;
      
      console.log('👨‍⚕️ Doctor Information:');
      console.log(`   ID: ${doctor.id}`);
      console.log(`   Name: ${doctor.name}`);
      console.log(`   Email: ${doctor.email}`);
      console.log('');
      
      if (doctor.services && doctor.services.length > 0) {
        console.log('✅ Services connected successfully!');
        console.log(`   Total services: ${doctor.services.length}`);
        console.log('');
        console.log('📋 Connected Services:');
        doctor.services.forEach((service, index) => {
          console.log(`   ${index + 1}. ID: ${service.id} - Name: ${service.name}`);
          if (service.category) {
            console.log(`      Category: ${service.category}`);
          }
          if (service.price) {
            console.log(`      Price: £${service.price}`);
          }
          console.log('');
        });
      } else {
        console.log('❌ No services found connected to this doctor');
        console.log('   The services connection might have failed during registration');
      }
      
    } else {
      console.log('❌ Could not retrieve doctor data');
    }

  } catch (error) {
    if (error.response) {
      console.error('❌ API Error:', error.response.status, error.response.statusText);
      if (error.response.data) {
        console.error('Response:', JSON.stringify(error.response.data, null, 2));
      }
    } else {
      console.error('❌ Request Error:', error.message);
    }
  }
}

// Also check what services exist in the database
async function listAvailableServices() {
  console.log('\n📋 Available Services in Database:');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.get('http://localhost:1337/api/services');
    
    if (response.data && response.data.data) {
      const services = response.data.data;
      console.log(`Total services available: ${services.length}\n`);
      
      services.slice(0, 10).forEach(service => {
        console.log(`ID: ${service.id} - ${service.name}`);
      });
      
      if (services.length > 10) {
        console.log(`... and ${services.length - 10} more services`);
      }
    }
  } catch (error) {
    console.error('❌ Could not fetch services:', error.message);
  }
}

// Run both checks
async function runFullCheck() {
  await verifyDoctorServices();
  await listAvailableServices();
  
  console.log('\n💡 If services are not connected:');
  console.log('1. Check Strapi backend logs for error messages');
  console.log('2. Ensure services [2, 4] exist in the database');
  console.log('3. Try registering a new doctor to test the fix');
}

runFullCheck();
