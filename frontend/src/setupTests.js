// src/setupTests.js

import '@testing-library/jest-dom';

// Polyfill TextEncoder and TextDecoder for Jest (fixes ReferenceError)
import { TextEncoder, TextDecoder } from 'util';

if (typeof global.TextEncoder === 'undefined') {
  global.TextEncoder = TextEncoder;
}

if (typeof global.TextDecoder === 'undefined') {
  global.TextDecoder = TextDecoder;
}

// Mock global fetch for API calls
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ data: [] })
  })
);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
  jest.resetAllMocks();
  jest.resetModules(); // Resets module state for hooks like useTodos
});
