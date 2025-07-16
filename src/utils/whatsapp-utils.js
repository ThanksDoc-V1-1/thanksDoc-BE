'use strict';

/**
 * Utility functions for WhatsApp integration
 */

class WhatsAppUtils {
  /**
   * Format phone number for WhatsApp API
   * Ensures proper country code and WhatsApp format
   */
  static formatPhoneNumber(phone) {
    if (!phone) return null;

    // Remove any existing whatsapp: prefix
    let cleanPhone = phone.replace('whatsapp:', '');
    
    // Remove any non-digit characters except +
    cleanPhone = cleanPhone.replace(/[^\d+]/g, '');
    
    // Add + if not present and doesn't start with it
    if (!cleanPhone.startsWith('+')) {
      // Assume it's a US number if no country code and exactly 10 digits
      if (cleanPhone.length === 10) {
        cleanPhone = '+1' + cleanPhone;
      } else if (cleanPhone.length > 10) {
        // Assume the first digits are country code
        cleanPhone = '+' + cleanPhone;
      } else {
        throw new Error(`Invalid phone number format: ${phone}`);
      }
    }
    
    return cleanPhone;
  }

  /**
   * Format phone number for WhatsApp Business API (no + prefix)
   */
  static formatPhoneForAPI(phone) {
    const formattedPhone = this.formatPhoneNumber(phone);
    // Remove + for WhatsApp Business API
    return formattedPhone.replace('+', '');
  }

  /**
   * Validate phone number format
   */
  static isValidPhoneNumber(phone) {
    try {
      const formatted = this.formatPhoneNumber(phone);
      return formatted && formatted.length >= 10 && formatted.length <= 15;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get country code from phone number
   */
  static getCountryCode(phone) {
    const formatted = this.formatPhoneNumber(phone);
    if (!formatted) return null;

    // Extract country code (everything after + until first digit that makes it too long)
    const digits = formatted.substring(1); // Remove +
    
    // Common country codes
    if (digits.startsWith('1')) return '+1'; // US/Canada
    if (digits.startsWith('44')) return '+44'; // UK
    if (digits.startsWith('91')) return '+91'; // India
    if (digits.startsWith('86')) return '+86'; // China
    
    // Default to first 1-3 digits as country code
    return '+' + digits.substring(0, 2);
  }

  /**
   * Bulk format phone numbers for multiple doctors
   */
  static async formatDoctorPhoneNumbers(strapi) {
    try {
      const doctors = await strapi.entityService.findMany('api::doctor.doctor', {
        populate: false,
      });

      const updates = [];
      
      for (const doctor of doctors) {
        if (doctor.phone) {
          try {
            const formattedPhone = this.formatPhoneNumber(doctor.phone);
            if (formattedPhone !== doctor.phone) {
              updates.push({
                id: doctor.id,
                oldPhone: doctor.phone,
                newPhone: formattedPhone
              });
            }
          } catch (error) {
            console.warn(`Invalid phone number for doctor ${doctor.id}: ${doctor.phone}`);
          }
        }
      }

      console.log(`Found ${updates.length} phone numbers to update`);
      
      for (const update of updates) {
        await strapi.entityService.update('api::doctor.doctor', update.id, {
          data: {
            phone: update.newPhone
          }
        });
        console.log(`Updated doctor ${update.id}: ${update.oldPhone} → ${update.newPhone}`);
      }

      return {
        total: doctors.length,
        updated: updates.length,
        updates
      };
    } catch (error) {
      console.error('Error formatting doctor phone numbers:', error);
      throw error;
    }
  }

  /**
   * Test WhatsApp connectivity for a phone number
   */
  static async testWhatsAppConnectivity(phone, twilioClient) {
    try {
      const formattedPhone = `whatsapp:${this.formatPhoneNumber(phone)}`;
      
      // Send a simple test message
      const message = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: formattedPhone,
        body: '🧪 WhatsApp connectivity test from ThanksDoc. Please ignore this message.'
      });

      return {
        success: true,
        sid: message.sid,
        phone: formattedPhone
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        phone: phone
      };
    }
  }

  /**
   * Generate WhatsApp deep link for manual testing
   */
  static generateWhatsAppLink(phone, message) {
    const formattedPhone = this.formatPhoneNumber(phone);
    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${formattedPhone.substring(1)}?text=${encodedMessage}`;
  }
}

module.exports = WhatsAppUtils;
