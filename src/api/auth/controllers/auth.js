'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

/**
 * Custom authentication controller
 */

module.exports = {
  async login(ctx) {
    try {
      const { email, password } = ctx.request.body;

      if (!email || !password) {
        return ctx.badRequest('Email and password are required');
      }

      console.log('Login attempt for:', email);

      // Check if user is a doctor
      const doctor = await strapi.entityService.findMany('api::doctor.doctor', {
        filters: { email },
        limit: 1,
      });

      if (doctor.length > 0) {
        const user = doctor[0];
        console.log('Found doctor:', user.email);
        console.log('Doctor verification status:', user.isVerified);
        
        // TEMPORARY: Allow unverified doctors for development
        // TODO: Remove this in production - only verified doctors should be able to log in
        if (!user.isVerified) {
          console.log('⚠️ WARNING: Allowing unverified doctor login for development:', user.email);
        }
        
        // Verify password
        console.log('🔍 Attempting password verification...');
        console.log('📝 Password provided:', password ? 'YES' : 'NO');
        console.log('🔐 Hashed password exists:', user.password ? 'YES' : 'NO');
        
        const isValidPassword = await bcrypt.compare(password, user.password);
        console.log('✅ Password valid:', isValidPassword);
        
        if (!isValidPassword) {
          console.log('❌ Invalid password for doctor:', user.email);
          return ctx.badRequest('Invalid credentials');
        }

        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            role: 'doctor' 
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        console.log('Doctor login successful:', user.email);
        return ctx.send({
          jwt: token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'doctor',
            isVerified: user.isVerified,
            isAvailable: user.isAvailable
          }
        });
      }

      // Check if user is a business
      const business = await strapi.entityService.findMany('api::business.business', {
        filters: { email },
        limit: 1,
      });

      if (business.length > 0) {
        const user = business[0];
        console.log('Found business:', user.email);
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          console.log('Invalid password for business:', user.email);
          return ctx.badRequest('Invalid credentials');
        }

        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            role: 'business' 
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );

        console.log('Business login successful:', user.email);
        return ctx.send({
          jwt: token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: 'business',
            isVerified: user.isVerified
          }
        });
      }

      console.log('No user found with email:', email);
      return ctx.badRequest('Invalid credentials');

    } catch (error) {
      console.error('Login error:', error);
      return ctx.internalServerError('An error occurred during login');
    }
  },

  async register(ctx) {
    try {
      const { type, ...userData } = ctx.request.body;

      if (!type || !['doctor', 'business'].includes(type)) {
        return ctx.badRequest('Invalid user type');
      }

      if (!userData.email || !userData.password) {
        return ctx.badRequest('Email and password are required');
      }

      console.log('Registration attempt for:', userData.email, 'as', type);

      // Check if user already exists
      const existingDoctor = await strapi.entityService.findMany('api::doctor.doctor', {
        filters: { email: userData.email },
        limit: 1,
      });

      const existingBusiness = await strapi.entityService.findMany('api::business.business', {
        filters: { email: userData.email },
        limit: 1,
      });

      if (existingDoctor.length > 0 || existingBusiness.length > 0) {
        console.log('User already exists:', userData.email);
        return ctx.badRequest('User already exists with this email');
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Prepare user data
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword,
      };

      let user;
      if (type === 'doctor') {
        user = await strapi.entityService.create('api::doctor.doctor', {
          data: userDataWithHashedPassword,
        });
      } else {
        user = await strapi.entityService.create('api::business.business', {
          data: userDataWithHashedPassword,
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          id: user.id, 
          email: user.email, 
          role: type 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

      console.log('Registration successful for:', user.email, 'as', type);
      return ctx.send({
        jwt: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: type,
          isVerified: user.isVerified,
          ...(type === 'doctor' ? { isAvailable: user.isAvailable } : {})
        }
      });

    } catch (error) {
      console.error('Registration error:', error);
      return ctx.internalServerError('An error occurred during registration');
    }
  },

  async me(ctx) {
    try {
      const token = ctx.request.header.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return ctx.unauthorized('No token provided');
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      
      // Handle JWT payload properly
      const payload = typeof decoded === 'string' ? JSON.parse(decoded) : decoded;
      
      let user;
      if (payload.role === 'doctor') {
        user = await strapi.entityService.findOne('api::doctor.doctor', payload.id);
      } else if (payload.role === 'business') {
        user = await strapi.entityService.findOne('api::business.business', payload.id);
      }

      if (!user) {
        return ctx.unauthorized('User not found');
      }

      return ctx.send({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: payload.role,
          isVerified: user.isVerified,
          ...(payload.role === 'doctor' ? { isAvailable: user.isAvailable } : {})
        }
      });

    } catch (error) {
      console.error('Me endpoint error:', error);
      return ctx.unauthorized('Invalid token');
    }
  }
};
