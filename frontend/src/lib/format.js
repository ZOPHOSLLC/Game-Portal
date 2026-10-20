// 1234567 -> "1.2M". Used for likes and dislikes so long numbers stay short.
const compact = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
export const formatCount = (n) => compact.format(n);

// "https://en.wikipedia.org/wiki/X" -> "wikipedia.org" (the label shown for a wiki link).
export function hostLabel(url) {
  try {
    return new URL(url).hostname.replace(/^(www|en)\./, '');
  } catch {
    return url;
  }
}
