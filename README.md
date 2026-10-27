# NeoVille Demo Dashboard

An interactive smart city simulation built with HTML, CSS, and JavaScript. Explore 25 districts, 177 deployed demo devices, building interiors, energy monitoring, and guided scenarios.

## Explore the demo

- Search for districts, devices, and scenarios using the search button or `/`.
- Click buildings and device markers for details, or start the guided tour.
- Drag the map to rotate; scroll or use the map controls to zoom.
- Switch between day and night, toggle device markers, and enable optional narration.
- Try emergency response, flash flood, power cut, irrigation, water treatment, and power grid scenarios.

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
- `images/` — device illustrations and product photos
- `serve.js` — optional local preview server

## GitHub Pages

Publish the repository using **Settings → Pages → Deploy from a branch**, with branch `main` and folder `/ (root)`. The `.nojekyll` file lets GitHub serve the static files directly.

## Product references

The demo includes Milesight and IRIV product names and supplied product images. Those names, trademarks, and images belong to their respective owners. Their inclusion is for demonstration and does not imply endorsement.
