require('dotenv').config();
const axios = require('axios');

(async () => {
  try {
    const response = await axios.get('http://localhost:1337/api/doctors');
    console.log('Available doctors:');
    response.data.data.slice(0,5).forEach(doc => {
      console.log(`ID: ${doc.id}, Name: ${doc.firstName} ${doc.lastName}`);
    });
  } catch (e) {
    console.error('Error:', e.message);
  }
})();
