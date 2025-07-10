// tests/auth-verification.test.js
'use strict';

/**
 * Authentication verification test
 * 
 * This test verifies that the authentication system correctly blocks
 * unverified doctors and businesses from logging in.
 */

// Mock strapi global
global.strapi = {
  entityService: {
    // @ts-ignore
    findMany: jest.fn(),
    // @ts-ignore
    findOne: jest.fn(),
    // @ts-ignore
    create: jest.fn(),
    // @ts-ignore
    update: jest.fn(),
    // @ts-ignore
    delete: jest.fn()
  }
};

const authController = require('../src/api/auth/controllers/auth');
// @ts-ignore
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock bcrypt and jwt
// @ts-ignore
jest.mock('bcryptjs', () => ({
  // @ts-ignore
  compare: jest.fn(),
  // @ts-ignore
  hash: jest.fn()
}));

// @ts-ignore
jest.mock('jsonwebtoken', () => ({
  // @ts-ignore
  sign: jest.fn(),
  // @ts-ignore
  verify: jest.fn()
}));

// @ts-ignore
describe('Auth Controller - Verification Tests', () => {
  let ctx;

  // @ts-ignore
  beforeEach(() => {
    // Reset mocks
    // @ts-ignore
    jest.clearAllMocks();

    // Mock context object
    ctx = {
      request: {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      },
      // @ts-ignore
      badRequest: jest.fn().mockReturnThis(),
      // @ts-ignore
      unauthorized: jest.fn().mockReturnThis(),
      // @ts-ignore
      forbidden: jest.fn().mockReturnThis(),
      // @ts-ignore
      internalServerError: jest.fn().mockReturnThis(),
      // @ts-ignore
      send: jest.fn().mockReturnThis(),
      params: {}
    };
  });

  // @ts-ignore
  describe('Doctor Login', () => {
    // @ts-ignore
    test('should reject login for unverified doctor', async () => {
      // Mock doctor in database
      const mockDoctor = {
        id: 1,
        email: 'doctor@example.com',
        password: 'hashedPassword',
        isVerified: false
      };

      // Set up strapi mock to return unverified doctor
      // @ts-ignore
      strapi.entityService.findMany.mockImplementation((entityName, options) => {
        if (entityName === 'api::doctor.doctor') {
          return [mockDoctor];
        }
        return [];
      });

      // Call login function
      await authController.login(ctx);

      // Expect forbidden response because doctor is not verified
      // @ts-ignore
      expect(ctx.forbidden).toHaveBeenCalled();
      // @ts-ignore
      expect(ctx.forbidden.mock.calls[0][0]).toContain('not verified');
      // @ts-ignore
      expect(bcrypt.compare).not.toHaveBeenCalled(); // Password check should be skipped
    });

    // @ts-ignore
    test('should allow login for verified doctor', async () => {
      // Mock doctor in database
      const mockDoctor = {
        id: 1,
        email: 'doctor@example.com',
        password: 'hashedPassword',
        isVerified: true,
        name: 'Dr. Test'
      };

      // Set up strapi mock to return verified doctor
      // @ts-ignore
      strapi.entityService.findMany.mockImplementation((entityName, options) => {
        if (entityName === 'api::doctor.doctor') {
          return [mockDoctor];
        }
        return [];
      });

      // Mock bcrypt compare to return true
      bcrypt.compare.mockResolvedValue(true);
      
      // Mock JWT sign
      // @ts-ignore
      jwt.sign.mockReturnValue('fake-token');

      // Call login function
      await authController.login(ctx);

      // Expect ctx.send to be called with token
      // @ts-ignore
      expect(ctx.send).toHaveBeenCalled();
      // @ts-ignore
      expect(bcrypt.compare).toHaveBeenCalled();
    });
  });

  // @ts-ignore
  describe('Business Login', () => {
    // @ts-ignore
    test('should reject login for unverified business', async () => {
      // Mock business in database
      const mockBusiness = {
        id: 2,
        email: 'business@example.com',
        password: 'hashedPassword',
        isVerified: false
      };

      // Set up strapi mock to return no doctors and an unverified business
      // @ts-ignore
      strapi.entityService.findMany.mockImplementation((entityName, options) => {
        if (entityName === 'api::doctor.doctor') {
          return [];
        }
        if (entityName === 'api::business.business') {
          return [mockBusiness];
        }
        return [];
      });

      // Call login function
      await authController.login(ctx);

      // Expect forbidden response because business is not verified
      // @ts-ignore
      expect(ctx.forbidden).toHaveBeenCalled();
      // @ts-ignore
      expect(ctx.forbidden.mock.calls[0][0]).toContain('not verified');
      // @ts-ignore
      expect(bcrypt.compare).not.toHaveBeenCalled(); // Password check should be skipped
    });

    // @ts-ignore
    test('should allow login for verified business', async () => {
      // Mock business in database
      const mockBusiness = {
        id: 2,
        email: 'business@example.com',
        password: 'hashedPassword',
        isVerified: true,
        name: 'Test Business'
      };

      // Set up strapi mock to return no doctors and a verified business
      // @ts-ignore
      strapi.entityService.findMany.mockImplementation((entityName, options) => {
        if (entityName === 'api::doctor.doctor') {
          return [];
        }
        if (entityName === 'api::business.business') {
          return [mockBusiness];
        }
        return [];
      });

      // Mock bcrypt compare to return true
      bcrypt.compare.mockResolvedValue(true);
      
      // Mock JWT sign
      // @ts-ignore
      jwt.sign.mockReturnValue('fake-token');

      // Call login function
      await authController.login(ctx);

      // Expect ctx.send to be called with token
      // @ts-ignore
      expect(ctx.send).toHaveBeenCalled();
      // @ts-ignore
      expect(bcrypt.compare).toHaveBeenCalled();
    });
  });
});
