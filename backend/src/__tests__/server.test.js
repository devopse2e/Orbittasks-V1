process.env.PORT = 3003;

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

// Comprehensive mock for mongoose to prevent real connections and schema errors
jest.mock('mongoose', () => {
  const mockSchema = jest.fn().mockImplementation(() => ({
    pre: jest.fn().mockReturnThis(), // Simulate pre() method
    post: jest.fn().mockReturnThis() // If needed for other hooks
  }));
  const mockModel = jest.fn().mockReturnValue({
    find: jest.fn(),
    findByIdAndUpdate: jest.fn(),
    findByIdAndDelete: jest.fn(),
    prototype: { save: jest.fn() }
  });
  return {
    connect: jest.fn().mockResolvedValue({}),
    Schema: mockSchema,
    model: mockModel,
    connection: { readyState: 0, close: jest.fn() } // Mock for teardown
  };
});


describe('Server Health Checks', () => {
  test('GET /health should return health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('OK');
    expect(response.body.uptime).toBeDefined();
  });

  test('GET /ready should return ready status', async () => {
    const response = await request(app).get('/ready');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Ready');
  });

  test('GET /nonexistent should return 404', async () => {
    const response = await request(app).get('/nonexistent');
    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Route not found');
  });
});
