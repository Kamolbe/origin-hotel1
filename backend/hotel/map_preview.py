"""Build Google Maps embeds; only Google short-link hosts are fetched."""
import re
from urllib.parse import urlparse, parse_qs, unquote, urlencode, urljoin
import requests
from django.core.exceptions import ValidationError

SHORT_HOSTS = {'maps.app.goo.gl', 'goo.gl'}
GOOGLE_HOSTS = SHORT_HOSTS | {'google.com', 'www.google.com', 'maps.google.com', 'www.google.uz', 'google.uz', 'www.google.co.uk'}

def map_embed_url(raw, address=''):
    url = raw.strip()
    parsed = urlparse(url)
    if parsed.hostname in SHORT_HOSTS:
        try:
            for _ in range(5):
                parsed = urlparse(url)
                if parsed.scheme != 'https' or parsed.hostname not in GOOGLE_HOSTS or parsed.username or parsed.port not in (None,443):
                    raise ValidationError('Google Maps havolasini tekshiring.')
                if parsed.hostname not in SHORT_HOSTS: break
                with requests.get(url, allow_redirects=False, timeout=3, stream=True) as result:
                    if result.status_code not in (301,302,303,307,308) or not result.headers.get('Location'):
                        raise ValidationError('Google Maps qisqa havolasi ochilmadi. To‘liq joylashuv havolasini kiriting.')
                    url = urljoin(url,result.headers['Location'])
            else: raise ValidationError('Google Maps havolasi juda ko‘p yo‘naltirmoqda.')
        except requests.RequestException:
            raise ValidationError('Google Maps havolasini ochib bo‘lmadi. To‘liq joylashuv havolasini kiriting.')
    parsed = urlparse(url)
    query = parse_qs(parsed.query)
    target = ''
    if parsed.hostname in GOOGLE_HOSTS:
        if parsed.path.startswith('/maps/embed') and query.get('pb'):
            return 'https://www.google.com/maps/embed?' + urlencode({'pb':query['pb'][0]})
        if query.get('cid'):
            return 'https://www.google.com/maps?' + urlencode({'cid':query['cid'][0],'output':'embed'})
        decoded = unquote(url)
        coords = re.search(r'!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)',decoded) or re.search(r'@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)',decoded)
        target = next((query[key][0] for key in ('query','q','ll') if query.get(key)), '')
        if query.get('query_place_id'): target = 'place_id:' + query['query_place_id'][0]
        elif coords: target = ','.join(coords.groups())
        if not target:
            place = re.search(r'/maps/(?:place|search)/([^/]+)',parsed.path)
            if place: target = unquote(place[1]).replace('+',' ')
    target = target or address.strip()
    return 'https://www.google.com/maps?' + urlencode({'q':target,'z':16,'output':'embed'}) if target else ''
