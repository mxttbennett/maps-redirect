# maps-redirect

Opens Google Maps links in Apple Maps on iPhone and iPad Safari. It ships two ways:

- **Safari extension** (`MapsRedirect.xcodeproj`): an iOS app with a Safari Web Extension. Redirects happen before the Google page loads, and the app has an on/off toggle and setup steps.
- **Userscript** (`dist/maps-redirect.user.js`): the same logic for the [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) app, with no Xcode or signing needed.

Both redirect a Google Maps page to Apple Maps and rewrite Google Maps links on other sites. Tapping a short link (`maps.app.goo.gl`) resolves it first, then opens Apple Maps.

## Safari extension

### Build

Requires Xcode 26 or later (built with Xcode 27) and [XcodeGen](https://github.com/yonaskolb/XcodeGen) (only if you change `project.yml`).

```bash
xcodebuild -project MapsRedirect.xcodeproj -scheme MapsRedirect \
  -destination 'platform=iOS Simulator,name=iPhone 17 Pro' build
```

To run on a device, open the project in Xcode and set your team under Signing & Capabilities for both targets. The app and extension share the App Group `group.com.mxttbennett.MapsRedirect`, so change it if your team cannot use that identifier.

### Enable

1. Install and open the app.
2. Open Settings > Apps > Safari > Extensions (iOS 17: Settings > Safari > Extensions).
3. Tap Maps Redirect, switch on **Allow Extension**, and set **All Websites** to **Allow**.

The switch in the app turns redirects on or off. It takes effect the next time Safari loads a page.

### How it works

- `WebExtension/rules.json` holds declarative redirect rules for the common forms (search, directions). They redirect before the page loads. `npm run build` regenerates the file from `scripts/build-rules.js`.
- A content script (`src/mapper.js`, `src/page.js`, `WebExtension/content.js`) handles everything the rules skip: place and coordinate links, multi-stop routes and in-page links.
- `WebExtension/background.js` asks the app for the toggle state and resolves short links.
- Short links that you open directly land on a Google Maps page first, then the content script redirects.

## Userscript

1. Install [Userscripts](https://apps.apple.com/us/app/userscripts/id1463298887) and finish its setup.
2. Enable it in Settings > Apps > Safari > Extensions, and choose **Allow on All Websites**.
3. Open the [install link](https://raw.githubusercontent.com/mxttbennett/maps-redirect/main/dist/maps-redirect.user.js) in Safari, tap **Aa** > Userscripts, and install the detected script.

The script updates itself from the same link. Disable it in the Userscripts popup to turn it off.

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

The extension always targets `https://maps.apple.com`. The userscript uses `maps://` for page redirects, so the Maps app opens directly, and `https://maps.apple.com` for rewritten links.

## Develop

```bash
npm test
npm run build
```

`src/mapper.js` holds the URL mapping and is unit tested. A second test checks that the redirect rules agree with the mapper. `src/page.js` holds the page behavior shared by both targets. `npm run build` writes `dist/maps-redirect.user.js` and `WebExtension/rules.json`; both are committed.

## Verification

Checked in the iOS Simulator (iPhone 17 Pro) with the extension allowed on all websites:

- A directions link (`/maps/dir/Boston,+MA/New+York,+NY/...!3e0`) opened Apple Maps with Boston to New York driving directions.
- A place link with `!3d!4d` coordinates opened Apple Maps on Joe's Pizza at the exact coordinates.
- With the app toggle off, a Google Maps place link stayed in Safari.

The app also builds and launches on an iPad simulator. Short-link resolution is covered by the shared code path but was not exercised against a live `maps.app.goo.gl` link.
