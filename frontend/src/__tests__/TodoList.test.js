// src/__tests__/TodoList.test.js

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TodoList from '../components/TodoList';
import { useTodos } from '../hooks/useTodos';

// Mock useTodos at the top
jest.mock('../hooks/useTodos', () => ({
  useTodos: jest.fn(), // Will set implementation per test
}));

describe('TodoList', () => {
  it('renders sections with zero counts when no todos', () => {
    useTodos.mockImplementation(() => ({
      todos: [],
      loading: false,
      error: null,
      addTodo: jest.fn(),
      toggleTodo: jest.fn(),
      editTodo: jest.fn(),
      updateNotes: jest.fn(),
      deleteTodo: jest.fn(),
    }));

    render(<TodoList />);
    expect(screen.getByText(/active \(0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/completed \(0\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/active todo/i)).not.toBeInTheDocument();
  });

  it('renders todos in the correct sections', () => {
    useTodos.mockImplementation(() => ({
      todos: [
        { _id: '1', text: 'Active Todo', completed: false, priority: 'High' },
        { _id: '2', text: 'Completed Todo', completed: true, priority: 'Low' },
      ],
      loading: false,
      error: null,
      addTodo: jest.fn(),
      toggleTodo: jest.fn(),
      editTodo: jest.fn(),
      updateNotes: jest.fn(),
      deleteTodo: jest.fn(),
    }));

    render(<TodoList />);
    expect(screen.getByText(/active \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/completed \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/active todo/i)).toBeInTheDocument();
    expect(screen.getByText(/completed todo/i)).toBeInTheDocument();
  });

  it('collapses and expands sections', () => {
    useTodos.mockImplementation(() => ({
      todos: [],
      loading: false,
      error: null,
      addTodo: jest.fn(),
      toggleTodo: jest.fn(),
      editTodo: jest.fn(),
      updateNotes: jest.fn(),
      deleteTodo: jest.fn(),
    }));

    render(<TodoList />);

    // Initial state: expanded (chevron ▲)
    const activeHeaderSpan = screen.getByText(/active \(0\)/i);
    const activeHeader = activeHeaderSpan.parentElement;
    expect(activeHeader.textContent).toBe('Active (0)▲');

    // Click to collapse (chevron ▼)
    fireEvent.click(activeHeaderSpan);
    expect(activeHeader.textContent).toBe('Active (0)▼');

    // Click to expand (chevron ▲)
    fireEvent.click(activeHeaderSpan);
    expect(activeHeader.textContent).toBe('Active (0)▲');
  });

  it('renders error if present', () => {
    useTodos.mockImplementation(() => ({
      todos: [],
      loading: false,
      error: 'Test error',
      addTodo: jest.fn(),
      toggleTodo: jest.fn(),
      editTodo: jest.fn(),
      updateNotes: jest.fn(),
      deleteTodo: jest.fn(),
    }));

    render(<TodoList />);
    expect(screen.getByText(/test error/i)).toBeInTheDocument();
  });

  it('renders loading spinner when loading', () => {
    useTodos.mockImplementation(() => ({
      todos: [],
      loading: true,
      error: null,
      addTodo: jest.fn(),
      toggleTodo: jest.fn(),
      editTodo: jest.fn(),
      updateNotes: jest.fn(),
      deleteTodo: jest.fn(),
    }));

    render(<TodoList />);
    expect(screen.getByText(/loading your todos/i)).toBeInTheDocument();
  });
});
