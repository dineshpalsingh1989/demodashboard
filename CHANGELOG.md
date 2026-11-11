# Changelog

## V2.0 — 11 November 2026

### City and street life

- Added a 3D city renderer and building interiors with shaded walls, glass, rooftops, trees, shadows, night lighting and weather.
- Added Scenic mode to hide map overlays while exploring.
- Added pavements, tactile corner pads, drainage grilles, building entrances, shopfronts, signs and awnings.
- Added visitors walking into buildings, bus-stop queues and boarding, and ferry passengers boarding at the quay.

### Transport, airport and water

- Added native 3D sedans, SUVs, vans, buses, articulated trucks and trains, with vehicle lighting and smoother motion.
- Raised the river bridge and its approaches so traffic follows the deck and the ferry can pass below.
- Improved warehouse truck docking and separated the dock apron from through traffic.
- Added detailed aircraft, landing gear, pushback tugs, baggage carts, jetbridge details and airfield lights.
- Added ferry hull motion and wakes, shallow-water shading, coastal rocks, seawalls and riverside details. Docked or storm-suspended ferries do not leave a moving wake.

### Warehouses and devices

- Added Warehouse Command 3D with three warehouses, forklift traffic, charging, collision controls, night mode, heatmaps and interactive sensors.
- Added GS301 restroom odour, VS121 lounge occupancy, EM320-TH refrigerated-trailer monitoring and a factory PPE camera demonstration.
- Improved place search and access to warehouse views; updated product documentation.

### Verification tools

- Expanded dashboard smoke checks for navigation, devices and street-life initialization.
- Added transport checks for bridge clearance, docking continuity, ferry wakes, pushback, Scenic mode and mobile controls.
- Added place-navigation and performance checks for the city and warehouse.

### Release validation and known limitation

- Dashboard smoke and transport checks passed, with no dashboard page errors.
- Three release performance samples on Intel Iris Xe missed some budgets: median city readiness was 2.05 seconds and idle rendering was 27 FPS; median warehouse first frame was 2.41 seconds. Targets are 2 seconds, 30 FPS and 1.5 seconds respectively.
- Sampled system CPU usage ranged from 47% to 86%. These measurements do not establish the cause of the slowdown; performance on this machine still needs improvement or verification under lower load.

This is a demonstration release. Sensor readings, transport movements, weather and operational events are simulated; the dashboard does not connect to live city or flight data.
