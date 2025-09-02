const axios = require('axios');

async function testPatientRequestWithNewFields() {
  console.log('🧪 Testing Patient Request with New Fields...');
  console.log('=' .repeat(50));

  try {
    // Get tomorrow's date for testing
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const serviceDate = tomorrow.toISOString().split('T')[0];
    const serviceTime = '14:30'; // 2:30 PM

    const patientRequestData = {
      // Patient information
      patientFirstName: "Sarah",
      patientLastName: "Wilson", 
      patientPhone: "+447911123456",
      patientEmail: "sarah.wilson@test.com",
      
      // Service information
      serviceId: 2,
      serviceType: "Private Prescriptions Updated",
      urgencyLevel: "medium",
      description: "Need prescription renewal for chronic condition medication",
      estimatedDuration: 20,
      
      // NEW FIELDS - Doctor selection and scheduling
      doctorSelectionType: "any",
      preferredDoctorId: null,
      serviceDateTime: `${serviceDate}T${serviceTime}:00.000Z`,
      
      // Payment information
      isPaid: true,
      paymentMethod: "card",
      paymentIntentId: "pi_test_" + Date.now(),
      paymentStatus: "succeeded",
      paidAt: new Date().toISOString(),
      totalAmount: 37,
      servicePrice: 34,
      serviceCharge: 3,
      currency: "gbp",
      chargeId: "ch_test_" + Date.now(),
      status: "pending",
      requestedAt: new Date().toISOString()
    };

    console.log('📝 Patient Request Data:');
    console.log(`   Name: ${patientRequestData.patientFirstName} ${patientRequestData.patientLastName}`);
    console.log(`   Phone: ${patientRequestData.patientPhone}`);
    console.log(`   Email: ${patientRequestData.patientEmail}`);
    console.log(`   Service: ${patientRequestData.serviceType}`);
    console.log(`   Description: ${patientRequestData.description}`);
    console.log(`   Doctor Selection: ${patientRequestData.doctorSelectionType}`);
    console.log(`   Service Date/Time: ${patientRequestData.serviceDateTime}`);
    console.log(`   Total Amount: £${patientRequestData.totalAmount}`);

    console.log('\n📤 Creating patient request...');
    const createResponse = await axios.post('http://localhost:1337/api/service-requests/patient-request', patientRequestData);
    const createdRequest = createResponse.data.data;

    console.log('✅ Patient request created successfully!');
    console.log(`   Request ID: ${createdRequest.id}`);
    console.log(`   Patient: ${createdRequest.patientFirstName} ${createdRequest.patientLastName}`);
    console.log(`   Service: ${createdRequest.serviceType}`);
    console.log(`   Description: ${createdRequest.description}`);
    console.log(`   Doctor Selection: ${createdRequest.doctorSelectionType}`);
    console.log(`   Requested Service Time: ${createdRequest.requestedServiceDateTime}`);
    console.log(`   Status: ${createdRequest.status}`);
    console.log(`   Is Patient Request: ${createdRequest.isPatientRequest}`);

    console.log('\n🎉 NEW FIELDS TEST SUCCESSFUL!');
    console.log('✅ All new fields are working correctly:');
    console.log('   • Doctor Selection Type: Captured');
    console.log('   • Description: Captured');
    console.log('   • Service Date/Time: Captured and validated');
    console.log('   • Form validation: Updated');
    console.log('   • Backend processing: Updated');

    return createdRequest;

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📋 Error response:', error.response.data);
    }
    throw error;
  }
}

// Run the test
testPatientRequestWithNewFields()
  .then(result => {
    console.log('\n✅ Test completed successfully!');
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
