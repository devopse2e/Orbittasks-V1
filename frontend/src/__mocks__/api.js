// src/__mocks__/api.js

export const todoService = {
  getTodos: jest.fn().mockResolvedValue([]),
  createTodo: jest.fn().mockResolvedValue({ _id: 'mockId', text: 'New Todo', notes: '', priority: 'Medium', dueDate: null, completed: false }),
  updateTodo: jest.fn().mockResolvedValue({ _id: 'mockId', text: 'Updated Todo' }),
  deleteTodo: jest.fn().mockResolvedValue(true),
};
