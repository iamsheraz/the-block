import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { Vehicle } from '../types';
import { ConditionSummary } from './ConditionSummary';

type VehicleSlice = Pick<Vehicle, 'ai_summary' | 'condition_report' | 'damage_notes'>;

function makeVehicle(overrides: Partial<VehicleSlice> = {}): VehicleSlice {
  return {
    condition_report: 'Clean inside and out with minor cosmetic wear.',
    damage_notes: [],
    ...overrides,
  };
}

describe('ConditionSummary', () => {
  it('renders ai_summary when present', () => {
    render(
      <ConditionSummary
        vehicle={makeVehicle({ ai_summary: 'Drives clean, no mechanical flags. Light wear only.' })}
      />,
    );
    expect(
      screen.getByText('Drives clean, no mechanical flags. Light wear only.'),
    ).toBeInTheDocument();
  });

  it('renders templated fallback when ai_summary is missing', () => {
    render(
      <ConditionSummary
        vehicle={makeVehicle({
          condition_report: 'Light frame work, repainted hood.',
          damage_notes: ['hood repaint', 'left fender ding'],
        })}
      />,
    );
    expect(
      screen.getByText(/Light frame work, repainted hood\. 2 damage notes flagged/i),
    ).toBeInTheDocument();
  });

  it('uses "AI summary" label and chat-bubble icon when ai_summary is present', () => {
    const { container } = render(
      <ConditionSummary vehicle={makeVehicle({ ai_summary: 'Clean grade-4 unit. Light wear.' })} />,
    );
    expect(screen.getByText(/AI summary/i)).toBeInTheDocument();
    expect(screen.queryByText(/Condition snapshot/i)).not.toBeInTheDocument();
    // Chat-bubble path is present; clipboard body path is not.
    expect(container.querySelector('path[d^="M21 11.5"]')).not.toBeNull();
    expect(container.querySelector('path[d^="M16 4h2"]')).toBeNull();
  });

  it('uses "Condition snapshot" label and clipboard icon when ai_summary is missing', () => {
    const { container } = render(<ConditionSummary vehicle={makeVehicle()} />);
    expect(screen.getByText(/Condition snapshot/i)).toBeInTheDocument();
    expect(screen.queryByText(/AI summary/i)).not.toBeInTheDocument();
    // Clipboard body path is present; chat-bubble path is not.
    expect(container.querySelector('path[d^="M16 4h2"]')).not.toBeNull();
    expect(container.querySelector('path[d^="M21 11.5"]')).toBeNull();
  });

  it('falls back when ai_summary is only whitespace', () => {
    render(<ConditionSummary vehicle={makeVehicle({ ai_summary: '   ' })} />);
    expect(screen.getByText(/Condition snapshot/i)).toBeInTheDocument();
  });
});
