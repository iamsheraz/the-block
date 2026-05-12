import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Vehicle } from '../types';
import { BidPanel } from './BidPanel';

const NOW = Date.UTC(2030, 0, 15, 12, 0, 0);

const submitBidMock = vi.fn();

vi.mock('../hooks/useBids', () => ({
  useBids: () => ({ submitBid: submitBidMock }),
}));

beforeEach(() => {
  submitBidMock.mockReset();
});

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

describe('BidPanel — display', () => {
  it('shows "Starts at" when current_bid is null', () => {
    render(<BidPanel vehicle={vehicleFixture({ current_bid: null })} now={NOW} />);
    expect(screen.getByText(/starts at/i)).toBeInTheDocument();
    expect(screen.getByText('$14,500')).toBeInTheDocument();
    expect(screen.getByText(/no bids yet/i)).toBeInTheDocument();
  });

  it('hides reserve dollar amount when reserve_price is null', () => {
    render(<BidPanel vehicle={vehicleFixture({ reserve_price: null })} now={NOW} />);
    expect(screen.getByText('None')).toBeInTheDocument();
    expect(screen.queryByText(/not met/i)).not.toBeInTheDocument();
  });

  it('shows the reserve price when set', () => {
    render(
      <BidPanel
        vehicle={vehicleFixture({ reserve_price: 16_000, current_bid: 15_000, bid_count: 3 })}
        now={NOW}
      />,
    );
    expect(screen.getByText('$16,000')).toBeInTheDocument();
    expect(screen.getByText(/not met/i)).toBeInTheDocument();
  });

  it('shows current bid amount and count when present', () => {
    render(<BidPanel vehicle={vehicleFixture({ current_bid: 19_200, bid_count: 5 })} now={NOW} />);
    expect(screen.getByText('$19,200')).toBeInTheDocument();
    expect(screen.getByText(/5 bids/i)).toBeInTheDocument();
  });

  it('renders the CarFax link pointing at carfax.ca with the vin in the path', () => {
    render(<BidPanel vehicle={vehicleFixture({ vin: 'ABC123' })} now={NOW} />);
    const link = screen.getByRole('link', { name: /carfax canada/i });
    expect(link).toHaveAttribute('href', expect.stringContaining('carfax.ca'));
    expect(link).toHaveAttribute('href', expect.stringContaining('ABC123'));
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('exposes a labeled bid input', () => {
    render(<BidPanel vehicle={vehicleFixture()} now={NOW} />);
    expect(screen.getByLabelText(/your bid/i)).toBeInTheDocument();
  });

  it('renders the AI summary panel when ai_summary is present', () => {
    render(
      <BidPanel
        vehicle={vehicleFixture({ ai_summary: 'Clean grade-4 unit. Light cosmetic wear only.' })}
        now={NOW}
      />,
    );
    const section = screen.getByRole('region', { name: /bid panel/i });
    expect(within(section).getByText(/ai summary/i)).toBeInTheDocument();
    expect(within(section).getByText(/Clean grade-4 unit\./)).toBeInTheDocument();
  });

  it('renders the templated Condition snapshot when ai_summary is missing', () => {
    render(<BidPanel vehicle={vehicleFixture()} now={NOW} />);
    const section = screen.getByRole('region', { name: /bid panel/i });
    expect(within(section).getByText(/Condition snapshot/i)).toBeInTheDocument();
    expect(within(section).queryByText(/AI summary/i)).not.toBeInTheDocument();
  });
});

describe('BidPanel — input validation', () => {
  it('keeps Place bid disabled when input is empty', () => {
    render(<BidPanel vehicle={vehicleFixture()} now={NOW} />);
    expect(screen.getByRole('button', { name: /place bid/i })).toBeDisabled();
  });

  it('shows inline error below minimum and keeps button disabled', async () => {
    const user = userEvent.setup();
    render(<BidPanel vehicle={vehicleFixture({ starting_bid: 14_500 })} now={NOW} />);
    await user.type(screen.getByLabelText(/your bid/i), '10000');
    expect(screen.getByText(/minimum bid is \$14,500/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place bid/i })).toBeDisabled();
  });

  it('enables Place bid when a valid amount is entered', async () => {
    const user = userEvent.setup();
    render(<BidPanel vehicle={vehicleFixture({ starting_bid: 14_500 })} now={NOW} />);
    await user.type(screen.getByLabelText(/your bid/i), '15000');
    expect(screen.getByRole('button', { name: /place bid/i })).toBeEnabled();
  });

  it('rejects non-numeric input', async () => {
    const user = userEvent.setup();
    render(<BidPanel vehicle={vehicleFixture()} now={NOW} />);
    await user.type(screen.getByLabelText(/your bid/i), '12abc');
    expect(screen.getByText(/whole-dollar amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place bid/i })).toBeDisabled();
  });

  it('disables Place bid on an ended auction even with a valid amount', async () => {
    const user = userEvent.setup();
    const endedStart = new Date(NOW - 10 * 60 * 60 * 1000).toISOString();
    render(
      <BidPanel
        vehicle={vehicleFixture({ auction_start: endedStart, starting_bid: 14_500 })}
        now={NOW}
      />,
    );
    await user.type(screen.getByLabelText(/your bid/i), '15000');
    expect(screen.getByRole('button', { name: /place bid/i })).toBeDisabled();
    expect(screen.getByText(/this auction has ended/i)).toBeInTheDocument();
  });
});

describe('BidPanel — submission flow', () => {
  it('opens the confirmation modal on Place bid', async () => {
    const user = userEvent.setup();
    render(<BidPanel vehicle={vehicleFixture({ starting_bid: 14_500 })} now={NOW} />);
    await user.type(screen.getByLabelText(/your bid/i), '15200');
    await user.click(screen.getByRole('button', { name: /place bid/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/confirm your bid/i)).toBeInTheDocument();
  });

  it('confirms the bid: closes modal and shows success state', async () => {
    const user = userEvent.setup();
    submitBidMock.mockReturnValueOnce({
      ok: true,
      bid: {
        vehicleId: 'v-1',
        bidderId: 'b-1',
        amount: 15_200,
        placedAt: new Date(NOW).toISOString(),
      },
    });
    render(<BidPanel vehicle={vehicleFixture({ starting_bid: 14_500 })} now={NOW} />);
    await user.type(screen.getByLabelText(/your bid/i), '15200');
    await user.click(screen.getByRole('button', { name: /place bid/i }));
    await user.click(screen.getByRole('button', { name: /confirm bid/i }));

    expect(submitBidMock).toHaveBeenCalledWith({ vehicleId: 'v-1', amount: 15_200 });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText(/bid placed/i)).toBeInTheDocument();
    expect(screen.getByText(/you're the high bidder/i)).toBeInTheDocument();
  });

  it('shows the error state inline within the modal on submit failure', async () => {
    const user = userEvent.setup();
    submitBidMock.mockReturnValueOnce({
      ok: false,
      error: { type: 'amount_too_low', min: 15_400 },
    });
    render(
      <BidPanel
        vehicle={vehicleFixture({ current_bid: 15_000, bid_count: 1, starting_bid: 14_500 })}
        now={NOW}
      />,
    );
    await user.type(screen.getByLabelText(/your bid/i), '15200');
    await user.click(screen.getByRole('button', { name: /place bid/i }));
    await user.click(screen.getByRole('button', { name: /confirm bid/i }));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText(/bid not placed/i)).toBeInTheDocument();
    expect(screen.getByText(/someone bid \$15,300 first/i)).toBeInTheDocument();
  });

  it('Adjust bid pre-fills the new minimum and closes the modal', async () => {
    const user = userEvent.setup();
    submitBidMock.mockReturnValueOnce({
      ok: false,
      error: { type: 'amount_too_low', min: 15_400 },
    });
    render(
      <BidPanel
        vehicle={vehicleFixture({ current_bid: 15_000, bid_count: 1, starting_bid: 14_500 })}
        now={NOW}
      />,
    );
    await user.type(screen.getByLabelText(/your bid/i), '15200');
    await user.click(screen.getByRole('button', { name: /place bid/i }));
    await user.click(screen.getByRole('button', { name: /confirm bid/i }));
    await user.click(screen.getByRole('button', { name: /adjust bid/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const input = screen.getByLabelText(/your bid/i) as HTMLInputElement;
    expect(input.value).toBe('15400');
  });

  it('Cancel inside the modal returns focus to the Place bid trigger', async () => {
    const user = userEvent.setup();
    render(<BidPanel vehicle={vehicleFixture({ starting_bid: 14_500 })} now={NOW} />);
    await user.type(screen.getByLabelText(/your bid/i), '15200');
    const trigger = screen.getByRole('button', { name: /place bid/i });
    await user.click(trigger);
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /cancel/i }));
    expect(trigger).toHaveFocus();
  });

  it('does not call submitBid when client-side validation fails (button disabled)', async () => {
    const user = userEvent.setup();
    render(<BidPanel vehicle={vehicleFixture({ starting_bid: 14_500 })} now={NOW} />);
    await user.type(screen.getByLabelText(/your bid/i), '0');
    const placeBid = screen.getByRole('button', { name: /place bid/i });
    expect(placeBid).toBeDisabled();
    await user.click(placeBid);
    expect(submitBidMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('blocks a synchronous double-fire of Confirm bid via the submittingRef guard', async () => {
    const user = userEvent.setup();
    submitBidMock.mockReturnValue({
      ok: true,
      bid: {
        vehicleId: 'v-1',
        bidderId: 'b-1',
        amount: 15_200,
        placedAt: new Date(NOW).toISOString(),
      },
    });
    render(<BidPanel vehicle={vehicleFixture({ starting_bid: 14_500 })} now={NOW} />);
    await user.type(screen.getByLabelText(/your bid/i), '15200');
    await user.click(screen.getByRole('button', { name: /place bid/i }));
    const confirm = screen.getByRole('button', { name: /confirm bid/i });
    // Simulate a double-click that lands before React commits the disabled prop.
    confirm.click();
    confirm.click();
    expect(submitBidMock).toHaveBeenCalledTimes(1);
  });

  it('shows an inline error when the typed amount exceeds MAX_BID', async () => {
    const user = userEvent.setup();
    render(<BidPanel vehicle={vehicleFixture({ starting_bid: 14_500 })} now={NOW} />);
    // MAX_BID is 10_000_000; type something past it.
    await user.type(screen.getByLabelText(/your bid/i), '99999999');
    expect(screen.getByText(/bids cap at \$10,000,000/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /place bid/i })).toBeDisabled();
  });

  it('focuses the SuccessPanel "Place another bid" button on a successful submit', async () => {
    const user = userEvent.setup();
    submitBidMock.mockReturnValueOnce({
      ok: true,
      bid: {
        vehicleId: 'v-1',
        bidderId: 'b-1',
        amount: 15_200,
        placedAt: new Date(NOW).toISOString(),
      },
    });
    render(<BidPanel vehicle={vehicleFixture({ starting_bid: 14_500 })} now={NOW} />);
    await user.type(screen.getByLabelText(/your bid/i), '15200');
    await user.click(screen.getByRole('button', { name: /place bid/i }));
    await user.click(screen.getByRole('button', { name: /confirm bid/i }));

    // Allow the queueMicrotask focus call to flush.
    await new Promise((resolve) => queueMicrotask(() => resolve(undefined)));
    expect(screen.getByRole('button', { name: /place another bid/i })).toHaveFocus();
  });
});
