// src/setupTests.js

import '@testing-library/jest-dom';

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
