// src/__tests__/api.test.js

import { todoService } from '../services/api';

describe('todoService', () => {
  const mockTodo = { _id: '1', text: 'Test' };
  const mockTodos = [mockTodo];

  afterEach(() => {
    jest.restoreAllMocks(); // Restore original methods after each test
  });

  it('gets todos successfully', async () => {
    jest.spyOn(todoService, 'getTodos').mockResolvedValue(mockTodos);

    const result = await todoService.getTodos();
    expect(result).toEqual(mockTodos);
  });

  it('handles get todos error', async () => {
    jest.spyOn(todoService, 'getTodos').mockRejectedValue(new Error('Network error'));
    await expect(todoService.getTodos()).rejects.toThrow('Network error');
  });

  it('creates a todo successfully', async () => {
    jest.spyOn(todoService, 'createTodo').mockResolvedValue(mockTodo);

    const result = await todoService.createTodo(mockTodo);
    expect(result).toEqual(mockTodo);
  });

  it('handles create todo error', async () => {
    jest.spyOn(todoService, 'createTodo').mockRejectedValue(new Error('Network error'));
    await expect(todoService.createTodo(mockTodo)).rejects.toThrow('Network error');
  });

  it('updates a todo successfully', async () => {
    jest.spyOn(todoService, 'updateTodo').mockResolvedValue(mockTodo);

    const result = await todoService.updateTodo('1', { text: 'Updated' });
    expect(result).toEqual(mockTodo);
  });

  it('handles update todo error', async () => {
    jest.spyOn(todoService, 'updateTodo').mockRejectedValue(new Error('Network error'));
    await expect(todoService.updateTodo('1', { text: 'Updated' })).rejects.toThrow('Network error');
  });

  it('deletes a todo successfully', async () => {
    jest.spyOn(todoService, 'deleteTodo').mockResolvedValue(true);

    const result = await todoService.deleteTodo('1');
    expect(result).toBe(true);
  });

  it('handles delete todo error', async () => {
    jest.spyOn(todoService, 'deleteTodo').mockRejectedValue(new Error('Network error'));
    await expect(todoService.deleteTodo('1')).rejects.toThrow('Network error');
  });
});
