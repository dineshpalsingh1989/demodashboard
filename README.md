# Smart City Demo Dashboard

An interactive smart city simulation built with HTML, CSS, and JavaScript. Explore the city and remote utility facilities, 387 deployed demo devices, building interiors, energy monitoring, and guided scenarios.

**[Open the live demo](https://dineshpalsingh1989.github.io/demodashboard/)**

## Explore the demo

- Search for districts, devices, and scenarios using the search button or `/`.
- Click buildings and device markers for details, or start the guided tour.
- Drag the map to move; Shift-drag to rotate. Scroll or use the map controls to zoom.
- Open **Whole map** to see the city, highway, small town and remote farms. Click the minimap or use its region buttons to jump there; **Fit entire map** frames the complete landscape.
- Scroll, zoom buttons and keyboard controls share a 35–500% range. Resetting the view, choosing a district or starting a tour exits walk mode.
- Enter walk mode to explore at street level, visit shops, or follow the highway to the small town and farms.
- Switch between day and night, toggle device markers, and enable optional narration.
- Try emergency response, flash flood, power cut, irrigation, water treatment, and power grid scenarios.
- Open **Whole map → City supply overview** to follow a remote **50 MW power station** and **1,000 m³/h water treatment plant** feeding the city. Both sit beyond a planted buffer; yellow lines carry power, blue lines carry treated water, and brown lines return wastewater. Click either plant for simulated capacity, output, flow, and pressure readings.
- **Fit entire map** can scale below the manual zoom minimum on short screens to keep the expanded landscape visible.
- Open the [Milesight collection](https://dineshpalsingh1989.github.io/demodashboard/#milesight) for eight additional models, or choose **Project → Explore 8 new Milesight products**.
- Run the water-leak and cold-storage response scenarios. Search for bin fill, pipe pressure, desk occupancy, classroom sound, solar irrigation, or the SG50 farm gateway.

All readings, events, and device quantities are simulated for demonstration. This dashboard does not connect to live city systems.

## Run locally

Open `index.html` directly in a modern browser, or use Node.js:

```sh
node serve.js
```

Then visit `http://localhost:8080`. No package installation or build step is required.

## Files

- `index.html` — city simulation, device content, and interface markup
- `ui.css` — responsive interface styles
- `ui.js` — search, keyboard access, camera controls, and preferences
- `milesight-devices.js` — additional products, room placements, and leak/cold-storage scenarios
- `utilities.js` — remote power and water facilities, supply routes, and simulated capacity readings
- `images/` — device illustrations and product photos
- `serve.js` — optional local preview server

## GitHub Pages

GitHub Pages publishes branch `main` from `/ (root)`. Pushing changes to `main` updates the live demo automatically. The `.nojekyll` file lets GitHub serve the static files directly.

## Product references

The demo includes Milesight and IRIV product names and supplied product images. Those names, trademarks, and images belong to their respective owners. Their inclusion is for demonstration and does not imply endorsement.

See [Milesight product references](MILESIGHT_PRODUCTS.md) for the added models, selected variants, official sources, and illustration credits.
