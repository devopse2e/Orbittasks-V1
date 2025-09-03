// src/__tests__/ErrorMessage.test.js

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorMessage from '../components/ErrorMessage';

describe('ErrorMessage', () => {
  it('renders default message', () => {
    render(<ErrorMessage />);
    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('renders custom message', () => {
    render(<ErrorMessage message="Custom error" />);
    expect(screen.getByText(/custom error/i)).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const mockRetry = jest.fn();
    render(<ErrorMessage onRetry={mockRetry} />);
    fireEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });
});
