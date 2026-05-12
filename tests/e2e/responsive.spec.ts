import { expect, test } from '@playwright/test';

// 375x667 is the iPhone SE / 8 viewport — the smallest target a desktop-first
// design needs to handle gracefully on mobile review.
test.use({ viewport: { width: 375, height: 667 } });

test('mobile (375x667): grid stacks single-column and triptych stacks vertically', async ({
  page,
}) => {
  await page.goto('/');

  // Inventory grid: the listings region is rendered with grid-cols-1 as the
  // base utility (responsive larger breakpoints are gated behind sm:/lg:).
  // Visually verify by reading offsetWidth of two adjacent cards — both should
  // span the same column at this viewport, so they share the same x position.
  const grid = page.getByRole('region', { name: /vehicle listings/i });
  await expect(grid).toBeVisible();
  const cards = grid.getByRole('link');
  await expect(cards.first()).toBeVisible();

  const positions = await cards.evaluateAll((nodes) =>
    nodes.slice(0, 2).map((n) => {
      const r = (n as HTMLElement).getBoundingClientRect();
      return { x: Math.round(r.x), width: Math.round(r.width) };
    }),
  );
  expect(positions.length).toBe(2);
  // Same x = same column → single-column stack at this viewport.
  expect(positions[0]?.x).toBe(positions[1]?.x);

  // Navigate to a detail page by clicking the first card.
  await cards.first().click();

  // Triptych above the fold should stack: gallery, then condition panel.
  // We assert vertical stacking by reading the bounding rects of the gallery
  // region and the bid panel region — the bid panel's top should be greater
  // than the gallery's bottom (i.e. they are not side-by-side on this viewport).
  const gallery = page.getByRole('region', { name: /image gallery/i });
  const bidPanel = page.getByRole('region', { name: /bid panel/i });
  await expect(gallery).toBeVisible();
  await expect(bidPanel).toBeVisible();

  const galleryBox = await gallery.boundingBox();
  const bidBox = await bidPanel.boundingBox();
  expect(galleryBox).not.toBeNull();
  expect(bidBox).not.toBeNull();
  if (galleryBox && bidBox) {
    expect(bidBox.y).toBeGreaterThanOrEqual(galleryBox.y + galleryBox.height - 1);
  }
});
