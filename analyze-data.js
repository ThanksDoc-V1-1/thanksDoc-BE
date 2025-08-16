const axios = require('axios');

const SOURCE_URL = 'https://king-prawn-app-mokx8.ondigitalocean.app/api';
const DESTINATION_URL = 'https://thanksdoc-be-production.up.railway.app/api';

async function analyzeDoctorData() {
  console.log('🔍 Analyzing doctor data structure...');
  
  try {
    // Fetch one doctor from source
    const response = await axios.get(`${SOURCE_URL}/doctors?pagination[pageSize]=1`);
    const doctor = response.data.data[0];
    
    console.log('\n📋 Source Doctor Data Structure:');
    console.log(JSON.stringify(doctor, null, 2));
    
    // Try to create a minimal doctor record to test what fields are required
    console.log('\n🧪 Testing minimal doctor creation...');
    
    const minimalDoctor = {
      firstName: 'Test',
      lastName: 'Doctor',
      email: 'test@example.com'
    };
    
    try {
      const createResponse = await axios.post(`${DESTINATION_URL}/doctors`, {
        data: minimalDoctor
      });
      console.log('✅ Minimal doctor created successfully:', createResponse.data);
    } catch (error) {
      console.log('❌ Minimal doctor creation failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.error?.message);
      console.log('Details:', JSON.stringify(error.response?.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error analyzing doctor data:', error.message);
  }
}

async function analyzeBusinessData() {
  console.log('\n🔍 Analyzing business data structure...');
  
  try {
    // Fetch one business from source
    const response = await axios.get(`${SOURCE_URL}/businesses?pagination[pageSize]=1`);
    const business = response.data.data[0];
    
    console.log('\n🏢 Source Business Data Structure:');
    console.log(JSON.stringify(business, null, 2));
    
    // Try to create a minimal business record to test what fields are required
    console.log('\n🧪 Testing minimal business creation...');
    
    const minimalBusiness = {
      businessName: 'Test Business',
      contactEmail: 'test@business.com'
    };
    
    try {
      const createResponse = await axios.post(`${DESTINATION_URL}/businesses`, {
        data: minimalBusiness
      });
      console.log('✅ Minimal business created successfully:', createResponse.data);
    } catch (error) {
      console.log('❌ Minimal business creation failed:');
      console.log('Status:', error.response?.status);
      console.log('Message:', error.response?.data?.error?.message);
      console.log('Details:', JSON.stringify(error.response?.data, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error analyzing business data:', error.message);
  }
}

// Run analysis
async function runAnalysis() {
  await analyzeDoctorData();
  await analyzeBusinessData();
}

runAnalysis();
