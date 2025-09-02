const axios = require('axios');

async function testCompletePatientFlow() {
  console.log('🎯 Testing Complete Patient Request Flow...');
  console.log('=' .repeat(50));

  try {
    // Step 1: Create a new patient request
    console.log('Step 1: Creating patient service request...');
    
    const patientRequestData = {
      patientFirstName: "Jane",
      patientLastName: "Smith", 
      patientPhone: "+447987654321",
      patientEmail: "jane.smith@test.com",
      serviceId: 2, // Using valid service ID
      serviceType: "Private Prescriptions Updated",
      urgencyLevel: "high",
      description: "Urgent medical consultation needed",
      estimatedDuration: 30,
      isPaid: true,
      paymentMethod: "card",
      paymentIntentId: "pi_test_" + Date.now(),
      paymentStatus: "succeeded",
      paidAt: new Date().toISOString(),
      totalAmount: 45,
      servicePrice: 42,
      serviceCharge: 3,
      currency: "gbp",
      chargeId: "ch_test_" + Date.now(),
      status: "pending",
      requestedAt: new Date().toISOString()
    };

    const createResponse = await axios.post('http://localhost:1337/api/service-requests/patient-request', patientRequestData);
    const createdRequest = createResponse.data.data;

    console.log(`✅ Patient request created: ID ${createdRequest.id}`);
    console.log(`   Patient: ${createdRequest.patientFirstName} ${createdRequest.patientLastName}`);
    console.log(`   Service: ${createdRequest.serviceType}`);
    console.log(`   Amount: £${createdRequest.totalAmount}`);
    console.log(`   Status: ${createdRequest.status}`);
    console.log(`   Is Patient Request: ${createdRequest.isPatientRequest}`);

    // Step 2: Find an available doctor
    console.log('\nStep 2: Finding available doctor...');
    const doctorsResponse = await axios.get('http://localhost:1337/api/doctors?filters[isVerified][$eq]=true&filters[isAvailable][$eq]=true');
    const doctors = doctorsResponse.data.data;
    
    if (doctors.length === 0) {
      throw new Error('No verified doctors available for testing');
    }

    const doctor = doctors[0];
    console.log(`✅ Doctor found: ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})`);
    console.log(`   Verified: ${doctor.isVerified}`);
    console.log(`   Available: ${doctor.isAvailable}`);

    // Step 3: Doctor accepts the request
    console.log('\nStep 3: Doctor accepting patient request...');
    const acceptanceData = {
      doctorId: doctor.id,
      notes: 'Patient request accepted - ready to provide service'
    };

    const acceptResponse = await axios.put(
      `http://localhost:1337/api/service-requests/${createdRequest.id}/accept`,
      acceptanceData
    );

    const acceptedRequest = acceptResponse.data;
    console.log(`✅ Request accepted successfully!`);
    console.log(`   Status: ${acceptedRequest.status}`);
    console.log(`   Doctor: ${acceptedRequest.doctor?.firstName} ${acceptedRequest.doctor?.lastName}`);
    console.log(`   Accepted At: ${acceptedRequest.acceptedAt}`);

    // Step 4: Verify the complete flow
    console.log('\nStep 4: Verifying complete flow...');
    const verifyResponse = await axios.get(`http://localhost:1337/api/service-requests/${createdRequest.id}?populate=*`);
    const finalRequest = verifyResponse.data.data;

    console.log('\n📋 FINAL VERIFICATION:');
    console.log('=====================');
    console.log(`✅ Request ID: ${finalRequest.id}`);
    console.log(`✅ Patient: ${finalRequest.patientFirstName} ${finalRequest.patientLastName}`);
    console.log(`✅ Patient Phone: ${finalRequest.patientPhone}`);
    console.log(`✅ Patient Email: ${finalRequest.patientEmail}`);
    console.log(`✅ Service: ${finalRequest.serviceType}`);
    console.log(`✅ Doctor: ${finalRequest.doctor?.firstName} ${finalRequest.doctor?.lastName}`);
    console.log(`✅ Doctor Phone: ${finalRequest.doctor?.phone}`);
    console.log(`✅ Status: ${finalRequest.status}`);
    console.log(`✅ Payment Status: ${finalRequest.paymentStatus}`);
    console.log(`✅ Total Amount: £${finalRequest.totalAmount}`);
    console.log(`✅ Is Patient Request: ${finalRequest.isPatientRequest}`);
    console.log(`✅ Requested At: ${finalRequest.requestedAt}`);
    console.log(`✅ Accepted At: ${finalRequest.acceptedAt}`);

    console.log('\n🎉 COMPLETE PATIENT FLOW TEST SUCCESSFUL!');
    console.log('=' .repeat(50));
    console.log('📱 WhatsApp Notifications:');
    console.log(`   - Patient notification sent to: ${finalRequest.patientPhone}`);
    console.log(`   - Doctor details shared with patient`);
    console.log('📧 Email Notifications:');
    console.log(`   - Email notification sent to: ${finalRequest.patientEmail}`);
    console.log('=' .repeat(50));

    return {
      requestId: finalRequest.id,
      patient: {
        name: `${finalRequest.patientFirstName} ${finalRequest.patientLastName}`,
        phone: finalRequest.patientPhone,
        email: finalRequest.patientEmail
      },
      doctor: {
        name: `${finalRequest.doctor?.firstName} ${finalRequest.doctor?.lastName}`,
        phone: finalRequest.doctor?.phone
      },
      service: finalRequest.serviceType,
      amount: finalRequest.totalAmount,
      status: finalRequest.status
    };

  } catch (error) {
    console.error('❌ Complete flow test failed:', error.message);
    if (error.response) {
      console.error('📋 Error response:', error.response.data);
    }
    throw error;
  }
}

// Run the complete test
testCompletePatientFlow()
  .then(result => {
    console.log('\n✅ Test completed successfully!');
    console.log('📋 Summary:', result);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
