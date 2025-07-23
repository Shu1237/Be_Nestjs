// Test setup file
import 'reflect-metadata';

// Mock các dependencies chung nếu cần
global.console = {
  ...console,
  // Disable console.log in tests nếu muốn
  // log: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};
