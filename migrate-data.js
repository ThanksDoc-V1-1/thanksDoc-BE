const axios = require('axios');

// Source and destination URLs
const SOURCE_URL = 'https://king-prawn-app-mokx8.ondigitalocean.app/api';
const DESTINATION_URL = 'https://thanksdoc-be-production.up.railway.app/api';

// Migration statistics
const stats = {
  doctors: { fetched: 0, created: 0, failed: 0, existing: 0 },
  businesses: { fetched: 0, created: 0, failed: 0, existing: 0 }
};

// Helper function to safely make API calls with error handling
async function safeApiCall(url, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url,
      headers: { 'Content-Type': 'application/json' }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      config.data = data;
    }
    
    const response = await axios(config);
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: {
        status: error.response?.status,
        message: error.response?.data?.error?.message || error.message,
        details: error.response?.data
      }
    };
  }
}

// Fetch data from source
async function fetchFromSource(endpoint) {
  console.log(`📥 Fetching data from: ${SOURCE_URL}/${endpoint}`);
  
  const result = await safeApiCall(`${SOURCE_URL}/${endpoint}`);
  
  if (!result.success) {
    console.error(`❌ Failed to fetch ${endpoint}:`, result.error.message);
    return [];
  }
  
  const data = result.data.data || [];
  console.log(`✅ Fetched ${data.length} records from ${endpoint}`);
  return data;
}

// Create data in destination
async function createInDestination(endpoint, item, itemName) {
  const result = await safeApiCall(`${DESTINATION_URL}/${endpoint}`, 'POST', { data: item });
  
  if (!result.success) {
    if (result.error.status === 400 && 
        (result.error.message?.includes('unique') || 
         result.error.message?.includes('already exists') ||
         result.error.details?.error?.details?.errors?.some(err => 
           err.message?.includes('unique') || err.message?.includes('already exists')))) {
      console.log(`⚠️  Already exists: ${itemName}`);
      return 'existing';
    } else {
      console.error(`❌ Failed to create ${itemName}:`);
      console.error(`   Status: ${result.error.status}`);
      console.error(`   Message: ${result.error.message}`);
      if (result.error.details) {
        console.error(`   Details:`, JSON.stringify(result.error.details, null, 2));
      }
      return 'failed';
    }
  }
  
  console.log(`✅ Created: ${itemName}`);
  return 'created';
}

// Clean and prepare doctor data for migration
function prepareDoctorData(doctor) {
  const attributes = doctor.attributes || doctor;
  
  // Remove system fields and clean data
  const cleanDoctor = {
    firstName: attributes.firstName,
    lastName: attributes.lastName,
    email: attributes.email,
    phone: attributes.phone,
    gmcNumber: attributes.gmcNumber,
    specialization: attributes.specialization,
    yearsOfExperience: attributes.yearsOfExperience,
    qualification: attributes.qualification,
    bio: attributes.bio,
    isVerified: attributes.isVerified || false,
    isActive: attributes.isActive !== false, // default to true if not specified
    profileImage: attributes.profileImage,
    address: attributes.address,
    postcode: attributes.postcode,
    city: attributes.city,
    availability: attributes.availability,
    consultationFee: attributes.consultationFee,
    rating: attributes.rating || 0,
    totalReviews: attributes.totalReviews || 0
  };
  
  // Remove undefined/null fields
  Object.keys(cleanDoctor).forEach(key => {
    if (cleanDoctor[key] === undefined || cleanDoctor[key] === null) {
      delete cleanDoctor[key];
    }
  });
  
  return cleanDoctor;
}

// Clean and prepare business data for migration
function prepareBusinessData(business) {
  const attributes = business.attributes || business;
  
  // Remove system fields and clean data
  const cleanBusiness = {
    businessName: attributes.businessName,
    contactEmail: attributes.contactEmail,
    contactPhone: attributes.contactPhone,
    address: attributes.address,
    postcode: attributes.postcode,
    city: attributes.city,
    businessType: attributes.businessType,
    description: attributes.description,
    website: attributes.website,
    isVerified: attributes.isVerified || false,
    isActive: attributes.isActive !== false, // default to true if not specified
    registrationNumber: attributes.registrationNumber,
    vatNumber: attributes.vatNumber,
    businessHours: attributes.businessHours,
    socialMedia: attributes.socialMedia,
    logo: attributes.logo
  };
  
  // Remove undefined/null fields
  Object.keys(cleanBusiness).forEach(key => {
    if (cleanBusiness[key] === undefined || cleanBusiness[key] === null) {
      delete cleanBusiness[key];
    }
  });
  
  return cleanBusiness;
}

// Migrate doctors
async function migrateDoctors() {
  console.log('\n🏥 Starting doctors migration...');
  console.log('=' .repeat(50));
  
  // Fetch doctors from source
  const doctors = await fetchFromSource('doctors');
  stats.doctors.fetched = doctors.length;
  
  if (doctors.length === 0) {
    console.log('⚠️  No doctors found to migrate');
    return;
  }
  
  // Migrate each doctor
  for (let i = 0; i < doctors.length; i++) {
    const doctor = doctors[i];
    const doctorName = `${doctor.attributes?.firstName || doctor.firstName || 'Unknown'} ${doctor.attributes?.lastName || doctor.lastName || ''}`.trim();
    
    console.log(`\n📋 Migrating doctor ${i + 1}/${doctors.length}: ${doctorName}`);
    
    const cleanedDoctor = prepareDoctorData(doctor);
    const result = await createInDestination('doctors', cleanedDoctor, doctorName);
    
    switch (result) {
      case 'created': stats.doctors.created++; break;
      case 'existing': stats.doctors.existing++; break;
      case 'failed': stats.doctors.failed++; break;
    }
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Migrate businesses
async function migrateBusinesses() {
  console.log('\n🏢 Starting businesses migration...');
  console.log('=' .repeat(50));
  
  // Fetch businesses from source
  const businesses = await fetchFromSource('businesses');
  stats.businesses.fetched = businesses.length;
  
  if (businesses.length === 0) {
    console.log('⚠️  No businesses found to migrate');
    return;
  }
  
  // Migrate each business
  for (let i = 0; i < businesses.length; i++) {
    const business = businesses[i];
    const businessName = business.attributes?.businessName || business.businessName || `Business ${i + 1}`;
    
    console.log(`\n🏢 Migrating business ${i + 1}/${businesses.length}: ${businessName}`);
    
    const cleanedBusiness = prepareBusinessData(business);
    const result = await createInDestination('businesses', cleanedBusiness, businessName);
    
    switch (result) {
      case 'created': stats.businesses.created++; break;
      case 'existing': stats.businesses.existing++; break;
      case 'failed': stats.businesses.failed++; break;
    }
    
    // Add a small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

// Test connectivity to both backends
async function testConnectivity() {
  console.log('🔍 Testing connectivity to both backends...\n');
  
  // Test source
  const sourceTest = await safeApiCall(`${SOURCE_URL}/doctors?pagination[pageSize]=1`);
  if (sourceTest.success) {
    console.log('✅ Source backend (DigitalOcean) is accessible');
  } else {
    console.log('❌ Source backend (DigitalOcean) is not accessible:', sourceTest.error.message);
  }
  
  // Test destination
  const destTest = await safeApiCall(`${DESTINATION_URL}/doctors?pagination[pageSize]=1`);
  if (destTest.success) {
    console.log('✅ Destination backend (Railway) is accessible');
  } else {
    console.log('❌ Destination backend (Railway) is not accessible:', destTest.error.message);
  }
  
  console.log('');
  return sourceTest.success && destTest.success;
}

// Main migration function
async function runMigration() {
  console.log('🚀 Starting Data Migration');
  console.log('📊 Source: https://king-prawn-app-mokx8.ondigitalocean.app');
  console.log('📊 Destination: https://thanksdoc-be-production.up.railway.app');
  console.log('=' .repeat(60));
  
  // Test connectivity first
  const canConnect = await testConnectivity();
  if (!canConnect) {
    console.log('❌ Cannot connect to one or both backends. Aborting migration.');
    return;
  }
  
  try {
    // Run migrations
    await migrateDoctors();
    await migrateBusinesses();
    
    // Print final statistics
    console.log('\n🎉 Migration Complete!');
    console.log('=' .repeat(60));
    
    console.log('\n📊 Migration Statistics:');
    console.log('\n👨‍⚕️ Doctors:');
    console.log(`   📥 Fetched: ${stats.doctors.fetched}`);
    console.log(`   ✅ Created: ${stats.doctors.created}`);
    console.log(`   ⚠️  Already Existed: ${stats.doctors.existing}`);
    console.log(`   ❌ Failed: ${stats.doctors.failed}`);
    
    console.log('\n🏢 Businesses:');
    console.log(`   📥 Fetched: ${stats.businesses.fetched}`);
    console.log(`   ✅ Created: ${stats.businesses.created}`);
    console.log(`   ⚠️  Already Existed: ${stats.businesses.existing}`);
    console.log(`   ❌ Failed: ${stats.businesses.failed}`);
    
    console.log('\n📈 Overall:');
    const totalFetched = stats.doctors.fetched + stats.businesses.fetched;
    const totalCreated = stats.doctors.created + stats.businesses.created;
    const totalExisting = stats.doctors.existing + stats.businesses.existing;
    const totalFailed = stats.doctors.failed + stats.businesses.failed;
    
    console.log(`   📥 Total Fetched: ${totalFetched}`);
    console.log(`   ✅ Total Created: ${totalCreated}`);
    console.log(`   ⚠️  Total Already Existed: ${totalExisting}`);
    console.log(`   ❌ Total Failed: ${totalFailed}`);
    
    if (totalFailed > 0) {
      console.log('\n⚠️  Some records failed to migrate. Check the logs above for details.');
    }
    
    console.log('\n🏁 Migration completed successfully!');
    
  } catch (error) {
    console.error('\n💥 Migration failed with error:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run if called directly
if (require.main === module) {
  runMigration()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error.message);
      process.exit(1);
    });
}

module.exports = {
  runMigration,
  migrateDoctors,
  migrateBusinesses,
  stats
};
