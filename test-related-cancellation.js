// Test script to verify related request cancellation functionality
const axios = require('axios');

const API_BASE = 'http://localhost:1337/api';

async function testRelatedRequestCancellation() {
  console.log('🧪 Testing related request cancellation functionality...\n');
  
  try {
    // Step 1: Create a direct request to doctor 1
    console.log('1. Creating direct request to doctor 1...');
    const createResponse = await axios.post(`${API_BASE}/service-requests/direct`, {
      businessId: 1,
      doctorId: 1,
      serviceId: 1, // Make sure to include serviceId
      urgencyLevel: 'high',
      serviceType: 'Emergency Consultation',
      description: 'Test request for cancellation functionality',
      estimatedDuration: 2
    });
    
    const originalRequestId = createResponse.data.id;
    console.log(`✅ Created request ID: ${originalRequestId}`);
    
    // Step 2: Wait for 2+ minutes to trigger the cron job (or manually trigger it)
    console.log('\n2. Waiting for cron job to broadcast request to other doctors...');
    console.log('⏳ Please wait 2+ minutes for the cron job to run, or manually trigger it');
    console.log('   The cron job will create new requests for other doctors who offer the same service');
    
    // Check if there are related requests created
    const checkInterval = setInterval(async () => {
      try {
        // Check for related requests
        const relatedRequests = await axios.get(`${API_BASE}/service-requests`, {
          params: {
            filters: {
              originalRequestId: originalRequestId,
              status: 'pending'
            }
          }
        });
        
        if (relatedRequests.data.data && relatedRequests.data.data.length > 0) {
          console.log(`\n✅ Found ${relatedRequests.data.data.length} related requests created by cron job!`);
          clearInterval(checkInterval);
          
          // Step 3: Accept one of the requests
          const requestToAccept = relatedRequests.data.data[0];
          console.log(`\n3. Accepting request ID: ${requestToAccept.id} by doctor: ${requestToAccept.doctor}`);
          
          const acceptResponse = await axios.put(`${API_BASE}/service-requests/${requestToAccept.id}/accept`, {
            doctorId: requestToAccept.doctor
          });
          
          console.log('✅ Request accepted successfully!');
          
          // Step 4: Check if related requests are cancelled
          console.log('\n4. Checking if related requests were cancelled...');
          
          setTimeout(async () => {
            try {
              // Check original request status
              const originalRequest = await axios.get(`${API_BASE}/service-requests/${originalRequestId}`);
              console.log(`Original request (ID: ${originalRequestId}) status: ${originalRequest.data.data.status}`);
              
              // Check other related requests
              const allRelatedRequests = await axios.get(`${API_BASE}/service-requests`, {
                params: {
                  filters: {
                    $or: [
                      { id: originalRequestId },
                      { originalRequestId: originalRequestId }
                    ]
                  }
                }
              });
              
              console.log('\n📋 Final status of all related requests:');
              allRelatedRequests.data.data.forEach(req => {
                console.log(`  - Request ID: ${req.id}, Doctor: ${req.doctor}, Status: ${req.status}`);
              });
              
              // Count cancelled requests
              const cancelledCount = allRelatedRequests.data.data.filter(req => req.status === 'cancelled').length;
              const acceptedCount = allRelatedRequests.data.data.filter(req => req.status === 'accepted').length;
              
              console.log(`\n📊 Summary:`);
              console.log(`  - Total requests: ${allRelatedRequests.data.data.length}`);
              console.log(`  - Accepted: ${acceptedCount}`);
              console.log(`  - Cancelled: ${cancelledCount}`);
              
              if (cancelledCount > 0 && acceptedCount === 1) {
                console.log('\n🎉 SUCCESS! Related request cancellation is working correctly!');
              } else {
                console.log('\n❌ ISSUE: Related requests were not cancelled properly');
              }
              
            } catch (error) {
              console.error('Error checking final status:', error.response?.data || error.message);
            }
          }, 2000);
        }
      } catch (error) {
        console.log('⏳ Still waiting for cron job to create related requests...');
      }
    }, 10000); // Check every 10 seconds
    
    // Set a timeout to stop checking after 5 minutes
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('\n⏰ Timeout reached. Please run the cron job manually or check if it\'s working.');
    }, 300000); // 5 minutes
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testRelatedRequestCancellation();
