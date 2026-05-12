import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DamageNotesList } from './DamageNotesList';

describe('DamageNotesList', () => {
  it('renders an empty-state line when notes is empty', () => {
    render(<DamageNotesList notes={[]} />);
    expect(screen.getByText(/no damage notes on file/i)).toBeInTheDocument();
  });

  it('groups body and mechanical notes under separate labeled headings', () => {
    render(
      <DamageNotesList
        notes={['Scratch on liftgate', 'Transmission slips in 3rd', 'Dent on hood']}
      />,
    );
    expect(screen.getByText(/body-mapped/i)).toBeInTheDocument();
    expect(screen.getByText(/mechanical/i)).toBeInTheDocument();
    expect(screen.getByText('Scratch on liftgate')).toBeInTheDocument();
    expect(screen.getByText('Dent on hood')).toBeInTheDocument();
    expect(screen.getByText('Transmission slips in 3rd')).toBeInTheDocument();
  });

  it('hides the mechanical group when there are no mechanical notes', () => {
    render(<DamageNotesList notes={['Scratch on liftgate']} />);
    expect(screen.getByText(/body-mapped/i)).toBeInTheDocument();
    expect(screen.queryByText(/mechanical/i)).not.toBeInTheDocument();
  });

  it('renders duplicate notes as distinct list items with stable keys', () => {
    render(<DamageNotesList notes={['Scratch on liftgate', 'Scratch on liftgate']} />);
    expect(screen.getAllByText('Scratch on liftgate')).toHaveLength(2);
  });
});
