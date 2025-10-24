import type React from 'react';

export type OptimizedImageSource = {
  src: string;
  srcSet?: string;
};

export const handleCaseImageError = (
  event: React.SyntheticEvent<HTMLImageElement, Event>
) => {
  const image = event.currentTarget;
  const originalSrc = image.dataset.originalSrc;

  if (originalSrc && image.src !== originalSrc) {
    image.src = originalSrc;
    image.srcset = '';
    return;
  }

  image.onerror = null;
  image.srcset = '';
};

const CLEARBIT_HOST = 'logo.clearbit.com';
const DEFAULT_CLEARBIT_SIZE = 1200;
const RETINA_CLEARBIT_SIZE = 2400;

const createSizedClearbitUrl = (url: URL, size: number) => {
  const sizedUrl = new URL(url.toString());
  sizedUrl.searchParams.set('size', String(size));
  if (!sizedUrl.searchParams.get('format')) {
    sizedUrl.searchParams.set('format', 'png');
  }
  return sizedUrl.toString();
};

export const getOptimizedCaseImage = (url?: string | null): OptimizedImageSource | null => {
  if (!url) {
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.hostname !== CLEARBIT_HOST) {
      return { src: url };
    }

    const requestedSize = Number(parsedUrl.searchParams.get('size'));
    const baseSize = Number.isFinite(requestedSize) && requestedSize > 0
      ? Math.max(requestedSize, DEFAULT_CLEARBIT_SIZE)
      : DEFAULT_CLEARBIT_SIZE;

    const primarySrc = createSizedClearbitUrl(parsedUrl, baseSize);
    const retinaSrc = createSizedClearbitUrl(parsedUrl, Math.max(baseSize * 2, RETINA_CLEARBIT_SIZE));

    return {
      src: primarySrc,
      srcSet: `${primarySrc} 1x, ${retinaSrc} 2x`,
    };
  } catch (error) {
    console.warn('Failed to optimize image url', { url, error });
    return { src: url };
  }
};
