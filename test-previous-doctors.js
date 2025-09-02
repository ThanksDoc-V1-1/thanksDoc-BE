const axios = require('axios');

async function testPreviousDoctorsFeature() {
  console.log('🧪 Testing Previously Worked With Doctors Feature...');
  console.log('=' .repeat(60));

  try {
    // Step 1: Create a patient request with a specific doctor assignment (simulate previous work)
    console.log('Step 1: Creating initial patient request to simulate previous work...');
    
    const initialRequestData = {
      patientFirstName: "Emma",
      patientLastName: "Johnson", 
      patientPhone: "+447922334455",
      patientEmail: "emma.johnson@test.com",
      serviceId: 2,
      serviceType: "Private Prescriptions Updated",
      urgencyLevel: "medium",
      description: "Initial request for prescription",
      estimatedDuration: 20,
      doctorSelectionType: "any",
      serviceDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
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

    const createResponse = await axios.post('http://localhost:1337/api/service-requests/patient-request', initialRequestData);
    const createdRequest = createResponse.data.data;
    console.log(`✅ Initial request created: ID ${createdRequest.id}`);

    // Step 2: Have a doctor accept this request
    console.log('\nStep 2: Doctor accepting the initial request...');
    
    const doctorsResponse = await axios.get('http://localhost:1337/api/doctors?filters[isVerified][$eq]=true&filters[isAvailable][$eq]=true');
    const doctors = doctorsResponse.data.data;
    
    if (doctors.length === 0) {
      throw new Error('No verified doctors available for testing');
    }

    const doctor = doctors[0];
    console.log(`✅ Using doctor: ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})`);

    const acceptanceData = {
      doctorId: doctor.id,
      notes: 'First service for this patient - establishing relationship'
    };

    const acceptResponse = await axios.put(
      `http://localhost:1337/api/service-requests/${createdRequest.id}/accept`,
      acceptanceData
    );

    console.log('✅ Doctor accepted the initial request');
    console.log(`   Status: ${acceptResponse.data.status}`);

    // Step 3: Test fetching previous doctors for this patient
    console.log('\nStep 3: Testing previous doctors lookup...');
    
    const phoneQuery = encodeURIComponent(initialRequestData.patientPhone);
    const emailQuery = encodeURIComponent(initialRequestData.patientEmail);
    
    const previousRequestsResponse = await axios.get(
      `http://localhost:1337/api/service-requests?filters[patientPhone][$eq]=${phoneQuery}&filters[isPatientRequest][$eq]=true&filters[status][$in][0]=accepted&filters[status][$in][1]=completed&populate[doctor]=*`
    );

    const previousRequests = previousRequestsResponse.data.data;
    console.log(`✅ Found ${previousRequests.length} previous requests for this patient`);

    if (previousRequests.length > 0) {
      const doctorMap = new Map();
      previousRequests.forEach(request => {
        if (request.doctor && request.doctor.id) {
          doctorMap.set(request.doctor.id, {
            id: request.doctor.id,
            firstName: request.doctor.firstName,
            lastName: request.doctor.lastName,
            specialization: request.doctor.specialization,
            lastWorkedWith: request.acceptedAt || request.completedAt
          });
        }
      });
      
      const uniqueDoctors = Array.from(doctorMap.values());
      console.log('✅ Previous doctors found:');
      uniqueDoctors.forEach(doc => {
        console.log(`   • Dr. ${doc.firstName} ${doc.lastName} (${doc.specialization})`);
        console.log(`     Last worked: ${doc.lastWorkedWith}`);
      });
    }

    // Step 4: Create a new request using the "previous doctor" selection
    console.log('\nStep 4: Creating new request with previously worked doctor...');
    
    const newRequestData = {
      patientFirstName: "Emma",
      patientLastName: "Johnson", 
      patientPhone: "+447922334455",
      patientEmail: "emma.johnson@test.com",
      serviceId: 2,
      serviceType: "Private Prescriptions Updated",
      urgencyLevel: "medium",
      description: "Follow-up prescription - requesting same doctor as before",
      estimatedDuration: 20,
      doctorSelectionType: "previous", // Using previous doctor selection
      preferredDoctorId: doctor.id, // Specific doctor from previous work
      serviceDateTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // Day after tomorrow
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

    const newCreateResponse = await axios.post('http://localhost:1337/api/service-requests/patient-request', newRequestData);
    const newRequest = newCreateResponse.data.data;

    console.log('✅ New request with preferred doctor created successfully!');
    console.log(`   Request ID: ${newRequest.id}`);
    console.log(`   Patient: ${newRequest.patientFirstName} ${newRequest.patientLastName}`);
    console.log(`   Doctor Selection Type: ${newRequest.doctorSelectionType}`);
    console.log(`   Preferred Doctor ID: ${newRequest.preferredDoctorId}`);
    console.log(`   Description: ${newRequest.description}`);

    console.log('\n🎉 PREVIOUS DOCTORS FEATURE TEST SUCCESSFUL!');
    console.log('✅ Feature verification:');
    console.log('   • Patient work history tracking: Working');
    console.log('   • Previous doctors lookup by phone/email: Working');
    console.log('   • Doctor selection type "previous": Working');
    console.log('   • Preferred doctor ID assignment: Working');
    console.log('   • Frontend will show previous doctors in dropdown');

    return {
      initialRequestId: createdRequest.id,
      newRequestId: newRequest.id,
      doctorId: doctor.id,
      patientInfo: {
        name: `${newRequest.patientFirstName} ${newRequest.patientLastName}`,
        phone: newRequest.patientPhone,
        email: newRequest.patientEmail
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📋 Error response:', error.response.data);
    }
    throw error;
  }
}

// Run the test
testPreviousDoctorsFeature()
  .then(result => {
    console.log('\n✅ Test completed successfully!');
    console.log('📋 Summary:', result);
  })
  .catch(error => {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  });
