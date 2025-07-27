'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

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
      
      // Check if user is an admin
      const admin = await strapi.entityService.findMany('api::admin.admin', {
        filters: { email },
        limit: 1,
      });
      
      if (admin.length > 0) {
        const user = admin[0];
        console.log('Found admin user:', user.email);
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          console.log('❌ Invalid password for admin:', user.email);
          return ctx.badRequest('Invalid credentials');
        }
        
        // Generate JWT token
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            role: 'admin' 
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );
        
        console.log('✅ Admin login successful:', user.email);
        return ctx.send({
          jwt: token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin',
            role: 'admin'
          }
        });
      }

      // Check if user is a doctor
      const doctor = await strapi.entityService.findMany('api::doctor.doctor', {
        filters: { email },
        limit: 1,
      });

      if (doctor.length > 0) {
        const user = doctor[0];
        console.log('Found doctor:', user.email);
        console.log('Doctor verification status:', user.isVerified);
        
        // Check if doctor is verified
        if (!user.isVerified) {
          console.log('❌ Unverified doctor attempted login:', user.email);
          return ctx.forbidden('Account not verified. Please wait for admin approval.');
        }
        
        // Verify password
        console.log('🔍 Attempting password verification...');
        console.log('📝 Password provided:', password ? 'YES' : 'NO');
        console.log('🔐 Hashed password exists:', user.password ? 'YES' : 'NO');
        console.log('🔐 Raw password length:', password.length);
        console.log('🔐 Hashed password length:', user.password ? user.password.length : 'N/A');
        console.log('🔐 Hashed password starts with $2:', user.password ? user.password.startsWith('$2') : 'N/A');
        console.log('🔐 First 10 chars of hash:', user.password ? user.password.substring(0, 10) : 'N/A');
        
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
        console.log('👤 Doctor ID being returned:', user.id);
        console.log('📊 Full doctor user object:', JSON.stringify(user, null, 2));
        
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
        console.log('Business verification status:', user.isVerified);
        
        // Check if business is verified
        if (!user.isVerified) {
          console.log('❌ Unverified business attempted login:', user.email);
          return ctx.forbidden('Account not verified. Please wait for admin approval.');
        }
        
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

      if (!type || !['doctor', 'business', 'admin'].includes(type)) {
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
      
      const existingAdmin = await strapi.entityService.findMany('api::admin.admin', {
        filters: { email: userData.email },
        limit: 1,
      });

      if (existingDoctor.length > 0 || existingBusiness.length > 0 || existingAdmin.length > 0) {
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

      // Add name field if not present
      if (!userDataWithHashedPassword.name) {
        if (type === 'doctor' && userDataWithHashedPassword.firstName && userDataWithHashedPassword.lastName) {
          userDataWithHashedPassword.name = `${userDataWithHashedPassword.firstName} ${userDataWithHashedPassword.lastName}`;
        } else if (type === 'business' && userDataWithHashedPassword.businessName) {
          userDataWithHashedPassword.name = userDataWithHashedPassword.businessName;
        }
      }

      let user;
      if (type === 'doctor') {
        user = await strapi.entityService.create('api::doctor.doctor', {
          data: userDataWithHashedPassword,
        });
      } else if (type === 'business') {
        user = await strapi.entityService.create('api::business.business', {
          data: userDataWithHashedPassword,
        });
      } else if (type === 'admin') {
        user = await strapi.entityService.create('api::admin.admin', {
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
      } else if (payload.role === 'admin') {
        user = await strapi.entityService.findOne('api::admin.admin', payload.id);
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
  },

  async forgotPassword(ctx) {
    try {
      const { email } = ctx.request.body;

      if (!email) {
        return ctx.badRequest('Email is required');
      }

      console.log('Forgot password request for:', email);

      // Find user in all user types
      let user = null;
      let userType = null;

      // Check if user is a doctor
      const doctor = await strapi.entityService.findMany('api::doctor.doctor', {
        filters: { email },
        limit: 1,
      });

      if (doctor.length > 0) {
        user = doctor[0];
        userType = 'doctor';
      } else {
        // Check if user is a business
        const business = await strapi.entityService.findMany('api::business.business', {
          filters: { email },
          limit: 1,
        });

        if (business.length > 0) {
          user = business[0];
          userType = 'business';
        } else {
          // Check if user is an admin
          const admin = await strapi.entityService.findMany('api::admin.admin', {
            filters: { email },
            limit: 1,
          });

          if (admin.length > 0) {
            user = admin[0];
            userType = 'admin';
          }
        }
      }

      if (!user) {
        // Don't reveal if user exists or not for security
        return ctx.send({
          message: 'If an account with that email exists, a password reset token has been sent to your registered WhatsApp number.'
        });
      }

      // Generate a secure random token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Update user with reset token
      await strapi.entityService.update(`api::${userType}.${userType}`, user.id, {
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires,
        }
      });

      // Send WhatsApp message with reset token
      try {
        const whatsappService = strapi.service('whatsapp');
        if (whatsappService) {
          const phoneNumber = user.phone || user.phoneNumber;
          
          if (!phoneNumber) {
            console.error('No phone number found for user:', email);
            return ctx.badRequest('No WhatsApp number registered for this account. Please contact support.');
          }

          // Get user name for personalized message
          const userName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User';
          
          // Use the dedicated password reset method
          await whatsappService.sendPasswordResetToken(phoneNumber, resetToken, userName);
          console.log(`Password reset token sent to WhatsApp: ${phoneNumber}`);
        } else {
          console.error('WhatsApp service not found!');
          return ctx.internalServerError('WhatsApp service unavailable');
        }
      } catch (whatsappError) {
        console.error('Failed to send WhatsApp message:', whatsappError);
        return ctx.internalServerError('Failed to send reset token via WhatsApp');
      }

      return ctx.send({
        message: 'Password reset token has been sent to your registered WhatsApp number.'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      return ctx.internalServerError('An error occurred while processing your request');
    }
  },

  async resetPassword(ctx) {
    try {
      const { email, token, newPassword } = ctx.request.body;

      if (!email || !token || !newPassword) {
        return ctx.badRequest('Email, token, and new password are required');
      }

      if (newPassword.length < 6) {
        return ctx.badRequest('Password must be at least 6 characters long');
      }

      console.log('Password reset attempt for:', email);

      // Find user in all user types
      let user = null;
      let userType = null;

      // Check if user is a doctor
      const doctor = await strapi.entityService.findMany('api::doctor.doctor', {
        filters: { 
          email,
          passwordResetToken: token,
          passwordResetExpires: { $gt: new Date() }
        },
        limit: 1,
      });

      if (doctor.length > 0) {
        user = doctor[0];
        userType = 'doctor';
      } else {
        // Check if user is a business
        const business = await strapi.entityService.findMany('api::business.business', {
          filters: { 
            email,
            passwordResetToken: token,
            passwordResetExpires: { $gt: new Date() }
          },
          limit: 1,
        });

        if (business.length > 0) {
          user = business[0];
          userType = 'business';
        } else {
          // Check if user is an admin
          const admin = await strapi.entityService.findMany('api::admin.admin', {
            filters: { 
              email,
              passwordResetToken: token,
              passwordResetExpires: { $gt: new Date() }
            },
            limit: 1,
          });

          if (admin.length > 0) {
            user = admin[0];
            userType = 'admin';
          }
        }
      }

      if (!user) {
        return ctx.badRequest('Invalid or expired reset token');
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Update user with new password and clear reset token
      await strapi.entityService.update(`api::${userType}.${userType}`, user.id, {
        data: {
          password: hashedPassword,
          passwordResetToken: null,
          passwordResetExpires: null,
        }
      });

      console.log('Password reset successful for:', email);

      // Send confirmation WhatsApp message
      try {
        const whatsappService = strapi.service('whatsapp');
        if (whatsappService) {
          const phoneNumber = user.phone || user.phoneNumber;
          
          if (phoneNumber) {
            const message = `✅ ThanksDoc Password Reset Successful\n\nYour password has been successfully updated.\n\nIf you didn't make this change, please contact support immediately.`;

            const messageData = {
              messaging_product: 'whatsapp',
              to: phoneNumber.replace(/^\+/, ''),
              type: 'text',
              text: {
                body: message
              }
            };

            await whatsappService.sendWhatsAppMessage(messageData);
            console.log(`Password reset confirmation sent to WhatsApp: ${phoneNumber}`);
          }
        }
      } catch (whatsappError) {
        console.error('Failed to send confirmation WhatsApp message:', whatsappError);
        // Don't fail the password reset if confirmation message fails
      }

      return ctx.send({
        message: 'Password has been successfully reset. You can now login with your new password.'
      });

    } catch (error) {
      console.error('Reset password error:', error);
      return ctx.internalServerError('An error occurred while resetting your password');
    }
  }
};
