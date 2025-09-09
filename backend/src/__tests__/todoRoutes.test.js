// src/__tests__/todoRoutes.test.js

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

describe('Todo Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock User.findById() with chainable select()
    User.findById.mockReturnValue({
      select: jest.fn().mockResolvedValue({ timezone: 'UTC' }),
    });

    // Mock Todo.find() with chainable sort() for GET tests
    Todo.find.mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        {
          _id: 'mockId',
          text: 'Test Todo',
          priority: 'Medium',
          completed: false,
          notes: 'Some notes',
          dueDate: null,
        },
      ]),
    });

    // Mock Todo constructor for POST tests
    Todo.mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({
        _id: 'newMockId',
        userId: data.userId,
        text: data.text,
        notes: data.notes || '',
        dueDate: data.dueDate || null,
        priority: data.priority || 'Medium',
        category: data.category || 'Personal',
        color: data.color || '#FFFFFF',
        isRecurring: data.isRecurring || false,
        recurrencePattern: data.recurrencePattern || 'none',
        recurrenceEndsAt: data.recurrenceEndsAt || null,
        recurrenceInterval: data.recurrenceInterval || 1,
        recurrenceCustomRule: data.recurrenceCustomRule || '',
        nextDueDate: data.nextDueDate || null,
        completed: false,
        completedAt: null,
      }),
    }));

    // Mock Todo.findOne() with chainable save() for PUT tests
    Todo.findOne.mockResolvedValue({
      _id: 'mockId',
      text: 'Test Todo',
      priority: 'Medium',
      completed: false,
      notes: 'Some notes',
      dueDate: null,
      save: jest.fn().mockResolvedValue({
        _id: 'mockId',
        text: 'Updated Todo',
        priority: 'High',
        completed: true,
        notes: 'Updated notes',
        dueDate: null,
      }),
    });

    // Mock Todo.findOneAndDelete() for DELETE tests
    Todo.findOneAndDelete.mockResolvedValue({
      _id: 'mockId',
      text: 'Test Todo',
    });

    // Mock findByIdAndUpdate and findByIdAndDelete if used (though not in provided controller)
    Todo.findByIdAndUpdate = jest.fn().mockResolvedValue({
      _id: 'mockId',
      text: 'Updated Todo',
      priority: 'High',
      completed: true,
      notes: 'Updated notes',
      dueDate: '2025-07-24T12:03:00.000Z',
    });
    Todo.findByIdAndDelete = jest.fn().mockResolvedValue({
      _id: 'mockId',
      text: 'Test Todo',
    });
  });

  describe('GET /api/todos', () => {
    it('should get todos for logged-in user', async () => {
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('text', 'Test Todo');
    });

    it('should return 500 if DB error happens', async () => {
      Todo.find.mockReturnValueOnce({
        sort: jest.fn().mockRejectedValue(new Error('DB failure')),
      });
      const res = await request(app).get('/api/todos');
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const newTodo = {
        text: 'New Todo',
        notes: 'Some notes',
        priority: 'Medium',
        dueDate: '2025-08-01T10:00:00.000Z',
        category: 'Personal',
        color: '#FFFFFF',
        recurrencePattern: 'none',
      };
      const res = await request(app).post('/api/todos').send(newTodo);
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('text', newTodo.text);
      expect(res.body).toHaveProperty('priority', newTodo.priority);
    });

    it('should return 400 on invalid input', async () => {
      const res = await request(app).post('/api/todos').send({ text: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/todos/:id', () => {
    it('should update an existing todo', async () => {
      const updateData = { text: 'Updated Todo', completed: true, notes: 'Updated notes', priority: 'High' };
      const res = await request(app).put('/api/todos/mockId').send(updateData);
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('text', updateData.text);
      expect(res.body).toHaveProperty('completed', true);
    });

    it('should return 404 if todo not found', async () => {
      Todo.findOne.mockResolvedValueOnce(null);
      const res = await request(app).put('/api/todos/invalidId').send({ text: 'Update' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/todos/:id', () => {
    it('should delete an existing todo', async () => {
      const res = await request(app).delete('/api/todos/mockId');
      expect(res.status).toBe(204);
    });

    it('should return 404 if todo does not exist', async () => {
      Todo.findOneAndDelete.mockResolvedValueOnce(null);
      const res = await request(app).delete('/api/todos/invalidId');
      expect(res.status).toBe(404);
    });
  });
});
