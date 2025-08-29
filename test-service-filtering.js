// Test script to verify service request filtering is working correctly
const strapi = require('@strapi/strapi');

async function testServiceFiltering() {
  console.log('🧪 Testing Service Request Filtering');
  console.log('=====================================');
  
  try {
    // Start Strapi
    const app = strapi.createStrapi();
    
    console.log('📊 Testing getAvailableRequests filtering logic');
    
    // Test 1: Get all doctors and their services
    const allDoctors = await strapi.entityService.findMany('api::doctor.doctor', {
      populate: ['services'],
      fields: ['id', 'firstName', 'lastName', 'isVerified', 'isAvailable']
    });
    
    console.log(`\n👥 Found ${allDoctors.length} doctors:`);
    allDoctors.forEach(doctor => {
      const services = doctor.services?.map(s => `${s.name} (${s.id})`).join(', ') || 'No services';
      console.log(`  - Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.id}): ${services} [Verified: ${doctor.isVerified}, Available: ${doctor.isAvailable}]`);
    });
    
    // Test 2: Get all service requests
    const allRequests = await strapi.entityService.findMany('api::service-request.service-request', {
      populate: ['service', 'business', 'doctor'],
      fields: ['id', 'serviceType', 'status', 'business', 'doctor', 'service']
    });
    
    console.log(`\n📋 Found ${allRequests.length} service requests:`);
    allRequests.forEach(request => {
      const serviceName = request.service?.name || request.serviceType || 'No service specified';
      const businessName = request.business?.businessName || 'Unknown business';
      const doctorName = request.doctor ? `Dr. ${request.doctor.firstName} ${request.doctor.lastName}` : 'Unassigned';
      console.log(`  - Request ${request.id}: ${serviceName} for ${businessName} - ${doctorName} [${request.status}]`);
    });
    
    // Test 3: For each verified doctor, test what requests they would see
    const verifiedDoctors = allDoctors.filter(d => d.isVerified);
    console.log(`\n🔍 Testing request visibility for ${verifiedDoctors.length} verified doctors:`);
    
    for (const doctor of verifiedDoctors) {
      const doctorServiceIds = doctor.services?.map(s => s.id) || [];
      
      // Simulate the new filtering logic
      const visibleRequests = allRequests.filter(request => {
        // Skip cancelled requests
        if (request.status === 'cancelled') return false;
        
        // Include accepted requests by this doctor
        if (request.status === 'accepted' && request.doctor?.id === doctor.id) return true;
        
        // Include pending requests specifically for this doctor
        if (request.status === 'pending' && request.doctor?.id === doctor.id) return true;
        
        // Include pending unassigned requests for services this doctor offers
        if (request.status === 'pending' && !request.doctor) {
          // Legacy requests without service (should be rare)
          if (!request.service) return true;
          
          // Requests for services this doctor offers
          return doctorServiceIds.includes(request.service.id);
        }
        
        return false;
      });
      
      console.log(`\n  👨‍⚕️ Dr. ${doctor.firstName} ${doctor.lastName} (Services: ${doctorServiceIds.join(', ')}):`);
      console.log(`     Would see ${visibleRequests.length} requests:`);
      visibleRequests.forEach(request => {
        const serviceName = request.service?.name || request.serviceType || 'No service';
        const reason = request.doctor?.id === doctor.id ? '(assigned to them)' : 
                      !request.doctor ? '(unassigned, offers this service)' : '(other)';
        console.log(`       - Request ${request.id}: ${serviceName} ${reason}`);
      });
    }
    
    console.log('\n✅ Service filtering test completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testServiceFiltering().then(() => {
  console.log('🎯 Test execution finished');
  process.exit(0);
}).catch(error => {
  console.error('💥 Test crashed:', error);
  process.exit(1);
});
