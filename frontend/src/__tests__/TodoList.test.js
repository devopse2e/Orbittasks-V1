import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TodoList from '../components/TodoList';
import * as TodosContext from '../context/TodosContext';
import * as AuthContext from '../context/AuthContext';

const sampleTodos = [
  {
    _id: '1',
    text: 'Buy groceries',
    completed: false,
    notes: 'Milk, eggs',
    dueDate: '2025-07-24T10:00:00.000Z',
    createdAt: '2025-07-20T10:00:00.000Z',
    priority: 'High',
    category: 'Groceries',
  },
  {
    _id: '2',
    text: 'Finished project',
    completed: true,
    notes: '',
    dueDate: '2025-07-22T12:00:00.000Z',
    createdAt: '2025-07-19T09:00:00.000Z',
    priority: 'Low',
    category: 'Work',
  },
  {
    _id: '3',
    text: 'Plan vacation',
    completed: false,
    notes: 'Check flights',
    dueDate: null,
    createdAt: '2025-07-18T08:00:00.000Z',
    priority: 'Medium',
    category: 'Personal',
  },
];

jest.spyOn(TodosContext, 'useTodosContext');
jest.spyOn(AuthContext, 'useAuthContext');

beforeEach(() => {
  TodosContext.useTodosContext.mockReturnValue({
    todos: sampleTodos,
    setTodos: jest.fn(),
    toggleTodo: jest.fn(),
    addTodo: jest.fn(),
    editTodo: jest.fn(),
    deleteTodo: jest.fn(),
    loading: false,
    error: null,
    fetchTodos: jest.fn(),
  });

  AuthContext.useAuthContext.mockReturnValue({
    user: { timezone: 'UTC' },
  });
});

describe('TodoList', () => {
  it('renders active tasks count and active todos, hides completed todo texts (not displayed as todos)', () => {
    render(<TodoList />);

    expect(screen.getByText(/Active Tasks \(2\)/i)).toBeInTheDocument();

    // Completed todos may not be rendered
    expect(screen.queryByText(/Finished project/i)).toBeNull();

    expect(screen.getByText(/Buy groceries/i)).toBeInTheDocument();
    expect(screen.getByText(/Plan vacation/i)).toBeInTheDocument();
  });

  it('filters tasks by search term', async () => {
    render(<TodoList />);

    // Toggle search visibility button via container
    const headerRightControls = screen.getByText(/Add New Task/i).nextSibling;
    const searchToggleBtn = headerRightControls.querySelector('.search-container > button');

    act(() => {
      fireEvent.click(searchToggleBtn);
    });

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    await act(async () => {
      await userEvent.type(searchInput, 'vacation');
    });

    expect(screen.getByText(/Plan vacation/i)).toBeInTheDocument();
    expect(screen.queryByText(/Buy groceries/i)).toBeNull();
  });

  it('filters by category pill click', () => {
    render(<TodoList />);
    const categoryPill = screen.getByText('Groceries');
    fireEvent.click(categoryPill);
    expect(screen.getByText(/Category: Groceries/i)).toBeInTheDocument();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.queryByText('Plan vacation')).toBeNull();
  });

  it('filters by priority pill click', () => {
    render(<TodoList />);
    const priorityPill = screen.getByText('High');
    fireEvent.click(priorityPill);
    expect(screen.getByText(/Priority: High/i)).toBeInTheDocument();
    expect(screen.getByText('Buy groceries')).toBeInTheDocument();
    expect(screen.queryByText('Plan vacation')).toBeNull();
  });

  it('toggles search input visibility and shows input', async () => {
    render(<TodoList />);

    const headerRightControls = screen.getByText(/Add New Task/i).nextSibling;
    const searchToggleBtn = headerRightControls.querySelector('.search-container > button');

    act(() => {
      fireEvent.click(searchToggleBtn);
    });

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/search tasks/i).parentElement).toHaveClass('active');
    });

    const searchInput = screen.getByPlaceholderText(/search tasks/i);
    expect(searchInput).toBeVisible();
  });

  it('toggles sort menu and selects sorting option', () => {
    render(<TodoList />);

    const sortBtn = screen.getByText((content, element) => {
      return element.tagName.toLowerCase() === 'button' && element.parentElement.classList.contains('sort-container');
    });

    act(() => {
      fireEvent.click(sortBtn);
    });

    const dueDateOption = screen.getByText(/Due Date/i);
    act(() => {
      fireEvent.click(dueDateOption);
    });

    expect(dueDateOption.className).toMatch(/sort-option/);
  });

  it('displays error message when error exists', () => {
    TodosContext.useTodosContext.mockReturnValue({
      todos: [],
      setTodos: jest.fn(),
      toggleTodo: jest.fn(),
      addTodo: jest.fn(),
      editTodo: jest.fn(),
      deleteTodo: jest.fn(),
      loading: false,
      error: new Error('Fetch failed'),
      fetchTodos: jest.fn(),
    });
    render(<TodoList />);
    expect(screen.getByText(/Fetch failed/i)).toBeInTheDocument();
  });

  it('opens add todo modal when button clicked', () => {
    render(<TodoList />);
    const addBtn = screen.getByText(/Add New Task/i);
    act(() => {
      fireEvent.click(addBtn);
    });
    expect(document.querySelector('.todo-modal-content')).toBeInTheDocument();
  });
});
