const todoModel = require('../models/todoModel');

// Get all todos
const getAllTodos = async () => {
  return todoModel.getAll();
};

// Pass the full todo data object for creation
const createTodo = async (todoData) => {
  // todoData: { text, notes, dueDate, priority }
  return todoModel.create(todoData);
};

// Pass the id and updates object for patching/updating
const updateTodo = async (id, updates) => {
  // updates: { text, notes, completed, dueDate, priority }
  return todoModel.update(id, updates);
};

const deleteTodo = async (id) => {
  return todoModel.delete(id);
};

module.exports = {
  getAllTodos,
  createTodo,
  updateTodo,
  deleteTodo
};
