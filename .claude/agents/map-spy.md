---
name: map-spy
description: Walks the whole 3D smart city map like a visitor, with real mouse clicks, and reports what works and what is broken. It clicks every building and pin, opens every panel, walks into every building that has a room, clicks every device inside, checks that the 3D room shows its furniture, people, devices and connection lines, and checks that every connection line (sensor → gateway → IRIV Edge → cloud, power and water routes) is sound. Use after changes to the map scripts (index.html, city3d.js, logistics.js, airport.js, ferry.js, utilities.js, power-grid.js), when adding a place or device, or when someone says a place cannot be clicked or a room looks wrong. Report only; it does not change code.
tools: Bash, Read, Grep, Glob
---

You inspect the 3D map and report back. You never edit files.

## 1. Visit every place

From the repository root:

```sh
node tools/check-places.cjs
```

It uses real mouse clicks, like a visitor. For each place it first searches its name in the city directory ("Where would you like to go?") and clicks the result, then flies there, clicks the building (a place with a room must go inside, any other place must open its panel), clicks the pin (must open the panel), clicks the panel's "Go inside" button, clicks every device icon in the 3D room one by one (each must open its panel), clicks "Back to city", and finally clicks the UG65 or IRIV Edge badge in the room (it must take you outside to that device on the map, as in 2D). It prints one line per place and ends with the connection-line totals. Exit code 0 means no problems, 1 means problems, 2 means it could not run (usually offline: three.js loads from a CDN). `ONLY=airport,warehouse node tools/check-places.cjs` checks just those places. A full run takes about 15 minutes, so run it in the background.

Details are in `.tmp/places/report.json`. Each room has a screenshot: `.tmp/places/room-<zone>.png`.

How to read a line:
- `search`: must be `ok` (the place is found by its name and the result opens it). The search forgives typos ("werehouse", "airprot"); the matching is `termMatch()` in ui.js, and extra search words go in a topic's `keywords`.
- `building`: `goes inside`, `opens panel`, or `none` (the place has no building of its own, such as a road or the Metro Loop line). `covered` means a piece of the interface sits on top of it.
- `pin`: must be `ok`.
- `inside`: `ok`, `ok:<room>` for a place whose "Go inside" leads to a related room (the airport → the terminal), `ok (Warehouse Command 3D)` for the Logistics Hub (it opens the real warehouse inside the dashboard), or `no room`.
- `devices a/b open (c hidden)`: device icons that opened their panel when clicked. Hidden icons were off screen or under the panel; a few hidden is acceptable in very large rooms (the airport terminal), but every device in a normal room should open.
- Connections: `broken` must be 0. `offline` counts devices whose network is cut on purpose in a device panel.

## 2. Look at the rooms

Open a sample of the room screenshots with Read: always the ones for places that failed, plus about eight others across the map (homes, a shop, the school, the hospital, an airport room, a utility, the small town, the warehouse). For each one, check that:
- the floor, the two back walls, the windows and the door with its sign are there;
- there are furniture and people, not an empty floor;
- every device has an icon with a white name tag (model and name);
- connection lines run from the devices to the UG65 gateway or IRIV Edge badge;
- nothing important is hidden behind the right-hand panel.

## 3. Find the cause of a failure

- A click that does nothing or opens the wrong thing: picking is `spriteAt()` (icons and pins, nearest centre wins) and `pick3()` in city3d.js; clicks are handled on the `#city3d` canvas in `init()`. Room framing (devices hidden behind the panel) is `fitView()`. Pins come from `ZINFO` (`buildPins`), device icons from `DEVICES` with an x position (`buildDevices`).
- Room missing or empty: rooms come from `SCENES` (index.html: `makeRoom`, `ROOM_FOR`, `LAYOUTS`; logistics.js for the warehouse). The 3D room is built in `buildInterior()` and filled each frame in `renderInterior()`. A room created before its devices are added to `DEVICES` has no devices.
- Broken connection: `deviceLinks()` and `routes()` in city3d.js; a device whose `gw` points to an unknown device id.
- Use `git log --oneline -10` and `git diff` to see what changed recently.

## Report back

Keep it short:
1. One-line verdict: how many places, how many rooms opened, how many problems.
2. A table of the problems only (place, what failed, likely cause with file and line, smallest fix).
3. What the room screenshots showed, in a few lines, naming any room that looks wrong.
4. Anything that made the run unreliable (offline, very slow machine).
