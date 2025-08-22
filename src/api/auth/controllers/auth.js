'use strict';

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const EmailService = require('../../../services/email.service');
const { generateVerificationToken, generateExpirationTime, isExpired } = require('../../../utils/auth.utils');

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
      
      // Check if user is an admin (fetch raw password via db.query)
      const adminUser = await strapi.db.query('api::admin.admin').findOne({
        where: { email },
        select: ['id', 'email', 'password', 'firstName', 'lastName', 'name'],
      });
      
      if (adminUser) {
        const user = adminUser;
        console.log('Found admin user:', user.email);
        console.log('🔐 Admin has password field:', user.password ? 'YES' : 'NO');
        if (user.password) {
          console.log('🔐 Admin hash length:', user.password.length);
          console.log('🔐 Admin hash prefix:', user.password.substring(0, 7));
        }
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password || '');
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

        // Check if email is verified
        if (!user.isEmailVerified) {
          console.log('❌ Email not verified for doctor:', user.email);
          return ctx.badRequest('Please verify your email address before logging in. Check your email for verification link.');
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
        
        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          console.log('Invalid password for business:', user.email);
          return ctx.badRequest('Invalid credentials');
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
          console.log('❌ Email not verified for business:', user.email);
          const errorMessage = 'Please verify your email address before logging in. Check your email for verification link.';
          console.log('🔍 Returning error message:', errorMessage);
          return ctx.badRequest(errorMessage);
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
  
  async changePassword(ctx) {
    try {
  console.log('🔐 /auth/change-password called');
      const authUser = ctx.state.user;
      const { currentPassword, newPassword } = ctx.request.body || {};

      if (!authUser || !authUser.id || !authUser.role) {
        return ctx.unauthorized('Authentication required');
      }

      if (!currentPassword || !newPassword) {
        return ctx.badRequest('Current and new password are required');
      }

      if (String(newPassword).length < 6) {
        return ctx.badRequest('Password must be at least 6 characters long');
      }

      // Resolve collection by role
      let collectionName, uid;
      if (authUser.role === 'admin') { collectionName = 'api::admin.admin'; uid = 'api::admin.admin'; }
      else if (authUser.role === 'doctor') { collectionName = 'api::doctor.doctor'; uid = 'api::doctor.doctor'; }
      else if (authUser.role === 'business') { collectionName = 'api::business.business'; uid = 'api::business.business'; }
      else return ctx.badRequest('Invalid user role');

      // Load user (raw to include password)
      const user = await strapi.db.query(uid).findOne({
        where: { id: authUser.id },
        select: ['id', 'email', 'password'],
      });
      if (!user) {
        return ctx.unauthorized('User not found');
      }

  console.log('🔄 Change password for:', user.email);
  console.log('🔐 Current hash prefix:', user.password ? user.password.substring(0, 7) : 'N/A');

      // Verify current password
      const isValid = await bcrypt.compare(currentPassword, user.password || '');
      if (!isValid) {
        return ctx.badRequest('Current password is incorrect');
      }

      // Hash and update
  const hashed = await bcrypt.hash(newPassword, 12);
  console.log('🔐 New hash prefix to store:', hashed.substring(0, 7));
      await strapi.db.query(uid).update({
        where: { id: authUser.id },
        data: {
          password: hashed,
          passwordResetToken: null,
          passwordResetExpires: null,
        },
      });

      // Re-fetch to confirm
  const after = await strapi.db.query(uid).findOne({ where: { id: authUser.id }, select: ['password'] });
  console.log('✅ Password updated. Stored hash exists:', after?.password ? 'YES' : 'NO');
  console.log('🔐 Stored hash prefix:', after?.password ? after.password.substring(0, 7) : 'N/A');

      return ctx.send({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      return ctx.internalServerError('An error occurred while changing password');
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
      
      // Generate email verification token for non-admin users
      let emailVerificationToken = null;
      let emailVerificationExpires = null;
      
      if (type !== 'admin') {
        emailVerificationToken = generateVerificationToken();
        emailVerificationExpires = generateExpirationTime(24); // 24 hours
      }
      
      // Prepare user data (DON'T remove services yet - we need them for validation)
      const userDataWithHashedPassword = {
        ...userData,
        password: hashedPassword,
        ...(type !== 'admin' ? {
          emailVerificationToken,
          emailVerificationExpires,
          isEmailVerified: false
        } : {})
      };

      // Map phoneNumber to phone for business schema compatibility
      if (type === 'business' && userDataWithHashedPassword.phoneNumber) {
        userDataWithHashedPassword.phone = userDataWithHashedPassword.phoneNumber;
        delete userDataWithHashedPassword.phoneNumber;
      }

      // Add name field if not present
      if (!userDataWithHashedPassword.name) {
        if (type === 'doctor' && userDataWithHashedPassword.firstName && userDataWithHashedPassword.lastName) {
          userDataWithHashedPassword.name = `${userDataWithHashedPassword.firstName} ${userDataWithHashedPassword.lastName}`;
        } else if (type === 'business' && userDataWithHashedPassword.businessName) {
          userDataWithHashedPassword.name = userDataWithHashedPassword.businessName;
        }
      }

      // Handle services for doctors - validate and filter existing services
      let validServices = [];
      if (type === 'doctor' && (userDataWithHashedPassword.services || userDataWithHashedPassword.selectedServices)) {
        const serviceIds = userDataWithHashedPassword.services || userDataWithHashedPassword.selectedServices || [];
        
        if (serviceIds.length > 0) {
          console.log('🔍 Validating services:', serviceIds);
          
          // Get existing services from the database
          const existingServices = await strapi.entityService.findMany('api::service.service', {
            filters: { id: { $in: serviceIds } },
            fields: ['id']
          });
          
          validServices = existingServices.map(service => service.id);
          console.log('✅ Valid services found:', validServices);
          
          if (validServices.length !== serviceIds.length) {
            console.log('⚠️ Some services were invalid and filtered out');
          }
        }
        
        // Update the services field with validated services
        userDataWithHashedPassword.services = validServices;
        
        // Remove selectedServices as it's not part of the schema
        delete userDataWithHashedPassword.selectedServices;
      }

      let user;
      if (type === 'doctor') {
        // For doctors, handle services separately due to many-to-many relation
        const doctorData = { ...userDataWithHashedPassword };
        const servicesToConnect = doctorData.services || [];
        
        // Remove services from the creation data as we'll connect them separately
        delete doctorData.services;
        
        console.log('📝 Doctor data to be created:', {
          email: doctorData.email,
          licenseNumber: doctorData.licenseNumber,
          firstName: doctorData.firstName,
          lastName: doctorData.lastName
        });
        
        // Check if email already exists
        const existingDoctorByEmail = await strapi.entityService.findMany('api::doctor.doctor', {
          filters: { email: doctorData.email },
          limit: 1
        });
        
        if (existingDoctorByEmail && existingDoctorByEmail.length > 0) {
          console.log('❌ Email already exists:', doctorData.email);
          return ctx.badRequest('An account with this email address already exists');
        }
        
        // Check if license number already exists
        const existingDoctorByLicense = await strapi.entityService.findMany('api::doctor.doctor', {
          filters: { licenseNumber: doctorData.licenseNumber },
          limit: 1
        });
        
        if (existingDoctorByLicense && existingDoctorByLicense.length > 0) {
          console.log('❌ License number already exists:', doctorData.licenseNumber);
          return ctx.badRequest('A doctor with this license number is already registered');
        }
        
  console.log('👨‍⚕️ Creating doctor without services first...');
        try {
          user = await strapi.entityService.create('api::doctor.doctor', {
            data: doctorData,
          });
        } catch (createError) {
          console.error('❌ Doctor creation failed:', createError.message);
          console.error('❌ Full error details:', JSON.stringify(createError, null, 2));
          
          // Extract more details from the error
          if (createError.details && createError.details.errors) {
            console.error('❌ Validation errors:', createError.details.errors);
            const firstError = createError.details.errors[0];
            if (firstError && firstError.path) {
              console.error('❌ Field causing error:', firstError.path);
              if (firstError.path.includes('email')) {
                return ctx.badRequest('An account with this email address already exists');
              } else if (firstError.path.includes('licenseNumber') || firstError.path.includes('licence')) {
                return ctx.badRequest('A doctor with this license number is already registered');
              }
            }
          }
          
          if (createError.message.includes('unique')) {
            // Check which field might be causing the unique constraint violation
            if (createError.message.includes('email')) {
              return ctx.badRequest('An account with this email address already exists');
            } else if (createError.message.includes('licenseNumber') || createError.message.includes('licence')) {
              return ctx.badRequest('A doctor with this license number is already registered');
            } else {
              return ctx.badRequest('This information conflicts with an existing account. Please check your email and license number.');
            }
          }
          throw createError; // Re-throw if it's not a unique constraint error
        }
        
  console.log('✅ Doctor created with ID:', user.id);
        
        // Now connect the services if any were provided
        if (servicesToConnect.length > 0) {
          console.log('🔗 Connecting services to doctor:', servicesToConnect);
          
          try {
            user = await strapi.entityService.update('api::doctor.doctor', user.id, {
              data: {
                services: servicesToConnect
              }
            });
            console.log('✅ Services connected successfully to doctor');
          } catch (serviceError) {
            console.error('❌ Error connecting services:', serviceError);
            // Continue without failing registration - doctor is created, just without services
          }
        }
      } else if (type === 'business') {
  console.log('🏢 Creating business with data:', JSON.stringify(userDataWithHashedPassword, null, 2));
        try {
          user = await strapi.entityService.create('api::business.business', {
            data: userDataWithHashedPassword,
          });
          console.log('✅ Business created successfully:', user.id);
        } catch (businessError) {
          console.error('❌ Business creation error:', businessError);
          throw businessError;
        }
      } else if (type === 'admin') {
        user = await strapi.entityService.create('api::admin.admin', {
          data: userDataWithHashedPassword,
        });
      }

      // Send email verification for non-admin users
      if (type !== 'admin' && emailVerificationToken) {
        try {
          const emailService = new EmailService();
          await emailService.sendVerificationEmail(
            user.email, 
            user.name || user.firstName || user.businessName || 'User',
            emailVerificationToken,
            type
          );
          console.log('✅ Verification email sent to:', user.email);
        } catch (emailError) {
          console.error('❌ Failed to send verification email:', emailError);
          // Continue with registration even if email fails
        }
      }

  console.log('Registration successful for:', user.email, 'as', type);
      
      if (type === 'admin') {
        // Generate JWT token for admin (no email verification needed)
        const token = jwt.sign(
          { 
            id: user.id, 
            email: user.email, 
            role: type 
          },
          process.env.JWT_SECRET || 'your-secret-key',
          { expiresIn: '7d' }
        );
        
        return ctx.send({
          jwt: token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: type,
            isVerified: user.isVerified,
          }
        });
      } else {
        // For doctor and business, return success without JWT token (they need to verify email first)
        return ctx.send({
          message: 'Registration successful! Please check your email to verify your account before logging in.',
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: type,
            isEmailVerified: false,
            requiresEmailVerification: true
          }
        });
      }

    } catch (error) {
      console.error('Registration error:', error);
      return ctx.internalServerError('An error occurred during registration');
    }
  },

  async verifyEmail(ctx) {
    try {
      const { token, type } = ctx.request.body;

      if (!token || !type || !['doctor', 'business'].includes(type)) {
        return ctx.badRequest('Invalid verification token or user type');
      }

  console.log('Email verification attempt for type:', type, 'with token:', token.substring(0, 10) + '...');

      // Find user with the verification token
      const collectionName = type === 'doctor' ? 'api::doctor.doctor' : 'api::business.business';
      
      const users = await strapi.entityService.findMany(collectionName, {
        filters: { 
          emailVerificationToken: token,
          isEmailVerified: false
        },
        limit: 1,
      });

      if (users.length === 0) {
  console.log('❌ Invalid or expired verification token');
        return ctx.badRequest('Invalid or expired verification token');
      }

      const user = users[0];

      // Check if token has expired
      if (isExpired(user.emailVerificationExpires)) {
  console.log('❌ Verification token has expired for:', user.email);
        return ctx.badRequest('Verification token has expired. Please request a new verification email.');
      }

      // Update user to mark email as verified
      const updatedUser = await strapi.entityService.update(collectionName, user.id, {
        data: {
          isEmailVerified: true,
          emailVerificationToken: null,
          emailVerificationExpires: null
        }
      });

      // Send welcome email
      try {
        const emailService = new EmailService();
        await emailService.sendWelcomeEmail(
          updatedUser.email,
          updatedUser.name || updatedUser.firstName || updatedUser.businessName || 'User',
          type
        );
  console.log('✅ Welcome email sent to:', updatedUser.email);
      } catch (emailError) {
        console.error('❌ Failed to send welcome email:', emailError);
        // Continue even if welcome email fails
      }

      // Generate JWT token now that email is verified
      const jwtToken = jwt.sign(
        { 
          id: updatedUser.id, 
          email: updatedUser.email, 
          role: type 
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );

  console.log('✅ Email verification successful for:', updatedUser.email);
      return ctx.send({
        message: 'Email verified successfully! You can now log in.',
        jwt: jwtToken,
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          name: updatedUser.name,
          role: type,
          isEmailVerified: true,
          isVerified: updatedUser.isVerified,
          ...(type === 'doctor' ? { isAvailable: updatedUser.isAvailable } : {})
        }
      });

    } catch (error) {
      console.error('Email verification error:', error);
      return ctx.internalServerError('An error occurred during email verification');
    }
  },

  async resendVerificationEmail(ctx) {
    try {
      const { email, type } = ctx.request.body;

      if (!email || !type || !['doctor', 'business'].includes(type)) {
        return ctx.badRequest('Email and user type are required');
      }

  console.log('Resend verification email request for:', email, 'as', type);

      // Find user
      const collectionName = type === 'doctor' ? 'api::doctor.doctor' : 'api::business.business';
      
      const users = await strapi.entityService.findMany(collectionName, {
        filters: { 
          email,
          isEmailVerified: false
        },
        limit: 1,
      });

      if (users.length === 0) {
  console.log('❌ User not found or already verified:', email);
        return ctx.badRequest('User not found or email already verified');
      }

      const user = users[0];

      // Generate new verification token
      const emailVerificationToken = generateVerificationToken();
      const emailVerificationExpires = generateExpirationTime(24);

      // Update user with new token
      const updatedUser = await strapi.entityService.update(collectionName, user.id, {
        data: {
          emailVerificationToken,
          emailVerificationExpires
        }
      });

      // Send new verification email
      try {
        const emailService = new EmailService();
        await emailService.sendVerificationEmail(
          updatedUser.email,
          updatedUser.name || updatedUser.firstName || updatedUser.businessName || 'User',
          emailVerificationToken,
          type
        );
  console.log('✅ New verification email sent to:', updatedUser.email);
      } catch (emailError) {
        console.error('❌ Failed to send verification email:', emailError);
        return ctx.internalServerError('Failed to send verification email');
      }

      return ctx.send({
        message: 'Verification email sent successfully! Please check your email.'
      });

    } catch (error) {
      console.error('Resend verification email error:', error);
      return ctx.internalServerError('An error occurred while resending verification email');
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

          // Use the dedicated password reset method, pass email as 4th argument
          await whatsappService.sendPasswordResetToken(phoneNumber, resetToken, userName, user.email);
          (`Password reset token sent to WhatsApp: ${phoneNumber}`);
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
            (`Password reset confirmation sent to WhatsApp: ${phoneNumber}`);
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
  },

  async checkEmail(ctx) {
    try {
      const { email } = ctx.params;
      
      console.log('🔍 Checking email existence for:', email);
      
      // Check in doctors table
      const doctorExists = await strapi.db.query('api::doctor.doctor').findOne({
        where: { email },
        select: ['id', 'email']
      });
      
      // Check in business table
      const businessExists = await strapi.db.query('api::business.business').findOne({
        where: { email },
        select: ['id', 'email']
      });
      
      // Check in admin table
      const adminExists = await strapi.db.query('api::admin.admin').findOne({
        where: { email },
        select: ['id', 'email']
      });
      
      console.log('📊 Email check results:');
      console.log('- Doctor exists:', doctorExists ? 'YES' : 'NO');
      console.log('- Business exists:', businessExists ? 'YES' : 'NO');
      console.log('- Admin exists:', adminExists ? 'YES' : 'NO');
      
      return ctx.send({
        email,
        exists: {
          doctor: !!doctorExists,
          business: !!businessExists,
          admin: !!adminExists,
          any: !!(doctorExists || businessExists || adminExists)
        },
        records: {
          doctor: doctorExists,
          business: businessExists,
          admin: adminExists
        }
      });
      
    } catch (error) {
      console.error('Check email error:', error);
      return ctx.internalServerError('An error occurred while checking email');
    }
  }
};

