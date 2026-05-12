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
    // Note appears twice: as the <title> tooltip on the SVG dot and as legend text.
    const matches = screen.getAllByText('Scratch on liftgate (8cm)');
    expect(matches.length).toBeGreaterThanOrEqual(1);
    expect(matches.some((el) => el.tagName.toLowerCase() === 'title')).toBe(true);
  });

  it('renders a legend entry for each unique body note', () => {
    render(
      <DamageDiagram notes={['Rust on driver-rear wheel well', 'Scratch on liftgate (8cm)']} />,
    );
    const legend = screen.getByRole('list', { name: /damage map legend/i });
    expect(legend).toBeInTheDocument();
    const items = legend.querySelectorAll('li');
    expect(items).toHaveLength(2);
  });

  it('deduplicates identical notes in the legend', () => {
    render(
      <DamageDiagram notes={['Rust on wheel well', 'Rust on wheel well', 'Scratch on liftgate']} />,
    );
    const legend = screen.getByRole('list', { name: /damage map legend/i });
    expect(legend.querySelectorAll('li')).toHaveLength(2);
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

  it('places wheel-region markers on the visible wheel boxes, not inside the body rect', () => {
    // Wheel boxes are painted at x=38..52 (left) and x=168..182 (right).
    // A regression in the marker clamp pulled wheel anchors (x=45 / 175) into
    // the body sidewall — this test pins the fix.
    render(
      <DamageDiagram
        notes={['Rust on driver-rear wheel well', 'Scratch on passenger-rear wheel well']}
      />,
    );
    const circles = screen
      .getAllByTestId('damage-marker')
      .map((g) => g.querySelector('circle'))
      .filter((c): c is SVGCircleElement => c !== null);
    expect(circles).toHaveLength(2);
    const xs = circles.map((c) => Number(c.getAttribute('cx'))).sort((a, b) => a - b);
    expect(xs[0]).toBeLessThanOrEqual(52);
    expect(xs[1]).toBeGreaterThanOrEqual(168);
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
