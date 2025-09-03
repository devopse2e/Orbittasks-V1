// src/__tests__/TodoForm.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TodoForm from '../components/TodoForm';

describe('TodoForm', () => {
  const mockAddTodo = jest.fn();

  it('renders Add Todo button', () => {
    render(<TodoForm addTodo={mockAddTodo} loading={false} />);
    expect(screen.getByRole('button', { name: '+ Add Todo' })).toBeInTheDocument(); // Exact match to your button text
  });

  it('opens modal and renders form fields', () => {
    render(<TodoForm addTodo={mockAddTodo} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add Todo' }));

    expect(screen.getByText(/add new todo/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/todo name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/notes/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/priority/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/time/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Add Todo' })).toBeInTheDocument(); // Exact match to submit button
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('validates empty todo name', () => {
    render(<TodoForm addTodo={mockAddTodo} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add Todo' }));

    const submitButton = screen.getByRole('button', { name: 'Add Todo' });
    fireEvent.click(submitButton);

    expect(mockAddTodo).not.toHaveBeenCalled(); // Submission prevented by browser required
    // Check input validity (your code uses required, no custom text)
    expect(screen.getByLabelText(/todo name/i).validity.valid).toBe(false);
  });

  it('submits form with all fields', async () => {
    render(<TodoForm addTodo={mockAddTodo} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add Todo' }));

    fireEvent.change(screen.getByLabelText(/todo name/i), { target: { value: 'New Todo' } });
    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'Test notes' } });
    fireEvent.change(screen.getByLabelText(/priority/i), { target: { value: 'High' } });
    fireEvent.change(screen.getByLabelText(/due date/i), { target: { value: '2023-10-01' } });
    fireEvent.change(screen.getByLabelText(/time/i), { target: { value: '12:00' } });

    const submitButton = screen.getByRole('button', { name: 'Add Todo' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalledWith(expect.objectContaining({
        text: 'New Todo',
        notes: 'Test notes',
        priority: 'High',
        dueDate: expect.any(Date) // Matches your code's Date parsing
      }));
    });
  });

  it('shows notes error for long input', () => {
    render(<TodoForm addTodo={mockAddTodo} loading={false} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add Todo' }));

    fireEvent.change(screen.getByLabelText(/notes/i), { target: { value: 'a'.repeat(401) } });
    expect(screen.getByText(/Notes cannot exceed 400 characters/i)).toBeInTheDocument(); // Exact match to your code's error text
  });

  it('disables buttons when loading', () => {
    render(<TodoForm addTodo={mockAddTodo} loading={true} />);
    fireEvent.click(screen.getByRole('button', { name: '+ Add Todo' }));

    expect(screen.getByRole('button', { name: /adding/i })).toBeDisabled(); // Matches "Adding..." text
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
  });
});
