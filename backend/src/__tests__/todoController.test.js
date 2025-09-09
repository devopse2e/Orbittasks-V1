// src/__tests__/todoController.test.js

process.env.PORT = 3002;
const request = require('supertest');
const express = require('express');

jest.mock('../middleware/auth', () => ({
  protect: (req, res, next) => {
    req.user = { id: 'userId123' };
    next();
  },
}));

const todoRoutes = require('../routes/todoRoutes');
const errorHandler = require('../middleware/errorHandler');
const Todo = require('../models/todoModel');
const User = require('../models/userModel');

jest.mock('../models/todoModel');
jest.mock('../models/userModel');

const app = express();
app.use(express.json());
app.use('/api/todos', todoRoutes);
app.use(errorHandler);

describe('Todo Controller Tests', () => {
  let mockTodo;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock User.findById() with chainable select()
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
    });

    // Define a consistent mock todo object
    mockTodo = {
      _id: 'todo1',
      userId: 'userId123',
      text: 'Test Todo',
      completed: false,
      notes: 'Sample notes',
      dueDate: null,
      priority: 'Medium',
      save: jest.fn().mockResolvedValue(true),
    };

    // Mock Todo.find() with chainable sort() resolving to array
    Todo.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([mockTodo]),
    });

    // Mock Todo constructor for POST and recurrence creation
    Todo.mockImplementation(function (data) {
      const instance = {
        ...data,
        _id: data._id || 'newMockId',
        save: jest.fn().mockResolvedValue(this),
        toObject: function () { return { ...this }; },
      };
      return instance;
    });

    // Mock Todo.findOne() for PUT tests
    Todo.findOne.mockResolvedValue(mockTodo);

    // Mock Todo.findOneAndDelete() for DELETE tests
    Todo.findOneAndDelete.mockResolvedValue({ _id: 'todo1' });
  });

  describe('GET /api/todos', () => {
    it('should return todos including the created mock todo', async () => {
      const res = await request(app).get('/api/todos');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ _id: 'todo1', text: 'Test Todo' }),
        ])
      );
      expect(Todo.find).toHaveBeenCalledWith({ userId: 'userId123' });
    });

    it('should handle errors and return 500', async () => {
      Todo.find.mockReturnValueOnce({
        sort: jest.fn().mockRejectedValue(new Error('DB failure')),
      });

      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new recurring todo and calculate nextDueDate', async () => {
      const newTodoData = {
        text: 'New Task',
        notes: 'Test notes',
        dueDate: '2025-08-01T10:00:00.000Z',
        priority: 'Medium',
        category: 'Personal',
        color: '#FFFFFF',
        isRecurring: true,
        recurrencePattern: 'daily',
        recurrenceEndsAt: null,
        recurrenceInterval: 1,
        recurrenceCustomRule: '',
      };

      const res = await request(app).post('/api/todos').send(newTodoData);

      expect(res.status).toBe(201);
      expect(res.body.text).toBe(newTodoData.text);
      expect(res.body.isRecurring).toBe(true);
      expect(res.body.nextDueDate).toBeDefined();
    });

    it('should return 400 for missing or empty text', async () => {
      const invalids = [{}, { text: '' }];
      for (const payload of invalids) {
        const res = await request(app).post('/api/todos').send(payload);
        expect(res.status).toBe(400);
      }
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update todo and create next recurrence if completed', async () => {
      const updateData = { completed: true };

      // Mock the existing todo with recurrence properties
      const recurringMockTodo = {
        ...mockTodo,
        isRecurring: true,
        recurrencePattern: 'daily',
        recurrenceInterval: 1,
        dueDate: new Date().toISOString(),
        save: jest.fn().mockResolvedValue(true),
      };
      Todo.findOne.mockResolvedValueOnce(recurringMockTodo);

      const res = await request(app).put('/api/todos/todo1').send(updateData);

      expect(res.status).toBe(200);
      expect(recurringMockTodo.save).toHaveBeenCalled();
      expect(Todo).toHaveBeenCalledTimes(1); // For the next recurrence instance
      expect(res.body.completed).toBe(true);
    });

    it('should return 404 if todo not found', async () => {
      Todo.findOne.mockResolvedValue(null);

      const res = await request(app).put('/api/todos/invalidid').send({ text: 'Update' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete todo successfully', async () => {
      Todo.findOneAndDelete.mockResolvedValue({ _id: 'todo1' });

      const res = await request(app).delete('/api/todos/todo1');

      expect(res.status).toBe(204);
    });

    it('should return 404 if todo does not exist', async () => {
      Todo.findOneAndDelete.mockResolvedValue(null);

      const res = await request(app).delete('/api/todos/nonexistentid');

      expect(res.status).toBe(404);
    });
  });
});
