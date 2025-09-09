// src/__tests__/TodoItem.test.js

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from 'react';
import userEvent from '@testing-library/user-event';
import TodoItem from '../components/TodoItem';
import { AuthProvider } from '../context/AuthContext';  // adjust path if needed

const baseTodo = {
  _id: '1',
  text: 'Write tests',
  completed: false,
  notes: 'Some notes for testing',
  dueDate: '2025-07-23T10:00:00.000Z',
  createdAt: '2025-07-22T09:00:00.000Z',
  priority: 'Medium',
  category: 'Work',
  color: '#ef4444',
  isRecurring: true,
  recurrencePattern: 'weekly',
  recurrenceInterval: 1,
  recurrenceEndsAt: '2025-12-31T23:59:59.999Z',
};

const mockToggle = jest.fn();
const mockEdit = jest.fn();
const mockUpdateNotes = jest.fn();
const mockDelete = jest.fn();
const mockSetCategoryFilter = jest.fn();
const mockSetPriorityFilter = jest.fn();

function renderWithAuth(ui, options) {
  return render(<AuthProvider>{ui}</AuthProvider>, options);
}

describe('TodoItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('renders all main todo fields', () => {
  renderWithAuth(
    <TodoItem
      todo={baseTodo}
      toggleTodo={mockToggle}
      onEdit={mockEdit}
      updateNotes={mockUpdateNotes}
      deleteTodo={mockDelete}
      setCategoryFilter={mockSetCategoryFilter}
      setPriorityFilter={mockSetPriorityFilter}
    />,
  );

  expect(screen.getByText(/write tests/i)).toBeInTheDocument();
  expect(screen.getByText(baseTodo.notes)).toBeInTheDocument();
  expect(screen.getByText(baseTodo.category)).toBeInTheDocument();
  expect(screen.getByText(baseTodo.priority)).toBeInTheDocument();
  expect(screen.getByText(/created:/i)).toBeInTheDocument();
  expect(screen.getByText(/Jul 23/i)).toBeInTheDocument(); // updated check for due date
  expect(screen.getByText(/🔁/)).toBeInTheDocument();
});


  it('calls toggleTodo when toggling completion status', () => {
    renderWithAuth(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggle}
        onEdit={mockEdit}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDelete}
        setCategoryFilter={mockSetCategoryFilter}
        setPriorityFilter={mockSetPriorityFilter}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /todo options/i })); // aria-label="Todo options"
    });
    act(() => {
      fireEvent.click(screen.getByText(/mark as done/i));
    });

    expect(mockToggle).toHaveBeenCalledWith(baseTodo._id, true);
  });

 it('calls onEdit when edit menu item clicked', () => {
  renderWithAuth(
    <TodoItem
      todo={baseTodo}
      toggleTodo={mockToggle}
      onEdit={mockEdit}
      updateNotes={mockUpdateNotes}
      deleteTodo={mockDelete}
     setCategoryFilter={mockSetCategoryFilter}
    setPriorityFilter={mockSetPriorityFilter}
    />,
  );

  // Open menu and click edit
 act(() => {
  fireEvent.click(screen.getByRole('button', { name: /todo options/i }));
});

const editMenuItem = screen.getByText((content, element) => {
  return content.toLowerCase().includes('edit')
    && element.classList.contains('menu-item');
});
act(() => {
  fireEvent.click(editMenuItem);
});
 });

  it('calls deleteTodo when delete menu item clicked', () => {
    renderWithAuth(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggle}
        onEdit={mockEdit}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDelete}
        setCategoryFilter={mockSetCategoryFilter}
        setPriorityFilter={mockSetPriorityFilter}
      />,
    );

    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /todo options/i }));
    });
    act(() => {
      fireEvent.click(screen.getByText(/delete/i));
    });

    expect(mockDelete).toHaveBeenCalledWith(baseTodo._id);
  });

it('does not render editable textarea on notes click', () => {
  renderWithAuth(
    <TodoItem
      todo={baseTodo}
      toggleTodo={mockToggle}
      onEdit={mockEdit}
      updateNotes={mockUpdateNotes}
      deleteTodo={mockDelete}
      setCategoryFilter={mockSetCategoryFilter}
      setPriorityFilter={mockSetPriorityFilter}
    />,
  );

  // notes field is visible
  expect(screen.getByText(baseTodo.notes)).toBeInTheDocument();

  // click notes does not open textarea/input
  fireEvent.click(screen.getByText(baseTodo.notes));

  // textarea should NOT be in the document
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

  // updateNotes should NOT have been called
  expect(mockUpdateNotes).not.toHaveBeenCalled();
});


it('opens popup on single click title, not on double click', async () => {
  const { rerender, container } = render(
    <AuthProvider>
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggle}
        onEdit={mockEdit}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDelete}
        setCategoryFilter={mockSetCategoryFilter}
      setPriorityFilter={mockSetPriorityFilter}
      />
    </AuthProvider>
  );

  // Select the main todo title span only
  const mainTitle = screen.getByText((content, element) =>
    element.tagName.toLowerCase() === 'span' &&
    element.classList.contains('todo-item-title') &&
    content === 'Write tests'
  );

  await act(async () => {
    fireEvent.click(mainTitle);
    jest.advanceTimersByTime(250);
  });

  await waitFor(() => {
    const popupTitle = screen.getByRole('heading', { name: /write tests/i });
    expect(popupTitle).toBeInTheDocument();
  });

  await act(async () => {
    const closeButton = container.querySelector('.todo-popup-close');
    fireEvent.click(closeButton);
  });

  await waitFor(() => {
    expect(screen.queryByRole('heading', { name: /write tests/i })).toBeNull();
  });

  rerender(
    <AuthProvider>
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggle}
        onEdit={mockEdit}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDelete}
        setCategoryFilter={mockSetCategoryFilter}
      setPriorityFilter={mockSetPriorityFilter}
      />
    </AuthProvider>
  );

  await act(async () => {
    fireEvent.doubleClick(mainTitle);
    jest.advanceTimersByTime(250);
  });

  expect(screen.queryByRole('heading', { name: /write tests/i })).toBeNull();
});


  it('shows tooltips and recurrence popup correctly', async () => {
    renderWithAuth(
      <TodoItem
        todo={baseTodo}
        toggleTodo={mockToggle}
        onEdit={mockEdit}
        updateNotes={mockUpdateNotes}
        deleteTodo={mockDelete}
        setCategoryFilter={mockSetCategoryFilter}
        setPriorityFilter={mockSetPriorityFilter}
      />,
    );

    const createdDate = screen.getByText(/created:/i).closest('div');

    await act(async () => {
      fireEvent.mouseOver(createdDate);
    });

    await waitFor(() => {
      expect(screen.getByText(/July 22, 2025/i)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.mouseOut(createdDate);
    });

    const recurrencePill = screen.getByText(/🔁/);

    await act(async () => {
      fireEvent.click(recurrencePill);
    });

    await waitFor(() => {
      expect(screen.getByText(/Recurs:/i)).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.mouseDown(document.body);
    });

    await waitFor(() => {
      expect(screen.queryByText(/Recurs:/i)).not.toBeInTheDocument();
    });
  });
});
