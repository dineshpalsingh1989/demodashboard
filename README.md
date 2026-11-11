# Smart City Demo Dashboard — V2.0

An interactive smart city simulation built with HTML, CSS, and JavaScript. One map holds a city, a mega airport, an elevated train, a river ferry, a small town, a village, farms and remote utilities: hundreds of deployed demo devices, building interiors, simulated power and weather, and guided scenarios. Milesight sensors and IRIV controllers are placed in their intended demonstration settings.

**[Open the live demo](https://dineshpalsingh1989.github.io/demodashboard/)**

## What's new in V2.0

Released 11 November 2026. This update brings the map into 3D and adds more believable transport, waterfronts and street activity.

- **3D city and interiors:** shaded buildings, glass, rooftop details, trees, animated water, night lighting and weather. Scenic mode gives a clear view of the city.
- **Cars and trucks:** distinct sedans, SUVs, vans, buses and articulated trucks, with headlights, brake lights and indicators. Traffic follows the raised river bridge; warehouse trucks reverse into their dock.
- **Airport and waterfront:** detailed aircraft, landing gear and pushback tugs, apron equipment, runway lights, seawalls, rocks and shallow water. The ferry has a moving wake that stops while docked or during a storm.
- **Street life:** raised pavements, tactile corners, drains, entrances, shop signs and awnings. Visitors walk to buildings, passengers queue and board stopped buses, and ferry passengers use the gangway at the quay.
- **Warehouse Command 3D:** explore three warehouses with working forklifts, charging bays, collision controls and clickable demonstration sensors.
- **More monitoring:** restroom odour, lounge occupancy, refrigerated-trailer temperature and humidity, and factory PPE camera demonstrations.
- **Better navigation and checks:** searchable places, warehouse access, and automated dashboard, transport, place and performance checks.

See [CHANGELOG.md](CHANGELOG.md) for the release details. All activity and readings are simulated.

## IRIV films and pages

Click **IRIV films** in the top bar of the dashboard to open all of these, or use the links below.

| | Page | Film |
|---|---|---|
| **IRIV EdgeAI CM5** | [Tour](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-edgeai/): a camera-first film, a live AI demo of a bottle inspection line and an ANPR gate, every port, compatible Cytron cameras, lights and parts | [MP4 · 2 min 9 s](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-edgeai/IRIV-EdgeAI-CM5-tour.mp4) |
| **IRIV PiControl** | [Tour](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-pi/): an interactive map of every pin and port, 49 compatible Cytron parts by port, a system builder that checks port limits, and ready-made parts lists | [MP4 · 1 min 45 s](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-pi/IRIV-PiControl-tour.mp4) |
| **IRIV Edge dashboard** | [Tour](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-hub/): the dashboard itself, recorded from this demo: the map of every unit, wiring, live rules, MQTT messages, offline behaviour and the airport control centre. All readings are simulated. | [MP4 · 1 min 10 s](https://dineshpalsingh1989.github.io/demodashboard/short-video-of-iriv-hub/IRIV-Edge-dashboard-tour.mp4) |
| **All IRIV controllers** | [Compare page](https://dineshpalsingh1989.github.io/demodashboard/iriv-controllers/): PiControl, IO Controller and EdgeAI CM5 side by side, a "Which IRIV do I need?" picker and how they work together | both films |
| **Warehouse Command 3D** | [Open](https://dineshpalsingh1989.github.io/demodashboard/warehouse-3d/): a 3D view of three warehouses. Forklifts accelerate, brake, wait for free aisles, give way at aisle mouths and recharge on their bays. Turn **anti-collision off** to see them collide. All 30 sensors and cameras are installed and clickable (UG65, EM300-TH, TS302 cold room, EM300-SLD, AM319, VS133, WS101, WS558, CT101/CT105, EM400-TLD at each dock, IRIV EdgeAI CM5, PiControl and IO Controller MQTT). Night mode, heatmap, follow and 1–4× speed. All simulated. | none |

All three films have English narration, short captions, chapter buttons and a transcript. Every IRIV device panel in the dashboard also has a **Watch the tour film** card.

## What is on the map

| Place | What you can do |
|---|---|
| **City** | 25 districts with building interiors, a smart car park (pay by plate), shops, a transport hub, a factory, a substation, a hospital, a school, energy and water. |
| **Mega Airport** (east of the city) | Planes land, taxi to four gates, unload, board, push back and take off on a live schedule. A baggage tractor and fuel truck serve each plane. Go inside the full-size terminal: check-in, security, gates with the apron view, food court, duty free, lounge, immigration and baggage claim. The control centre has a video wall. The car park reads plates at the entry barrier and counts cars in. |
| **Metro Loop** | An elevated train circles the city and the airport, stopping at five stations. Every platform and the train show the next stop. Click **Ride the train** to follow it. |
| **Airport Logistics Hub** (south of the Metro Loop at the airport) | A smart warehouse with six docks, a cold store, a gate ANPR camera, dock door controller and trailer sensors. A truck drives in, docks and leaves. Its panel opens **Warehouse Command 3D** for the inside. |
| **River Ferry** | A water bus calls at three quays, with next-ferry screens. A storm suspends it. |
| **Small town, village and farms** | The small town has its own gateway, shops, school and water tank. The village has a school you can enter, timber homes and a solar-pumped pond. Farm belts line the highway. |
| **Bus stops** | Five stops with live arrival signs, passenger counters and SOS buttons. |
| **Regional power grid** | A 132 kV line runs from the city substation to the airport, small town, village and farm pumps, with a live load at each substation. |
| **Weather** | The sun button cycles auto, rain, storm and clear. A storm closes the runway, delays flights and stops the ferry. |

## Explore the demo

- **The map is 3D.** Buildings, lit windows at night, trees, power lines, traffic lights, moving cars, people, planes, the Metro Loop, the ferry, rain and storms. District pins and device icons are clickable. Device connections (sensor → gateway → IRIV Edge → cloud), the power and water routes, and each district's wiring are drawn as lines with moving packets, and **Traffic** colours every lane by speed. **Building interiors are 3D too**: click a building to walk into its room. Walk mode still uses the 2D street view. three.js loads from a CDN; without an internet connection the map falls back to 2D.
- Search for districts, devices, and scenarios using the search button or `/`.
- Click **IRIV units** on the map toolbar to list every IRIV unit and fly to where it is installed.
- Click buildings and device markers for details, or start the guided tour.
- Drag the map to move; Shift-drag to rotate. Scroll or use the map controls to zoom.
- Scroll, zoom buttons and keyboard controls share a 35–500% range. Resetting the view, choosing a district or starting a tour exits walk mode.
- Enter walk mode to explore at street level, visit shops, or follow the highway to the small town and farms.
- Switch between day and night, toggle device markers, and enable optional narration.
- **Scenic** hides district pins, sensor links and dashboard overlays while keeping the map interactive. Switch it off to restore the device map.
- Native 3D transport includes sedans, SUVs, vans, buses, articulated trucks, aircraft with landing gear and pushback tugs, and a ferry with a moving wake. The river bridge has raised approaches and clearance for the ferry; highway traffic follows the road elevation.
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

Transport check (needs Chrome): `node tools/check-transport.cjs`. Checks native models, bridge clearance, continuity of the truck docking path, ferry wakes in clear/storm weather, pushback tugs, Scenic mode and mobile controls. Screenshots are saved to `.tmp/transport/`.

Place check (needs Chrome): `node tools/check-places.cjs`. It visits all 72 places on the 3D map, clicks each pin, walks into every room and checks the devices and connection lines, with a screenshot per room in `.tmp/places/`. The `map-spy` agent (`.claude/agents/map-spy.md`) runs it, reviews the room screenshots and reports problems.

Lag check (needs Chrome and a GPU): `node tools/check-performance.cjs`. It measures how fast the 3D map and Warehouse Command 3D open and how smooth they run, compares with the last run and fails if a budget is missed. In Claude Code, the `lag-monitor` agent (`.claude/agents/lag-monitor.md`) runs it and explains any regression.

The IRIV films include English narration, short captions, chapter navigation and a transcript. The EdgeAI inspection demo follows one bottle through detection, a missing-cap decision and rejection, with pause, replay and individual stage controls. Demonstration results are simulated.

To rebuild the films on Windows with Chrome installed:

```powershell
python -m pip install edge-tts
node tools/build-iriv-narration.cjs
node tools/build-iriv-videos.cjs
```

Edit each tour's `narration.json` for the spoken script and short on-screen descriptions. The narration build sends each line to Microsoft's neural voice service through `edge-tts` (en-US Aria by default; set `IRIV_VOICE` to another `edge-tts --list-voices` name), decodes the speech in Chrome, then creates matching scene timing, WAV audio and VTT captions. Both builders take `--only=pi|edge|hub`. The video build embeds AAC narration in the 1080p MP4s and refreshes the posters. `node tools/build-iriv-videos.cjs --preview` checks the source scenes without encoding, and `--check` verifies the finished films; previews go in `.tmp/`.

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
- `city3d-details.js` — shared 3D vehicle models, aircraft, ferry effects, raised bridge, shoreline and airport scenery
- `city3d-life.js` — street life in 3D: shop doorways with signs, paved blocks, and people who visit shops, board the bus and walk the ferry gangway
- `ui.css` — responsive interface styles
- `ui.js` — search, IRIV films panel, keyboard access, camera controls, and preferences
- `milesight-devices.js` — additional products, room placements, and leak/cold-storage scenarios
- `utilities.js` — remote power and water facilities, supply routes, and simulated capacity readings
- `weather.js` — rain, storm and clear weather and the toolbar button
- `airport.js` — Mega Airport, the live flight schedule, the full-size terminal, the car park and the Metro Loop
- `power-grid.js` — regional 132 kV lines, substations and live loads
- `ferry.js` — the river ferry, its quays and devices
- `logistics.js` — the Airport Logistics Hub: buildings, moving truck, devices and its panel
- `city3d.js` — the 3D map (the default view): captures the 2D draw calls (boxes, tanks, poles) into three.js and bakes the 2D ground into a texture, so both views always show the same city
- `device-insights.js` — IRIV device panels: connection map, live rules, MQTT feed, health, output tests, network failover, camera view, and model comparison
- `images/` — device illustrations and product photos
- `serve.js` — optional local preview server with range requests for video
- `iriv-controllers/` — one page for all IRIV controllers: films, comparison, picker and "better together" examples
- `short-video-of-iriv-edgeai/` — IRIV EdgeAI CM5 tour: film, live AI demo (`demo.js`), port data, compatible Cytron cameras and parts, and the rendered MP4
- `short-video-of-iriv-pi/` — IRIV PiControl tour page, film renderer (`film.js`), pin data (`data.js`), compatible Cytron parts and system recipes (`connect.js`), and the rendered MP4
- `short-video-of-iriv-hub/` — IRIV Edge dashboard film: page, film renderer (`film.js`) and the recorded screens (`images/`, made by `tools/capture-iriv-hub-shots.cjs`)
- `warehouse-3d/` — Warehouse Command 3D: one self-contained page (three.js from a CDN)
- `iriv-tour-media.js` / `.css` — shared player, footer, end card and MP4 export for both tours
- `tools/` — smoke test (`check-dashboard.cjs`), place check (`check-places.cjs`), lag check (`check-performance.cjs`), film and narration builders, and the vendored MP4 muxer

## GitHub Pages

GitHub Pages publishes branch `main` from `/ (root)`. Pushing changes to `main` updates the live demo automatically. The `.nojekyll` file lets GitHub serve the static files directly.

## Product references

The demo includes Milesight and IRIV product names and supplied product images. Those names, trademarks, and images belong to their respective owners. Their inclusion is for demonstration and does not imply endorsement.

See [Milesight product references](MILESIGHT_PRODUCTS.md) for the added models, selected variants, official sources, and illustration credits.
