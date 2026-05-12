import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AUCTION_DURATION } from '../lib/constants';
import type { Vehicle } from '../types';
import { BidConfirmationModal } from './BidConfirmationModal';

const NOW = Date.UTC(2030, 0, 15, 12, 0, 0);

function vehicleFixture(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: 'v-1',
    vin: '2HGFC2F5XKH123456',
    year: 2019,
    make: 'Honda',
    model: 'Civic',
    trim: 'LX',
    body_style: 'Sedan',
    exterior_color: 'Black',
    interior_color: 'Grey',
    engine: '2.0L I4',
    transmission: 'CVT',
    drivetrain: 'FWD',
    odometer_km: 84_210,
    fuel_type: 'gasoline',
    condition_grade: 4.2,
    condition_report: '',
    damage_notes: [],
    title_status: 'clean',
    province: 'Ontario',
    city: 'Toronto',
    auction_start: new Date(NOW - 30 * 60_000).toISOString(),
    starting_bid: 14_500,
    reserve_price: null,
    buy_now_price: null,
    images: [],
    selling_dealership: 'King City Auto',
    lot: 'A-0001',
    current_bid: null,
    bid_count: 0,
    ...overrides,
  };
}

function renderConfirm(props: Partial<React.ComponentProps<typeof BidConfirmationModal>> = {}) {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  const onAdjust = vi.fn();
  render(
    <BidConfirmationModal
      vehicle={vehicleFixture()}
      amount={15_200}
      now={NOW}
      view={{ kind: 'confirm' }}
      submitting={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
      onAdjust={onAdjust}
      {...props}
    />,
  );
  return { onCancel, onConfirm, onAdjust };
}

describe('BidConfirmationModal — confirm view', () => {
  it('shows the worst damage note when damage_notes is non-empty', () => {
    renderConfirm({
      vehicle: vehicleFixture({
        damage_notes: ['Scratch on liftgate (8cm)', 'Transmission slips in 3rd gear'],
      }),
    });
    expect(screen.getByText(/worst note on this vehicle/i)).toBeInTheDocument();
    // Mechanical note outranks cosmetic for the "worst" pick.
    expect(screen.getByText(/transmission slips/i)).toBeInTheDocument();
  });

  it('hides the worst-note callout when damage_notes is empty', () => {
    renderConfirm({ vehicle: vehicleFixture({ damage_notes: [] }) });
    expect(screen.queryByText(/worst note on this vehicle/i)).not.toBeInTheDocument();
  });

  it('renders "Below reserve by $X" when bid is under reserve', () => {
    renderConfirm({
      vehicle: vehicleFixture({ reserve_price: 16_000, current_bid: 15_000, bid_count: 1 }),
      amount: 15_200,
    });
    expect(screen.getByText(/below reserve by \$800/i)).toBeInTheDocument();
  });

  it('renders "Above reserve" when bid meets or exceeds reserve', () => {
    renderConfirm({
      vehicle: vehicleFixture({ reserve_price: 14_500 }),
      amount: 14_500,
    });
    expect(screen.getByText(/above reserve/i)).toBeInTheDocument();
  });

  it('renders "No reserve" when reserve_price is null', () => {
    renderConfirm({ vehicle: vehicleFixture({ reserve_price: null }) });
    expect(screen.getByText(/no reserve/i)).toBeInTheDocument();
  });

  it('shows the delta against starts-at when there is no current bid', () => {
    renderConfirm({
      vehicle: vehicleFixture({ starting_bid: 14_500, current_bid: null }),
      amount: 15_200,
    });
    expect(screen.getByText(/vs\. starts at/i)).toBeInTheDocument();
    expect(screen.getByText(/\+\$700/)).toBeInTheDocument();
  });

  it('shows the delta against current bid when one exists', () => {
    renderConfirm({
      vehicle: vehicleFixture({ current_bid: 15_000, bid_count: 1 }),
      amount: 15_300,
    });
    expect(screen.getByText(/vs\. current bid/i)).toBeInTheDocument();
    expect(screen.getByText(/\+\$300/)).toBeInTheDocument();
  });

  it('renders the commitment line', () => {
    renderConfirm();
    expect(
      screen.getByText(/by placing this bid you commit to purchase if you win/i),
    ).toBeInTheDocument();
  });

  it('renders Cancel and Confirm bid buttons', () => {
    renderConfirm();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm bid/i })).toBeInTheDocument();
  });

  it('disables Confirm bid while submitting and shows a spinner label', () => {
    renderConfirm({ submitting: true });
    const confirm = screen.getByRole('button', { name: /placing bid/i });
    expect(confirm).toBeDisabled();
  });

  it('calls onCancel when ESC is pressed', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderConfirm();
    await user.keyboard('{Escape}');
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderConfirm();
    const backdrop = screen.getByRole('dialog').parentElement;
    if (!backdrop) throw new Error('backdrop missing');
    await user.click(backdrop);
    expect(onCancel).toHaveBeenCalled();
  });

  it('does not call onCancel when clicking inside the dialog content', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderConfirm();
    await user.click(screen.getByText(/2019 honda civic/i));
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('autofocuses the Confirm bid button on open', () => {
    renderConfirm();
    expect(screen.getByRole('button', { name: /confirm bid/i })).toHaveFocus();
  });

  it('traps Tab inside the modal (cycles from last back to first)', async () => {
    const user = userEvent.setup();
    renderConfirm();
    const close = screen.getByRole('button', { name: /close/i });
    const cancel = screen.getByRole('button', { name: /cancel/i });
    const confirm = screen.getByRole('button', { name: /confirm bid/i });

    expect(confirm).toHaveFocus();
    await user.tab(); // last → wraps to first
    expect(close).toHaveFocus();
    await user.tab();
    expect(cancel).toHaveFocus();
    await user.tab({ shift: true });
    expect(close).toHaveFocus();
    await user.tab({ shift: true }); // first → wraps to last
    expect(confirm).toHaveFocus();
  });

  it('shows time remaining derived from auction_start + AUCTION_DURATION', () => {
    const minutesLeft = 90;
    renderConfirm({
      vehicle: vehicleFixture({
        auction_start: new Date(NOW - (AUCTION_DURATION - minutesLeft * 60_000)).toISOString(),
      }),
    });
    // Should read as "1h 30m" with the clock icon prefix; matcher checks digits.
    const dt = screen.getByText(/time remaining/i);
    const dd = dt.nextElementSibling;
    expect(dd?.textContent ?? '').toMatch(/1h\s*30m/);
  });
});

describe('BidConfirmationModal — error view', () => {
  it('surfaces the typed amount_too_low error with outbid copy', () => {
    render(
      <BidConfirmationModal
        vehicle={vehicleFixture({ current_bid: 15_000, bid_count: 1 })}
        amount={15_100}
        now={NOW}
        view={{ kind: 'error', error: { type: 'amount_too_low', min: 15_300 } }}
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(screen.getByText(/bid not placed/i)).toBeInTheDocument();
    expect(screen.getByText(/someone bid \$15,200 first/i)).toBeInTheDocument();
    expect(screen.getByText(/try \$15,300 or higher/i)).toBeInTheDocument();
  });

  it('surfaces auction_not_live status', () => {
    render(
      <BidConfirmationModal
        vehicle={vehicleFixture()}
        amount={15_000}
        now={NOW}
        view={{ kind: 'error', error: { type: 'auction_not_live', status: 'ended' } }}
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(screen.getByText(/auction has ended/i)).toBeInTheDocument();
  });

  it('calls onAdjust with new minimum when Adjust bid is clicked', async () => {
    const user = userEvent.setup();
    const onAdjust = vi.fn();
    render(
      <BidConfirmationModal
        vehicle={vehicleFixture()}
        amount={15_100}
        now={NOW}
        view={{ kind: 'error', error: { type: 'amount_too_low', min: 15_300 } }}
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onAdjust={onAdjust}
      />,
    );
    await user.click(screen.getByRole('button', { name: /adjust bid/i }));
    expect(onAdjust).toHaveBeenCalledWith(15_300);
  });

  it('renders an Adjust bid button and a Cancel button in error footer', () => {
    render(
      <BidConfirmationModal
        vehicle={vehicleFixture()}
        amount={15_100}
        now={NOW}
        view={{ kind: 'error', error: { type: 'amount_too_low', min: 15_300 } }}
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /adjust bid/i })).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByRole('button', { name: /^cancel$/i }),
    ).toBeInTheDocument();
  });

  it('renders the error body inside a role="alert" / aria-live region', () => {
    render(
      <BidConfirmationModal
        vehicle={vehicleFixture()}
        amount={15_100}
        now={NOW}
        view={{ kind: 'error', error: { type: 'amount_too_low', min: 15_300 } }}
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });

  it('moves focus to the Adjust bid button when the view transitions to error', () => {
    const { rerender } = render(
      <BidConfirmationModal
        vehicle={vehicleFixture()}
        amount={15_100}
        now={NOW}
        view={{ kind: 'confirm' }}
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /confirm bid/i })).toHaveFocus();
    rerender(
      <BidConfirmationModal
        vehicle={vehicleFixture()}
        amount={15_100}
        now={NOW}
        view={{ kind: 'error', error: { type: 'amount_too_low', min: 15_300 } }}
        submitting={false}
        onCancel={vi.fn()}
        onConfirm={vi.fn()}
        onAdjust={vi.fn()}
      />,
    );
    expect(screen.getByRole('button', { name: /adjust bid/i })).toHaveFocus();
  });
});

describe('BidConfirmationModal — submitting + auction-end gates', () => {
  it('ignores ESC while submitting is true', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderConfirm({ submitting: true, onCancel });
    await user.keyboard('{Escape}');
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('ignores backdrop clicks while submitting is true', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();
    renderConfirm({ submitting: true, onCancel });
    // Click the backdrop (outside the role="dialog" content).
    const backdrop = screen.getByRole('dialog').parentElement;
    if (!backdrop) throw new Error('backdrop missing');
    await user.click(backdrop);
    expect(onCancel).not.toHaveBeenCalled();
  });

  it('disables Confirm bid and shows "Auction ended" copy when msRemaining <= 0', () => {
    const endedStart = new Date(NOW - 10 * 60 * 60 * 1000).toISOString();
    renderConfirm({
      vehicle: vehicleFixture({ auction_start: endedStart, starting_bid: 14_500 }),
    });
    const confirm = screen.getByRole('button', { name: /auction ended/i });
    expect(confirm).toBeDisabled();
    expect(screen.getByText(/this auction ended while you were deciding/i)).toBeInTheDocument();
  });
});
