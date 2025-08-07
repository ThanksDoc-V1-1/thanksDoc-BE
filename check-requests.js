// Check recent service requests
require('dotenv').config();
const axios = require('axios');

async function checkRecentRequests() {
  try {
    const response = await axios.get('http://localhost:1337/api/service-requests?populate=*&sort[0]=id:desc&pagination[limit]=5');
    
    console.log('🔍 Recent Service Requests:');
    response.data.data.forEach((req, i) => {
      console.log(`\n${i+1}. Service Request ID: ${req.id}`);
      console.log(`   Service Type: ${req.serviceType}`);
      console.log(`   Status: ${req.status}`);
      console.log(`   Patient: ${req.patientFirstName || 'NULL'} ${req.patientLastName || 'NULL'}`);
      console.log(`   Patient Phone: ${req.patientPhone || 'NULL'}`);
      console.log(`   Patient Email: ${req.patientEmail || 'NULL'}`);
      console.log(`   Whereby URL: ${req.wherebyRoomUrl || 'NOT SET'}`);
      console.log(`   Whereby Meeting ID: ${req.wherebyMeetingId || 'NOT SET'}`);
    });
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkRecentRequests();
