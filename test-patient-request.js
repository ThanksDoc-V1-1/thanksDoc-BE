// Test script for patient service request functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:1337/api';

async function testPatientRequest() {
  try {
    console.log('🧪 Testing Patient Service Request Creation...');
    
    // First, let's get available services
    console.log('📋 Fetching available services...');
    const servicesResponse = await axios.get(`${BASE_URL}/services?filters[isActive][$eq]=true`);
    console.log('✅ Services loaded:', servicesResponse.data.data.length);
    
    const firstService = servicesResponse.data.data[0];
    if (!firstService) {
      throw new Error('No services available for testing');
    }
    
    console.log(`🎯 Using service: ${firstService.name} (£${firstService.price})`);
    
    // Create a test patient request
    const patientRequestData = {
      // Patient information
      patientFirstName: 'John',
      patientLastName: 'Doe',
      patientPhone: '+447123456789',
      patientEmail: 'john.doe@test.com',
      
      // Service information
      serviceId: firstService.id,
      serviceType: firstService.name,
      urgencyLevel: 'medium',
      description: `Test patient service request for ${firstService.name}`,
      estimatedDuration: firstService.duration || 1,
      
      // Payment information (simulating successful payment)
      isPaid: true,
      paymentMethod: 'card',
      paymentIntentId: 'pi_test_' + Date.now(),
      paymentStatus: 'succeeded',
      paidAt: new Date().toISOString(),
      totalAmount: parseFloat(firstService.price) + 3.00, // service price + booking fee
      servicePrice: parseFloat(firstService.price),
      serviceCharge: 3.00,
      currency: 'gbp',
      chargeId: 'ch_test_' + Date.now(),
      
      // Additional fields
      status: 'pending',
      requestedAt: new Date().toISOString()
    };
    
    console.log('📝 Creating patient service request...');
    console.log('Data:', JSON.stringify(patientRequestData, null, 2));
    
    const response = await axios.post(`${BASE_URL}/service-requests/patient-request`, patientRequestData);
    
    console.log('✅ Patient service request created successfully!');
    console.log('📋 Response:', response.data);
    
    const requestId = response.data.data.id;
    console.log(`🆔 Request ID: ${requestId}`);
    
    // Verify the request was created correctly
    console.log('🔍 Verifying request details...');
    const verifyResponse = await axios.get(`${BASE_URL}/service-requests/${requestId}`);
    const createdRequest = verifyResponse.data.data;
    
    console.log('✅ Request verification successful:');
    console.log(`   Patient: ${createdRequest.patientFirstName} ${createdRequest.patientLastName}`);
    console.log(`   Phone: ${createdRequest.patientPhone}`);
    console.log(`   Email: ${createdRequest.patientEmail}`);
    console.log(`   Service: ${createdRequest.serviceType}`);
    console.log(`   Payment Status: ${createdRequest.paymentStatus}`);
    console.log(`   Total Amount: £${createdRequest.totalAmount}`);
    console.log(`   Is Patient Request: ${createdRequest.isPatientRequest}`);
    
    return requestId;
    
  } catch (error) {
    console.error('❌ Error testing patient request:', error.response?.data || error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testPatientRequest().then((requestId) => {
  if (requestId) {
    console.log(`\n🎉 Test completed successfully! Request ID: ${requestId}`);
    console.log('💡 You can now test doctor acceptance through the doctor dashboard.');
  }
}).catch(console.error);
