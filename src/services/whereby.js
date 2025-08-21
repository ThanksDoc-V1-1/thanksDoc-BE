// @ts-nocheck
'use strict';

/**
 * Whereby Video Service
 * Handles video call room creation and management for online consultations
 */

const axios = require('axios');

class WherebyService {
  constructor() {
    this.apiKey = process.env.WHEREBY_API_KEY;
    this.baseURL = 'https://api.whereby.dev/v1';
    
    if (!this.apiKey) {
      console.warn('⚠️ WHEREBY_API_KEY not found in environment variables. Video calls will not work.');
    }
  }

  /**
   * Create a video meeting room for a consultation
   * @param {Object} options - Meeting configuration
   * @returns {Promise<Object>} Meeting details with room URL
   */
  async createMeeting({
    startDate,
    endDate,
    roomNamePrefix = 'consultation',
    meetingId = null
  }) {
    try {
      if (!this.apiKey) {
        throw new Error('Whereby API key not configured');
      }

      const meetingName = meetingId || `${roomNamePrefix}-${Date.now()}`;
      
      // Calculate duration in seconds (minimum 30 minutes for consultations)
      const start = new Date(startDate);
      const end = new Date(endDate);
      const durationMs = end.getTime() - start.getTime();
      const durationMinutes = Math.max(30, Math.ceil(durationMs / (1000 * 60))); // Minimum 30 minutes

      const payload = {
        isLocked: false, // Allow participants to join
        roomNamePrefix: meetingName,
        roomMode: 'normal', // Standard room mode
        startDate: start.toISOString(),
        endDate: new Date(start.getTime() + (durationMinutes * 60 * 1000)).toISOString(),
        fields: ['hostRoomUrl', 'viewerRoomUrl', 'roomUrl']
      };

      ('🎥 Creating Whereby meeting with payload:', payload);

      const response = await axios.post(`${this.baseURL}/meetings`, payload, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      const meeting = response.data;
      
      ('✅ Whereby meeting created successfully:', {
        meetingId: meeting.meetingId,
        roomUrl: meeting.roomUrl,
        startDate: meeting.startDate,
        endDate: meeting.endDate
      });

      return {
        meetingId: meeting.meetingId,
        roomUrl: meeting.roomUrl,
        hostRoomUrl: meeting.hostRoomUrl, // For the doctor
        viewerRoomUrl: meeting.viewerRoomUrl, // For the patient (if different)
        startDate: meeting.startDate,
        endDate: meeting.endDate
      };

    } catch (error) {
      console.error('❌ Error creating Whereby meeting:', error.response?.data || error.message);
      
      // Return a fallback object for development
      if (process.env.NODE_ENV === 'development') {
        ('🔧 Development mode: Returning mock meeting data');
        const meetingId = meetingId || `mock-${Date.now()}`;
        return {
          meetingId,
          roomUrl: `https://whereby.com/${meetingId}`,
          hostRoomUrl: `https://whereby.com/${meetingId}?host=true`,
          viewerRoomUrl: `https://whereby.com/${meetingId}`,
          startDate: startDate,
          endDate: endDate
        };
      }
      
      throw error;
    }
  }

  /**
   * Delete a video meeting
   * @param {string} meetingId - The meeting ID to delete
   * @returns {Promise<boolean>} Success status
   */
  async deleteMeeting(meetingId) {
    try {
      if (!this.apiKey) {
        ('🔧 Development mode: Mock deleting meeting', meetingId);
        return true;
      }

      await axios.delete(`${this.baseURL}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      ('✅ Whereby meeting deleted successfully:', meetingId);
      return true;

    } catch (error) {
      console.error('❌ Error deleting Whereby meeting:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get meeting details
   * @param {string} meetingId - The meeting ID
   * @returns {Promise<Object>} Meeting details
   */
  async getMeeting(meetingId) {
    try {
      if (!this.apiKey) {
        throw new Error('Whereby API key not configured');
      }

      const response = await axios.get(`${this.baseURL}/meetings/${meetingId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      return response.data;

    } catch (error) {
      console.error('❌ Error getting Whereby meeting:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Create a consultation meeting for a service request
   * @param {Object} serviceRequest - The service request object
   * @returns {Promise<Object>} Meeting details
   */
  async createConsultationMeeting(serviceRequest) {
    try {
      const startDate = serviceRequest.requestedServiceDateTime || new Date();
      const endDate = new Date(new Date(startDate).getTime() + (60 * 60 * 1000)); // 1 hour default
      
      const meetingId = `consultation-${serviceRequest.id}-${Date.now()}`;
      
      const meeting = await this.createMeeting({
        startDate,
        endDate,
        roomNamePrefix: 'consultation',
        meetingId
      });

      ('🎥 Created consultation meeting for service request:', serviceRequest.id);
      
      return meeting;

    } catch (error) {
      console.error('❌ Error creating consultation meeting for service request:', serviceRequest.id, error.message);
      throw error;
    }
  }
}

module.exports = WherebyService;
