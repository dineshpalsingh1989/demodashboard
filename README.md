# Smart City Demo Dashboard

An interactive smart city simulation built with HTML, CSS, and JavaScript. Explore the city and remote utility facilities, 387 deployed demo devices, building interiors, energy monitoring, and guided scenarios.

**[Open the live demo](https://dineshpalsingh1989.github.io/demodashboard/)**

## Explore the demo

- Search for districts, devices, and scenarios using the search button or `/`.
- Click buildings and device markers for details, or start the guided tour.
- Drag the map to move; Shift-drag to rotate. Scroll or use the map controls to zoom.
- The city, highway, small town and farms are all part of one map: drag and zoom to move between them.
- Scroll, zoom buttons and keyboard controls share a 35–500% range. Resetting the view, choosing a district or starting a tour exits walk mode.
- Enter walk mode to explore at street level, visit shops, or follow the highway to the small town and farms.
- Switch between day and night, toggle device markers, and enable optional narration.
- Try emergency response, flash flood, power cut, irrigation, water treatment, and power grid scenarios.
- Search for the **City Power Station** or **Water Treatment** to follow a remote **50 MW power station** and **1,000 m³/h water treatment plant** feeding the city. Both sit beyond a planted buffer; yellow lines carry power, blue lines carry treated water, and brown lines return wastewater. Click either plant for simulated capacity, output, flow, and pressure readings.
- Open the [Milesight collection](https://dineshpalsingh1989.github.io/demodashboard/#milesight) for eight additional models, or choose **Project → Explore 8 new Milesight products**.
- Open any IRIV PiControl, IO Controller or EdgeAI device to see what it is wired to, the automation rules it runs (live), its MQTT messages and health, and where else the model is installed. Test its outputs, or cut its network to compare how each controller behaves offline. EdgeAI panels start with a live camera view, since cameras and CCTV analytics are their main job.
- Run the water-leak and cold-storage response scenarios. Search for bin fill, pipe pressure, desk occupancy, classroom sound, solar irrigation, or the SG50 farm gateway.

All readings, events, and device quantities are simulated for demonstration. This dashboard does not connect to live city systems.

## Run locally

Open `index.html` directly in a modern browser, or use Node.js:

```sh
node serve.js
```

Then visit `http://localhost:8080`. No package installation or build step is required.

## Performance

The map is drawn on a canvas that is fully redrawn every frame, so most of the work happens on the GPU. To keep selecting, panning, and the camera fly-to smooth on laptop graphics:

- Building wall outlines are drawn only when zoomed in far enough to see them, and roof outlines stay thinner than one device pixel.
- Poles, tree trunks, and wires are drawn as thin filled shapes, which the GPU handles faster than strokes.
- Objects outside the visible area are skipped, which helps most when a selection zooms the camera in.
- On slower machines, the map automatically switches from 1.5× to 1× pixel density after about two seconds below 25 fps.
- Hover checks run at most once per frame.
- The top bar, side panel, and other overlays are solid rather than frosted glass, because a blur over the moving map has to be recalculated every frame.

## Files

- `index.html` — city simulation, device content, and interface markup
- `ui.css` — responsive interface styles
- `ui.js` — search, keyboard access, camera controls, and preferences
- `milesight-devices.js` — additional products, room placements, and leak/cold-storage scenarios
- `utilities.js` — remote power and water facilities, supply routes, and simulated capacity readings
- `device-insights.js` — IRIV device panels: connection map, live rules, MQTT feed, health, output tests, network failover, camera view, and model comparison
- `images/` — device illustrations and product photos
- `serve.js` — optional local preview server

## GitHub Pages

GitHub Pages publishes branch `main` from `/ (root)`. Pushing changes to `main` updates the live demo automatically. The `.nojekyll` file lets GitHub serve the static files directly.

## Product references

The demo includes Milesight and IRIV product names and supplied product images. Those names, trademarks, and images belong to their respective owners. Their inclusion is for demonstration and does not imply endorsement.

See [Milesight product references](MILESIGHT_PRODUCTS.md) for the added models, selected variants, official sources, and illustration credits.
