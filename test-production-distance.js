const axios = require('axios');

const BASE_URL = 'https://thanksdoc-be-production.up.railway.app';

async function testProductionData() {
  try {
    console.log('🧪 Testing Production Distance Calculation');
    
    // Get Arafat's doctor data
    const doctorResponse = await axios.get(`${BASE_URL}/api/doctors?populate=*&pagination[pageSize]=100`);
    const arafatDoctor = doctorResponse.data.data.find(doctor => 
      doctor.email === 'arafats144@gmail.com'
    );
    
    // Get KIHIHI business data
    const businessResponse = await axios.get(`${BASE_URL}/api/businesses?populate=*&pagination[pageSize]=50`);
    const kihihibusiness = businessResponse.data.data.find(business => 
      business.businessName === 'KIHIHI COMPANY'
    );
    
    if (!arafatDoctor) {
      console.log('❌ Doctor Arafat not found');
      return;
    }
    
    if (!kihihibusiness) {
      console.log('❌ KIHIHI business not found');
      return;
    }
    
    console.log('\n📍 Production Coordinates:');
    console.log('Doctor Arafat:', {
      lat: arafatDoctor.latitude,
      lng: arafatDoctor.longitude,
      latType: typeof arafatDoctor.latitude,
      lngType: typeof arafatDoctor.longitude
    });
    
    console.log('KIHIHI Business:', {
      lat: kihihibusiness.latitude,
      lng: kihihibusiness.longitude,
      latType: typeof kihihibusiness.latitude,
      lngType: typeof kihihibusiness.longitude
    });
    
    // Use the same distance calculation logic as in the email service
    function calculateDistanceInMiles(lat1, lng1, lat2, lng2) {
      console.log('\n🔢 Distance Calculation Input:');
      console.log('Business coords:', { lat1, lng1 });
      console.log('Doctor coords:', { lat2, lng2 });
      
      // Validate coordinates
      if (!lat1 || !lng1 || !lat2 || !lng2) {
        console.log('❌ Invalid coordinates detected');
        return 'Unknown';
      }
      
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLng = (lng2 - lng1) * Math.PI / 180;
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;
      
      console.log('Raw distance:', distance, 'miles');
      
      if (distance < 1) {
        const feet = distance * 5280;
        console.log('Converted to feet:', feet);
        return feet < 500 ? 'Less than 500 feet' : `${Math.round(feet)} feet`;
      }
      
      return `${distance.toFixed(1)} miles`;
    }
    
    // Test distance calculation with production data
    const distance = calculateDistanceInMiles(
      kihihibusiness.latitude,
      kihihibusiness.longitude,
      arafatDoctor.latitude,
      arafatDoctor.longitude
    );
    
    console.log('\n🎯 Production Distance Result:', distance);
    
    // Also test with address
    console.log('\n📍 Address Information:');
    console.log('Doctor Address:', arafatDoctor.address || 'No address');
    console.log('Business Address:', kihihibusiness.address || 'No address');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testProductionData();
