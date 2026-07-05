/**
 * Encodes a Set of skipped activity IDs to a URL-safe string.
 * Returns empty string for empty set.
 */
export function encodeSkipped(skipped: Set<string>): string {
  return [...skipped].join(',')
}

/**
 * Decodes a comma-separated string of activity IDs back to a Set.
 * Returns empty Set for empty/null string.
 */
export function decodeSkipped(value: string): Set<string> {
  if (!value) return new Set()
  return new Set(value.split(',').filter(Boolean))
}

/**
 * Reads the current `?skip=...` URL parameter and returns the skipped IDs as a Set.
 */
export function getSkippedFromUrl(): Set<string> {
  const params = new URLSearchParams(window.location.search)
  return decodeSkipped(params.get('skip') ?? '')
}

/**
 * Writes the skipped IDs to the URL without reloading the page.
 * Removes the `skip` param entirely when the set is empty.
 */
export function setSkippedToUrl(skipped: Set<string>): void {
  const url = new URL(window.location.href)
  if (skipped.size === 0) {
    url.searchParams.delete('skip')
  } else {
    url.searchParams.set('skip', encodeSkipped(skipped))
  }
  window.history.replaceState({}, '', url.toString())
}

/**
 * Builds a shareable URL string from the current page + a skipped IDs set.
 * Does not modify window.location.
 */
export function buildShareUrl(skipped: Set<string>): string {
  const url = new URL(window.location.href)
  if (skipped.size === 0) {
    url.searchParams.delete('skip')
  } else {
    url.searchParams.set('skip', encodeSkipped(skipped))
  }
  return url.toString()
}
