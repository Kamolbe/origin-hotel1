/** Embed Google Maps without exposing keys or embedding arbitrary websites. */
export function mapPreviewUrl(link: string, address: string, saved?: string) {
  try {
    const stored = saved ? new URL(saved) : null;
    if (stored?.protocol === 'https:' && stored.hostname === 'www.google.com' && stored.pathname.startsWith('/maps')) return stored.href;
    const url = new URL(link);
    if (['google.com', 'www.google.com', 'maps.google.com', 'google.uz', 'www.google.uz', 'www.google.co.uk'].includes(url.hostname)) {
      if (url.pathname.startsWith('/maps/embed') && url.searchParams.has('pb')) return `https://www.google.com/maps/embed?${new URLSearchParams({ pb: url.searchParams.get('pb')! })}`;
      if (url.searchParams.has('cid')) return `https://www.google.com/maps?${new URLSearchParams({ cid: url.searchParams.get('cid')!, output: 'embed' })}`;
      const decoded = decodeURIComponent(url.href);
      const coords = decoded.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/) ?? decoded.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      const place = url.pathname.match(/\/maps\/(?:place|search)\/([^/]+)/);
      const query = url.searchParams.get('query_place_id') ? `place_id:${url.searchParams.get('query_place_id')}` : coords ? `${coords[1]},${coords[2]}` : url.searchParams.get('query') || url.searchParams.get('q') || url.searchParams.get('ll') || (place ? decodeURIComponent(place[1]).replace(/\+/g, ' ') : '');
      if (query) return `https://www.google.com/maps?${new URLSearchParams({ q: query, z: '16', output: 'embed' })}`;
    }
  } catch { /* An address preview remains available for non-Google map links. */ }
  return `https://www.google.com/maps?${new URLSearchParams({ q: address, z: '16', output: 'embed' })}`;
}
