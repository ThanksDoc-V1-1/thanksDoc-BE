'use strict';

const jwt = require('jsonwebtoken');

/**
 * Custom authentication middleware
 * Validates custom JWT tokens for Strapi built-in API endpoints
 * This middleware bridges custom JWT tokens with Strapi's user & permissions system
 */

module.exports = (config, { strapi }) => {
  return async (ctx, next) => {
    const authorization = ctx.request.header.authorization;
    
    // Skip authentication for public endpoints and non-API routes
    const publicPaths = [
      '/api/auth/',
      '/admin',
      '/_health',
      '/documentation',
      '/uploads',
    ];
    
    const isPublicPath = publicPaths.some(path => ctx.request.url.startsWith(path));
    const isApiPath = ctx.request.url.startsWith('/api/');
    
    // Skip middleware for public paths or non-API paths
    if (isPublicPath || !isApiPath) {
      return await next();
    }
    
    // If no authorization header, let Strapi handle it (might be public access)
    if (!authorization) {
      return await next();
    }
    
    // Extract JWT token
    const token = authorization.replace('Bearer ', '');
    
    if (!token) {
      return await next();
    }
    
    try {
      // Verify the custom JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
      
      // Ensure decoded is an object with our expected properties
      if (typeof decoded === 'string' || !decoded.email || !decoded.role) {
        console.log('� Invalid token structure');
        return await next();
      }
      
      console.log('�🔐 Custom auth middleware: Token validated for user:', decoded.email);
      
      // Create Strapi-compatible user object based on role
      let strapiUser = null;
      
      if (decoded.role === 'admin') {
        // For admin users, find the admin record
        const admin = await strapi.entityService.findMany('api::admin.admin', {
          filters: { email: decoded.email },
          limit: 1,
        });
        
        if (admin.length > 0) {
          // Create a Strapi-compatible user object
          strapiUser = {
            id: admin[0].id,
            email: admin[0].email,
            role: {
              id: 1,
              name: 'Authenticated',
              description: 'Default role given to authenticated user.',
              type: 'authenticated'
            },
            isActive: true,
            isBlocked: false,
          };
          console.log('✅ Admin user context set:', strapiUser.email);
        }
      } else if (decoded.role === 'doctor') {
        // For doctor users
        const doctor = await strapi.entityService.findMany('api::doctor.doctor', {
          filters: { email: decoded.email },
          limit: 1,
        });
        
        if (doctor.length > 0) {
          strapiUser = {
            id: doctor[0].id,
            email: doctor[0].email,
            role: {
              id: 1,
              name: 'Authenticated',
              description: 'Default role given to authenticated user.',
              type: 'authenticated'
            },
            isActive: true,
            isBlocked: false,
          };
          console.log('✅ Doctor user context set:', strapiUser.email);
        }
      } else if (decoded.role === 'business') {
        // For business users
        const business = await strapi.entityService.findMany('api::business.business', {
          filters: { email: decoded.email },
          limit: 1,
        });
        
        if (business.length > 0) {
          strapiUser = {
            id: business[0].id,
            email: business[0].email,
            role: {
              id: 1,
              name: 'Authenticated',
              description: 'Default role given to authenticated user.',
              type: 'authenticated'
            },
            isActive: true,
            isBlocked: false,
          };
          console.log('✅ Business user context set:', strapiUser.email);
        }
      }
      
      // Set the user in Strapi's context
      if (strapiUser) {
        ctx.state.user = strapiUser;
        console.log('🎯 Strapi user context established for:', strapiUser.email);
      }
      
      // Proceed to next middleware
      return await next();
      
    } catch (error) {
      console.log('🚫 Custom auth middleware: Token validation failed:', error.message);
      
      // If custom token validation fails, let Strapi handle it
      // This allows fallback to standard Strapi authentication
      return await next();
    }
  };
};
