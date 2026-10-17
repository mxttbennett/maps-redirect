# maps-redirect

A userscript for iPhone and iPad Safari that opens Google Maps links in Apple Maps.

It does two things:

- **Redirects** a Google Maps page to Apple Maps as soon as it starts loading.
- **Rewrites** Google Maps links on every other site to Apple Maps links. A tap on a short link (`maps.app.goo.gl`) is intercepted, resolved to its full URL, then opened in Apple Maps.

## Install

1. Install [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) and finish its setup.
2. Enable it in Settings > Apps > Safari > Extensions, and choose **Allow on All Websites**.
3. Open the [install link](https://raw.githubusercontent.com/mxttbennett/maps-redirect/main/dist/maps-redirect.user.js) in Safari, tap **Aa** > Userscripts, and install the detected script.

The script updates itself from the same link.

## Supported links

| Google Maps form | Apple Maps result |
| --- | --- |
| `google.com/maps?q=...`, `maps.google.com/?q=...` | search (`q`) |
| `/maps/place/<name>/@lat,lng,...` | search with center (`q`, `ll`), using `!3d!4d` coordinates when present |
| `/maps/@lat,lng,<zoom>z` | map view (`ll`, `z`) |
| `/maps/search/<query>/@lat,lng,...`, `?api=1&query=` | search (`q`, `ll`, `z`) |
| `/maps/dir/<from>/<to>/...`, `/maps/dir//<to>` | directions (`saddr`, `daddr`), empty origin means current location |
| `?saddr=&daddr=`, `?api=1&origin=&destination=` | directions |
| `!3e0`, `!3e2`, `!3e3` or `travelmode` | driving, walking, transit (`dirflg`) |
| `maps.app.goo.gl/...`, `goo.gl/maps/...` | resolved, then mapped as above |

Country domains such as `google.co.uk` work too.

Limits:

- Multi-stop routes keep only the first and last stop.
- Cycling has no Apple Maps flag, so it opens as a default route.
- Links with no destination or coordinates (`?cid=`, `/maps/embed`, My Maps) stay in Google Maps.

Page redirects use the `maps://` scheme so the Maps app opens directly. Rewritten links use `https://maps.apple.com`, which opens the Maps app through universal links.

## Turn it off

Disable the script in the Userscripts extension popup (Aa > Userscripts).

## Develop

```bash
npm test
npm run build
```

`src/mapper.js` holds the URL mapping and is unit tested. `src/main.js` holds the browser behavior. `npm run build` writes `dist/maps-redirect.user.js`, which is committed.
