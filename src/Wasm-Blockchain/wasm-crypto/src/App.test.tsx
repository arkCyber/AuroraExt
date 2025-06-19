import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from './App';

test('renders Ethereum Wallet Generator title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Ethereum Wallet Generator/i);
  expect(titleElement).toBeInTheDocument();
});
