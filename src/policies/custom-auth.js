'use strict';

/**
 * Custom authentication policy
 * Validates custom JWT tokens and sets user context
 */

const jwt = require('jsonwebtoken');

module.exports = async (policyContext, config, { strapi }) => {
  const { ctx } = policyContext;
  
  const authorization = ctx.request.header.authorization;
  
  if (!authorization) {
    return false; // No authorization header
  }
  
  const token = authorization.replace('Bearer ', '');
  
  if (!token) {
    return false; // No token provided
  }
  
  try {
    // Verify the custom JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // Ensure decoded is an object with our expected properties
    if (typeof decoded === 'string' || !decoded.email || !decoded.role) {
      console.log('🚫 Invalid token structure');
      return false;
    }
    
    console.log('🔐 Custom auth policy: Token validated for user:', decoded.email);
    
    // Set user context based on role
    if (decoded.role === 'admin') {
      const admin = await strapi.entityService.findMany('api::admin.admin', {
        filters: { email: decoded.email },
        limit: 1,
      });
      
      if (admin.length > 0) {
        ctx.state.user = {
          id: admin[0].id,
          email: admin[0].email,
          role: 'admin',
          isAuthenticated: true
        };
        console.log('✅ Admin authenticated:', ctx.state.user.email);
        return true;
      }
    } else if (decoded.role === 'doctor') {
      const doctor = await strapi.entityService.findMany('api::doctor.doctor', {
        filters: { email: decoded.email },
        limit: 1,
      });
      
      if (doctor.length > 0) {
        ctx.state.user = {
          id: doctor[0].id,
          email: doctor[0].email,
          role: 'doctor',
          isAuthenticated: true
        };
        console.log('✅ Doctor authenticated:', ctx.state.user.email);
        return true;
      }
    } else if (decoded.role === 'business') {
      const business = await strapi.entityService.findMany('api::business.business', {
        filters: { email: decoded.email },
        limit: 1,
      });
      
      if (business.length > 0) {
        ctx.state.user = {
          id: business[0].id,
          email: business[0].email,
          role: 'business',
          isAuthenticated: true
        };
        console.log('✅ Business authenticated:', ctx.state.user.email);
        return true;
      }
    }
    
    return false; // User not found in database
    
  } catch (error) {
    console.log('🚫 Custom auth policy: Token validation failed:', error.message);
    return false; // Invalid token
  }
};
