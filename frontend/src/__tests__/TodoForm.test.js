// src/__tests__/TodoForm.test.js

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react-dom/test-utils'; // For async wrapping
import TodoForm from '../components/TodoForm';
import { todoService } from '../services/api';

// Mock the todoService and its parse function to simulate NLP API response
jest.mock('../services/api', () => ({
  todoService: {
    parseTaskDetails: jest.fn(async ({ taskTitle, timeZone }) => ({
      taskTitle,
      cleanedTitle: 'Cleaned Title',
      dueDate: '2023-10-01T12:00:00Z',
      priority: 'High',
      recurrencePattern: 'daily',
      recurrenceInterval: 1,
      recurrenceEndsAt: null,
    })),
  },
}));

describe('TodoForm', () => {
  const mockAddTodo = jest.fn().mockResolvedValue();
  const mockCloseModal = jest.fn();
  const defaultProps = {
    addTodo: mockAddTodo,
    editTodo: jest.fn(),
    isAddModalOpen: true,
    isEditModalOpen: false,
    closeAddModal: mockCloseModal,
    closeEditModal: jest.fn(),
    todoToEdit: null,
    loading: false,
    //userTimeZone: 'Asia/Kolkata', // Set timezone to Asia/Kolkata
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    const { container } = render(<TodoForm {...defaultProps} />);
    expect(screen.getByRole('heading', { name: /Add Task/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Task Name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Notes.*max 400 chars/i)).toBeInTheDocument();
    expect(screen.getByText(/Due Date:/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="date"]')).toBeInTheDocument();
    expect(screen.getByText(/Time:/i)).toBeInTheDocument();
    expect(container.querySelector('input[type="time"]')).toBeInTheDocument();
    expect(screen.getByText(/Priority:/i)).toBeInTheDocument();
    expect(screen.getByText(/Category:/i)).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(screen.getByText(/Color:/i)).toBeInTheDocument();
    expect(screen.getByText(/Recurring Task/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Add Task/i })).toBeInTheDocument();
  });

  it('validates empty task name', async () => {
    render(<TodoForm {...defaultProps} />);
    const submitButton = screen.getByRole('button', { name: /Add Task/i });

    await act(async () => {
      await userEvent.click(submitButton);
    });

    await waitFor(() => {
      expect(screen.getByText(/Todo name is required/i)).toBeInTheDocument();
    });
    expect(mockAddTodo).not.toHaveBeenCalled();
  });

  it('submits form with all fields including recurrence', async () => {
    const { container } = render(<TodoForm {...defaultProps} />);
    const taskInput = screen.getByPlaceholderText(/Task Name/i);
    const notesInput = screen.getByPlaceholderText(/Notes.*max 400 chars/i);
    const dateInput = container.querySelector('input[type="date"]');
    const timeInput = container.querySelector('input[type="time"]');

    await act(async () => {
      await userEvent.type(taskInput, 'New Task');
      await userEvent.type(notesInput, 'Test notes');
      await userEvent.click(screen.getByRole('button', { name: /High/i }));
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Work' } });
      await userEvent.click(container.querySelector('div[title="#f97316"]'));
      await userEvent.type(dateInput, '2023-10-01');
      await userEvent.type(timeInput, '12:00');
      await userEvent.click(screen.getByLabelText(/Repeat this task/i));
    });

    // Wait for recurrence fields after toggling recurring
    let endsInput;
    await waitFor(() => {
      endsInput = container.querySelector('#recurrence-ends');
      expect(endsInput).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.change(screen.getByLabelText(/Repeat Every/i), { target: { value: 'weekly' } });
      await userEvent.type(endsInput, '2023-12-31');
      await userEvent.click(screen.getByRole('button', { name: /Add Task/i }));
    });

    await waitFor(() => {
      expect(mockAddTodo).toHaveBeenCalledWith(expect.objectContaining({
        text: 'New Task',
        notes: 'Test notes',
        priority: 'High',
        category: 'Work',
        color: '#f97316',
        isRecurring: true,
        recurrencePattern: 'weekly',
        recurrenceEndsAt: expect.any(String),
        dueDate: expect.any(String),
      }));
      expect(mockCloseModal).toHaveBeenCalled();
    });
  });

  it('shows notes error for input exceeding 400 characters', async () => {
    render(<TodoForm {...defaultProps} />);
    const notesInput = screen.getByPlaceholderText(/Notes.*max 400 chars/i);

    await act(async () => {
      fireEvent.change(notesInput, { target: { value: 'a'.repeat(401) } });
    });

    await waitFor(() => {
      expect(screen.getByText(/Notes cannot exceed 400 characters/i)).toBeInTheDocument();
    });
  });

  it('disables submit button when loading', () => {
    render(<TodoForm {...defaultProps} loading={true} />);
    expect(screen.getByRole('button', { name: /Processing/i })).toBeDisabled();
  });

  it('applies NLP suggestions when button is clicked', async () => {
    jest.useRealTimers(); // Use real timers due to debounce/timers complexity
    todoService.parseTaskDetails.mockImplementation(async () => ({
      taskTitle: 'Test task daily',
      cleanedTitle: 'Cleaned Title',
      dueDate: '2023-10-01T12:00:00Z',
      priority: 'High',
      recurrencePattern: 'daily',
      recurrenceInterval: 1,
      recurrenceEndsAt: null,
    }));

    const { container } = render(<TodoForm {...defaultProps} />);
    const taskInput = screen.getByPlaceholderText(/Task Name/i);

    await userEvent.type(taskInput, 'Test task daily');

    // Wait for NLP suggestion box to appear
    await waitFor(() => {
      expect(screen.getByText(/Detected:/i)).toBeInTheDocument();
    }, { timeout: 10000 });

    await userEvent.click(screen.getByRole('button', { name: /Apply/i }));

    expect(taskInput).toHaveValue('Cleaned Title');

    const dateInput = container.querySelector('input[type="date"]');
    expect(dateInput).toHaveValue('2023-10-01');

    const timeInput = container.querySelector('input[type="time"]');
    // Adjust expected time if needed based on timezone conversions
    expect(timeInput).toHaveValue('06:30'); // IST offset time suggests 12:00 UTC is 06:30 IST

  }, 15000);
});
