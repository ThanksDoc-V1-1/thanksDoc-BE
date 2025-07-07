module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/doctors',
      handler: 'doctor.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/doctors/:id',
      handler: 'doctor.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/doctors',
      handler: 'doctor.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/doctors/:id',
      handler: 'doctor.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/doctors/:id',
      handler: 'doctor.delete',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/doctors/available',
      handler: 'doctor.findAvailable',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/doctors/:id/availability',
      handler: 'doctor.updateAvailability',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/doctors/:id/stats',
      handler: 'doctor.getStats',
      config: {
        auth: false,
      },
    },
  ],
};
