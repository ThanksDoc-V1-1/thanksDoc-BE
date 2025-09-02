const axios = require('axios');

async function testNewSchemaFields() {
  console.log('🧪 Testing New Schema Fields...');
  console.log('=' .repeat(40));

  try {
    // Create a patient request with the new fields
    const requestData = {
      patientFirstName: "Test",
      patientLastName: "Patient", 
      patientPhone: "+447999888777",
      patientEmail: "test.patient@example.com",
      serviceId: 2,
      serviceType: "Private Prescriptions Updated",
      urgencyLevel: "medium",
      description: "Testing new schema fields",
      estimatedDuration: 20,
      doctorSelectionType: "previous", // NEW FIELD
      preferredDoctorId: 1, // NEW FIELD
      serviceDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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

    console.log('📤 Creating patient request with new fields...');
    const createResponse = await axios.post('http://localhost:1337/api/service-requests/patient-request', requestData);
    const createdRequest = createResponse.data.data;

    console.log('✅ Request created successfully!');
    console.log(`   Request ID: ${createdRequest.id}`);

    // Fetch the request to verify the new fields
    console.log('\n🔍 Verifying new fields are stored...');
    const fetchResponse = await axios.get(`http://localhost:1337/api/service-requests/${createdRequest.id}?populate=*`);
    const fetchedRequest = fetchResponse.data.data;

    console.log('📋 Field Verification:');
    console.log(`   Doctor Selection Type: ${fetchedRequest.doctorSelectionType || 'NOT STORED'}`);
    console.log(`   Preferred Doctor ID: ${fetchedRequest.preferredDoctorId || 'NOT STORED'}`);
    console.log(`   Description: ${fetchedRequest.description || 'NOT STORED'}`);
    console.log(`   Is Patient Request: ${fetchedRequest.isPatientRequest}`);

    if (fetchedRequest.doctorSelectionType === 'previous' && fetchedRequest.preferredDoctorId === 1) {
      console.log('\n🎉 SUCCESS: New schema fields are working correctly!');
      return true;
    } else {
      console.log('\n❌ FAILED: New schema fields are not being stored properly.');
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📋 Error response:', error.response.data);
    }
    return false;
  }
}

testNewSchemaFields();
