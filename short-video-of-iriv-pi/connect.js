// What plugs into each port of the IRIV PiControl, using products listed on my.cytron.io.
// Names, links and prices (RM, excluding tax) were taken from the store on 28 October 2026.

const CY = 'https://my.cytron.io/';
const item = (name, path, price, note, icon) => ({ name, url: CY + path, price, note, icon });

const PRODUCTS = {
  picontrol: item('IRIV PiControl (CM4 / CM5)', 'p-iriv-picontrol-cm4-industrial-controller', 1489, 'The controller itself, from RM1,489 depending on the compute module.', 'chip'),
  sht40: item('SHT40 Temperature & Humidity Sensor with RS485', 'c-sensors-connectivities/p-sht40-rs485-temperature-and-humidity-sensor', 35, 'Low-cost room or cabinet climate over Modbus.', 'thermo'),
  thIndustrial: item('Industrial Grade RS485 Temperature & Humidity Sensor', 'c-sensors-connectivities/p-industrial-grade-rs485-temperature-humidity-sensor', 179, 'Housed sensor for plant rooms, warehouses and outdoors.', 'thermo'),
  soil: item('RS485/Modbus RTU 3-in-1 Soil Sensor (moisture, temp, EC)', 'c-sensors-connectivities/p-rs485-modbus-rtu-3-in-1-soil-sensor-moisture-temperature-and-ec', 120, 'Soil moisture, temperature and EC from one probe.', 'leaf'),
  lux: item('RS485 Waterproof Ambient Light Sensor', 'c-sensors-connectivities/p-rs485-waterproof-ambient-light-sensor', 69, 'Daylight level for lighting control and greenhouses.', 'sun'),
  solar: item('RS485 Photoelectric Solar Radiation Sensor (400–1100 nm)', 'c-sensors-connectivities/p-rk200-04-solar-radiation-sensor', 295, 'Irradiance for solar farms and weather stations.', 'sun'),
  co2: item('SenseCAP CO2, Temperature & Humidity Sensor (RS485 / SDI-12)', 'c-sensors-connectivities/p-sensecap-co2-temperature-and-humidity-sensor-with-rs485-and-sdi-12', 389, 'Air quality for offices, classrooms and greenhouses.', 'wind'),
  thermocouple: item('K-Type Thermocouple to RS485 Modbus RTU', 'c-sensors-connectivities/p-k-type-thermocouple-to-rs485-modbus-rtu-series', 6.9, 'High-temperature readings from ovens, motors and pipes.', 'thermo'),
  meter: item('Acrel ADL Power Meter (RS485 Modbus RTU)', 'c-industry-accessories/p-adl-power-meter', 149, 'kWh, voltage, current and power factor per circuit.', 'bolt'),
  ph: item('Industrial pH Sensor (SP13, RS485 Modbus RTU)', 'c-sensors-connectivities/p-industrial-ph-sensor-with-sp13-connector-rs485-modbus-rtu', 640, 'Continuous pH in tanks, ponds and treatment lines.', 'flask'),
  ec: item('Industrial EC & TDS Sensor (SP13, RS485 Modbus RTU)', 'c-sensors-connectivities/p-industrial-ec-tds-sensor-with-sp13-connector-rs485-modbus-rtu', 640, 'Conductivity and dissolved solids for water quality.', 'flask'),
  turbidity: item('Industrial Turbidity Sensor (SP13, RS485 Modbus RTU)', 'c-sensors-connectivities/p-industrial-turbidity-sensor-with-sp13-connector-rs485-modbus-rtu', 1135, 'Water clarity at intakes and filters.', 'drop'),
  dissolvedO2: item('Industrial Dissolved Oxygen Sensor (SP13, RS485 Modbus RTU)', 'c-sensors-connectivities/p-industrial-dissolved-oxygen-sensor-with-sp13-connector', 1122.5, 'Oxygen level for aquaculture and aeration control.', 'drop'),
  lidar: item('TFmini-i 12 m Industrial LiDAR (RS485)', 'c-sensors-connectivities/p-tfmini-i-12m-industrial-grade-lidar-ranging-module', 360, 'Distance and presence up to 12 m, for bins, docks and gates.', 'radar'),
  ultrasonic: item('A02YY4W IP67 Ultrasonic Ranging Sensor 3–450 cm (RS485)', 'c-industry-accessories/p-a02yy4w-ip67-waterproof-ultrasonic-ranging-sensor-3-450cm', 73.5, 'Tank and sump level without touching the water.', 'wave'),
  ioExt: item('Industrial 8×DI + 8×DO Modbus RTU IO Extender', 'c-industrial-adapter-converter/p-industrial-8-ch-modbus-rtu-gpio-extender', 119, 'Need more than 4 inputs and outputs? Add 8 more of each.', 'chip'),
  aiExt: item('Industrial 8-Ch Analog Input Extender (Modbus RTU)', 'c-industrial-adapter-converter/p-industrial-8-ch-analog-input-extender-module', 119, 'Eight more analog channels over the same RS485 bus.', 'gauge'),
  rs485Hub: item('Industrial Isolated 8-Ch RS485 Hub', 'c-industry-accessories/p-industrial-grade-isolated-8-ch-rs485-hub', 189, 'Split one RS485 port into 8 isolated branches.', 'hub'),
  uc100: item('UC100 IoT Controller (Modbus RTU to LoRaWAN)', 'c-industrial-adapter-converter/p-uc100-iot-controller-modbus-rtu-to-lorawan', 223.85, 'Bring a remote Modbus device back wirelessly over LoRaWAN.', 'lora'),
  usbSerial: item('USB to RS232/485 Serial Converter', 'c-industrial-adapter-converter/p-usb-to-rs232-485-serial-converter', 65, 'Adds another RS232 or RS485 port from a USB socket.', 'plug'),
  usb2ch: item('USB to 2-Ch RS485 Isolated Converter', 'c-industrial-adapter-converter/p-usb-to-2ch-rs485-isolated-converter', 89, 'Two more isolated RS485 buses from one USB port.', 'plug'),
  serialEth: item('Industrial RS232/485/422 to Ethernet Converter', 'c-industrial-adapter-converter/p-industrial-rs232-485-422-to-ethernet-converter', 115, 'Reach serial machines across the plant network.', 'net'),
  serialServer: item('RJ45 Ethernet to 4×RS485 Serial Server Gateway', 'c-industrial-adapter-converter/p-rj45-ethernet-to-4xrs485-serial-server-gateway', 259, 'Four remote RS485 buses over one Ethernet cable.', 'net'),
  photo: item('BJ300 Photoelectric Sensor (PNP)', 'c-sensors-connectivities/p-bj300-photoelectric-sensors-pnp', 169, 'Counts boxes or detects objects on a conveyor.', 'eye'),
  prox: item('E2E2-X5MY1M4 Inductive Proximity Sensor', 'c-sensors-connectivities/p-e2e2-x5my1m4-inductive-proximity-sensor', 715.4, 'Detects metal parts, shaft rotation or valve position.', 'magnet'),
  float: item('Water Float / Level Switch', 'c-liquid-flow-ph-sensor/p-water-float-or-level-sensor-switch', 8.2, 'Simple high or low level alarm in a tank.', 'drop'),
  flow: item('YF-S201 G1/2" Hall-Effect Water Flow Sensor', 'c-liquid-flow-ph-sensor/p-g1-2-half-effect-water-flow-sensor-yf-s201', 49, 'Pulse output for counting litres used.', 'drop'),
  button: item('Illuminated Push Button 24 VDC / 240 VAC', 'c-industry-accessories/p-illuminated-push-push-button-24vdc-240vac', 10, 'Start, stop or acknowledge, with a lamp that DO can light.', 'button'),
  doorSensor: item('ADS-AF Automatic Door Sensor', 'c-sensors-connectivities/p-ads-af-automatic-door-sensor', 739, 'Motion and presence for automatic doors.', 'eye'),
  relay: item('24 V DC Industrial Relay', 'c-industry-accessories/p-24v-dc-industrial-relay', 35, 'Let a digital output switch pumps, motors or mains loads.', 'relay'),
  relayEth: item('Dual Ethernet 8-Ch Relay Module', 'c-industrial-adapter-converter/p-dual-ethernet-ports-8-ch-relay-module', 229, 'Eight more relays, controlled over Ethernet.', 'relay'),
  fan: item('24 V Fan 2400 RPM (92 mm)', 'c-industry-accessories/p-24v-fan-2400rpm-92mm-x-92mm', 49, 'Cabinet cooling switched by a temperature rule.', 'fan'),
  router4g: item('RUT200 LTE Cat 4 Industrial Router', 'c-router-switch-gateway/p-rut200-lte-cat-4-industrial-grade-router', 566, 'Puts the controller online anywhere with a SIM card.', 'router'),
  tsw202: item('TSW202 Industrial Managed PoE+ Switch', 'c-router-switch-gateway/p-tsw202-industrial-managed-poe-plus-switch', 686, 'Powers and connects IP cameras and other devices.', 'net'),
  ug65: item('UG65 LoRaWAN Gateway', 'c-router-switch-gateway/p-ug65-semi-industrial-lorawan-gateway-with-without-cellular', 1610.05, 'Collects wireless LoRaWAN sensors and hands them to the PiControl.', 'lora'),
  smartCam: item('XC-130 5 MP Smart Camera', 'c-industry-accessories/p-xc-130-5mp-smart-camera', 12459, 'Inspection results arrive over the network.', 'camera'),
  ethCable: item('Gigabit Ethernet Cable', 'c-industry-accessories/p-gigabit-ethernet-cable', 12.9, 'For the Gigabit port.', 'net'),
  usbCam: item('USB 3.0 Industrial Camera 2 MP (CS lens)', 'c-industry-accessories/p-usb-3.0-industrial-camera-2mp-with-cs-adjustable-lens', 328, 'Snapshots and simple vision on a USB port (runs at USB 2.0 speed).', 'camera'),
  touch: item('10.4" / 7" HDMI Touch Screen with Industrial Enclosure', 'c-hmi/p-industrial-lcd-display-capacitive-touchscreen', 650, 'A local operator screen: HDMI for video, USB for touch.', 'screen'),
  edatec: item('Edatec Industrial Touchscreen LCD Monitor', 'c-hmi/p-edatec-industrial-touchscreen-lcd-monitor', 528, 'Panel-mount HMI for dashboards like Node-RED or Grafana.', 'screen'),
  lte: item('Quectel EC25-EM LTE Cat 4 Mini PCIe Module + Antenna Kit', 'c-sensors-connectivities/p-quectel-lte-cat-4-ec25-em-mini-pcie-module-south-east-asia', 445, 'Built-in 4G in the Mini PCIe slot (South-East Asia bands).', 'cell'),
  ant4g: item('4G High-Gain SMA Antenna (outdoor, magnetic base)', 'c-industry-accessories/p-4g-high-gain-sma-antenna-for-outdoor-condition-waterproof-magnetic-base', 30, 'Mounts outside the cabinet through an ANT knock-out.', 'ant'),
  antKit: item('Dual-Band Antenna Kit for CM4 / CM5', 'c-industry-accessories/p-rpi-compute-module-4-compatible-ufl-antenna', 12.9, 'Spare or replacement Wi-Fi antenna.', 'ant'),
  em320: item('EM320 LoRaWAN Temperature & Humidity Sensor', 'c-sensors-connectivities/p-em320-lorawan-temperature-and-humidity-sensor', 241.1, 'Battery-powered, no cables, years of battery life.', 'thermo'),
  leak: item('EM300-ZLD LoRaWAN Zone Leak Sensor', 'c-sensors-connectivities/p-em300-zld-lorawan-leak-detection-sensor', 413.3, 'Rope sensor for water leaks under floors and racks.', 'drop'),
  pipe: item('EM500-PP LoRaWAN Pipe Pressure Sensor', 'c-sensors-connectivities/p-em500-pp-lorawan-pipe-pressure-sensor', 1136.5, 'Water network pressure without running cables.', 'gauge'),
  psu24: item('Meanwell DIN-Rail Power Supply 24 V', 'c-industrial-power-supply/p-meanwell-industry-din-rail-mount-power-supply-24v', 98, 'The standard cabinet supply, inside the 10–30 V range.', 'bolt'),
  psu36: item('Industry Switching Power Supply 24 V 36 W (wide AC/DC input)', 'c-industrial-power-supply/p-industry-switching-power-supply-24v-36w-wide-dc-and-ac-input-voltage', 89, 'Wide-input supply for remote sites.', 'bolt'),
  drc40: item('Meanwell DRC-40 DIN-Rail Supply with Battery Charger', 'c-industrial-power-supply/p-meanwell-drc-40-series-industry-din-rail-mount-power-supply', 190, 'Add a battery and the controller rides through power cuts.', 'battery'),
  psu12: item('Industrial Grade 12 V 2 A Power Adapter', 'c-industrial-power-supply/p-industrial-grade-12v-2a-psu-5.5-2.1-dc-jack-uk-plug', 38, 'Bench testing and small installs.', 'plug')
};

// One tab per port. `ports` names the terminals the devices land on.
const CONNECT = [
  { id: 'rs485', label: 'RS485 · Modbus', ports: 'A · B · 485G', devices: ['Sensors', 'Meters', 'IO extenders'], icons: ['thermo', 'bolt', 'chip'],
    lede: 'One twisted pair, many devices. Each one gets its own Modbus address, and the PiControl polls them in turn.',
    tips: ['Daisy-chain A to A and B to B, then connect 485G to each device’s ground.', 'Give every device a unique Modbus address and the same baud rate.', 'Long runs: add a 120 Ω terminator at the far end.'],
    items: ['sht40', 'thIndustrial', 'soil', 'lux', 'solar', 'co2', 'thermocouple', 'meter', 'ph', 'ec', 'turbidity', 'dissolvedO2', 'lidar', 'ultrasonic', 'ioExt', 'aiExt', 'rs485Hub', 'uc100'] },
  { id: 'di', label: 'Digital inputs', ports: 'DI0–DI3 (+ / −)', devices: ['Switches', 'Sensors', 'Pulses'], icons: ['button', 'eye', 'drop'],
    lede: 'Anything that is on or off: buttons, float switches, door contacts, proximity and photoelectric sensors, and pulse meters.',
    tips: ['Each input is isolated with its own + and −, so it can take a sourcing (PNP) or sinking (NPN) signal with the right wiring.', 'Inputs accept up to 50 V; most field sensors run on 24 V.', 'Check the user manual for input thresholds before wiring.'],
    items: ['photo', 'prox', 'float', 'flow', 'button', 'doorSensor', 'ioExt'] },
  { id: 'do', label: 'Digital outputs', ports: 'DO0–DO3', devices: ['Relays', 'Lamps', 'Fans'], icons: ['relay', 'button', 'fan'],
    lede: 'Switch things on and off from a rule, a schedule or a dashboard button.',
    tips: ['Outputs are isolated and handle up to 50 V DC; use a relay for pumps, motors or anything on mains.', 'Fit a flyback diode across relay coils if the relay doesn’t already have one.', 'Need more than four? Add relays over Ethernet or Modbus.'],
    items: ['relay', 'button', 'fan', 'relayEth', 'ioExt'] },
  { id: 'an', label: 'Analog inputs', ports: 'AN0–AN3 · AGND', devices: ['4–20 mA', '0–10 V', '0–5 V'], icons: ['gauge', 'drop', 'thermo'],
    lede: 'Standard industrial transmitters: pressure, level, flow, temperature and position, read as 0–5 V, 0–10 V or 0–20 mA.',
    tips: ['Wire the signal to ANx and its return to AGND; loop-powered 4–20 mA devices usually take 24 V from the panel supply.', 'All four inputs share AGND, so keep sensor grounds at the same potential.', 'Most transmitters are bought from instrument suppliers. For more channels, add the 8-channel extender on RS485.'],
    generic: ['Pressure transmitter, 4–20 mA', 'Submersible level transmitter, 4–20 mA', 'Flow meter with analog output', 'PT100 temperature transmitter', 'Valve position feedback, 0–10 V'],
    items: ['aiExt'] },
  { id: 'lan', label: 'Ethernet & 4G', ports: 'Gigabit · 10/100M · Mini PCIe', devices: ['Routers', 'Switches', 'Cameras'], icons: ['router', 'net', 'camera'],
    lede: 'Two Ethernet ports for the plant and the office network, and a Mini PCIe socket for built-in 4G.',
    tips: ['Use the Gigabit port for the busier network, such as cameras or the cloud uplink.', 'For built-in 4G, fit the LTE module and route its antennas through ANT0–ANT3.', 'Serial-to-Ethernet gateways let one controller reach machines across the site.'],
    items: ['router4g', 'tsw202', 'lte', 'ant4g', 'serialEth', 'serialServer', 'smartCam', 'ethCable'] },
  { id: 'usb', label: 'USB & HDMI', ports: '2× USB 2.0 · HDMI 2.0', devices: ['Screens', 'Cameras', 'Serial'], icons: ['screen', 'camera', 'plug'],
    lede: 'Add a local touchscreen, a camera, or more serial ports.',
    tips: ['HDMI drives a display up to 4K 60 Hz; touch uses one USB port.', 'USB serial adapters add RS232 or RS485 ports for older machines.', 'Camera bandwidth is limited by USB 2.0; use an Ethernet camera for high frame rates.'],
    items: ['touch', 'edatec', 'usbCam', 'usbSerial', 'usb2ch'] },
  { id: 'lora', label: 'LoRaWAN sensors', ports: 'Via a gateway on Ethernet', devices: ['Wireless', 'Battery'], icons: ['lora', 'battery'],
    lede: 'Battery-powered wireless sensors across a whole building or farm. A LoRaWAN gateway collects them and the PiControl runs the logic.',
    tips: ['The gateway joins the PiControl’s network over Ethernet and forwards readings by MQTT.', 'Ideal where cables are costly: rooftops, fields, pipe networks and old buildings.', 'UC100 converters turn any Modbus device into a wireless LoRaWAN one.'],
    items: ['ug65', 'em320', 'leak', 'pipe', 'uc100'] },
  { id: 'power', label: 'Power', ports: 'VIN · GND (10–30 V DC)', devices: ['24 V supply', 'Backup'], icons: ['bolt', 'battery'],
    lede: 'A 24 V DIN-rail supply powers the controller and the field sensors from the same rail.',
    tips: ['Any 10–30 V DC supply works; 24 V is the cabinet standard.', 'Allow for sensor and relay current on top of the controller.', 'A supply with a battery charger keeps logging during power cuts.'],
    items: ['psu24', 'psu36', 'drc40', 'psu12', 'antKit'] }
];

// Example systems, each a parts list with the port every part uses.
const RECIPES = [
  { id: 'farm', name: 'Smart farm', color: '#1a9e45', icon: 'leaf', blurb: 'Watch the soil and the sun, run the irrigation pump, and report over 4G from the middle of a field.',
    parts: [['picontrol', 1, 'Controller'], ['soil', 2, 'RS485'], ['solar', 1, 'RS485'], ['float', 1, 'DI0'], ['relay', 1, 'DO0 → pump'], ['lte', 1, 'Mini PCIe'], ['ant4g', 1, 'ANT0'], ['psu36', 1, 'VIN']] },
  { id: 'energy', name: 'Energy monitoring', color: '#f56300', icon: 'bolt', blurb: 'Meter every circuit, alarm on overload, and show live kWh on a screen at the switchboard.',
    parts: [['picontrol', 1, 'Controller'], ['meter', 4, 'RS485'], ['thermocouple', 2, 'RS485'], ['relay', 1, 'DO0 → alarm'], ['edatec', 1, 'HDMI + USB'], ['psu24', 1, 'VIN']] },
  { id: 'water', name: 'Water quality station', color: '#0071e3', icon: 'drop', blurb: 'pH, conductivity, turbidity and oxygen, plus tank level and dosing-pump control, online through a 4G router.',
    parts: [['picontrol', 1, 'Controller'], ['ph', 1, 'RS485'], ['ec', 1, 'RS485'], ['turbidity', 1, 'RS485'], ['dissolvedO2', 1, 'RS485'], ['ultrasonic', 1, 'RS485'], ['relay', 1, 'DO0 → dosing'], ['router4g', 1, 'Gigabit LAN'], ['drc40', 1, 'VIN']] }
];

const ICONS = {
  thermo: '<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0Z"/><path d="M12 9v7"/>',
  leaf: '<path d="M5 19c0-8 5-13 14-14-1 9-6 14-14 14Z"/><path d="M5 19 13 11"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  wind: '<path d="M3 9h11a3 3 0 1 0-3-3M3 15h15a3 3 0 1 1-3 3M3 12h8"/>',
  bolt: '<path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/>',
  flask: '<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M7.5 15h9"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  radar: '<path d="M4 12h3m10 0h3"/><circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 1 10 0M7 17a7 7 0 0 0 10 0"/>',
  wave: '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/><path d="M3 18c2-4 4-4 6 0s4 4 6 0 4-4 6 0" opacity=".5"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
  gauge: '<path d="M4 17a8 8 0 1 1 16 0"/><path d="m12 17 4-5"/>',
  hub: '<circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21"/>',
  lora: '<path d="M8.5 15.5a5 5 0 0 1 0-7m7 0a5 5 0 0 1 0 7M5.5 18.5a9 9 0 0 1 0-13m13 0a9 9 0 0 1 0 13"/><circle cx="12" cy="12" r="1.5"/>',
  plug: '<path d="M9 2v5m6-5v5M6 7h12v4a6 6 0 0 1-12 0V7Zm6 10v5"/>',
  net: '<rect x="3" y="3" width="7" height="6" rx="1"/><rect x="14" y="3" width="7" height="6" rx="1"/><rect x="8.5" y="15" width="7" height="6" rx="1"/><path d="M6.5 9v3h11V9M12 12v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  magnet: '<path d="M6 3v9a6 6 0 0 0 12 0V3h-4v9a2 2 0 0 1-4 0V3H6Z"/><path d="M6 7h4m4 0h4"/>',
  button: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  relay: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 15h3l3-5h2M8 9h2"/>',
  fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10c0-5 4-7 6-5s-1 5-4 5M14 12c5 0 7 4 5 6s-5-1-5-4M12 14c0 5-4 7-6 5s1-5 4-5M10 12c-5 0-7-4-5-6s5 1 5 4"/>',
  router: '<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 13V8m10 5V8M7 16.5h.01M11 16.5h.01"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  cell: '<path d="M4 20h2v-4H4zM9 20h2v-8H9zM14 20h2V8h-2zM19 20h2V4h-2z"/>',
  ant: '<path d="M12 21V9"/><path d="M8.5 5.5a5 5 0 0 1 7 0M6 3a8.5 8.5 0 0 1 12 0"/><circle cx="12" cy="9" r="1.5"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 11v2M7 10v4m4-4v4"/>'
};
const icon = (k, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.chip}</svg>`;
const rm = v => 'RM' + v.toLocaleString('en-MY', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });

// Which PiControl resource each product takes up, for the system builder and the "Uses" line on each card.
const USES = {
  sht40: ['rs485'], thIndustrial: ['rs485'], soil: ['rs485'], lux: ['rs485'], solar: ['rs485'], co2: ['rs485'], thermocouple: ['rs485'],
  meter: ['rs485'], ph: ['rs485'], ec: ['rs485'], turbidity: ['rs485'], dissolvedO2: ['rs485'], lidar: ['rs485'], ultrasonic: ['rs485'],
  ioExt: ['rs485'], aiExt: ['rs485'], rs485Hub: ['rs485'], uc100: ['rs485'], usbSerial: ['usb'], usb2ch: ['usb'], serialEth: ['lan'], serialServer: ['lan'],
  photo: ['di'], prox: ['di'], float: ['di'], flow: ['di'], button: ['di', 'do'], doorSensor: ['di'], relay: ['do'], fan: ['do'], relayEth: ['lan'],
  router4g: ['lan'], tsw202: ['lan'], lte: ['pcie', 'ant'], ant4g: ['ant'], smartCam: ['lan'], ethCable: [], usbCam: ['usb'], touch: ['hdmi', 'usb'], edatec: ['hdmi', 'usb'],
  ug65: ['lan'], em320: ['lora'], leak: ['lora'], pipe: ['lora'], psu24: ['vin'], psu36: ['vin'], drc40: ['vin'], psu12: ['vin'], antKit: ['wifi'], picontrol: []
};
// What one PiControl offers, and what extenders add (from their product names: 8 DI + 8 DO, 8 analog inputs, 8 relays).
const BUDGET = { rs485: 32, di: 4, do: 4, an: 4, lan: 2, usb: 2, hdmi: 1, pcie: 1, ant: 4, vin: 1 };
const ADDS = { ioExt: { di: 8, do: 8 }, aiExt: { an: 8 }, relayEth: { do: 8 } };
const RES = {
  rs485: ['RS485 devices', 'A · B · 485G'], di: ['Digital inputs', 'DI + / −'], do: ['Digital outputs', 'DO'], an: ['Analog inputs', 'AN + AGND'],
  lan: ['Ethernet ports', 'Ethernet'], usb: ['USB ports', 'USB'], hdmi: ['HDMI', 'HDMI'], pcie: ['Mini PCIe', 'Mini PCIe'], ant: ['Antenna ports', 'ANT'],
  vin: ['Power supply', 'VIN · GND'], lora: ['LoRaWAN', 'LoRaWAN gateway'], wifi: ['Wi-Fi', 'Wi-Fi antenna']
};
// Topic filters for the long RS485 list.
const TOPICS_485 = { Environment: ['sht40', 'thIndustrial', 'lux', 'solar', 'co2'], 'Soil & water': ['soil', 'ph', 'ec', 'turbidity', 'dissolvedO2', 'ultrasonic'],
  'Energy & process': ['meter', 'thermocouple'], Distance: ['lidar', 'ultrasonic'], Expansion: ['ioExt', 'aiExt', 'rs485Hub', 'uc100'] };
// Where each tab's port sits on the product photos (crop of the photo, highlighted groups).
const PORT_VIEW = {
  rs485: ['front', 'rs485'], di: ['front', 'di'], do: ['front', 'do'], an: ['front', 'an'], lan: ['front', 'lan'], usb: ['side', 'usb'], lora: ['front', 'lan'], power: ['front', 'power']
};
