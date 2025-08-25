require('dotenv').config();

async function debugActualServiceRequest() {
  try {
    console.log('🔍 Creating a debug script to check actual coordinates in service requests');
    
    // This script should be run after you trigger a service request in production
    // It will log the exact data being passed to the distance calculation
    
    const WhatsAppService = require('./src/services/whatsapp');
    const EmailService = require('./src/services/email.service');
    
    // Add more detailed logging to both services temporarily
    const originalWhatsAppCalculate = WhatsAppService.prototype.calculateDistanceInMiles;
    const originalEmailCalculate = EmailService.prototype.calculateDistanceInMiles;
    
    WhatsAppService.prototype.calculateDistanceInMiles = function(business, doctor) {
      console.log('\n🔍 WhatsApp Distance Calculation Debug:');
      console.log('📍 Business object:', JSON.stringify(business, null, 2));
      console.log('👨‍⚕️ Doctor object:', JSON.stringify(doctor, null, 2));
      console.log('📏 Business coordinates check:', {
        hasLatitude: business && business.hasOwnProperty('latitude'),
        hasLongitude: business && business.hasOwnProperty('longitude'),
        latitudeValue: business ? business.latitude : 'N/A',
        longitudeValue: business ? business.longitude : 'N/A',
        latitudeType: business && business.latitude ? typeof business.latitude : 'N/A',
        longitudeType: business && business.longitude ? typeof business.longitude : 'N/A'
      });
      console.log('👨‍⚕️ Doctor coordinates check:', {
        hasLatitude: doctor && doctor.hasOwnProperty('latitude'),
        hasLongitude: doctor && doctor.hasOwnProperty('longitude'),
        latitudeValue: doctor ? doctor.latitude : 'N/A',
        longitudeValue: doctor ? doctor.longitude : 'N/A',
        latitudeType: doctor && doctor.latitude ? typeof doctor.latitude : 'N/A',
        longitudeType: doctor && doctor.longitude ? typeof doctor.longitude : 'N/A'
      });
      
      const result = originalWhatsAppCalculate.call(this, business, doctor);
      console.log('📊 WhatsApp Distance Result:', result);
      return result;
    };
    
    EmailService.prototype.calculateDistanceInMiles = function(business, doctor) {
      console.log('\n📧 Email Distance Calculation Debug:');
      console.log('📍 Business object:', JSON.stringify(business, null, 2));
      console.log('👨‍⚕️ Doctor object:', JSON.stringify(doctor, null, 2));
      console.log('📏 Business coordinates check:', {
        hasLatitude: business && business.hasOwnProperty('latitude'),
        hasLongitude: business && business.hasOwnProperty('longitude'),
        latitudeValue: business ? business.latitude : 'N/A',
        longitudeValue: business ? business.longitude : 'N/A',
        latitudeType: business && business.latitude ? typeof business.latitude : 'N/A',
        longitudeType: business && business.longitude ? typeof business.longitude : 'N/A'
      });
      console.log('👨‍⚕️ Doctor coordinates check:', {
        hasLatitude: doctor && doctor.hasOwnProperty('latitude'),
        hasLongitude: doctor && doctor.hasOwnProperty('longitude'),
        latitudeValue: doctor ? doctor.latitude : 'N/A',
        longitudeValue: doctor ? doctor.longitude : 'N/A',
        latitudeType: doctor && doctor.latitude ? typeof doctor.latitude : 'N/A',
        longitudeType: doctor && doctor.longitude ? typeof doctor.longitude : 'N/A'
      });
      
      const result = originalEmailCalculate.call(this, business, doctor);
      console.log('📊 Email Distance Result:', result);
      return result;
    };
    
    console.log('✅ Debug logging enhanced!');
    console.log('📋 To debug your production issue:');
    console.log('1. Copy this debug code to your production backend temporarily');
    console.log('2. Deploy it to production');
    console.log('3. Trigger a service request between Arafat Magezi and KIHIHI COMPANY');
    console.log('4. Check the production logs for the detailed coordinate information');
    console.log('5. Look for the debug output showing the exact business and doctor objects');
    
    console.log('\n🔧 Quick fix suggestions:');
    console.log('If coordinates are missing or invalid, check:');
    console.log('- Database schema: ensure latitude/longitude columns exist');
    console.log('- Data population: verify coordinates are actually saved');
    console.log('- API response: check if coordinates are included in the business/doctor objects');
    console.log('- Object population: ensure the full business/doctor objects are passed to distance calculation');
    
  } catch (error) {
    console.error('❌ Debug setup failed:', error);
  }
}

// Run the debug setup
debugActualServiceRequest();
