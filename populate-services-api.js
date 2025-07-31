const axios = require('axios');

const servicesWithPricing = [
  // Main categories
  {
    name: "In-Person Consultation",
    description: "Face-to-face consultation with doctor",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "main",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "Online Consultation",
    description: "Video/phone consultation with doctor",
    category: "online",
    duration: 30,
    price: 50.00,
    serviceType: "main",
    isActive: true,
    displayOrder: 2
  },
  
  // Letters category with subcategories
  {
    name: "Letters",
    description: "Medical letters and reports",
    category: "online",
    duration: 15,
    price: 25.00,
    serviceType: "main",
    isActive: true,
    displayOrder: 3
  },
  
  // Specialist Clinic category
  {
    name: "Specialist Clinic",
    description: "Specialized medical consultations",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "main",
    isActive: true,
    displayOrder: 4
  },
  
  // Aesthetics category
  {
    name: "Aesthetics",
    description: "Cosmetic and aesthetic procedures",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "main",
    isActive: true,
    displayOrder: 5
  }
];

const letterSubcategories = [
  {
    name: "Referrals",
    description: "Medical referral letters",
    category: "online",
    duration: 10,
    price: 16.67,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "Scans",
    description: "Medical scan reports and letters",
    category: "online",
    duration: 15,
    price: 25.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 2
  },
  {
    name: "Sick Notes",
    description: "Medical certificates and sick notes",
    category: "online",
    duration: 5,
    price: 8.33,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 3
  }
];

const specialistSubcategories = [
  {
    name: "Cardiology",
    description: "Heart and cardiovascular consultation",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "Dermatology",
    description: "Skin and dermatological consultation",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 2
  },
  {
    name: "Mental Health",
    description: "Mental health and wellness consultation",
    category: "online",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 3
  }
];

const aestheticsSubcategories = [
  {
    name: "Botox",
    description: "Botox treatment consultation and procedure",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "Dermal Fillers",
    description: "Dermal filler consultation and treatment",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 2
  },
  {
    name: "Skin Consultation",
    description: "General skin health and aesthetic consultation",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 3
  }
];

const API_URL = 'http://localhost:1337/api';

async function populateServices() {
  try {
    console.log('🚀 Starting service population with pricing...');
    
    // First, get existing services and clear them
    console.log('🗑️ Clearing existing services...');
    try {
      const existingResponse = await axios.get(`${API_URL}/services`);
      const existingServices = existingResponse.data.data;
      
      for (const service of existingServices) {
        await axios.delete(`${API_URL}/services/${service.id}`);
      }
      console.log(`Cleared ${existingServices.length} existing services`);
    } catch (error) {
      console.log('No existing services to clear or error clearing:', error.response?.status);
    }
    
    console.log('📝 Creating main services...');
    const createdServices = {};
    
    // Create main services
    for (const service of servicesWithPricing) {
      try {
        const response = await axios.post(`${API_URL}/services`, {
          data: service
        });
        createdServices[service.name] = response.data.data;
        console.log(`✅ Created: ${service.name} - £${service.price} (${service.duration} min)`);
      } catch (error) {
        console.error(`❌ Error creating ${service.name}:`, error.response?.data || error.message);
      }
    }
    
    // Create Letters subcategories
    console.log('📄 Creating Letters subcategories...');
    const lettersParent = createdServices['Letters'];
    if (lettersParent) {
      for (const subService of letterSubcategories) {
        try {
          const response = await axios.post(`${API_URL}/services`, {
            data: {
              ...subService,
              parentService: lettersParent.id
            }
          });
          console.log(`✅ Created: ${subService.name} - £${subService.price} (${subService.duration} min)`);
        } catch (error) {
          console.error(`❌ Error creating ${subService.name}:`, error.response?.data || error.message);
        }
      }
    }
    
    // Create Specialist Clinic subcategories
    console.log('🏥 Creating Specialist Clinic subcategories...');
    const specialistParent = createdServices['Specialist Clinic'];
    if (specialistParent) {
      for (const subService of specialistSubcategories) {
        try {
          const response = await axios.post(`${API_URL}/services`, {
            data: {
              ...subService,
              parentService: specialistParent.id
            }
          });
          console.log(`✅ Created: ${subService.name} - £${subService.price} (${subService.duration} min)`);
        } catch (error) {
          console.error(`❌ Error creating ${subService.name}:`, error.response?.data || error.message);
        }
      }
    }
    
    // Create Aesthetics subcategories
    console.log('💄 Creating Aesthetics subcategories...');
    const aestheticsParent = createdServices['Aesthetics'];
    if (aestheticsParent) {
      for (const subService of aestheticsSubcategories) {
        try {
          const response = await axios.post(`${API_URL}/services`, {
            data: {
              ...subService,
              parentService: aestheticsParent.id
            }
          });
          console.log(`✅ Created: ${subService.name} - £${subService.price} (${subService.duration} min)`);
        } catch (error) {
          console.error(`❌ Error creating ${subService.name}:`, error.response?.data || error.message);
        }
      }
    }
    
    console.log('🎉 Service population completed successfully!');
    console.log(`📊 Total services created: ${servicesWithPricing.length} main + ${letterSubcategories.length + specialistSubcategories.length + aestheticsSubcategories.length} subcategories`);
    
  } catch (error) {
    console.error('❌ Error populating services:', error.message);
    throw error;
  }
}

// Run the population
async function main() {
  try {
    await populateServices();
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

module.exports = { populateServices };
