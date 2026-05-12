import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DamageDiagram } from './DamageDiagram';

describe('DamageDiagram', () => {
  it('renders one dot per body-classified note', () => {
    render(
      <DamageDiagram
        notes={['Scratch on liftgate', 'Dent on tailgate', 'Minor rust on wheel wells']}
      />,
    );
    expect(screen.getAllByTestId('damage-marker')).toHaveLength(3);
  });

  it('renders no dots when damage_notes is empty', () => {
    render(<DamageDiagram notes={[]} />);
    expect(screen.queryAllByTestId('damage-marker')).toHaveLength(0);
    expect(screen.getByText(/no body damage reported/i)).toBeInTheDocument();
  });

  it('excludes mechanical notes from the dot count', () => {
    render(
      <DamageDiagram
        notes={['Scratch on liftgate', 'Transmission slips in 3rd', 'AC compressor noisy']}
      />,
    );
    expect(screen.getAllByTestId('damage-marker')).toHaveLength(1);
  });

  it('renders each dot with a tooltip that contains the full note text', () => {
    render(<DamageDiagram notes={['Scratch on liftgate (8cm)']} />);
    expect(screen.getByText('Scratch on liftgate (8cm)')).toBeInTheDocument();
  });
});
