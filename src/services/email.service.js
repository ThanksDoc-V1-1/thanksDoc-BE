const nodemailer = require('nodemailer');
const { calculateDistance } = require('../utils/distance');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendVerificationEmail(email, name, verificationToken, userType) {
    const verificationUrl = `${process.env.FRONTEND_DASHBOARD_URL}/verify-email?token=${verificationToken}&type=${userType}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Verify your ThanksDoc Account',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email - ThanksDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              background: #3b82f6 !important; 
              color: #ffffff !important; 
              padding: 14px 32px; 
              text-decoration: none !important; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: bold; 
              font-size: 16px;
              border: none;
              box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
            }
            .button:hover { background: #2563eb !important; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .code { background: #e5e7eb; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 18px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to ThanksDoc</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Thank you for registering with ThanksDoc as a ${userType === 'doctor' ? 'Doctor' : 'Business'}.</p>
              <p>To complete your registration and start using our platform, please verify your email address by clicking the button below:</p>
              
              <div style="text-align: center;">
                <a href="${verificationUrl}" 
                   class="button" 
                   style="display: inline-block; background: #3b82f6 !important; color: #ffffff !important; padding: 14px 32px; text-decoration: none !important; border-radius: 6px; margin: 20px 0; font-weight: bold; font-size: 16px; border: none; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);">
                  Verify Email Address
                </a>
              </div>
              
              <p>Or copy and paste this link into your browser:</p>
              <div class="code">${verificationUrl}</div>
              
              <p><strong>Important:</strong> This verification link will expire in 24 hours for security reasons.</p>
              
              <p>If you didn't create an account with ThanksDoc, please ignore this email.</p>
              
              <p>Best regards,<br>The ThanksDoc Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ThanksDoc. All rights reserved.</p>
              <p>This is an automated email, please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Verification email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending verification email:', error);
      throw new Error('Failed to send verification email');
    }
  }

  async sendWelcomeEmail(email, name, userType) {
    const dashboardUrl = `${process.env.FRONTEND_DASHBOARD_URL}/${userType}/dashboard`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Welcome to ThanksDoc - Account Verified!',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to ThanksDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9fafb; }
            .button { display: inline-block; background: #10b981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .feature { background: white; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #10b981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Welcome to ThanksDoc!</h1>
            </div>
            <div class="content">
              <h2>Hello ${name},</h2>
              <p>Congratulations! Your email has been successfully verified and your ThanksDoc account is now active.</p>
              
              ${userType === 'doctor' ? `
                <div class="feature">
                  <h3>👨‍⚕️ As a Doctor, you can now:</h3>
                  <ul>
                    <li>Complete your profile</li>
                    <li>Upload compliance documents for verification</li>
                    <li>Set your availability and services</li>
                    <li>Receive consultation requests from businesses</li>
                    <li>Conduct video consultations</li>
                  </ul>
                </div>
              ` : `
                <div class="feature">
                  <h3>🏢 As a Business, you can now:</h3>
                  <ul>
                    <li>Complete your business profile</li>
                    <li>Request doctor consultations for your customers</li>
                    <li>Access NHS and private healthcare services</li>
                    <li>Manage consultation requests and payments</li>
                    <li>View consultation history and reports</li>
                  </ul>
                </div>
              `}
              
              <div style="text-align: center;">
                <a href="${dashboardUrl}" class="button">Access Your Dashboard</a>
              </div>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Best regards,<br>The ThanksDoc Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ThanksDoc. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending welcome email:', error);
      throw new Error('Failed to send welcome email');
    }
  }

  async testConnection() {
    try {
      await this.transporter.verify();
      ('Email service connection successful');
      return true;
    } catch (error) {
      console.error('Email service connection failed:', error);
      return false;
    }
  }

  /**
   * Send video call link to doctor via email
   */
  async sendVideoCallEmailToDoctor(doctor, serviceRequest, videoCallUrl) {
    const scheduledTime = new Date(serviceRequest.requestedServiceDateTime).toLocaleString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const platformVideoUrl = `${process.env.FRONTEND_VIDEO_URL}/consultation/${serviceRequest.id}?type=doctor&roomUrl=${encodeURIComponent(videoCallUrl)}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: doctor.email,
      subject: 'ThanksDoc - Video Consultation Ready',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Video Consultation Ready - ThanksDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              background: #10b981 !important; 
              color: #ffffff !important; 
              padding: 16px 32px; 
              text-decoration: none !important; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: bold; 
              font-size: 16px;
              border: none;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            }
            .button:hover { background: #059669 !important; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .patient-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .video-icon { font-size: 48px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🩺 Video Consultation Ready</h1>
            </div>
            <div class="content">
              <h2>Hi Dr. ${doctor.firstName} ${doctor.lastName},</h2>
              <p>Your video consultation is ready to start!</p>
              
              <div class="patient-details">
                <h3>📋 Patient Details:</h3>
                <ul>
                  <li><strong>Name:</strong> ${serviceRequest.patientFirstName} ${serviceRequest.patientLastName}</li>
                  <li><strong>Phone:</strong> ${serviceRequest.patientPhone}</li>
                  <li><strong>Service:</strong> ${serviceRequest.serviceType || 'Online Consultation'}</li>
                  <li><strong>Scheduled Time:</strong> ${scheduledTime}</li>
                </ul>
              </div>

              <div class="video-icon">🎥</div>
              
              <div style="text-align: center;">
                <a href="${platformVideoUrl}" class="button">Join Video Call</a>
              </div>
              
              <p><strong>⏰ Please join at your scheduled time.</strong> The patient will receive their link separately.</p>
              
              <p>Need help? Reply to this email or contact our support team.</p>
              
              <p>Best regards,<br>The ThanksDoc Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ThanksDoc - Connecting Healthcare</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      (`✅ Video call email sent to doctor: ${doctor.email}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send video call email to doctor ${doctor.email}:`, error);
      throw new Error('Failed to send video call email to doctor');
    }
  }

  /**
   * Send video call link to patient via email
   */
  async sendVideoCallEmailToPatient(serviceRequest, doctor, videoCallUrl) {
    if (!serviceRequest.patientEmail) {
      console.warn('⚠️ No patient email provided for video call notification');
      return null;
    }

    const scheduledTime = new Date(serviceRequest.requestedServiceDateTime).toLocaleString('en-GB', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    const platformVideoUrl = `${process.env.FRONTEND_VIDEO_URL}/consultation/${serviceRequest.id}?type=patient&roomUrl=${encodeURIComponent(videoCallUrl)}`;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: serviceRequest.patientEmail,
      subject: 'ThanksDoc - Your Video Consultation',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Video Consultation - ThanksDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              background: #3b82f6 !important; 
              color: #ffffff !important; 
              padding: 16px 32px; 
              text-decoration: none !important; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: bold; 
              font-size: 16px;
              border: none;
              box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
            }
            .button:hover { background: #2563eb !important; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .doctor-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981; }
            .video-icon { font-size: 48px; text-align: center; margin: 20px 0; }
            .instructions { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏥 Your Video Consultation</h1>
            </div>
            <div class="content">
              <h2>Hello ${serviceRequest.patientFirstName || 'Patient'},</h2>
              <p>Your video consultation with ThanksDoc is ready!</p>
              
              <div class="doctor-details">
                <h3>👨‍⚕️ Your Doctor:</h3>
                <ul>
                  <li><strong>Name:</strong> Dr. ${doctor.firstName} ${doctor.lastName}</li>
                  <li><strong>Service:</strong> ${serviceRequest.serviceType || 'Online Consultation'}</li>
                  <li><strong>Scheduled Time:</strong> ${scheduledTime}</li>
                </ul>
              </div>

              <div class="video-icon">🎥</div>
              
              <div style="text-align: center;">
                <a href="${platformVideoUrl}" class="button">Join Video Call</a>
              </div>
              
              <div class="instructions">
                <h3>📱 Instructions:</h3>
                <ul>
                  <li>Click the "Join Video Call" button above</li>
                  <li>Allow camera and microphone access when prompted</li>
                  <li>Ensure you have a good internet connection</li>
                  <li>Join a few minutes early for the best experience</li>
                </ul>
              </div>
              
              <p>Need help? Contact us at support@thanksdoc.com</p>
              
              <p>Best regards,<br>The ThanksDoc Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ThanksDoc - Your Healthcare Partner</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      (`✅ Video call email sent to patient: ${serviceRequest.patientEmail}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send video call email to patient ${serviceRequest.patientEmail}:`, error);
      throw new Error('Failed to send video call email to patient');
    }
  }

  /**
   * Send video call emails to both doctor and patient
   */
  async sendVideoCallEmails(doctor, serviceRequest, videoCallUrl) {
    try {
      ('📧 Sending video call email notifications');
      
      const notifications = [];
      
      // Send to doctor
      try {
        const doctorEmail = await this.sendVideoCallEmailToDoctor(doctor, serviceRequest, videoCallUrl);
        notifications.push({ type: 'doctor_email', success: true, data: doctorEmail });
      } catch (error) {
        console.error('❌ Failed to send video call email to doctor:', error);
        notifications.push({ type: 'doctor_email', success: false, error: error.message });
      }

      // Send to patient (only if email is provided)
      if (serviceRequest.patientEmail) {
        try {
          const patientEmail = await this.sendVideoCallEmailToPatient(serviceRequest, doctor, videoCallUrl);
          if (patientEmail) {
            notifications.push({ type: 'patient_email', success: true, data: patientEmail });
          } else {
            notifications.push({ type: 'patient_email', success: false, error: 'No patient email provided' });
          }
        } catch (error) {
          console.error('❌ Failed to send video call email to patient:', error);
          notifications.push({ type: 'patient_email', success: false, error: error.message });
        }
      } else {
        console.warn('⚠️ Patient email not provided, skipping patient email notification');
        notifications.push({ type: 'patient_email', success: false, error: 'No email address provided' });
      }

      console.log('✅ Video call email notifications completed:', notifications);
      return notifications;

    } catch (error) {
      console.error('❌ Error sending video call email notifications:', error);
      throw error;
    }
  }

  /**
   * Send professional reference request email
   */
  async sendReferenceRequestEmail(referenceEmail, referenceName, doctorName, referenceToken) {
    const referenceFormUrl = `${process.env.FRONTEND_DASHBOARD_URL}/reference-form/${referenceToken}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: referenceEmail,
      subject: `Professional Reference Request for Dr. ${doctorName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Professional Reference Request - ThanksDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              background: #10b981 !important; 
              color: #ffffff !important; 
              padding: 16px 32px; 
              text-decoration: none !important; 
              border-radius: 6px; 
              margin: 20px 0; 
              font-weight: bold; 
              font-size: 16px;
              border: none;
              box-shadow: 0 2px 4px rgba(16, 185, 129, 0.3);
            }
            .button:hover { background: #059669 !important; }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .reference-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .instructions { background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .icon { font-size: 48px; text-align: center; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📋 Professional Reference Request</h1>
            </div>
            <div class="content">
              <h2>Dear ${referenceName},</h2>
              <p>Dr. ${doctorName} recently registered with ThanksDoc, and we would appreciate you filling in their reference letter to help them complete their compliance documents.</p>
              
              <div class="icon">📄</div>
              
              <div style="text-align: center;">
                <a href="${referenceFormUrl}" class="button">Complete Reference Form</a>
              </div>
              
              <div class="instructions">
                <h3>📋 Instructions:</h3>
                <ul>
                  <li>Click the "Complete Reference Form" button above</li>
                  <li>Fill out the professional reference form with accurate information</li>
                  <li>Rate the doctor's clinical skills based on your professional experience</li>
                  <li>Submit the form once completed</li>
                </ul>
              </div>
              
              <p>Please use the following link to access and complete the reference letter:</p>
              <div style="background: #e5e7eb; padding: 15px; border-radius: 5px; font-family: monospace; font-size: 14px; text-align: center; margin: 20px 0;">
                ${referenceFormUrl}
              </div>
              
              <p><strong>Important:</strong> This reference request is confidential and should only be completed by you.</p>
              
              <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
              
              <p>Kind regards,<br>ThanksDoc Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ThanksDoc - Professional Healthcare Platform</p>
              <p>This is an automated email, please do not reply to this message.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      (`✅ Professional reference request email sent to: ${referenceEmail}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send professional reference request email to ${referenceEmail}:`, error);
      throw new Error('Failed to send professional reference request email');
    }
  }

  /**
   * Calculate distance between business and doctor in miles
   */
  calculateDistanceInMiles(business, doctor) {
    // Enhanced logging for production debugging
    console.log('\n📧 Email Distance Calculation Debug:');
    console.log('📍 Business object keys:', business ? Object.keys(business) : 'null/undefined');
    console.log('👨‍⚕️ Doctor object keys:', doctor ? Object.keys(doctor) : 'null/undefined');
    console.log('📏 Business coordinates:', {
      latitude: business ? business.latitude : 'N/A',
      longitude: business ? business.longitude : 'N/A',
      latType: business && business.latitude ? typeof business.latitude : 'N/A',
      lngType: business && business.longitude ? typeof business.longitude : 'N/A'
    });
    console.log('👨‍⚕️ Doctor coordinates:', {
      latitude: doctor ? doctor.latitude : 'N/A',
      longitude: doctor ? doctor.longitude : 'N/A',
      latType: doctor && doctor.latitude ? typeof doctor.latitude : 'N/A',
      lngType: doctor && doctor.longitude ? typeof doctor.longitude : 'N/A'
    });
    
    // Check if both business and doctor have valid coordinates
    if (!business || !doctor) {
      console.log('❌ Missing business or doctor object');
      return 'Unknown';
    }
    
    // Handle both string and number coordinates
    const businessLat = business.latitude ? parseFloat(business.latitude) : NaN;
    const businessLng = business.longitude ? parseFloat(business.longitude) : NaN;
    const doctorLat = doctor.latitude ? parseFloat(doctor.latitude) : NaN;
    const doctorLng = doctor.longitude ? parseFloat(doctor.longitude) : NaN;
    
    // Validate coordinates
    if (isNaN(businessLat) || isNaN(businessLng) || isNaN(doctorLat) || isNaN(doctorLng)) {
      console.log('🔍 Email Distance calculation: Invalid coordinates detected', {
        business: { lat: business.latitude, lng: business.longitude },
        doctor: { lat: doctor.latitude, lng: doctor.longitude },
        parsed: { businessLat, businessLng, doctorLat, doctorLng }
      });
      return 'Unknown';
    }
    
    // Calculate distance in kilometers using Haversine formula
    const distanceKm = calculateDistance(businessLat, businessLng, doctorLat, doctorLng);
    
    // Convert to miles (1 km = 0.621371 miles)
    const distanceMiles = distanceKm * 0.621371;
    
    // Format the distance nicely
    if (distanceMiles < 0.1) {
      // Very close - show in feet
      const feet = Math.round(distanceMiles * 5280);
      return `${feet}ft`;
    } else if (distanceMiles < 1) {
      // Less than a mile - show one decimal place
      return `${distanceMiles.toFixed(1)} miles`;
    } else if (distanceMiles < 10) {
      // Less than 10 miles - show one decimal place
      return `${distanceMiles.toFixed(1)} miles`;
    } else {
      // 10+ miles - round to nearest mile
      return `${Math.round(distanceMiles)} miles`;
    }
  }

  /**
   * Send service request notification to doctor via email
   */
  async sendServiceRequestNotification(doctor, serviceRequest, business) {
    console.log('📧 Email Service Debug - serviceRequest data:', {
      servicePrice: serviceRequest.servicePrice,
      serviceCost: serviceRequest.serviceCost,
      totalAmount: serviceRequest.totalAmount,
      service: serviceRequest.service,
      id: serviceRequest.id
    });
    
    // Calculate doctor's take-home pay (90% of service cost, same as WhatsApp and dashboard)
    const calculateDoctorTakeHome = (servicePrice) => {
      return servicePrice * 0.9; // Doctor keeps 90%, ThanksDoc takes 10%
    };
    
    // Get the service price from multiple possible sources (same logic as WhatsApp service)
    let servicePrice = 0;
    
    // Try to get BASE service price (what doctor gets paid from) - NOT total amount
    if (serviceRequest.servicePrice && parseFloat(serviceRequest.servicePrice) > 0) {
      servicePrice = parseFloat(serviceRequest.servicePrice);
      console.log('💰 Email: Using serviceRequest.servicePrice (base price):', servicePrice);
    } else if (serviceRequest.serviceCost && parseFloat(serviceRequest.serviceCost) > 0) {
      servicePrice = parseFloat(serviceRequest.serviceCost);
      console.log('💰 Email: Using serviceRequest.serviceCost (base price):', servicePrice);
    } else if (serviceRequest.service && serviceRequest.service.price && parseFloat(serviceRequest.service.price) > 0) {
      servicePrice = parseFloat(serviceRequest.service.price);
      console.log('💰 Email: Using serviceRequest.service.price (base price):', servicePrice);
    } else {
      console.log('⚠️ Email: No base service price found, cannot calculate doctor take-home');
    }
    
    const doctorTakeHome = servicePrice > 0 ? calculateDoctorTakeHome(servicePrice) : 0;
    const formattedTakeHome = doctorTakeHome > 0 ? `£${doctorTakeHome.toFixed(2)}` : 'To be confirmed';
    
    console.log('💰 Email price calculation:', {
      servicePrice,
      doctorTakeHome,
      formattedTakeHome
    });

    // Calculate distance between business and doctor (or show "Online" for online services)
    let distanceText;
    let locationText;
    if (serviceRequest.service && serviceRequest.service.category === 'online') {
      distanceText = "Online";
      locationText = "Online";
    } else {
      distanceText = this.calculateDistanceInMiles(business, doctor);
      locationText = business.address || "Address not specified";
    }
    
    console.log('📍 Email distance calculation:', {
      distanceText,
      locationText,
      isOnline: serviceRequest.service && serviceRequest.service.category === 'online'
    });
    
    const acceptUrl = `${process.env.BASE_URL}/api/service-requests/email-accept/${serviceRequest.id}?doctorId=${doctor.id}`;
    const ignoreUrl = `${process.env.BASE_URL}/api/service-requests/email-ignore/${serviceRequest.id}?doctorId=${doctor.id}`;
    const dashboardUrl = `${process.env.FRONTEND_DASHBOARD_URL}/doctor/dashboard`;

    const scheduledTime = serviceRequest.requestedServiceDateTime 
      ? new Date(serviceRequest.requestedServiceDateTime).toLocaleString('en-GB', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      : 'As soon as possible';

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: doctor.email,
      subject: `New Service Request - ${business.businessName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Service Request - ThanksDoc</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { padding: 30px 20px; background: #f9fafb; }
            .button { 
              display: inline-block; 
              padding: 14px 28px; 
              text-decoration: none !important; 
              border-radius: 6px; 
              margin: 10px 5px; 
              font-weight: bold; 
              font-size: 16px;
              border: none;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              text-align: center;
            }
            .accept-btn { 
              background: #10b981 !important; 
              color: #ffffff !important; 
            }
            .ignore-btn { 
              background: #6b7280 !important; 
              color: #ffffff !important; 
            }
            .dashboard-btn { 
              background: #3b82f6 !important; 
              color: #ffffff !important; 
            }
            .footer { padding: 20px; text-align: center; color: #666; font-size: 14px; }
            .request-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .urgency-high { color: #dc2626; font-weight: bold; }
            .urgency-medium { color: #d97706; font-weight: bold; }
            .urgency-low { color: #059669; font-weight: bold; }
            .button-container { text-align: center; margin: 25px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🩺 New Service Request</h1>
              <p>You have received a new consultation request</p>
            </div>
            <div class="content">
              <h2>Hello Dr. ${doctor.firstName} ${doctor.lastName},</h2>
              <p>You have received a new service request from <strong>${business.businessName}</strong>.</p>
              
              <div class="request-details">
                <h3>📋 Request Details</h3>
                <p><strong>Business:</strong> ${business.businessName}</p>
                <p><strong>Location:</strong> ${locationText}</p>
                <p><strong>Service Type:</strong> ${serviceRequest.serviceType}</p>
                <p><strong>Scheduled Time:</strong> ${scheduledTime}</p>
                <p><strong>Duration:</strong> ${serviceRequest.estimatedDuration} mins</p>
                <p><strong>Distance:</strong> ${distanceText}</p>
                <p><strong>Pay:</strong> ${formattedTakeHome}</p>
                ${serviceRequest.description ? `<p><strong>Description:</strong> ${serviceRequest.description}</p>` : ''}
                ${serviceRequest.patientFirstName ? `<p><strong>Patient:</strong> ${serviceRequest.patientFirstName} ${serviceRequest.patientLastName || ''}</p>` : ''}
              </div>
              
              <div class="button-container">
                <h3>Quick Actions</h3>
                <a href="${acceptUrl}" class="button accept-btn">✅ Accept Request</a>
                <a href="${ignoreUrl}" class="button ignore-btn">❌ Ignore Request</a>
              </div>
              
              <div style="text-align: center; margin-top: 20px;">
                <p>Or view more details in your dashboard:</p>
                <a href="${dashboardUrl}" class="button dashboard-btn">🏥 Open Dashboard</a>
              </div>
              
              <div style="background: #fef3c7; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f59e0b;">
                <p><strong>⏰ Time Sensitive:</strong> Please respond to this request as soon as possible. The business is waiting for your confirmation.</p>
              </div>
              
              <p>Best regards,<br>The ThanksDoc Team</p>
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} ThanksDoc. All rights reserved.</p>
              <p>This is an automated email regarding your ThanksDoc service requests.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Service request email sent to Dr. ${doctor.firstName} ${doctor.lastName}: ${result.messageId}`);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error(`❌ Failed to send service request email to Dr. ${doctor.firstName} ${doctor.lastName}:`, error);
      throw new Error('Failed to send service request email');
    }
  }
}

module.exports = EmailService;
