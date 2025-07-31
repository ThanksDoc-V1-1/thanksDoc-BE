const axios = require('axios');

const API_URL = 'http://localhost:1337/api';

// Default business types
const businessTypes = [
  {
    name: "Pharmacy",
    value: "pharmacy",
    description: "Pharmaceutical business providing medications and health products",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "Clinic",
    value: "clinic",
    description: "Medical clinic providing healthcare services",
    isActive: true,
    displayOrder: 2
  },
  {
    name: "Hospital",
    value: "hospital",
    description: "Hospital providing comprehensive medical care",
    isActive: true,
    displayOrder: 3
  },
  {
    name: "Dental Practice",
    value: "dental",
    description: "Dental practice providing oral healthcare services",
    isActive: true,
    displayOrder: 4
  },
  {
    name: "Physiotherapy Center",
    value: "physiotherapy",
    description: "Center providing physiotherapy and rehabilitation services",
    isActive: true,
    displayOrder: 5
  },
  {
    name: "Mental Health Practice",
    value: "mental_health",
    description: "Practice providing mental health and counseling services",
    isActive: true,
    displayOrder: 6
  },
  {
    name: "Laboratory",
    value: "laboratory",
    description: "Medical laboratory providing diagnostic testing services",
    isActive: true,
    displayOrder: 7
  },
  {
    name: "Medical Supply Company",
    value: "medical_supply",
    description: "Company providing medical equipment and supplies",
    isActive: true,
    displayOrder: 8
  },
  {
    name: "Ambulance Service",
    value: "ambulance",
    description: "Emergency medical transport and ambulance services",
    isActive: true,
    displayOrder: 9
  },
  {
    name: "Other Healthcare Business",
    value: "other",
    description: "Other healthcare-related business not listed above",
    isActive: true,
    displayOrder: 10
  }
];

async function createBusinessTypes() {
  try {
    console.log('🏢 Creating business types...');
    
    for (const businessType of businessTypes) {
      try {
        console.log(`📝 Creating business type: ${businessType.name}`);
        
        // Check if business type already exists
        const existingResponse = await axios.get(`${API_URL}/business-types?filters[value][$eq]=${businessType.value}`);
        
        if (existingResponse.data.data.length > 0) {
          console.log(`⚠️ Business type "${businessType.name}" already exists, skipping...`);
          continue;
        }
        
        // Create new business type
        const response = await axios.post(`${API_URL}/business-types`, {
          data: businessType
        });
        
        if (response.data) {
          console.log(`✅ Created business type: ${businessType.name}`);
        }
      } catch (error) {
        console.error(`❌ Error creating business type "${businessType.name}":`, error.response?.data || error.message);
      }
    }
    
    console.log('🎉 Business types creation completed!');
    
    // Display all business types
    const allTypesResponse = await axios.get(`${API_URL}/business-types?sort=displayOrder`);
    console.log('\n📋 Current business types:');
    allTypesResponse.data.data.forEach((type, index) => {
      console.log(`${index + 1}. ${type.attributes.name} (${type.attributes.value})`);
    });
    
  } catch (error) {
    console.error('💥 Fatal error:', error.response?.data || error.message);
  }
}

// Check if this script is run directly
if (require.main === module) {
  createBusinessTypes().then(() => {
    console.log('🏁 Script completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
}

module.exports = { createBusinessTypes, businessTypes };
