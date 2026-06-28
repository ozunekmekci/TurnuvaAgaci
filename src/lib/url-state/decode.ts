import LZString from 'lz-string';

/**
 * Decodes a compressed URL-safe string back into the user picks object.
 * Returns an empty object if the input is empty or invalid.
 *
 * @param compressed The compressed string from URL parameter 'p'
 */
export function decodeUserPicks(compressed: string | null | undefined): Record<string, string> {
  if (!compressed) {
    return {};
  }

  try {
    const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
    if (!decompressed) {
      return {};
    }
    const parsed = JSON.parse(decompressed);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, string>;
    }
    return {};
  } catch (error) {
    console.error('Error decoding user picks from URL:', error);
    return {};
  }
}
