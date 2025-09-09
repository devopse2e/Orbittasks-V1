// src/__tests__/useTodosContext.test.js
import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { TodosProvider, useTodosContext } from '../context/TodosContext';
import { AuthContext } from '../context/AuthContext';
import { todoService } from '../services/api';

jest.mock('../services/api', () => ({
  todoService: {
    getTodos: jest.fn(),
    createTodo: jest.fn(),
    updateTodo: jest.fn(),
    deleteTodo: jest.fn(),
  },
}));

// Mock user data for AuthContext
const mockUser = { isGuest: false, timezone: 'UTC' };

// Mock AuthProvider to provide user context needed by TodosProvider
const MockAuthProvider = ({ children }) => {
  return (
    <AuthContext.Provider value={{ user: mockUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Compose wrapper to include AuthProvider and TodosProvider
const wrapper = ({ children }) => (
  <MockAuthProvider>
    <TodosProvider>{children}</TodosProvider>
  </MockAuthProvider>
);

describe('TodosContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches todos on mount and updates loading state', async () => {
    todoService.getTodos.mockResolvedValue([{ _id: '1', text: 'Test Todo' }]);
    const { result } = renderHook(() => useTodosContext(), { wrapper });

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.todos).toHaveLength(1);
      expect(result.current.todos[0].text).toBe('Test Todo');
    });

    expect(todoService.getTodos).toHaveBeenCalledTimes(1);
  });

  it('handles fetch error', async () => {
    const error = new Error('Fetch failed');
    todoService.getTodos.mockRejectedValue(error);

    const { result } = renderHook(() => useTodosContext(), { wrapper });

    await waitFor(() => {
      expect(result.current.error).toBe(error);
      expect(result.current.todos).toHaveLength(0);
      expect(result.current.loading).toBe(false);
    });
  });

  it('adds a todo for authenticated user', async () => {
    todoService.getTodos.mockResolvedValue([]);
    const newTodo = { _id: '2', text: 'New Todo' };
    todoService.createTodo.mockResolvedValue(newTodo);

    const { result } = renderHook(() => useTodosContext(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addTodo({ text: 'New Todo' });
    });

    expect(result.current.todos[0]).toEqual(newTodo);
    expect(todoService.createTodo).toHaveBeenCalledWith({ text: 'New Todo' });
  });

  it('handles addTodo error', async () => {
    todoService.getTodos.mockResolvedValue([]);
    const error = new Error('Add failed');
    todoService.createTodo.mockRejectedValue(error);

    const { result } = renderHook(() => useTodosContext(), { wrapper });

    await waitFor(() => expect(result.current.loading).toBe(false));

    await act(async () => {
      await result.current.addTodo({ text: 'Fail Todo' });
    });

    expect(result.current.error).toBe(error);
  });

  it('toggles a todo completion for authenticated user', async () => {
  const todo = { _id: '3', completed: false, text: 'Toggle Todo' };
  const updatedTodo = { ...todo, completed: true };

  // Initially return todo
  todoService.getTodos.mockResolvedValue([todo]);
  // Update returns updated todo
  todoService.updateTodo.mockResolvedValue(updatedTodo);
  // Fetch after toggle returns updated list
  todoService.getTodos.mockResolvedValueOnce([todo]);
  todoService.getTodos.mockResolvedValueOnce([updatedTodo]);

  const { result } = renderHook(() => useTodosContext(), { wrapper });

  await waitFor(() => expect(result.current.todos.length).toBe(1));

  await act(async () => {
    await result.current.toggleTodo('3', true);
  });

  await waitFor(() => {
    expect(result.current.todos[0].completed).toBe(true);
  });

  expect(todoService.updateTodo).toHaveBeenCalledWith('3', expect.objectContaining({ completed: true }));
});


  it('deletes a todo for authenticated user', async () => {
    const todo = { _id: '5', text: 'Delete Me' };
    todoService.getTodos.mockResolvedValue([todo]);
    todoService.deleteTodo.mockResolvedValue();

    const { result } = renderHook(() => useTodosContext(), { wrapper });

    await waitFor(() => expect(result.current.todos).toHaveLength(1));

    await act(async () => {
      await result.current.deleteTodo('5');
    });

    expect(result.current.todos.find(t => t._id === '5')).toBeUndefined();
    expect(todoService.deleteTodo).toHaveBeenCalledWith('5');
  });

  it('handles deleteTodo error', async () => {
    const todo = { _id: '6', text: 'Cannot Delete' };
    todoService.getTodos.mockResolvedValue([todo]);
    const error = new Error('Delete failed');
    todoService.deleteTodo.mockRejectedValue(error);

    const { result } = renderHook(() => useTodosContext(), { wrapper });

    await waitFor(() => expect(result.current.todos).toHaveLength(1));

    await act(async () => {
      try {
        await result.current.deleteTodo('6');
      } catch {
        // Expected error ignored
      }
    });

    expect(result.current.error).toBe(error);
  });

  // Add more tests as needed...
});
