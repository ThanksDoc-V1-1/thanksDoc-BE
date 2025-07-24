const axios = require('axios');

const API_URL = 'http://localhost:1337/api';

async function publishServices() {
  try {
    console.log('Getting all services...');
    
    // Get all services (including drafts)
    const response = await axios.get(`${API_URL}/services`);
    const services = response.data.data;
    
    console.log(`Found ${services.length} services`);
    
    for (const service of services) {
      if (!service.publishedAt) {
        try {
          console.log(`Publishing service: ${service.name} (ID: ${service.id})`);
          
          await axios.post(`${API_URL}/services/${service.id}/actions/publish`);
          console.log(`✅ Published: ${service.name}`);
        } catch (error) {
          console.error(`❌ Error publishing ${service.name}:`, error.response?.data?.error?.message || error.message);
        }
      } else {
        console.log(`✅ Already published: ${service.name}`);
      }
    }
    
    console.log('\nService publishing completed!');
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

publishServices();
