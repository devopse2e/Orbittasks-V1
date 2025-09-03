// src/__tests__/LoadingSpinner.test.js

import React from 'react';
import { render, screen } from '@testing-library/react';
import LoadingSpinner from '../components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('renders default message', () => {
    render(<LoadingSpinner />);
    expect(screen.getByText(/loading your todos/i)).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<LoadingSpinner message="Custom loading..." />);
    expect(screen.getByText(/custom loading/i)).toBeInTheDocument();
  });
});
