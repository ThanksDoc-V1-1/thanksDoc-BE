const axios = require('axios');

async function debugAcceptanceError() {
  console.log('🔍 Debugging acceptance error...');

  try {
    // Check the service request first
    const serviceRequestResponse = await axios.get('http://localhost:1337/api/service-requests/714?populate=*');
    const serviceRequest = serviceRequestResponse.data.data;
    
    console.log('📋 Service Request Status:', serviceRequest.status);
    console.log('📋 Service Request ID:', serviceRequest.id);
    console.log('📋 Is Patient Request:', serviceRequest.isPatientRequest);
    console.log('📋 Patient Info:', {
      firstName: serviceRequest.patientFirstName,
      lastName: serviceRequest.patientLastName,
      phone: serviceRequest.patientPhone,
      email: serviceRequest.patientEmail
    });

    // Check the doctor
    const doctorResponse = await axios.get('http://localhost:1337/api/doctors/1?populate=*');
    const doctor = doctorResponse.data.data;
    
    console.log('👨‍⚕️ Doctor Info:', {
      id: doctor.id,
      name: `${doctor.firstName} ${doctor.lastName}`,
      isVerified: doctor.isVerified,
      status: doctor.status
    });

    // Try the acceptance with minimal data
    console.log('📤 Attempting acceptance...');
    const acceptanceData = {
      doctorId: 1
    };

    const acceptResponse = await axios.put(
      `http://localhost:1337/api/service-requests/714/accept`,
      acceptanceData
    );

    console.log('✅ Success!', acceptResponse.data);

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('📋 Status:', error.response.status);
      console.error('📋 Data:', error.response.data);
      console.error('📋 Headers:', error.response.headers);
    }
  }
}

debugAcceptanceError();
