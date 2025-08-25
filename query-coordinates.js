require('dotenv').config();

async function queryCoordinatesFromDatabase() {
  try {
    console.log('🔍 Querying Database for Coordinates');
    console.log('Environment:', process.env.NODE_ENV || 'development');
    console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // We'll use the Strapi instance to query the database
    // First, let's simulate starting Strapi to access the database
    
    const axios = require('axios');
    const baseUrl = 'https://thanksdoc-be-production.up.railway.app';  // Use production URL
    
    console.log('Using production API:', baseUrl);
    
    console.log('\n📊 Querying Doctor: Arafat Magezi');
    
    try {
      // Query doctors to find Arafat Magezi
      const doctorsResponse = await axios.get(`${baseUrl}/api/doctors`, {
        params: {
          populate: '*'
        }
      });
      
      console.log('Raw doctors response:', JSON.stringify(doctorsResponse.data, null, 2));
      
      if (doctorsResponse.data && doctorsResponse.data.data) {
        const doctors = doctorsResponse.data.data;
        console.log(`Found ${doctors.length} total doctor(s)`);
        
        // Filter for Arafat Magezi or specific email
        const targetDoctors = doctors.filter(doctor => {
          const firstName = doctor.attributes?.firstName || doctor.firstName || '';
          const lastName = doctor.attributes?.lastName || doctor.lastName || '';
          const email = doctor.attributes?.email || doctor.email || '';
          const name = doctor.attributes?.name || doctor.name || '';
          
          return firstName.toLowerCase().includes('arafat') || 
                 lastName.toLowerCase().includes('magezi') ||
                 email.toLowerCase().includes('arafats144') ||
                 email.toLowerCase().includes('arafat') ||
                 name.toLowerCase().includes('arafat');
        });
        
        console.log(`Found ${targetDoctors.length} doctor(s) matching "Arafat", "Magezi", or related emails`);
        
        targetDoctors.forEach((doctor, index) => {
          const attrs = doctor.attributes || doctor || {};
          console.log(`\n👨‍⚕️ Doctor ${index + 1}:`);
          console.log('ID:', doctor.id);
          console.log('Name:', `${attrs.firstName || 'N/A'} ${attrs.lastName || 'N/A'}`);
          console.log('Full Name:', attrs.name || 'N/A');
          console.log('Email:', attrs.email || 'N/A');
          console.log('Phone:', attrs.phone || 'N/A');
          console.log('Latitude:', {
            value: attrs.latitude,
            type: typeof attrs.latitude,
            isValid: attrs.latitude !== null && attrs.latitude !== undefined && attrs.latitude !== ''
          });
          console.log('Longitude:', {
            value: attrs.longitude,
            type: typeof attrs.longitude,
            isValid: attrs.longitude !== null && attrs.longitude !== undefined && attrs.longitude !== ''
          });
          console.log('Has coordinates:', !!(attrs.latitude && attrs.longitude));
          console.log('All attributes keys:', Object.keys(attrs));
          console.log('Raw doctor object keys:', Object.keys(doctor));
        });
        
        // If no specific match, show all doctors to help identify the right one
        if (targetDoctors.length === 0) {
          console.log('\n📋 All doctors in database (first 5):');
          doctors.slice(0, 5).forEach((doctor, index) => {
            const attrs = doctor.attributes || doctor || {};
            console.log(`${index + 1}. Name: "${attrs.firstName || 'N/A'} ${attrs.lastName || 'N/A'}" | Full: "${attrs.name || 'N/A'}" | Email: "${attrs.email || 'N/A'}" | ID: ${doctor.id}`);
            console.log(`   Raw keys: [${Object.keys(doctor).join(', ')}]`);
            if (doctor.attributes) {
              console.log(`   Attributes keys: [${Object.keys(doctor.attributes).join(', ')}]`);
            }
          });
        }
      } else {
        console.log('❌ No doctors found or invalid response structure');
      }
    } catch (error) {
      console.log('❌ Error querying doctors:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('\n📊 Querying Business: KIHIHI COMPANY');
    
    try {
      // Query businesses to find KIHIHI COMPANY
      const businessesResponse = await axios.get(`${baseUrl}/api/businesses`, {
        params: {
          populate: '*'
        }
      });
      
      console.log('\nRaw businesses response:', JSON.stringify(businessesResponse.data, null, 2));
      
      if (businessesResponse.data && businessesResponse.data.data) {
        const businesses = businessesResponse.data.data;
        console.log(`Found ${businesses.length} total business(es)`);
        
        // Filter for KIHIHI COMPANY
        const targetBusinesses = businesses.filter(business => {
          const businessName = business.attributes?.businessName || '';
          return businessName.toLowerCase().includes('kihihi');
        });
        
        console.log(`Found ${targetBusinesses.length} business(es) matching "KIHIHI"`);
        
        targetBusinesses.forEach((business, index) => {
          const attrs = business.attributes || {};
          console.log(`\n🏢 Business ${index + 1}:`);
          console.log('ID:', business.id);
          console.log('Name:', attrs.businessName || 'N/A');
          console.log('Email:', attrs.email || 'N/A');
          console.log('Phone:', attrs.phone || 'N/A');
          console.log('Address:', attrs.address || 'N/A');
          console.log('Latitude:', {
            value: attrs.latitude,
            type: typeof attrs.latitude,
            isValid: attrs.latitude !== null && attrs.latitude !== undefined && attrs.latitude !== ''
          });
          console.log('Longitude:', {
            value: attrs.longitude,
            type: typeof attrs.longitude,
            isValid: attrs.longitude !== null && attrs.longitude !== undefined && attrs.longitude !== ''
          });
          console.log('Has coordinates:', !!(attrs.latitude && attrs.longitude));
          console.log('All attributes keys:', Object.keys(attrs));
        });
        
        // If no specific match, show all businesses to help identify the right one
        if (targetBusinesses.length === 0) {
          console.log('\n📋 All businesses in database:');
          businesses.forEach((business, index) => {
            const attrs = business.attributes || {};
            console.log(`${index + 1}. ${attrs.businessName || 'N/A'} (ID: ${business.id})`);
          });
        }
      } else {
        console.log('❌ No businesses found or invalid response structure');
      }
    } catch (error) {
      console.log('❌ Error querying businesses:', error.message);
      if (error.response) {
        console.log('Response status:', error.response.status);
        console.log('Response data:', JSON.stringify(error.response.data, null, 2));
      }
    }
    
    console.log('\n🔧 Alternative Query Methods:');
    console.log('If the above API queries failed, try these alternatives:');
    console.log('1. Direct database query (if you have database access)');
    console.log('2. Check the admin panel at:', `${baseUrl}/admin`);
    console.log('3. Use Strapi content manager to view the data');
    
    console.log('\n📝 What to Check:');
    console.log('- Are latitude and longitude fields present in the database schema?');
    console.log('- Do the doctor and business records have coordinate values?');
    console.log('- Are the coordinates stored as numbers or strings?');
    console.log('- Are there any null, undefined, or empty string values?');
    
  } catch (error) {
    console.error('❌ Query failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the coordinate query
queryCoordinatesFromDatabase();
