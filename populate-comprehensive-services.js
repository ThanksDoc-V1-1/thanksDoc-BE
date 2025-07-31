const strapi = require('@strapi/strapi');

// Main categories
const mainCategories = [
  {
    name: "Online",
    description: "Online medical services and consultations",
    category: "online",
    duration: 0, // Will be set by subcategories
    price: 0.00, // Will be set by subcategories
    serviceType: "main",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "In-Person",
    description: "Face-to-face medical services",
    category: "in-person",
    duration: 60, // Default 1 hour at £100/hour
    price: 100.00,
    serviceType: "main",
    isActive: true,
    displayOrder: 2
  },
  {
    name: "NHS",
    description: "NHS medical services",
    category: "nhs",
    duration: 60, // Default 1 hour at £100/hour
    price: 100.00,
    serviceType: "main",
    isActive: true,
    displayOrder: 3
  }
];

// Online services (individual rates as per previous document)
const onlineServices = [
  {
    name: "Online Consultation",
    description: "Video/phone consultation with doctor",
    category: "online",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "Letters - Referrals",
    description: "Medical referral letters",
    category: "online",
    duration: 10,
    price: 16.67,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 2
  },
  {
    name: "Letters - Scans",
    description: "Medical scan reports and letters",
    category: "online",
    duration: 15,
    price: 25.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 3
  },
  {
    name: "Letters - Sick Notes",
    description: "Medical certificates and sick notes",
    category: "online",
    duration: 5,
    price: 8.33,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 4
  }
];

// In-Person services (£100/hour rate)
const inPersonServices = [
  // Basic services
  {
    name: "Private Prescriptions",
    description: "Private prescription services",
    category: "in-person",
    duration: 15,
    price: 25.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 1
  },
  {
    name: "Phlebotomy",
    description: "Blood drawing and testing services",
    category: "in-person",
    duration: 15,
    price: 25.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 2
  },
  {
    name: "Travel Vaccinations",
    description: "Vaccinations for travel",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 3
  },
  {
    name: "Hay Fever Injections",
    description: "Hay fever treatment injections",
    category: "in-person",
    duration: 15,
    price: 25.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 4
  },
  {
    name: "Ear Wax Removal",
    description: "Professional ear wax removal",
    category: "in-person",
    duration: 20,
    price: 33.33,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 5
  },
  {
    name: "Home Visits",
    description: "Doctor visits to patient's home",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 6
  },
  {
    name: "Face to Face Consultation",
    description: "In-person consultation with doctor",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 7
  },
  
  // Specialist Clinics
  {
    name: "Menopause Clinic",
    description: "Menopause consultation and treatment",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 10
  },
  {
    name: "Men's Health",
    description: "Men's health consultation",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 11
  },
  {
    name: "Testosterone Replacement Therapy",
    description: "TRT consultation and treatment",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 12
  },
  {
    name: "Dermatology",
    description: "Skin and dermatological consultation",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 13
  },
  {
    name: "Mental Health",
    description: "Mental health consultation",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 14
  },
  {
    name: "Women's Health",
    description: "Women's health consultation",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 15
  },
  {
    name: "Paediatrics",
    description: "Paediatric consultation",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 16
  },
  {
    name: "Allergy Clinic",
    description: "Allergy testing and consultation",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 17
  },
  {
    name: "Cardiology",
    description: "Heart and cardiovascular consultation",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 18
  },
  {
    name: "Neurology",
    description: "Neurological consultation",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 19
  },
  {
    name: "ADHD + Neurodivergence",
    description: "ADHD and neurodivergence assessment",
    category: "in-person",
    duration: 90,
    price: 150.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 20
  },
  {
    name: "Weight Loss",
    description: "Weight loss consultation and management",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 21
  },
  {
    name: "Diabetes",
    description: "Diabetes management and consultation",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 22
  },
  {
    name: "Lactation Consulting",
    description: "Breastfeeding and lactation support",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 23
  },
  {
    name: "Early Cancer Diagnosis",
    description: "Early cancer screening and diagnosis",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 24
  },
  {
    name: "Minor Surgery",
    description: "Minor surgical procedures",
    category: "in-person",
    duration: 90,
    price: 150.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 25
  },
  {
    name: "Joint Injections",
    description: "Joint injection procedures",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 26
  },
  {
    name: "Functional Medicine",
    description: "Functional medicine consultation",
    category: "in-person",
    duration: 90,
    price: 150.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 27
  },
  {
    name: "Lifestyle Medicine",
    description: "Lifestyle medicine consultation",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 28
  },
  {
    name: "Alternative Medicine",
    description: "Alternative medicine consultation",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 29
  },
  {
    name: "Sexual Health",
    description: "Sexual health consultation",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 30
  },
  {
    name: "Taxi Medicals",
    description: "Medical examination for taxi drivers",
    category: "in-person",
    duration: 30,
    price: 50.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 31
  },
  
  // Aesthetics
  {
    name: "Botox",
    description: "Botox treatment and consultation",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 35
  },
  {
    name: "Dermal Fillers",
    description: "Dermal filler treatment",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 36
  },
  {
    name: "Chemical Peels",
    description: "Chemical peel treatments",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 37
  },
  {
    name: "IV Vitamin Drips",
    description: "Intravenous vitamin therapy",
    category: "in-person",
    duration: 60,
    price: 100.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 38
  },
  {
    name: "General Aesthetics",
    description: "General aesthetic treatments",
    category: "in-person",
    duration: 45,
    price: 75.00,
    serviceType: "subcategory",
    isActive: true,
    displayOrder: 39
  }
];

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

async function populateServices() {
  try {
    console.log('🚀 Starting comprehensive service population...');
    
    // Clear existing services
    console.log('🗑️ Clearing existing services...');
    const existingServices = await strapi.db.query('api::service.service').findMany();
    for (const service of existingServices) {
      await strapi.db.query('api::service.service').delete({ where: { id: service.id } });
    }
    
    console.log('📝 Creating main categories...');
    const createdCategories = {};
    
    // Create main categories
    for (const category of mainCategories) {
      const created = await strapi.db.query('api::service.service').create({
        data: category
      });
      createdCategories[category.name] = created;
      console.log(`✅ Created category: ${category.name}`);
    }
    
    // Create Online services
    console.log('💻 Creating Online services...');
    const onlineParent = createdCategories['Online'];
    for (const service of onlineServices) {
      const created = await strapi.db.query('api::service.service').create({
        data: {
          ...service,
          parentService: onlineParent.id
        }
      });
      console.log(`✅ Created: ${service.name} - £${service.price} (${service.duration} min)`);
    }
    
    // Create In-Person services
    console.log('🏥 Creating In-Person services...');
    const inPersonParent = createdCategories['In-Person'];
    for (const service of inPersonServices) {
      const created = await strapi.db.query('api::service.service').create({
        data: {
          ...service,
          parentService: inPersonParent.id
        }
      });
      console.log(`✅ Created: ${service.name} - £${service.price} (${service.duration} min)`);
    }
    
    // Create NHS services
    console.log('🏛️ Creating NHS services...');
    const nhsParent = createdCategories['NHS'];
    for (const service of nhsServices) {
      const created = await strapi.db.query('api::service.service').create({
        data: {
          ...service,
          parentService: nhsParent.id
        }
      });
      console.log(`✅ Created: ${service.name} - £${service.price} (${service.duration} min)`);
    }
    
    console.log('🎉 Service population completed successfully!');
    console.log(`📊 Total services created:`);
    console.log(`   - Main categories: ${mainCategories.length}`);
    console.log(`   - Online services: ${onlineServices.length}`);
    console.log(`   - In-Person services: ${inPersonServices.length}`);
    console.log(`   - NHS services: ${nhsServices.length}`);
    console.log(`   - Grand total: ${mainCategories.length + onlineServices.length + inPersonServices.length + nhsServices.length}`);
    
  } catch (error) {
    console.error('❌ Error populating services:', error);
    throw error;
  }
}

// Run the population
async function main() {
  try {
    const app = await strapi.createStrapi();
    await app.load();
    
    // Set global strapi instance
    global.strapi = app;
    
    await populateServices();
    await app.destroy();
    console.log('✅ Script completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { populateServices };
