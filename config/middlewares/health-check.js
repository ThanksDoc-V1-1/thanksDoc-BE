/**
 * Railway Health Check Middleware
 * Ensures health check endpoints are available immediately during startup
 */

'use strict';

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    // Handle health check requests before full Strapi initialization
    if (ctx.request.path === '/health' || ctx.request.path === '/healthz') {
      ctx.body = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'ThanksDoc Backend',
        port: process.env.PORT || 1337,
        host: process.env.HOST || '0.0.0.0',
        environment: process.env.NODE_ENV || 'development'
      };
      ctx.status = 200;
      return;
    }

    // Handle root path
    if (ctx.request.path === '/' && ctx.request.method === 'GET') {
      ctx.body = {
        message: 'ThanksDoc Backend API is running',
        status: 'healthy',
        timestamp: new Date().toISOString(),
        port: process.env.PORT || 1337
      };
      ctx.status = 200;
      return;
    }

    await next();
  };
};
