# Origin Hotel asset sources

## Photography

Hotel photography is selected from Unsplash image pages and rendered from the corresponding
`images.unsplash.com` CDN URLs. The public image links live in the code so visitors can follow the
photo source: marketing photos in `src/data/marketing.ts` (`PHOTOS`), room-type photos in
`src/services/imageUtils.ts` (`roomPhotoForType`).

| Where it is used | Unsplash photo id | Subject |
| --- | --- | --- |
| Hero, social sharing image | `photo-1564501049412-61c2a3083791` | Hotel exterior and pool at dusk |
| Login split screen | `photo-1660557989695-14fac79c086d` | Lobby with designer furniture |
| About collage, gallery | `photo-1445019980597-93fa8acb246c` | Lounge / seating area |
| Gallery | `photo-1566665797739-1674de7a421a` | Suite |
| CTA band, gallery | `photo-1582719478250-c89cae4dc85b` | Presidential room |
| Gallery | `photo-1564078516393-cf04bd966897` | Family room |
| Standard room | `photo-1611892440504-42a792e24d32` | Bedroom |
| Deluxe room | `photo-1590490360182-c33d57733427` | Bedroom with garden view |

Photographer pages from the original selection:

- Lobby with designer furniture and wood walls — [Unsplash photo page](https://unsplash.com/photos/zSG-kd-L6vw), photographer Frames For Your Heart.
- Marble reception desk with gold trim — [Unsplash photo page](https://unsplash.com/photos/8BYahZcwYgI), photographer Dylan Calluy.
- White hotel bed linen — [Unsplash photo page](https://unsplash.com/photos/Yrxr3bsPdS0), photographer Vojtech Bruzek.
- Hotel bedroom with wooden bed and garden view — [Unsplash photo page](https://unsplash.com/photos/T5pL6ciEn-I), photographer visualsofdana.
- Sunlight through curtains in a hotel room — [Unsplash photo page](https://unsplash.com/photos/NIbUk7ATSuw), photographer Hiram Huang.
- Bedroom with sectional sofa — [Unsplash photo page](https://unsplash.com/photos/emqnSQwQQDo), photographer Roberto Nickson.
- Swimming pool surrounded by palm trees — [Unsplash photo page](https://unsplash.com/photos/_pPHgeHz1uk), photographer Valeriia Bugaiova.
- Hotel lobby with a sleek reception desk — [Unsplash photo page](https://unsplash.com/photos/Accg0bUgp7k), photographer Aalo Lens.

Collections consulted: [Unsplash hotel lobby](https://unsplash.com/s/photos/hotel-lobby) and
[Unsplash hotel rooms](https://unsplash.com/s/photos/hotel-room).

Every image on the landing page is requested with `srcset`/`sizes` so phones download a small
variant, and with `width`/`height` so the layout does not shift while a photo loads.

## Location panel

The location panel uses an inline SVG street-map illustration with an approximate demo marker in
central Tashkent, so the page has no blank or slow third-party map frame. The “Xaritani ochish” link
opens [OpenStreetMap](https://www.openstreetmap.org/?mlat=41.3111&mlon=69.2797#map=14/41.3111/69.2797).
The address, phone number and coordinates are placeholders: replace the marker, the address in
`src/data/marketing.ts` (`HOTEL`) and the JSON-LD block in `index.html` with the hotel's verified
details before public launch.
