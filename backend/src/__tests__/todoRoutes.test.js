const request = require('supertest');
const express = require('express');
const cors = require('cors');
const todoRoutes = require('../routes/todoRoutes');
const Todo = require('../models/todoModel'); // Import for mocking

// Enhanced mock for Todo model
jest.mock('../models/todoModel', () => {
  const mockQuery = {
    sort: jest.fn().mockReturnThis(),
    exec: jest.fn()
  };
  const mockTodo = jest.fn(function (data) {
    const instance = { ...data, _id: 'mockId', completed: false };
    instance.save = jest.fn().mockResolvedValue(instance);
    return instance;
  });
  mockTodo.find = jest.fn().mockReturnValue({
    ...mockQuery,
    then: (resolve) => resolve([])
  });
  mockTodo.findByIdAndUpdate = jest.fn().mockResolvedValue(null);
  mockTodo.findByIdAndDelete = jest.fn().mockResolvedValue(null);
  return mockTodo;
});

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/todos', todoRoutes);

describe('Todo Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/todos should work', async () => {
    Todo.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        then: (resolve) => resolve([])
      })
    });
    const response = await request(app).get('/api/todos');
    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
  });

  test('POST /api/todos should validate input', async () => {
    const response = await request(app).post('/api/todos').send({ text: 'A'.repeat(101) });
    expect(response.status).toBe(400);
  });

  test('Full CRUD flow should work with all fields', async () => {
    const mockTodo = {
      _id: 'mockId',
      text: 'Integration test todo',
      notes: 'integration notes',
      completed: false,
      priority: 'Medium',
      dueDate: '2025-07-23T12:03:00.000Z'
    };

    Todo.mockReturnValueOnce({
      save: jest.fn().mockResolvedValue(mockTodo)
    });

    const createResponse = await request(app)
      .post('/api/todos')
      .send({
        text: 'Integration test todo',
        notes: 'integration notes',
        dueDate: '2025-07-23T12:03:00.000Z',
        priority: 'Medium'
      });
    expect(createResponse.status).toBe(201);

    const todoId = createResponse.body._id;

    Todo.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        then: (resolve) => resolve([mockTodo])
      })
    });
    const getResponse = await request(app).get('/api/todos');
    expect(getResponse.status).toBe(200);
    expect(getResponse.body).toHaveLength(1);

    const updatedTodo = { ...mockTodo, text: 'Updated integration test todo', completed: true, notes: 'updated notes', priority: 'High' };
    Todo.findByIdAndUpdate.mockResolvedValueOnce(updatedTodo);
    const updateResponse = await request(app)
      .put(`/api/todos/${todoId}`)
      .send({ text: 'Updated integration test todo', completed: true, notes: 'updated notes', priority: 'High' });
    expect(updateResponse.status).toBe(200);

    Todo.findByIdAndDelete.mockResolvedValueOnce(mockTodo);
    const deleteResponse = await request(app).delete(`/api/todos/${todoId}`);
    expect(deleteResponse.status).toBe(204);

    Todo.find.mockReturnValueOnce({
      sort: jest.fn().mockReturnValueOnce({
        then: (resolve) => resolve([])
      })
    });
    const finalGetResponse = await request(app).get('/api/todos');
    expect(finalGetResponse.status).toBe(200);
    expect(finalGetResponse.body).toHaveLength(0);
  });
});
