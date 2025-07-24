/**
 * Populate initial services data
 * Run this script after creating the service content type
 */

const services = [
  // In-person services
  {
    name: "Private Prescriptions",
    description: "Private prescription services for medications",
    category: "in-person",
    displayOrder: 1,
    isActive: true
  },
  {
    name: "Phlebotomy",
    description: "Blood drawing and collection services",
    category: "in-person",
    displayOrder: 2,
    isActive: true
  },
  {
    name: "Travel Vaccinations",
    description: "Vaccinations required for international travel",
    category: "in-person",
    displayOrder: 3,
    isActive: true
  },
  {
    name: "Hay fever Injections",
    description: "Seasonal allergy treatment injections",
    category: "in-person",
    displayOrder: 4,
    isActive: true
  },
  {
    name: "Ear Wax removal",
    description: "Professional ear wax removal services",
    category: "in-person",
    displayOrder: 5,
    isActive: true
  },
  {
    name: "Home Visits",
    description: "Medical consultations at patient's home",
    category: "in-person",
    displayOrder: 6,
    isActive: true
  },
  {
    name: "Face to Face consultation",
    description: "In-person medical consultations",
    category: "in-person",
    displayOrder: 7,
    isActive: true
  },
  {
    name: "Aesthetics",
    description: "Cosmetic and aesthetic medical procedures",
    category: "in-person",
    displayOrder: 8,
    isActive: true
  },
  
  // Online services
  {
    name: "Private Prescriptions",
    description: "Private prescription services via online consultation",
    category: "online",
    displayOrder: 1,
    isActive: true
  },
  {
    name: "Online consultation",
    description: "Remote medical consultations via video call",
    category: "online",
    displayOrder: 2,
    isActive: true
  },
  {
    name: "Letters – Referrals/Scans/Sick notes",
    description: "Medical letters, referrals, and documentation",
    category: "online",
    displayOrder: 3,
    isActive: true
  },
  {
    name: "Specialist Clinics – menopause/mens health/TRT/derm",
    description: "Specialized online clinics for specific health conditions",
    category: "online",
    displayOrder: 4,
    isActive: true
  }
];

module.exports = async (strapi) => {
  try {
    console.log('Populating services...');
    
    for (const serviceData of services) {
      // Check if service already exists
      const existing = await strapi.entityService.findMany('api::service.service', {
        filters: {
          name: serviceData.name,
          category: serviceData.category
        }
      });
      
      if (existing.length === 0) {
        await strapi.entityService.create('api::service.service', {
          data: serviceData
        });
        console.log(`Created service: ${serviceData.name} (${serviceData.category})`);
      } else {
        console.log(`Service already exists: ${serviceData.name} (${serviceData.category})`);
      }
    }
    
    console.log('Services population completed!');
  } catch (error) {
    console.error('Error populating services:', error);
  }
};
