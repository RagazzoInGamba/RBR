// Jest setup file
// Loaded before each test suite

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.NEXTAUTH_URL = 'http://localhost:3001';
process.env.NEXTAUTH_SECRET = 'test-secret-key-for-jest';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  // Uncomment to suppress logs during tests
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  error: jest.fn(), // Keep error visible
};
