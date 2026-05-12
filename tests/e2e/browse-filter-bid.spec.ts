import { expect, test } from '@playwright/test';

// Happy path: visit /, search "Toyota", click into a live Toyota, place a
// valid bid in the panel, confirm in the modal, see the success state, and
// verify the bid history reflects it.
//
// The 200-vehicle dataset is median-anchor normalized at module init: every
// auction_start is shifted so the dataset's median lands on "now". The seven
// Toyotas all sit far enough from the dataset median that none would be live
// at the moment of page load on a real clock. We pin Playwright's clock at
// install time and advance it past the median window so a Toyota whose
// original auction_start is ~+49h from the dataset median moves into the
// live window — making the bid flow deterministic against a committed JSON.
test('browse → filter → bid → confirm → see updated state', async ({ page }) => {
  // Fresh bid storage every run so success assertions are deterministic.
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem('the-block:bids');
      window.localStorage.removeItem('the-block:bidder-id');
    } catch {
      // Ignore — storage may be unavailable on the about:blank initial page.
    }
  });

  // Pin the clock at the dataset's median timestamp so the median-anchor
  // offset captured by dataStore is exactly zero — vehicles keep their
  // original auction_start values.
  const datasetMedian = new Date('2026-04-03T21:00:00Z').getTime();
  await page.clock.install({ time: datasetMedian });

  await page.goto('/');

  // Wait for the grid to mount (confirms the inventory chunk loaded and the
  // dataStore captured offset = 0 at the median time).
  const grid = page.getByRole('region', { name: /vehicle listings/i });
  await expect(grid).toBeVisible();

  // Advance the clock past the median by ~50.5h so the 2022 Toyota Tundra
  // (original auction_start = median + 49h) is mid-auction — 1.5h elapsed,
  // 2.5h remaining. Use fastForward to bump the simulated clock without
  // firing 181k setInterval ticks, then runFor a single second so useNow
  // picks up the new "now" on its next tick.
  await page.clock.fastForward('50:30:00');
  await page.clock.runFor(1000);

  const search = page.getByRole('searchbox', { name: /search/i });
  await search.fill('Toyota');

  // SearchBar debounces URL writes by 200ms (useFilters serializes search
  // under the short `q` param). Wait for the URL to reflect the new filter.
  await page.waitForURL(/[?&]q=Toyota/i);

  // Pick the first Toyota card. With the clock advanced, the ending-soon
  // sort puts the still-live Toyotas at the top.
  const toyotaCards = grid.getByRole('link');
  const firstToyota = toyotaCards.first();
  await expect(firstToyota).toContainText(/toyota/i);
  await firstToyota.click();

  // Detail page lands.
  await expect(page.getByRole('region', { name: /image gallery/i })).toBeVisible();
  await expect(page.getByRole('region', { name: /bid panel/i })).toBeVisible();

  const bidInput = page.getByLabel('Your bid', { exact: true });
  await expect(bidInput).toBeVisible();

  // Placeholder is the suggested minimum bid in en-CA locale format.
  const placeholder = await bidInput.getAttribute('placeholder');
  const minBid = Number((placeholder ?? '0').replace(/[^\d]/g, ''));
  expect(minBid).toBeGreaterThan(0);
  const ourBid = minBid + 500;

  await bidInput.fill(String(ourBid));

  const placeBidButton = page.getByRole('button', { name: /place bid/i });
  await expect(placeBidButton).toBeEnabled();
  await placeBidButton.click();

  // Confirmation modal opens; confirm the bid.
  const modal = page.getByRole('dialog', { name: /confirm your bid/i });
  await expect(modal).toBeVisible();
  await modal.getByRole('button', { name: /confirm bid/i }).click();

  // Success state replaces the form. The app renders CAD as a bare "$" plus
  // a grouped integer.
  const formattedBid = `$${new Intl.NumberFormat('en-CA', { maximumFractionDigits: 0 }).format(
    ourBid,
  )}`;

  // SuccessPanel uses <output aria-live="polite"> → implicit role=status.
  const successPanel = page.getByRole('status').first();
  await expect(successPanel).toContainText(/you're the high bidder/i);
  await expect(successPanel).toContainText('Bid placed:');
  await expect(successPanel).toContainText(formattedBid);

  // Bid history lists the bid we just placed. Scope to the bid history
  // heading's parent panel so we don't accidentally match the success panel.
  const historyHeading = page.getByRole('heading', { name: /your bid history/i });
  await expect(historyHeading).toBeVisible();
  const historyPanel = historyHeading.locator('..');
  await expect(historyPanel.getByText(formattedBid)).toBeVisible();
});
