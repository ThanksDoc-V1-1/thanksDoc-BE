const axios = require('axios');

const API_URL = 'http://localhost:1337/api';

// NHS category
const nhsCategory = {
  name: "NHS",
  description: "NHS medical services",
  category: "nhs",
  duration: 60, // Default 1 hour at £100/hour
  price: 100.00,
  serviceType: "main",
  isActive: true,
  displayOrder: 3
};

// NHS services (£100/hour rate)
const nhsServices = [
  {
    name: "NHS Consultation",
    description: "NHS medical consultation",
    category: "nhs",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "NHS Home Visit",
    description: "NHS home visit service",
    category: "nhs",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 2
  }
];

async function createNHSServices() {
  try {
    console.log('🏛️ Creating NHS category and services...');
    
    // Create NHS category
    console.log('📝 Creating NHS category...');
    let nhsParent = null;
    try {
      const response = await axios.post(`${API_URL}/services`, {
        data: nhsCategory
      });
      nhsParent = response.data.data;
      console.log(`✅ Created NHS category: ${nhsCategory.name}`);
    } catch (error) {
      if (error.response?.data?.error?.message?.includes('must be unique')) {
        // NHS category might already exist, let's find it
        console.log('NHS category might already exist, searching...');
        try {
          const existingResponse = await axios.get(`${API_URL}/services?filters[name][$eq]=NHS`);
          if (existingResponse.data.data && existingResponse.data.data.length > 0) {
            nhsParent = existingResponse.data.data[0];
            console.log(`✅ Found existing NHS category: ${nhsParent.name}`);
          }
        } catch (searchError) {
          console.error('Error searching for existing NHS category:', searchError.response?.data || searchError.message);
        }
      } else {
        console.error(`❌ Error creating NHS category:`, error.response?.data || error.message);
      }
    }
    
    // Create NHS services
    if (nhsParent) {
      console.log('🏛️ Creating NHS services...');
      for (const service of nhsServices) {
        try {
          const response = await axios.post(`${API_URL}/services`, {
            data: {
              ...service,
              parentService: nhsParent.id
            }
          });
          console.log(`✅ Created: ${service.name} - £${service.price} (${service.duration} min)`);
        } catch (error) {
          console.error(`❌ Error creating ${service.name}:`, error.response?.data || error.message);
        }
      }
    } else {
      console.error('❌ Cannot create NHS services - NHS category not found');
    }
    
    console.log('🎉 NHS services creation completed!');
    
  } catch (error) {
    console.error('❌ Error creating NHS services:', error.message);
    throw error;
  }
}

// Run the creation
async function main() {
  try {
    await createNHSServices();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { createNHSServices };
