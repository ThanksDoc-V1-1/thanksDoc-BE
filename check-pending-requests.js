const strapi = require('@strapi/strapi');

async function checkPendingRequests() {
  try {
    const app = strapi({
      dir: process.cwd(),
    });
    await app.load();
    
    const requests = await strapi.entityService.findMany('api::service-request.service-request', {
      filters: {
        status: 'pending'
      },
      populate: ['business', 'doctor', 'service'],
      sort: { createdAt: 'desc' },
      limit: 5
    });
    
    console.log('📋 Recent Pending Service Requests:');
    if (requests.length === 0) {
      console.log('No pending service requests found');
    } else {
      requests.forEach(req => {
        const isOnlineConsultation = req.serviceType?.toLowerCase().includes('online consultation') || 
                                      req.service?.category === 'online';
        console.log(`- ID: ${req.id}`);
        console.log(`  Service: ${req.serviceType || 'N/A'}`);
        console.log(`  Category: ${req.service?.category || 'N/A'}`);
        console.log(`  Is Online: ${isOnlineConsultation ? '✅' : '❌'}`);
        console.log(`  Patient: ${req.patientFirstName || 'N/A'} ${req.patientLastName || 'N/A'}`);
        console.log(`  Patient Phone: ${req.patientPhone || 'N/A'}`);
        console.log(`  Business: ${req.business?.name || 'N/A'}`);
        console.log(`  Created: ${new Date(req.createdAt).toLocaleString()}`);
        console.log('  ---');
      });
    }
    
    await app.destroy();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkPendingRequests();
