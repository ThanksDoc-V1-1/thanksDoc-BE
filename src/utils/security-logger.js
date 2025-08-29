'use strict';

/**
 * Security Logger Utility
 * Logs security-related events for audit and monitoring
 */

class SecurityLogger {
  
  /**
   * Log WhatsApp security events
   */
  static async logWhatsAppSecurity(event, details) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      event,
      details,
      severity: this.getSeverityLevel(event)
    };
    
    console.log(`🔐 SECURITY LOG [${logEntry.severity}]: ${event}`);
    console.log(`📅 Time: ${timestamp}`);
    console.log(`📋 Details:`, JSON.stringify(details, null, 2));
    
    // In production, you might want to save to a dedicated security audit table
    try {
      await strapi.entityService.create('api::security-log.security-log', {
        data: {
          event,
          category: 'whatsapp',
          severity: logEntry.severity,
          details: JSON.stringify(details),
          timestamp: new Date(),
          publishedAt: new Date()
        }
      }).catch(error => {
        // If security log table doesn't exist, just console log
        console.log('📝 Security log (table not found, console only):', logEntry);
      });
    } catch (error) {
      console.log('📝 Security log (console only):', logEntry);
    }
  }
  
  /**
   * Log service request acceptance events
   */
  static async logServiceRequestAcceptance(method, serviceRequestId, doctorId, additional = {}) {
    await this.logWhatsAppSecurity('SERVICE_REQUEST_ACCEPTED', {
      method, // 'dashboard', 'whatsapp_button', 'whatsapp_text', 'email'
      serviceRequestId,
      doctorId,
      ...additional
    });
  }
  
  /**
   * Log suspicious activity
   */
  static async logSuspiciousActivity(type, details) {
    await this.logWhatsAppSecurity('SUSPICIOUS_ACTIVITY', {
      type,
      ...details
    });
  }
  
  /**
   * Log security violations
   */
  static async logSecurityViolation(violation, details) {
    await this.logWhatsAppSecurity('SECURITY_VIOLATION', {
      violation,
      ...details
    });
  }
  
  /**
   * Get severity level based on event type
   */
  static getSeverityLevel(event) {
    const highSeverity = ['SECURITY_VIOLATION', 'SUSPICIOUS_ACTIVITY', 'AUTO_ACCEPTANCE_PREVENTED'];
    const mediumSeverity = ['SERVICE_REQUEST_ACCEPTED', 'INVALID_MESSAGE_STRUCTURE'];
    
    if (highSeverity.includes(event)) return 'HIGH';
    if (mediumSeverity.includes(event)) return 'MEDIUM';
    return 'LOW';
  }
}

module.exports = SecurityLogger;
