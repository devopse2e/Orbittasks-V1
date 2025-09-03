// src/__tests__/TodoItem.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react'; // Import act from 'react' to address deprecation warning
import TodoItem from '../components/TodoItem';

const baseTodo = {
  _id: '1',
  text: 'Write tests',
  completed: false,
  notes: 'Some notes for testing',
  dueDate: '2025-07-23T10:00:00.000Z',
  createdAt: '2025-07-22T09:00:00.000Z',
  priority: 'Medium'
};

// Mock handlers
const mockToggleTodo = jest.fn();
const mockEditTodo = jest.fn().mockResolvedValue(undefined); // Assume async success
const mockUpdateNotes = jest.fn().mockResolvedValue(undefined); // Assume async success
const mockDeleteTodo = jest.fn();

describe('TodoItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // For handling click delay in popup
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders todo item with all fields', () => {
    render(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggleTodo}
        editTodo={mockEditTodo}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDeleteTodo}
      />
    );

    expect(screen.getByText(/write tests/i)).toBeInTheDocument();
    expect(screen.getByText(/medium/i)).toBeInTheDocument();
    expect(screen.getByText(/some notes for testing/i)).toBeInTheDocument();
    expect(screen.getByText(/added:/i)).toBeInTheDocument();
    expect(screen.getByText(/due:/i)).toBeInTheDocument();
  });

  it('calls toggleTodo when checkbox is clicked', () => {
    render(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggleTodo}
        editTodo={mockEditTodo}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDeleteTodo}
      />
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    expect(mockToggleTodo).toHaveBeenCalledWith(baseTodo._id);
  });

  it('calls editTodo when edit icon is clicked and name is edited', async () => {
    render(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggleTodo}
        editTodo={mockEditTodo}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDeleteTodo}
      />
    );

    // Click edit icon to enter editing mode
    const editButton = screen.getByText('✎'); // Use getByText for icon; add aria-label in component if needed
    fireEvent.click(editButton);

    // Change the input value and blur to trigger save
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Updated text' } });
    fireEvent.blur(input);

    await waitFor(() => {
      expect(mockEditTodo).toHaveBeenCalledWith(baseTodo._id, 'Updated text');
    });
  });

  it('calls deleteTodo when delete icon is clicked', () => {
    render(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggleTodo}
        editTodo={mockEditTodo}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDeleteTodo}
      />
    );

    const deleteButton = screen.getByText('🗑'); // Use getByText for icon; add aria-label like 'Delete todo' in component
    fireEvent.click(deleteButton);
    expect(mockDeleteTodo).toHaveBeenCalledWith(baseTodo._id);
  });

  it('displays notes preview and calls updateNotes when notes are edited in main card', async () => {
    render(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggleTodo}
        editTodo={mockEditTodo}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDeleteTodo}
      />
    );

    // Notes preview is shown
    expect(screen.getByText(/some notes for testing/i)).toBeInTheDocument();

    // Click to edit notes
    fireEvent.click(screen.getByText(/some notes for testing/i));

    // Change value and blur to trigger save
    const textarea = screen.getByRole('textbox'); // Assumes one textbox at a time
    fireEvent.change(textarea, { target: { value: 'Updated notes' } });
    fireEvent.blur(textarea);

    await waitFor(() => {
      expect(mockUpdateNotes).toHaveBeenCalledWith(baseTodo._id, 'Updated notes');
    });
  });

  it('opens popup on single click of title and does not open on double click', async () => {
    const { rerender } = render(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggleTodo}
        editTodo={mockEditTodo}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDeleteTodo}
      />
    );

    const title = screen.getByText(/write tests/i);

    // Test single click: Should open popup after delay
    fireEvent.click(title);
    act(() => {
      jest.advanceTimersByTime(250); // Simulate the delay
    });

    await waitFor(() => {
      expect(screen.getByText('×')).toBeInTheDocument(); // Popup close icon
    });
    expect(screen.getAllByText(/write tests/i).length).toBeGreaterThan(1); // Name in popup and original

    // Close popup for next test
    fireEvent.click(screen.getByText('×'));
    await waitFor(() => {
      expect(screen.queryByText('×')).not.toBeInTheDocument();
    });

    // Force a rerender to ensure state is reset (optional but helps in some test envs)
    rerender(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggleTodo}
        editTodo={mockEditTodo}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDeleteTodo}
      />
    );

    // Test double click: Should not open popup
    fireEvent.doubleClick(title);
    act(() => {
      jest.advanceTimersByTime(250); // Even after delay, no open
    });

    await waitFor(() => {
      expect(screen.queryByText('×')).not.toBeInTheDocument(); // No popup
    });
  });

  it('displays non-editable notes in popup', async () => {
    render(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggleTodo}
        editTodo={mockEditTodo}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDeleteTodo}
      />
    );

    const title = screen.getByText(/write tests/i);

    // Open popup
    fireEvent.click(title);
    act(() => {
      jest.advanceTimersByTime(250);
    });

    await waitFor(() => {
      expect(screen.getByText('×')).toBeInTheDocument();
    });

    // Specifically query for the popup notes element using its unique class
    const popupNotes = screen.getByText(/some notes for testing/i, { selector: '.todo-popup-notes-text' });
    expect(popupNotes).toBeInTheDocument();
    expect(popupNotes.tagName).toBe('P'); // Ensure it's a non-editable <p> element

    // Attempt to "click" notes in popup should not trigger editing (no change to textarea)
    fireEvent.click(popupNotes);
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument(); // No editable field appears
    expect(mockUpdateNotes).not.toHaveBeenCalled(); // No update triggered
  });
});
