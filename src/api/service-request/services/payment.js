'use strict';

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_your_test_key_here');

module.exports = ({ strapi }) => ({
  
  async createPaymentIntent(amount, currency = 'usd', customerId = null) {
    try {
      const paymentIntentData = {
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true,
        },
      };

      if (customerId) {
        paymentIntentData.customer = customerId;
      }

      const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
      
      return paymentIntent;
    } catch (error) {
      strapi.log.error('Error creating payment intent:', error);
      throw error;
    }
  },

  async createCustomer(email, name, metadata = {}) {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata,
      });
      
      return customer;
    } catch (error) {
      strapi.log.error('Error creating customer:', error);
      throw error;
    }
  },

  async confirmPayment(paymentIntentId) {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      strapi.log.error('Error confirming payment:', error);
      throw error;
    }
  },

  async refundPayment(paymentIntentId, amount = null) {
    try {
      const refundData = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await stripe.refunds.create(refundData);
      return refund;
    } catch (error) {
      strapi.log.error('Error creating refund:', error);
      throw error;
    }
  },

  async processServicePayment(serviceRequestId) {
    try {
      const serviceRequest = await strapi.entityService.findOne(
        'api::service-request.service-request',
        serviceRequestId,
        {
          populate: ['business', 'doctor'],
        }
      );

      if (!serviceRequest) {
        throw new Error('Service request not found');
      }

      if (!serviceRequest.business || !serviceRequest.doctor) {
        throw new Error('Business or doctor information missing');
      }

      // Create payment intent
      const paymentIntent = await this.createPaymentIntent(
        serviceRequest.totalAmount,
        'usd',
        serviceRequest.business.stripeCustomerId
      );

      // Update service request with payment intent
      await strapi.entityService.update(
        'api::service-request.service-request',
        serviceRequestId,
        {
          data: {
            paymentIntentId: paymentIntent.id,
          },
        }
      );

      return paymentIntent;
    } catch (error) {
      strapi.log.error('Error processing service payment:', error);
      throw error;
    }
  },

  async handlePaymentSuccess(paymentIntentId) {
    try {
      // Find service request by payment intent ID
      const serviceRequests = await strapi.entityService.findMany(
        'api::service-request.service-request',
        {
          filters: {
            paymentIntentId,
          },
        }
      );

      if (serviceRequests.length === 0) {
        throw new Error('Service request not found for payment intent');
      }

      const serviceRequest = serviceRequests[0];

      // Update payment status
      await strapi.entityService.update(
        'api::service-request.service-request',
        serviceRequest.id,
        {
          data: {
            paymentStatus: 'paid',
          },
        }
      );

      return serviceRequest;
    } catch (error) {
      strapi.log.error('Error handling payment success:', error);
      throw error;
    }
  },

});
