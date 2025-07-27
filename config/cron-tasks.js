module.exports = {
  '*/1 * * * *': async ({ strapi }) => {
    console.log('Cron job running - checking for unresponsive doctors...');
    // This cron job runs every minute to check for service requests that have not been responded to.
    // For testing: 2 minutes timeout, for production: change to 24 hours (24 * 60 * 60 * 1000)
    const timeoutDuration = 2 * 60 * 1000; // 2 minutes for testing
    const timeoutAgo = new Date(Date.now() - timeoutDuration);
    console.log(`Checking for pending requests created before: ${timeoutAgo.toISOString()}`);

    try {
      const pendingRequests = await strapi.entityService.findMany('api::service-request.service-request', {
        filters: {
          status: 'pending',
          doctor: { $notNull: true },
          requestedAt: { $lt: timeoutAgo },
          isBroadcasted: { $ne: true }
        },
        populate: ['doctor', 'service', 'business'],
      });

      console.log(`Found ${pendingRequests.length} pending requests that need broadcasting.`);

      for (const request of pendingRequests) {
        try {
          console.log(`Processing request ID: ${request.id} for doctor: ${request.doctor?.id || 'unknown'}`);
          
          // Check if required relations exist
          if (!request.doctor || !request.service || !request.business) {
            console.error(`Request ID ${request.id} is missing required relations:`, {
              doctor: !!request.doctor,
              service: !!request.service,
              business: !!request.business
            });
            
            // Mark as broadcasted to prevent re-processing
            await strapi.entityService.update('api::service-request.service-request', request.id, {
              data: { isBroadcasted: true }
            });
            continue;
          }

          const originalDoctorId = request.doctor.id;
          const serviceId = request.service.id;

          // Find other doctors who provide the same service (excluding the original doctor)
          const otherDoctors = await strapi.entityService.findMany('api::doctor.doctor', {
            filters: {
              services: { id: serviceId },
              id: { $ne: originalDoctorId },
            },
            populate: ['services'],
          });

        console.log(`Found ${otherDoctors.length} other doctors for service ID ${serviceId}.`);

        if (otherDoctors.length > 0) {
          // Mark the original request as broadcasted to prevent re-processing
          await strapi.entityService.update('api::service-request.service-request', request.id, {
            data: {
              isBroadcasted: true,
            }
          });
          console.log(`Marked original request ID ${request.id} as broadcasted.`);

          // Create new service requests for other doctors
          for (const doctor of otherDoctors) {
            console.log(`Creating new request for doctor ID: ${doctor.id}`);
            
            const newRequestData = {
              business: request.business.id,
              doctor: doctor.id,
              service: request.service.id,
              urgencyLevel: request.urgencyLevel,
              serviceType: request.serviceType,
              description: request.description,
              estimatedDuration: request.estimatedDuration,
              requestedServiceDateTime: request.requestedServiceDateTime,
              totalAmount: request.totalAmount,
              notes: request.notes,
              status: 'pending',
              isBroadcasted: false,
              requestedAt: new Date(),
              originalRequestId: request.id, // Link to the original request
            };

            await strapi.entityService.create('api::service-request.service-request', {
              data: newRequestData
            });
            console.log(`Successfully created new request for doctor ID: ${doctor.id}`);
          }

          console.log(`Request ID ${request.id} has been successfully broadcasted to ${otherDoctors.length} other doctors.`);
        } else {
          console.log(`No other doctors found for service ID ${serviceId}. Marking request as broadcasted without creating new requests.`);
          
          // Still mark as broadcasted to prevent re-processing
          await strapi.entityService.update('api::service-request.service-request', request.id, {
            data: {
              isBroadcasted: true,
            }
          });
        }
        } catch (requestError) {
          console.error(`Error processing request ID ${request.id}:`, requestError);
          // Mark as broadcasted to prevent getting stuck in a loop
          try {
            await strapi.entityService.update('api::service-request.service-request', request.id, {
              data: { isBroadcasted: true }
            });
          } catch (updateError) {
            console.error(`Failed to mark request ${request.id} as broadcasted:`, updateError);
          }
        }
      }
      
      if (pendingRequests.length > 0) {
        console.log(`Cron job completed. Processed ${pendingRequests.length} requests.`);
      }
    } catch (error) {
      console.error('Error in service request broadcasting cron job:', error);
    }
  },
};
