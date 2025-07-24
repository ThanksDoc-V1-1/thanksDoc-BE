const axios = require('axios');

const API_URL = 'http://localhost:1337/api';

async function publishServicesDirectly() {
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
          
          // Update service to published state
          await axios.put(`${API_URL}/services/${service.id}`, {
            data: {
              ...service,
              publishedAt: new Date().toISOString()
            }
          });
          console.log(`✅ Published: ${service.name}`);
        } catch (error) {
          console.error(`❌ Error publishing ${service.name}:`, error.response?.data?.error?.message || error.message);
        }
      } else {
        console.log(`✅ Already published: ${service.name}`);
      }
    }
    
    console.log('\nService publishing completed!');
    
    // Verify by getting published services
    console.log('\nVerifying published services...');
    const publishedResponse = await axios.get(`${API_URL}/services?filters[publishedAt][$notNull]=true`);
    console.log(`Published services count: ${publishedResponse.data.data.length}`);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

publishServicesDirectly();
