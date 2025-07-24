const axios = require('axios');

const baseURL = 'http://localhost:1337';

const services = [
  // In-person services
  { name: 'Private Prescriptions', category: 'in-person', isActive: true, displayOrder: 1 },
  { name: 'Phlebotomy', category: 'in-person', isActive: true, displayOrder: 2 },
  { name: 'Travel Vaccinations', category: 'in-person', isActive: true, displayOrder: 3 },
  { name: 'Hay fever Injections', category: 'in-person', isActive: true, displayOrder: 4 },
  { name: 'Ear Wax removal', category: 'in-person', isActive: true, displayOrder: 5 },
  { name: 'Home Visits', category: 'in-person', isActive: true, displayOrder: 6 },
  { name: 'Face to Face consultation', category: 'in-person', isActive: true, displayOrder: 7 },
  { name: 'Aesthetics', category: 'in-person', isActive: true, displayOrder: 8 },
  
  // Online services
  { name: 'Private Prescriptions', category: 'online', isActive: true, displayOrder: 1 },
  { name: 'Online consultation', category: 'online', isActive: true, displayOrder: 2 },
  { name: 'Letters – Referrals/Scans/Sick notes', category: 'online', isActive: true, displayOrder: 3 },
  { name: 'Specialist Clinics – menopause/mens health/TRT/derm', category: 'online', isActive: true, displayOrder: 4 }
];

async function createServices() {
  try {
    console.log('Creating services...');
    
    for (const service of services) {
      try {
        const response = await axios.post(`${baseURL}/api/services`, {
          data: service
        }, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        console.log(`✅ Created: ${service.name} (${service.category}) - ID: ${response.data.data.id}`);
      } catch (error) {
        if (error.response?.status === 400 && error.response?.data?.error?.message?.includes('unique')) {
          console.log(`⚠️  Already exists: ${service.name} (${service.category})`);
        } else {
          console.error(`❌ Error creating ${service.name}:`, error.response?.data?.error?.message || error.message);
        }
      }
    }
    
    // Fetch and display all services
    const response = await axios.get(`${baseURL}/api/services`);
    console.log(`\n📋 Total services created: ${response.data.data.length}`);
    response.data.data.forEach(service => {
      console.log(`- ${service.attributes.name} (${service.attributes.category}) - ID: ${service.id}`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

createServices();
