// What plugs into each port of the IRIV EdgeAI CM5, using products listed on my.cytron.io.
// Names, links and prices (RM, excluding tax) were taken from the store on 29 October 2026.

const CY = 'https://my.cytron.io/';
const item = (name, path, price, note, icon) => ({ name, url: CY + path, price, note, icon });

const PRODUCTS = {
  edgeai: item('IRIV EdgeAI CM5 (13 or 26 TOPS)', 'c-industrial-edge-controller/p-iriv-edge-ai-cm5', 2487, 'The controller, from RM2,487 depending on RAM, storage and TOPS.', 'chip'),
  cam3: item('Raspberry Pi Camera Module 3 (12 MP, autofocus)', 'c-raspberry-pi-camera/p-raspberry-pi-camera-module-3-12mp-with-auto-focus-lens', 112, 'Sharp autofocus camera for general scenes, labels and people.', 'camera'),
  hq: item('Raspberry Pi HQ Camera and Lenses', 'c-raspberry-pi-camera/p-official-raspberry-pi-hq-camera-and-lenses', 111.7, 'Takes C/CS lenses, so you can zoom in on small parts.', 'camera'),
  aicam: item('Raspberry Pi AI Camera (IMX500, 12 MP)', 'c-raspberry-pi-camera/p-raspberry-pi-ai-camera', 312.7, 'Runs a small model on the sensor itself, freeing the accelerator.', 'eye'),
  night: item('5 MP Night Vision Camera for Raspberry Pi', 'c-raspberry-pi-camera/p-5mp-night-vision-camera-for-raspberry-pi', 58.5, 'Infrared view for gates and yards after dark.', 'camera'),
  tof: item('ArduCam Time-of-Flight (ToF) Camera', 'c-raspberry-pi-camera/p-arducam-time-of-flight-tof-camera-module-for-rpi', 249, 'Depth image for measuring height, volume and fill.', 'radar'),
  csiCable: item('Official CSI Camera Cable (22-way to 15-way)', 'c-raspberry-pi-5-accessories/p-fpc-22-way-to-15-way-for-camera', 5.9, 'Connects 15-pin Raspberry Pi cameras to a 22-pin CSI port.', 'plug'),
  camCase: item('Enclosure Case for Raspberry Pi Camera Module', 'c-raspberry-pi-camera/p-enclosure-case-for-raspberry-pi-camera-module-v1.3-v2-v3', 18, 'Protects the camera board on the line.', 'box'),
  usbCam2: item('USB 3.0 Industrial Camera 2 MP (CS lens)', 'c-camera-image-sensor/p-usb-3.0-industrial-camera-2mp-with-cs-adjustable-lens', 328, 'The camera in the EdgeAI Basic kit. Adjustable lens.', 'camera'),
  zoom8: item('8 MP 4K USB Camera with 10× Zoom (5–50 mm)', 'c-camera-image-sensor/p-8mp-imx179-industrial-zoom-camera-5-50mm', 450, 'Zoom lens for reading labels from further away.', 'camera'),
  imx283: item('20 MP IMX283 USB 3.0 Camera (16 mm C-mount)', 'c-camera-image-sensor/p-20mp-imx283-usb-3.0-camera-module-with-16mm-c-mount-lens', 1250, 'High resolution for fine defects and small text.', 'camera'),
  pdaf13: item('13 MP PDAF UVC USB Camera', 'c-camera-image-sensor/p-13mp-pdaf-uvc-usb-camera', 1359, 'Fast phase-detect autofocus for mixed part sizes.', 'camera'),
  tsw202: item('TSW202 Industrial Managed PoE+ Switch', 'c-router-switch-gateway/p-tsw202-industrial-managed-poe-plus-switch', 686, 'Powers and connects several IP cameras on one port.', 'net'),
  smartCam: item('XC-130 5 MP Smart Camera', 'c-camera-image-sensor/p-xc-130-5mp-smart-camera', 12459, 'An industrial smart camera that streams to the EdgeAI.', 'camera'),
  ethCable: item('Gigabit Ethernet Cable', 'c-industry-accessories/p-gigabit-ethernet-cable', 12.9, 'For the camera and plant networks.', 'net'),
  router4g: item('RUT200 LTE Cat 4 Industrial Router', 'c-router-switch-gateway/p-rut200-lte-cat-4-industrial-grade-router', 566, 'Sends results to the cloud from sites without a network.', 'router'),
  dome: item('Industrial Dome Light for Camera Vision (175 mm)', 'c-industry-accessories/p-industrial-dome-lighting-for-camera-vision-175mm-diameter', 339, 'Even, shadow-free light for shiny or curved parts.', 'sun'),
  stand: item('Industrial VisionPro Camera Stand', 'c-camera-image-sensor/p-industrial-visionpro-camera-stand', 649, 'Holds the camera and light steady over the line.', 'stand'),
  holder3dof: item('Industrial 3-DOF Aluminum Holder', 'c-industry-accessories/p-industrial-grade-3-dof-aluminum-holder', 119, 'Angle a camera exactly where you need it.', 'stand'),
  microLens: item('100× Industrial Microscope Lens (C/CS mount)', 'c-industry-accessories/p-100x-industrial-microscope-lens-c-cs-mount', 79, 'Close-up inspection of solder joints and tiny parts.', 'eye'),
  photo: item('BJ300 Photoelectric Sensor (PNP)', 'c-sensors-connectivities/p-bj300-photoelectric-sensors-pnp', 169, 'Tells DI0 a part has arrived, so the camera fires on time.', 'eye'),
  prox: item('E2E2-X5MY1M4 Inductive Proximity Sensor', 'c-sensors-connectivities/p-e2e2-x5my1m4-inductive-proximity-sensor', 715.4, 'Detects metal parts or a pallet in position.', 'magnet'),
  relay24: item('24 V DC Industrial Relay', 'c-industry-accessories/p-24v-dc-industrial-relay', 35, 'Lets a dry-contact output switch a pusher, valve or barrier.', 'relay'),
  button: item('Illuminated Push Button 24 VDC / 240 VAC', 'c-industry-accessories/p-illuminated-push-push-button-24vdc-240vac', 10, 'Operator start, stop or "teach this part" button.', 'button'),
  conveyor: item('Conveyor Belt with Adjustable Speed', 'c-industry-accessories/p-conveyor-belt-with-adjustable-speed', 239, 'A desktop line for demos and training.', 'belt'),
  ioExt: item('Industrial 8×DI + 8×DO Modbus RTU IO Extender', 'c-industrial-adapter-converter/p-industrial-8-ch-modbus-rtu-gpio-extender', 119, 'Need more than 2 inputs and outputs? Add 8 more of each.', 'chip'),
  meter: item('Acrel ADL Power Meter (RS485 Modbus RTU)', 'c-industry-accessories/p-adl-power-meter', 149, 'Log the line’s energy next to its quality results.', 'bolt'),
  thIndustrial: item('Industrial Grade RS485 Temperature & Humidity Sensor', 'c-sensors-connectivities/p-industrial-grade-rs485-temperature-humidity-sensor', 179, 'Watch the cabinet or clean-room climate.', 'thermo'),
  rs485Hub: item('Industrial Isolated 8-Ch RS485 Hub', 'c-industry-accessories/p-industrial-grade-isolated-8-ch-rs485-hub', 189, 'Split one RS485 port into 8 isolated branches.', 'hub'),
  lte: item('Quectel EC25-EM LTE Cat 4 Mini PCIe Module + Antenna Kit', 'c-sensors-connectivities/p-quectel-lte-cat-4-ec25-em-mini-pcie-module-south-east-asia', 445, 'Built-in 4G in the mPCIe socket, with the SIM in the side slot.', 'cell'),
  ant4g: item('4G High-Gain SMA Antenna (outdoor, magnetic base)', 'c-industry-accessories/p-4g-high-gain-sma-antenna-for-outdoor-condition-waterproof-magnetic-base', 30, 'Better signal from inside a metal cabinet.', 'ant'),
  edatec: item('Edatec Industrial Touchscreen LCD Monitor', 'c-hmi/p-edatec-industrial-touchscreen-lcd-monitor', 528, 'Shows live camera views and pass / fail results at the line.', 'screen'),
  touch: item('10.4" / 7" HDMI Touch Screen with Industrial Enclosure', 'c-hmi/p-industrial-lcd-display-capacitive-touchscreen', 650, 'Operator screen: HDMI for video, USB for touch.', 'screen'),
  psu24: item('Meanwell DIN-Rail Power Supply 24 V', 'c-industrial-power-supply/p-meanwell-industry-din-rail-mount-power-supply-24v', 98, 'Runs the controller, the light drivers and the sensors.', 'bolt'),
  psu36: item('Industry Switching Power Supply 24 V 36 W (wide input)', 'c-industrial-power-supply/p-industry-switching-power-supply-24v-36w-wide-dc-and-ac-input-voltage', 89, 'Wide-input supply for remote gates and yards.', 'bolt'),
  drc40: item('Meanwell DRC-40 DIN-Rail Supply with Battery Charger', 'c-industrial-power-supply/p-meanwell-drc-40-series-industry-din-rail-mount-power-supply', 190, 'Add a battery and recording carries on through power cuts.', 'battery')
};

// One tab per port. `view` is the photo and highlighted group(s) shown at the top of the tab.
const CONNECT = [
  { id: 'cams', label: 'MIPI cameras', color: '#0071e3', ports: 'MIPI0 · MIPI1', view: ['iso', ['cams']], devices: ['Camera Module 3', 'HQ camera', 'AI camera'], icons: ['camera', 'camera', 'eye'],
    lede: 'Raspberry Pi cameras plug straight into the two 4-lane camera ports. No USB bandwidth used, and two cameras can run at once.',
    tips: ['Raspberry Pi cameras with a 15-pin connector need the 22-to-15-way cable; check the user manual for the port’s connector.', 'Pair two cameras for top and side views of the same part.', 'Pick the HQ camera with a C/CS lens for small parts, or Camera Module 3 for general scenes.'],
    items: ['cam3', 'hq', 'aicam', 'night', 'tof', 'csiCable', 'camCase'] },
  { id: 'usb', label: 'USB 3.0 cameras', color: '#5e5ce6', ports: '2× USB 3.0', view: ['iso', ['usb']], devices: ['Industrial', 'Zoom', 'High-res'], icons: ['camera', 'eye', 'camera'],
    lede: 'Industrial USB 3.0 cameras with proper lenses, from 2 MP up to 20 MP.',
    tips: ['USB 3.0 has the bandwidth for high-resolution cameras at full frame rate.', 'C and CS-mount lenses let you set the field of view and focus for the job.', 'Keep USB 3.0 cables short, or use an active cable for longer runs.'],
    items: ['usbCam2', 'zoom8', 'imx283', 'pdaf13'] },
  { id: 'ip', label: 'IP & CCTV cameras', color: '#8e44ad', ports: 'ETH0 · ETH1', view: ['front', ['lan']], devices: ['CCTV', 'PoE switch', 'Smart camera'], icons: ['camera', 'net', 'camera'],
    lede: 'Use the CCTV you already have. The EdgeAI pulls each camera’s stream over the network and runs the AI on it.',
    tips: ['Put the cameras on ETH0 and the plant or cloud network on ETH1.', 'A PoE switch powers and connects several cameras over one cable each.', 'Cameras stream over RTSP; most IP and ONVIF CCTV cameras work.'],
    generic: ['Any RTSP / ONVIF IP camera', 'Existing CCTV or NVR streams', 'ANPR camera'],
    items: ['tsw202', 'smartCam', 'ethCable', 'router4g'] },
  { id: 'light', label: 'Lighting & mounting', color: '#d4a000', ports: 'L0 · L1 (2 A, PWM)', view: ['front', ['led']], devices: ['Dome light', 'Stand', 'Lens'], icons: ['sun', 'stand', 'eye'],
    lede: 'Good light matters more than megapixels. The two built-in drivers power and strobe lights in time with each capture.',
    tips: ['L0 and L1 output the VIN voltage, so a 24 V supply means 24 V lights; check the light’s rating.', 'Up to 2 A per output, with PWM to dim or strobe.', 'A dome light removes glare on shiny, curved or wrapped parts.'],
    items: ['dome', 'stand', 'holder3dof', 'microLens'] },
  { id: 'io', label: 'Triggers & actions', color: '#1a9e45', ports: 'DI0–DI1 · DO0–DO1', view: ['front', ['di', 'do']], devices: ['Trigger', 'Reject', 'Buttons'], icons: ['eye', 'relay', 'button'],
    lede: 'A sensor tells the EdgeAI when to look, and an output acts on the answer: reject a part, open a gate, stop the line.',
    tips: ['Wire a photoelectric sensor to DI0 so every part is captured in the same place.', 'S/S is the input common: connect it to suit sinking or sourcing sensors.', 'Outputs are dry contacts up to 500 mA; switch bigger loads through a relay.'],
    items: ['photo', 'prox', 'relay24', 'button', 'conveyor', 'ioExt'] },
  { id: 'rs485', label: 'RS485 · Modbus', color: '#0a8a8f', ports: 'A · B · G', view: ['front', ['rs485']], devices: ['PLC', 'Meters', 'IO extenders'], icons: ['chip', 'bolt', 'chip'],
    lede: 'Hand results to a PLC, or read meters and sensors at the same station.',
    tips: ['Daisy-chain A to A and B to B, and connect G to each device’s ground.', 'Give every device a unique Modbus address and the same baud rate.', 'Long runs: add a 120 Ω terminator at the far end.'],
    items: ['ioExt', 'meter', 'thIndustrial', 'rs485Hub'] },
  { id: 'net', label: '4G & storage', color: '#c07a00', ports: 'mPCIe · SIM · M.2', view: ['iso', ['cell']], devices: ['4G module', 'Antenna', 'NVMe SSD'], icons: ['cell', 'ant', 'chip'],
    lede: 'Built-in 4G for remote sites, and an M.2 NVMe SSD for storing images of every failed part.',
    tips: ['The mPCIe socket is USB 2.0 only, which suits 4G and LoRa modules.', 'The SIM goes in the slot on the side panel.', 'Fit an M.2 Key-M NVMe SSD to keep weeks of images and video.'],
    generic: ['M.2 Key-M NVMe SSD'],
    items: ['lte', 'ant4g', 'router4g'] },
  { id: 'screen', label: 'Screens', color: '#e5383b', ports: 'HDMI 2.0 · USB', view: ['iso', ['usb']], devices: ['Touchscreen', 'Monitor'], icons: ['screen', 'screen'],
    lede: 'A screen at the line shows the live view, the last result and the pass rate.',
    tips: ['HDMI 2.0 drives up to 4K at 60 Hz.', 'Touch connects over one USB port.', 'Run the dashboard in a browser, for example Node-RED or Grafana.'],
    items: ['edatec', 'touch'] },
  { id: 'power', label: 'Power', color: '#86868b', ports: 'VIN · GND (10–30 V DC)', view: ['front', ['power']], devices: ['24 V supply', 'Backup'], icons: ['bolt', 'battery'],
    lede: 'One 24 V supply runs the controller, the lights and the sensors.',
    tips: ['The controller uses up to 11 W; add the lights and sensors on top.', 'Light drivers draw from VIN, up to 2 A each.', 'A supply with a battery charger keeps it running through power cuts.'],
    items: ['psu24', 'psu36', 'drc40'] }
];

// Example systems, each a parts list with the port every part uses.
const RECIPES = [
  { id: 'inspect', name: 'Bottle inspection', color: '#0071e3', icon: 'camera', blurb: 'The demo above, for real: a trigger sensor, a camera under a dome light, and a relay that fires the reject jet.',
    parts: [['edgeai', 1, 'Controller'], ['usbCam2', 1, 'USB 3.0'], ['dome', 1, 'L0'], ['stand', 1, 'Mount'], ['photo', 1, 'DI0 → trigger'], ['relay24', 1, 'DO0 → reject'], ['psu24', 1, 'VIN']] },
  { id: 'gate', name: 'Car park ANPR gate', color: '#8e44ad', icon: 'car', blurb: 'Your IP cameras on a PoE switch, plates read on the EdgeAI, the barrier opened by a relay, and results sent over 4G.',
    parts: [['edgeai', 1, 'Controller'], ['tsw202', 1, 'ETH0 → cameras'], ['router4g', 1, 'ETH1 → cloud'], ['photo', 1, 'DI0 → car present'], ['relay24', 1, 'DO0 → barrier'], ['psu36', 1, 'VIN']] },
  { id: 'dual', name: 'Two-camera QC station', color: '#1a9e45', icon: 'eye', blurb: 'Top and side views on the two camera ports, a dome light, a reject output and a touchscreen for the operator.',
    parts: [['edgeai', 1, 'Controller'], ['hq', 1, 'MIPI0 → top view'], ['cam3', 1, 'MIPI1 → side view'], ['csiCable', 2, 'MIPI0 · MIPI1'], ['holder3dof', 2, 'Mount'], ['dome', 1, 'L0'], ['relay24', 1, 'DO0 → reject'], ['edatec', 1, 'HDMI + USB'], ['psu24', 1, 'VIN']] }
];

// Which EdgeAI resource each product takes up, for the system builder and the "Uses" line on each card.
const USES = {
  edgeai: [], cam3: ['csi'], hq: ['csi'], aicam: ['csi'], night: ['csi'], tof: ['csi'], csiCable: [], camCase: [],
  usbCam2: ['usb'], zoom8: ['usb'], imx283: ['usb'], pdaf13: ['usb'], tsw202: ['lan'], smartCam: ['lan'], ethCable: [], router4g: ['lan'],
  dome: ['led'], stand: [], holder3dof: [], microLens: [], photo: ['di'], prox: ['di'], relay24: ['do'], button: ['di'], conveyor: ['do'],
  ioExt: ['rs485'], meter: ['rs485'], thIndustrial: ['rs485'], rs485Hub: ['rs485'], lte: ['pcie'], ant4g: [], edatec: ['hdmi', 'usb'], touch: ['hdmi', 'usb'],
  psu24: ['vin'], psu36: ['vin'], drc40: ['vin']
};
const CONTROLLER = 'edgeai';
// What one EdgeAI CM5 offers, and what extenders add (from the product name: 8 DI + 8 DO).
const BUDGET = { csi: 2, usb: 2, lan: 2, di: 2, do: 2, led: 2, rs485: 32, hdmi: 1, pcie: 1, vin: 1 };
const ADDS = { ioExt: { di: 8, do: 8 } };
const RES = {
  csi: ['Camera ports', 'MIPI CSI'], usb: ['USB 3.0 ports', 'USB 3.0'], lan: ['Ethernet ports', 'Ethernet'], di: ['Digital inputs', 'DI'], do: ['Dry-contact outputs', 'DO'],
  led: ['Light drivers', 'L0 / L1'], rs485: ['RS485 devices', 'A · B · G'], hdmi: ['HDMI', 'HDMI'], pcie: ['mPCIe', 'mPCIe'], vin: ['Power supply', 'VIN · GND']
};
const FIX = { csi: 'use a USB 3.0 or IP camera for the third view', usb: 'move a camera to a MIPI port or the network', lan: 'add a PoE switch such as the TSW202',
  di: 'add the 8×DI + 8×DO IO extender on RS485', do: 'add the IO extender on RS485', led: 'two lights per controller; wire extra lights through a relay',
  hdmi: 'one screen per controller', pcie: 'only one mPCIe module fits', rs485: 'split the bus with the isolated 8-channel RS485 hub' };
// Extra advice for the system builder.
function extraChecks(sys, used) {
  const w = [];
  if (Object.keys(sys).length > 1 && !(used.csi || used.usb || sys.tsw202 || sys.smartCam)) w.push('<div><b>No camera yet.</b> Add a MIPI, USB 3.0 or IP camera so the AI has something to look at.</div>');
  return w;
}

const ICONS = {
  thermo: '<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0Z"/><path d="M12 9v7"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  bolt: '<path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  radar: '<path d="M4 12h3m10 0h3"/><circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 1 10 0M7 17a7 7 0 0 0 10 0"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
  hub: '<circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21"/>',
  plug: '<path d="M9 2v5m6-5v5M6 7h12v4a6 6 0 0 1-12 0V7Zm6 10v5"/>',
  net: '<rect x="3" y="3" width="7" height="6" rx="1"/><rect x="14" y="3" width="7" height="6" rx="1"/><rect x="8.5" y="15" width="7" height="6" rx="1"/><path d="M6.5 9v3h11V9M12 12v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  magnet: '<path d="M6 3v9a6 6 0 0 0 12 0V3h-4v9a2 2 0 0 1-4 0V3H6Z"/><path d="M6 7h4m4 0h4"/>',
  button: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  relay: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 15h3l3-5h2M8 9h2"/>',
  router: '<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 13V8m10 5V8M7 16.5h.01M11 16.5h.01"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  cell: '<path d="M4 20h2v-4H4zM9 20h2v-8H9zM14 20h2V8h-2zM19 20h2V4h-2z"/>',
  ant: '<path d="M12 21V9"/><path d="M8.5 5.5a5 5 0 0 1 7 0M6 3a8.5 8.5 0 0 1 12 0"/><circle cx="12" cy="9" r="1.5"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 11v2M7 10v4m4-4v4"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z"/><path d="M3 7l9 4 9-4M12 11v10"/>',
  stand: '<path d="M12 21v-9M7 21h10M12 12l5-6"/><rect x="14" y="3" width="7" height="5" rx="1.5"/>',
  belt: '<circle cx="6" cy="15" r="3"/><circle cx="18" cy="15" r="3"/><path d="M6 12h12M6 18h12"/><rect x="8" y="6" width="5" height="5" rx="1"/>',
  car: '<path d="M5 16V11l2-5h10l2 5v5"/><path d="M3 16h18v3H3zM5 11h14"/><circle cx="7.5" cy="16" r="1"/><circle cx="16.5" cy="16" r="1"/>'
};
const icon = (k, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.chip}</svg>`;
const rm = v => 'RM' + v.toLocaleString('en-MY', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
