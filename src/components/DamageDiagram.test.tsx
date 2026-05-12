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

  it('jitters dots when several notes resolve to the same region so they do not overlap', () => {
    render(
      <DamageDiagram notes={['Scratch on liftgate', 'Dent on tailgate', 'Crack in rear bumper']} />,
    );
    const markers = screen.getAllByTestId('damage-marker');
    expect(markers).toHaveLength(3);
    const circles = markers.map((g) => g.querySelector('circle'));
    const positions = circles.map((c) => `${c?.getAttribute('cx')}:${c?.getAttribute('cy')}`);
    const unique = new Set(positions);
    expect(unique.size).toBe(positions.length);
  });

  it('keeps every dot inside the body silhouette x range even with many collisions', () => {
    const sameRegion = Array.from({ length: 10 }, (_, i) => `Scratch on liftgate (${i})`);
    render(<DamageDiagram notes={sameRegion} />);
    const circles = screen
      .getAllByTestId('damage-marker')
      .map((g) => g.querySelector('circle'))
      .filter((c): c is SVGCircleElement => c !== null);
    expect(circles).toHaveLength(10);
    for (const c of circles) {
      const cx = Number(c.getAttribute('cx'));
      const cy = Number(c.getAttribute('cy'));
      expect(cx).toBeGreaterThanOrEqual(50);
      expect(cx).toBeLessThanOrEqual(170);
      expect(cy).toBeGreaterThanOrEqual(22);
      expect(cy).toBeLessThanOrEqual(320);
    }
  });
});
