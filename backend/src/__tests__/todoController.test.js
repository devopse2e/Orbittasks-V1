process.env.PORT = 3002;

const request = require('supertest');
const express = require('express');
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
app.use(express.json());
app.use('/api/todos', todoRoutes);

describe('Todo Controller Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/todos', () => {
    test('should return empty array initially', async () => {
      Todo.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          then: (resolve) => resolve([])
        })
      });
      const response = await request(app).get('/api/todos');
      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });

    test('should return all todos', async () => {
      const mockTodos = [
        {
          _id: 'mockId',
          text: 'Test todo',
          completed: false,
          notes: 'test notes',
          dueDate: null,
          priority: 'High'
        }
      ];
      Todo.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          then: (resolve) => resolve(mockTodos)
        })
      });
      const response = await request(app).get('/api/todos');
      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].text).toBe('Test todo');
      expect(response.body[0].priority).toBe('High');
    });
  });

  describe('POST /api/todos', () => {
    test('should create a new todo with full fields', async () => {
      const newTodo = {
        text: 'Test todo',
        notes: 'Some notes',
        dueDate: '2025-07-23T12:03:00.000Z',
        priority: 'Medium'
      };

      Todo.mockReturnValueOnce({
        ...newTodo,
        _id: 'mockId',
        completed: false,
        save: jest.fn().mockResolvedValueOnce({
          _id: 'mockId',
          text: 'Test todo',
          notes: 'Some notes',
          dueDate: '2025-07-23T12:03:00.000Z',
          priority: 'Medium',
          completed: false
        })
      });

      const response = await request(app).post('/api/todos').send(newTodo);
      expect(response.status).toBe(201);
      expect(response.body.text).toBe('Test todo');
      expect(response.body.notes).toBe('Some notes');
      expect(response.body.priority).toBe('Medium');
      expect(response.body.dueDate).toBe('2025-07-23T12:03:00.000Z');
      expect(response.body._id).toBeDefined();
    });

    test('should return 400 for invalid todo', async () => {
      const response = await request(app).post('/api/todos').send({ text: '' });
      expect(response.status).toBe(400);
    });

    test('should return 400 for missing text', async () => {
      const response = await request(app).post('/api/todos').send({});
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/todos/:id', () => {
    test('should update existing todo', async () => {
      const mockTodo = {
        _id: 'mockId',
        text: 'Test todo',
        completed: false,
        notes: 'Some notes',
        dueDate: '2025-07-23T12:03:00.000Z',
        priority: 'Medium'
      };

      Todo.findByIdAndUpdate.mockResolvedValueOnce({
        ...mockTodo,
        text: 'Updated todo',
        completed: true,
        notes: 'Updated notes',
        dueDate: '2025-07-24T12:03:00.000Z',
        priority: 'Low'
      });

      const response = await request(app)
        .put('/api/todos/mockId')
        .send({
          text: 'Updated todo',
          completed: true,
          notes: 'Updated notes',
          dueDate: '2025-07-24T12:03:00.000Z',
          priority: 'Low'
        });
      expect(response.status).toBe(200);
      expect(response.body.text).toBe('Updated todo');
      expect(response.body.completed).toBe(true);
      expect(response.body.notes).toBe('Updated notes');
      expect(response.body.priority).toBe('Low');
    });

    test('should return 404 for non-existent todo', async () => {
      Todo.findByIdAndUpdate.mockResolvedValueOnce(null);
      const response = await request(app).put('/api/todos/9999').send({ text: 'Updated todo' });
      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    test('should delete existing todo', async () => {
      Todo.findByIdAndDelete.mockResolvedValueOnce({ _id: 'mockId' });

      const deleteResponse = await request(app).delete('/api/todos/mockId');
      expect(deleteResponse.status).toBe(204);

      Todo.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnValueOnce({
          then: (resolve) => resolve([])
        })
      });
      const getResponse = await request(app).get('/api/todos');
      expect(getResponse.status).toBe(200);
      expect(Array.isArray(getResponse.body)).toBe(true);
      expect(getResponse.body).toHaveLength(0);
    });

    test('should return 404 for non-existent todo', async () => {
      Todo.findByIdAndDelete.mockResolvedValueOnce(null);
      const response = await request(app).delete('/api/todos/9999');
      expect(response.status).toBe(404);
    });
  });
});
