process.env.PORT = 3003;

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../server');

jest.mock('mongoose', () => {
  const bcrypt = require('bcryptjs'); // or mock bcrypt as well if needed

  const ObjectId = function () {};

  function Schema(obj) {
    // Add 'methods' as an empty object to attach instance methods
    return {
      obj,
      methods: {},
      statics: {},
      _indexes: [],
      index: jest.fn(function(fields, options) {
        this._indexes.push({ fields, options });
        return this;
      }),
      pre: jest.fn(function (hook, callback) {
        return this; // to support chaining
      }),
      post: jest.fn(function (hook, callback) {
        return this;
      }),
    };
  }

  Schema.Types = {
    ObjectId,
  };

  const model = jest.fn(() => {
    return {
      find: jest.fn(),
      findOne: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      save: jest.fn(),
      // Attach methods or statics as needed
    };
  });

  return {
    Schema,
    Types: Schema.Types,
    model,
    connect: jest.fn(() => Promise.resolve()),
    connection: {
      readyState: 1,
      close: jest.fn(),
    },
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
