# Smart City Demo Dashboard

An interactive smart city simulation built with HTML, CSS, and JavaScript. One map holds a city, a mega airport, an elevated train, a river ferry, a small town, a village, farms and remote utilities: 533 deployed demo devices, building interiors, live power and weather, and guided scenarios. Every Milesight sensor and IRIV controller is installed where it would really go.

**[Open the live demo](https://dineshpalsingh1989.github.io/demodashboard/)**

## IRIV films and pages

Click **IRIV films** in the top bar of the dashboard to open all of these, or use the links below.

| | Page | Film |
|---|---|---|
| **IRIV EdgeAI CM5** | [Tour](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-edgeai/): a camera-first film, a live AI demo of a bottle inspection line and an ANPR gate, every port, compatible Cytron cameras, lights and parts | [MP4 · 2 min 9 s](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-edgeai/IRIV-EdgeAI-CM5-tour.mp4) |
| **IRIV PiControl** | [Tour](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-pi/): an interactive map of every pin and port, 49 compatible Cytron parts by port, a system builder that checks port limits, and ready-made parts lists | [MP4 · 1 min 45 s](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-pi/IRIV-PiControl-tour.mp4) |
| **All IRIV controllers** | [Compare page](https://dineshpalsingh1989.github.io/demodashboard/iriv-controllers/): PiControl, IO Controller and EdgeAI CM5 side by side, a "Which IRIV do I need?" picker and how they work together | both films |

Both films have English narration, short captions, chapter buttons and a transcript. Every IRIV device panel in the dashboard also has a **Watch the tour film** card.

## What is on the map

| Place | What you can do |
|---|---|
| **City** | 25 districts with building interiors, a smart car park (pay by plate), shops, a transport hub, a factory, a substation, a hospital, a school, energy and water. |
| **Mega Airport** (east of the city) | Planes land, taxi to four gates, unload, board, push back and take off on a live schedule. A baggage tractor and fuel truck serve each plane. Go inside the full-size terminal: check-in, security, gates with the apron view, food court, duty free, lounge, immigration and baggage claim. The control centre has a video wall. The car park reads plates at the entry barrier and counts cars in. |
| **Metro Loop** | An elevated train circles the city and the airport, stopping at five stations. Every platform and the train show the next stop. Click **Ride the train** to follow it. |
| **River Ferry** | A water bus calls at three quays, with next-ferry screens. A storm suspends it. |
| **Small town, village and farms** | The small town has its own gateway, shops, school and water tank. The village has a school you can enter, timber homes and a solar-pumped pond. Farm belts line the highway. |
| **Bus stops** | Five stops with live arrival signs, passenger counters and SOS buttons. |
| **Regional power grid** | A 132 kV line runs from the city substation to the airport, small town, village and farm pumps, with a live load at each substation. |
| **Weather** | The sun button cycles auto, rain, storm and clear. A storm closes the runway, delays flights and stops the ferry. |

## Explore the demo

- Search for districts, devices, and scenarios using the search button or `/`.
- Click **IRIV units** on the map toolbar to list every IRIV unit and fly to where it is installed.
- Click buildings and device markers for details, or start the guided tour.
- Drag the map to move; Shift-drag to rotate. Scroll or use the map controls to zoom.
- Scroll, zoom buttons and keyboard controls share a 35–500% range. Resetting the view, choosing a district or starting a tour exits walk mode.
- Enter walk mode to explore at street level, visit shops, or follow the highway to the small town and farms.
- Switch between day and night, toggle device markers, and enable optional narration.
- Turn on **Traffic** to colour every lane by live speed (green free-flowing, amber slow, red queued), with arrows moving in the direction of travel. Cars brake gradually for red lights, keep a safe gap, and show brake lights as queues build and clear.
- Try emergency response, flash flood, power cut, irrigation, water treatment, and power grid scenarios. The power-cut scenario also greys out the regional lines.
- Search for the **City Power Station** or **Water Treatment** to follow a remote **50 MW power station** and **1,000 m³/h water treatment plant** feeding the city. Yellow lines carry power, blue lines carry treated water, and brown lines return wastewater.
- Open the [Milesight collection](https://dineshpalsingh1989.github.io/demodashboard/#milesight) for eight additional models, or choose **Project → Explore 8 new Milesight products**.
- Open any IRIV PiControl, IO Controller or EdgeAI device to see what it is wired to, the automation rules it runs (live), its MQTT messages and health, and where else the model is installed. Test its outputs, or cut its network to compare how each controller behaves offline. EdgeAI panels start with a live camera view, since cameras and CCTV analytics are their main job.
- Run the water-leak and cold-storage response scenarios. Search for bin fill, pipe pressure, desk occupancy, classroom sound, solar irrigation, or the SG50 farm gateway.

All readings, events, flights, trains, and device quantities are simulated for demonstration. This dashboard does not connect to live city systems or flight data.

## Run locally

Open `index.html` directly in a modern browser, or use Node.js:

```sh
node serve.js
```

Then visit `http://localhost:8080`. No package installation or build step is required.

Smoke test (needs Chrome): `node tools/check-dashboard.cjs`. It opens every district, the airport and its rooms, the ferry, the grid, the weather, the IRIV films panel and the scenarios, and fails on any page error.

The IRIV films include English narration, short captions, chapter navigation and a transcript. The EdgeAI inspection demo follows one bottle through detection, a missing-cap decision and rejection, with pause, replay and individual stage controls. Demonstration results are simulated.

To rebuild the films on Windows with Chrome installed:

```powershell
powershell -NoProfile -File tools/build-iriv-narration.ps1
node tools/build-iriv-videos.cjs
```

Edit each tour's `narration.json` for the spoken script and short on-screen descriptions. The narration build uses the installed Windows English voice, then creates matching scene timing, WAV audio and VTT captions. The video build embeds AAC narration in the 1080p MP4s and refreshes the posters. `node tools/build-iriv-videos.cjs --preview` checks the source scenes without encoding, and `--check` verifies the finished films; previews go in `.tmp/`.

## Performance

The map is drawn on a canvas that is fully redrawn every frame, so most of the work happens on the GPU. To keep selecting, panning, and the camera fly-to smooth on laptop graphics:

- Building wall outlines are drawn only when zoomed in far enough to see them, and roof outlines stay thinner than one device pixel.
- Poles, tree trunks, and wires are drawn as thin filled shapes, which the GPU handles faster than strokes.
- Objects outside the visible area are skipped, and small decor (car-park cars, rail pillars) is hidden when zoomed far out.
- On slower machines, the map automatically switches from 1.5× to 1× pixel density after about two seconds below 25 fps.
- Hover checks run at most once per frame.
- The top bar, side panel, and other overlays are solid rather than frosted glass, because a blur over the moving map has to be recalculated every frame.

## Files

- `index.html` — city simulation, device content, and interface markup
- `ui.css` — responsive interface styles
- `ui.js` — search, IRIV films panel, keyboard access, camera controls, and preferences
- `milesight-devices.js` — additional products, room placements, and leak/cold-storage scenarios
- `utilities.js` — remote power and water facilities, supply routes, and simulated capacity readings
- `weather.js` — rain, storm and clear weather and the toolbar button
- `airport.js` — Mega Airport, the live flight schedule, the full-size terminal, the car park and the Metro Loop
- `power-grid.js` — regional 132 kV lines, substations and live loads
- `ferry.js` — the river ferry, its quays and devices
- `device-insights.js` — IRIV device panels: connection map, live rules, MQTT feed, health, output tests, network failover, camera view, and model comparison
- `images/` — device illustrations and product photos
- `serve.js` — optional local preview server with range requests for video
- `iriv-controllers/` — one page for all IRIV controllers: films, comparison, picker and "better together" examples
- `short-video-of-iriv-edgeai/` — IRIV EdgeAI CM5 tour: film, live AI demo (`demo.js`), port data, compatible Cytron cameras and parts, and the rendered MP4
- `short-video-of-iriv-pi/` — IRIV PiControl tour page, film renderer (`film.js`), pin data (`data.js`), compatible Cytron parts and system recipes (`connect.js`), and the rendered MP4
- `iriv-tour-media.js` / `.css` — shared player, footer, end card and MP4 export for both tours
- `tools/` — smoke test (`check-dashboard.cjs`), film and narration builders, and the vendored MP4 muxer

## GitHub Pages

GitHub Pages publishes branch `main` from `/ (root)`. Pushing changes to `main` updates the live demo automatically. The `.nojekyll` file lets GitHub serve the static files directly.

## Product references

The demo includes Milesight and IRIV product names and supplied product images. Those names, trademarks, and images belong to their respective owners. Their inclusion is for demonstration and does not imply endorsement.

See [Milesight product references](MILESIGHT_PRODUCTS.md) for the added models, selected variants, official sources, and illustration credits.
