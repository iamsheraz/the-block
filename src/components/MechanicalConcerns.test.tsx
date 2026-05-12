import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MechanicalConcerns } from './MechanicalConcerns';

describe('MechanicalConcerns', () => {
  it('hides the panel when count is zero', () => {
    const { container } = render(
      <MechanicalConcerns notes={['Scratch on liftgate', 'Dent on tailgate']} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('hides the panel when notes is empty', () => {
    const { container } = render(<MechanicalConcerns notes={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows the count in the heading when there are mechanical notes', () => {
    render(
      <MechanicalConcerns
        notes={['Transmission slips in 3rd', 'AC compressor noisy', 'Scratch on liftgate']}
      />,
    );
    expect(screen.getByText(/mechanical concerns \(2\)/i)).toBeInTheDocument();
  });

  it('lists each mechanical note as a bullet', () => {
    render(<MechanicalConcerns notes={['Transmission slips in 3rd', 'AC compressor noisy']} />);
    expect(screen.getByText(/transmission slips in 3rd/i)).toBeInTheDocument();
    expect(screen.getByText(/ac compressor noisy/i)).toBeInTheDocument();
  });
});
