const axios = require('axios');

async function testPatientDoctorAcceptance() {
  console.log('🧪 Testing Doctor Acceptance for Patient Service Request...');

  try {
    // First get a random doctor with active status
    console.log('👨‍⚕️ Finding an available doctor...');
    const doctorsResponse = await axios.get('http://localhost:1337/api/doctors?populate=*');
    const doctors = doctorsResponse.data.data;
    
    if (doctors.length === 0) {
      console.log('❌ No doctors found for testing');
      return;
    }

    const doctor = doctors[0];
    console.log(`✅ Using doctor: ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})`);

    // Get the most recent patient request
    console.log('🔍 Finding latest patient service request...');
    const requestsResponse = await axios.get('http://localhost:1337/api/service-requests?filters[isPatientRequest][$eq]=true&filters[status][$eq]=pending&populate=*&sort=createdAt:desc');
    const requests = requestsResponse.data.data;
    
    if (requests.length === 0) {
      console.log('❌ No pending patient requests found for testing');
      return;
    }

    const serviceRequest = requests[0];
    console.log(`✅ Found patient request: ID ${serviceRequest.id} for ${serviceRequest.patientFirstName} ${serviceRequest.patientLastName}`);

    // Now test doctor acceptance
    console.log('✅ Testing doctor acceptance...');
    const acceptanceData = {
      doctorId: doctor.id,
      notes: 'Patient request accepted successfully'
    };

    console.log('📤 Accepting service request...', acceptanceData);

    const acceptResponse = await axios.put(
      `http://localhost:1337/api/service-requests/${serviceRequest.id}/accept`,
      acceptanceData
    );

    console.log('✅ Doctor acceptance successful!');
    console.log('📋 Response:', JSON.stringify(acceptResponse.data, null, 2));

    // Verify the acceptance was recorded
    const verifyResponse = await axios.get(`http://localhost:1337/api/service-requests/${serviceRequest.id}?populate=*`);
    const updatedRequest = verifyResponse.data.data;

    console.log('🔍 Verifying acceptance...');
    console.log(`✅ Status: ${updatedRequest.status}`);
    console.log(`✅ Doctor: ${updatedRequest.doctor?.firstName} ${updatedRequest.doctor?.lastName}`);
    console.log(`✅ Accepted At: ${updatedRequest.acceptedAt}`);
    console.log(`✅ Patient: ${updatedRequest.patientFirstName} ${updatedRequest.patientLastName}`);
    console.log(`✅ Patient Phone: ${updatedRequest.patientPhone}`);
    console.log(`✅ Patient Email: ${updatedRequest.patientEmail}`);

    console.log('🎉 Patient doctor acceptance test completed successfully!');
    console.log('📱 Check WhatsApp messages to verify patient notifications were sent.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('📋 Error response:', error.response.data);
    }
  }
}

// Run the test
testPatientDoctorAcceptance();
