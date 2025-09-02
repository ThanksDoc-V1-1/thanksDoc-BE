const strapi = require('@strapi/strapi');

async function createPatientServices() {
  const app = strapi({
    appDir: process.cwd(),
    distDir: '.strapi-dist',
  });

  await app.load();

  try {
    console.log('Creating patient-specific services...');

    // Patient services with their specific pricing
    const patientServices = [
      {
        name: 'Online Consultation',
        description: 'Virtual consultation with a qualified doctor via video call',
        category: 'online',
        serviceType: 'patient',
        price: 39.00,
        duration: 30,
        isActive: true,
        displayOrder: 1
      },
      {
        name: 'In Clinic Consultation',
        description: 'Face-to-face consultation at the doctor\'s clinic',
        category: 'in-person',
        serviceType: 'patient',
        price: 99.00,
        duration: 45,
        isActive: true,
        displayOrder: 2
      },
      {
        name: 'Home Visit Consultation',
        description: 'Doctor visits you at your home for consultation',
        category: 'in-person',
        serviceType: 'patient',
        price: 129.00,
        duration: 60,
        isActive: true,
        displayOrder: 3
      }
    ];

    for (const service of patientServices) {
      try {
        // Check if service already exists
        const existingService = await strapi.entityService.findMany('api::service.service', {
          filters: {
            name: service.name,
            serviceType: 'patient'
          }
        });

        if (existingService.length > 0) {
          console.log(`Service "${service.name}" already exists, updating...`);
          await strapi.entityService.update('api::service.service', existingService[0].id, {
            data: service
          });
        } else {
          console.log(`Creating service: ${service.name}`);
          await strapi.entityService.create('api::service.service', {
            data: service
          });
        }
      } catch (error) {
        console.error(`Error creating service ${service.name}:`, error);
      }
    }

    console.log('Patient services created successfully!');
    
  } catch (error) {
    console.error('Error creating patient services:', error);
  } finally {
    await app.destroy();
  }
}

createPatientServices();
