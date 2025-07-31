module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/service-requests/calculate-cost',
      handler: 'service-request.calculateCost',
      config: {
        auth: false, // Allow public access for cost calculation
      },
    },
  ],
};
