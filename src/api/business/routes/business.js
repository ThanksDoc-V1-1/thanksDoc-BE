module.exports = {
  routes: [
    {
      method: 'GET',
      path: '/businesses',
      handler: 'business.find',
      config: {
        auth: false,
      },
    },
    {
      method: 'GET',
      path: '/businesses/:id',
      handler: 'business.findOne',
      config: {
        auth: false,
      },
    },
    {
      method: 'POST',
      path: '/businesses',
      handler: 'business.create',
      config: {
        auth: false,
      },
    },
    {
      method: 'PUT',
      path: '/businesses/:id',
      handler: 'business.update',
      config: {
        auth: false,
      },
    },
    {
      method: 'DELETE',
      path: '/businesses/:id',
      handler: 'business.delete',
      config: {
        auth: false,
      },
    },
  ],
};
