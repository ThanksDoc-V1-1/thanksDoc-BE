require('dotenv').config();
const WhatsAppService = require('./src/services/whatsapp');

async function testDistanceCalculation() {
  try {
    console.log('🧪 Testing Distance Calculation with Different Scenarios');
    
    const whatsappService = new WhatsAppService();
    
    // Test Case 1: Close distance (same city)
    console.log('\n📍 Test Case 1: Close distance (same city)');
    const businessKampala = {
      name: 'Kampala Clinic',
      latitude: 0.3476,
      longitude: 32.5825
    };
    
    const doctorKampala = {
      firstName: 'Dr. Close',
      lastName: 'Doctor',
      latitude: 0.3500, // Very close to business
      longitude: 32.5800
    };
    
    const distance1 = whatsappService.calculateDistanceInMiles(businessKampala, doctorKampala);
    console.log(`Distance: ${distance1}`);
    
    // Test Case 2: Medium distance (different cities)
    console.log('\n📍 Test Case 2: Medium distance (different cities)');
    const businessEntebbe = {
      name: 'Entebbe Medical Center',
      latitude: 0.0514,
      longitude: 32.4600
    };
    
    const doctorJinja = {
      firstName: 'Dr. Medium',
      lastName: 'Distance',
      latitude: 0.4314,
      longitude: 33.2040
    };
    
    const distance2 = whatsappService.calculateDistanceInMiles(businessEntebbe, doctorJinja);
    console.log(`Distance: ${distance2}`);
    
    // Test Case 3: Very close distance (should show in feet)
    console.log('\n📍 Test Case 3: Very close distance (should show in feet)');
    const businessClose = {
      name: 'Hospital A',
      latitude: 0.3476,
      longitude: 32.5825
    };
    
    const doctorVeryClose = {
      firstName: 'Dr. VeryClose',
      lastName: 'Doctor',
      latitude: 0.3477, // Extremely close (about 100m)
      longitude: 32.5826
    };
    
    const distance3 = whatsappService.calculateDistanceInMiles(businessClose, doctorVeryClose);
    console.log(`Distance: ${distance3}`);
    
    // Test Case 4: Missing coordinates
    console.log('\n📍 Test Case 4: Missing coordinates');
    const businessNoCoords = {
      name: 'No Coords Clinic'
      // No latitude/longitude
    };
    
    const doctorNoCoords = {
      firstName: 'Dr. NoCoords',
      lastName: 'Doctor'
      // No latitude/longitude
    };
    
    const distance4 = whatsappService.calculateDistanceInMiles(businessNoCoords, doctorNoCoords);
    console.log(`Distance: ${distance4}`);
    
    // Test Case 5: Long distance (different countries)
    console.log('\n📍 Test Case 5: Long distance (different countries)');
    const businessUganda = {
      name: 'Uganda Hospital',
      latitude: 0.3476,
      longitude: 32.5825
    };
    
    const doctorKenya = {
      firstName: 'Dr. Far',
      lastName: 'Away',
      latitude: -1.2864, // Nairobi, Kenya
      longitude: 36.8172
    };
    
    const distance5 = whatsappService.calculateDistanceInMiles(businessUganda, doctorKenya);
    console.log(`Distance: ${distance5}`);
    
    console.log('\n✅ All distance calculation tests completed!');
    
  } catch (error) {
    console.error('❌ Error in distance calculation test:', error);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDistanceCalculation();
