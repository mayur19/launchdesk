import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PendingPage } from '../src/pages/PendingPage';

describe('PendingPage', () => {
  it('names the screen and its tracking ticket', () => {
    render(<PendingPage title="Assets" ticket="AO-042" />);
    expect(screen.getByRole('heading', { name: 'Assets' })).toBeInTheDocument();
    expect(screen.getByText('AO-042')).toBeInTheDocument();
  });
});
