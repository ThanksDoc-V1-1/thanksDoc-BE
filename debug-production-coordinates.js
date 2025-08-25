require('dotenv').config();

async function debugProductionCoordinates() {
  try {
    console.log('🔍 Debugging Production Coordinates Issue');
    console.log('Production URL:', process.env.BASE_URL || 'Not set');
    
    // Test the distance calculation with sample data that matches your production case
    const WhatsAppService = require('./src/services/whatsapp');
    const EmailService = require('./src/services/email.service');
    
    const whatsappService = new WhatsAppService();
    const emailService = new EmailService();
    
    // Test with various coordinate formats that might be coming from production
    console.log('\n📊 Testing different coordinate formats...');
    
    // Test Case 1: String coordinates (common in databases)
    const businessStringCoords = {
      name: 'KIHIHI COMPANY',
      businessName: 'KIHIHI COMPANY',
      latitude: '0.3476',
      longitude: '32.5825'
    };
    
    const doctorStringCoords = {
      firstName: 'Arafat',
      lastName: 'Magezi',
      latitude: '0.3500',
      longitude: '32.5800'
    };
    
    console.log('\n🧪 Test Case 1: String coordinates');
    console.log('Business coordinates:', { lat: businessStringCoords.latitude, lng: businessStringCoords.longitude });
    console.log('Doctor coordinates:', { lat: doctorStringCoords.latitude, lng: doctorStringCoords.longitude });
    
    const whatsappDistance1 = whatsappService.calculateDistanceInMiles(businessStringCoords, doctorStringCoords);
    const emailDistance1 = emailService.calculateDistanceInMiles(businessStringCoords, doctorStringCoords);
    
    console.log('WhatsApp distance:', whatsappDistance1);
    console.log('Email distance:', emailDistance1);
    
    // Test Case 2: Number coordinates
    const businessNumberCoords = {
      name: 'KIHIHI COMPANY',
      businessName: 'KIHIHI COMPANY',
      latitude: 0.3476,
      longitude: 32.5825
    };
    
    const doctorNumberCoords = {
      firstName: 'Arafat',
      lastName: 'Magezi',
      latitude: 0.3500,
      longitude: 32.5800
    };
    
    console.log('\n🧪 Test Case 2: Number coordinates');
    console.log('Business coordinates:', { lat: businessNumberCoords.latitude, lng: businessNumberCoords.longitude });
    console.log('Doctor coordinates:', { lat: doctorNumberCoords.latitude, lng: doctorNumberCoords.longitude });
    
    const whatsappDistance2 = whatsappService.calculateDistanceInMiles(businessNumberCoords, doctorNumberCoords);
    const emailDistance2 = emailService.calculateDistanceInMiles(businessNumberCoords, doctorNumberCoords);
    
    console.log('WhatsApp distance:', whatsappDistance2);
    console.log('Email distance:', emailDistance2);
    
    // Test Case 3: Null/undefined coordinates
    const businessNullCoords = {
      name: 'KIHIHI COMPANY',
      businessName: 'KIHIHI COMPANY',
      latitude: null,
      longitude: null
    };
    
    const doctorNullCoords = {
      firstName: 'Arafat',
      lastName: 'Magezi',
      latitude: undefined,
      longitude: undefined
    };
    
    console.log('\n🧪 Test Case 3: Null/undefined coordinates');
    console.log('Business coordinates:', { lat: businessNullCoords.latitude, lng: businessNullCoords.longitude });
    console.log('Doctor coordinates:', { lat: doctorNullCoords.latitude, lng: doctorNullCoords.longitude });
    
    const whatsappDistance3 = whatsappService.calculateDistanceInMiles(businessNullCoords, doctorNullCoords);
    const emailDistance3 = emailService.calculateDistanceInMiles(businessNullCoords, doctorNullCoords);
    
    console.log('WhatsApp distance:', whatsappDistance3);
    console.log('Email distance:', emailDistance3);
    
    // Test Case 4: Empty string coordinates
    const businessEmptyCoords = {
      name: 'KIHIHI COMPANY',
      businessName: 'KIHIHI COMPANY',
      latitude: '',
      longitude: ''
    };
    
    const doctorEmptyCoords = {
      firstName: 'Arafat',
      lastName: 'Magezi',
      latitude: '',
      longitude: ''
    };
    
    console.log('\n🧪 Test Case 4: Empty string coordinates');
    console.log('Business coordinates:', { lat: businessEmptyCoords.latitude, lng: businessEmptyCoords.longitude });
    console.log('Doctor coordinates:', { lat: doctorEmptyCoords.latitude, lng: doctorEmptyCoords.longitude });
    
    const whatsappDistance4 = whatsappService.calculateDistanceInMiles(businessEmptyCoords, doctorEmptyCoords);
    const emailDistance4 = emailService.calculateDistanceInMiles(businessEmptyCoords, doctorEmptyCoords);
    
    console.log('WhatsApp distance:', whatsappDistance4);
    console.log('Email distance:', emailDistance4);
    
    // Test Case 5: Missing latitude/longitude properties
    const businessMissingProps = {
      name: 'KIHIHI COMPANY',
      businessName: 'KIHIHI COMPANY'
      // No latitude/longitude properties
    };
    
    const doctorMissingProps = {
      firstName: 'Arafat',
      lastName: 'Magezi'
      // No latitude/longitude properties
    };
    
    console.log('\n🧪 Test Case 5: Missing latitude/longitude properties');
    console.log('Business coordinates:', { lat: businessMissingProps.latitude, lng: businessMissingProps.longitude });
    console.log('Doctor coordinates:', { lat: doctorMissingProps.latitude, lng: doctorMissingProps.longitude });
    
    const whatsappDistance5 = whatsappService.calculateDistanceInMiles(businessMissingProps, doctorMissingProps);
    const emailDistance5 = emailService.calculateDistanceInMiles(businessMissingProps, doctorMissingProps);
    
    console.log('WhatsApp distance:', whatsappDistance5);
    console.log('Email distance:', emailDistance5);
    
    console.log('\n🎯 Debugging Summary:');
    console.log('The "Distance: Unknown" issue is likely caused by one of the following:');
    console.log('1. Coordinates are null/undefined in the database');
    console.log('2. Coordinates are empty strings');
    console.log('3. Latitude/longitude properties are missing from the object');
    console.log('4. Coordinates are in an unexpected format');
    console.log('\nCheck your production database for the actual coordinate values for:');
    console.log('- Doctor: Arafat Magezi');
    console.log('- Business: KIHIHI COMPANY');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
}

// Run the debug test
debugProductionCoordinates();
