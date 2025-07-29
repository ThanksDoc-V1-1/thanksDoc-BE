'use strict';

/**
 * doctor-payment service
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::doctor-payment.doctor-payment');
