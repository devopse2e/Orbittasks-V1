// src/__tests__/useTodos.test.js

import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react'; // Import from 'react' to fix deprecation warning
import { useTodos } from '../hooks/useTodos';
import { todoService } from '../services/api';

// Mock todoService
jest.mock('../services/api', () => ({
  todoService: {
    getTodos: jest.fn(),
    createTodo: jest.fn(),
    updateTodo: jest.fn(),
    deleteTodo: jest.fn(),
  },
}));

describe('useTodos', () => {
  it('loads todos on mount', async () => {
    todoService.getTodos.mockResolvedValue([{ _id: '1', text: 'Test' }]);
    const { result } = renderHook(() => useTodos());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.todos).toHaveLength(1);
      expect(result.current.loading).toBe(false);
    });
  });

  it('handles error on load', async () => {
    const mockError = new Error('Fetch error');
    todoService.getTodos.mockRejectedValue(mockError);
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.error).toBe('Fetch error');
      expect(result.current.loading).toBe(false);
    });
  });

  it('adds a todo', async () => {
    todoService.getTodos.mockResolvedValue([]);
    todoService.createTodo.mockResolvedValue({ _id: '2', text: 'New' });
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.todos).toHaveLength(0);
    });

    await act(async () => {
      await result.current.addTodo({ text: 'New' });
    });

    await waitFor(() => {
      expect(result.current.todos).toHaveLength(1);
    });
  });

  it('handles error on add todo', async () => {
    todoService.getTodos.mockResolvedValue([]);
    const mockError = new Error('Create error');
    todoService.createTodo.mockRejectedValue(mockError);
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.todos).toHaveLength(0);
    });

    await act(async () => {
      try {
        await result.current.addTodo({ text: 'New' });
      } catch (err) {
        // Expected error, do nothing
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Create error');
    });
  });

  it('toggles a todo', async () => {
    todoService.getTodos.mockResolvedValue([{ _id: '1', completed: false }]);
    todoService.updateTodo.mockResolvedValue({ _id: '1', completed: true });
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.todos).toHaveLength(1);
    });

    await act(async () => {
      await result.current.toggleTodo('1');
    });

    await waitFor(() => {
      expect(result.current.todos[0].completed).toBe(true);
    });
  });

  it('handles error on toggle todo', async () => {
    todoService.getTodos.mockResolvedValue([{ _id: '1', completed: false }]);
    const mockError = new Error('Update error');
    todoService.updateTodo.mockRejectedValue(mockError);
    const { result } = renderHook(() => useTodos());

    await waitFor(() => {
      expect(result.current.todos).toHaveLength(1);
    });

    await act(async () => {
      try {
        await result.current.toggleTodo('1');
      } catch (err) {
        // Expected error, do nothing
      }
    });

    await waitFor(() => {
      expect(result.current.error).toBe('Update error');
    });
  });

  // Add similar tests for editTodo, updateNotes, deleteTodo if needed
});
