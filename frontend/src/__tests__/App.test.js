// src/__tests__/App.test.js

import { render, screen } from '@testing-library/react';
import { act } from 'react';  // FIXED: Import from 'react' (resolves deprecation)
import App from '../App';

// Mock AuthContext - Simulate unauthenticated (user: null)
jest.mock('../context/AuthContext', () => {
  const React = require('react');  // Import inside factory
  return {
    __esModule: true,
    AuthProvider: ({ children }) => children,
    AuthContext: React.createContext({
      user: null,  // NEW: user null for login page render
      logout: jest.fn(),
      updateUserProfile: jest.fn(),
    }),
  };
});

// Mock TodosContext
jest.mock('../context/TodosContext', () => ({
  __esModule: true,
  TodosProvider: ({ children }) => children,
  useTodosContext: () => ({
    todos: [],  // Mock todos
    toggleTodo: jest.fn(),
    editTodo: jest.fn(),
    deleteTodo: jest.fn(),
    fetchTodos: jest.fn(),
  }),
}));

// Mock useNavigate
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

// Mock useScrollDirection
jest.mock('../hooks/useScrollDirection', () => () => 'up');

describe('App', () => {
  it('renders the login page when unauthenticated', async () => {
    await act(async () => {
      render(<App />);
    });

    // Checks based on login page (from log)
    expect(screen.getByRole('heading', { name: /Sign In/i })).toBeInTheDocument();  // "Sign In" heading
    expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();  // Email input
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();  // Password input (added for coverage)
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();  // Login button (updated to exact match)
    expect(screen.getByRole('button', { name: /Skip Login \(Guest Mode\)/i })).toBeInTheDocument();  // Guest button (added for coverage)
    expect(screen.getByRole('link', { name: /Sign Up/i })).toBeInTheDocument();  // Signup link (added for coverage)
  });
});
