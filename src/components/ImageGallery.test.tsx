import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ImageGallery } from './ImageGallery';

const IMAGES = ['/a.jpg', '/b.jpg', '/c.jpg'];
const TITLE = '2019 Honda Civic';

function hero(): HTMLImageElement {
  return screen.getByTestId('gallery-hero') as HTMLImageElement;
}

describe('ImageGallery', () => {
  it('renders the first image as the hero by default', () => {
    render(<ImageGallery images={IMAGES} title={TITLE} />);
    expect(hero()).toHaveAttribute('src', '/a.jpg');
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('swaps the hero when a thumbnail is clicked', async () => {
    const user = userEvent.setup();
    render(<ImageGallery images={IMAGES} title={TITLE} />);
    await user.click(screen.getByRole('tab', { name: /view 3 of 3/i }));
    expect(hero()).toHaveAttribute('src', '/c.jpg');
    expect(screen.getByText('3 / 3')).toBeInTheDocument();
  });

  it('navigates to the next image with the right arrow key on a focused thumbnail', async () => {
    const user = userEvent.setup();
    render(<ImageGallery images={IMAGES} title={TITLE} />);
    screen.getByRole('tab', { name: /view 1 of 3/i }).focus();
    await user.keyboard('{ArrowRight}');
    expect(hero()).toHaveAttribute('src', '/b.jpg');
  });

  it('wraps to the last image when left arrow is pressed from the first', async () => {
    const user = userEvent.setup();
    render(<ImageGallery images={IMAGES} title={TITLE} />);
    screen.getByRole('tab', { name: /view 1 of 3/i }).focus();
    await user.keyboard('{ArrowLeft}');
    expect(hero()).toHaveAttribute('src', '/c.jpg');
  });

  it('falls back to a placeholder when the hero image fails to load', () => {
    render(<ImageGallery images={IMAGES} title={TITLE} />);
    fireEvent.error(hero());
    expect(screen.getByLabelText(/image unavailable for 2019 Honda Civic/i)).toBeInTheDocument();
  });

  it('renders a "no photos on file" placeholder when no images are provided', () => {
    render(<ImageGallery images={[]} title={TITLE} />);
    expect(screen.getByLabelText(/no photos on file for 2019 Honda Civic/i)).toBeInTheDocument();
    expect(screen.getByText('0 photos')).toBeInTheDocument();
  });

  it('hides the thumbnail strip when there is a single image', () => {
    render(<ImageGallery images={['/only.jpg']} title={TITLE} />);
    expect(hero()).toHaveAttribute('src', '/only.jpg');
    expect(screen.getByText('1 / 1')).toBeInTheDocument();
    expect(screen.queryByRole('tablist')).not.toBeInTheDocument();
  });

  it('renders every image as a focusable thumbnail (not just the first five)', () => {
    const eight = Array.from({ length: 8 }, (_, i) => `/img-${i}.jpg`);
    render(<ImageGallery images={eight} title={TITLE} />);
    expect(screen.getAllByRole('tab')).toHaveLength(8);
  });
});
