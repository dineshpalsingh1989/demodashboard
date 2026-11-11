// What wires into each terminal of the IRIV IO Controller MQTT, using products listed on my.cytron.io.
// Names, links and prices (RM, excluding tax) were taken from the store on 11 November 2026.

const CY = 'https://my.cytron.io/';
const item = (name, path, price, note, icon) => ({ name, url: CY + path, price, note, icon });

const PRODUCTS = {
  ioc: item('IRIV IO Controller MQTT', 'p-iriv-io-controller-mqtt-ir4.0-industrial-i-o-controller-with-mqtt-ready', 334.95, 'The gateway: 11 inputs, 4 outputs, 2 analog inputs, RS485 and Ethernet.', 'chip'),
  photo: item('BJ300 Photoelectric Sensor (PNP)', 'c-sensors-connectivities/p-bj300-photoelectric-sensors-pnp', 169, 'Counts parts or cycles as they pass.', 'eye'),
  prox: item('E2E2-X5MY1M4 Inductive Proximity Sensor', 'c-sensors-connectivities/p-e2e2-x5my1m4-inductive-proximity-sensor', 715.4, 'Detects metal: a guard closed, a pallet in place.', 'magnet'),
  float: item('Water Float / Level Switch', 'c-liquid-flow-ph-sensor/p-water-float-or-level-sensor-switch', 8.2, 'A simple contact for tank high or low level.', 'drop'),
  button: item('Illuminated Push Button 24 VDC / 240 VAC', 'c-industry-accessories/p-illuminated-push-push-button-24vdc-240vac', 10, 'An operator call, acknowledge or stop button.', 'button'),
  relay: item('24 V DC Industrial Relay', 'c-industry-accessories/p-24v-dc-industrial-relay', 35, 'Lets an output switch a pump, a valve or a lamp.', 'relay'),
  fan: item('24 V Fan 2400 RPM (92 mm)', 'c-industry-accessories/p-24v-fan-2400rpm-92mm-x-92mm', 49, 'A cabinet fan switched from an output.', 'fan'),
  meter: item('Acrel ADL Power Meter (RS485 Modbus RTU)', 'c-industry-accessories/p-adl-power-meter', 149, 'Energy readings polled over Modbus and published as MQTT.', 'bolt'),
  thIndustrial: item('Industrial Grade RS485 Temperature & Humidity Sensor', 'c-sensors-connectivities/p-industrial-grade-rs485-temperature-humidity-sensor', 179, 'Cabinet or room climate over Modbus.', 'thermo'),
  sht40: item('SHT40 Temperature & Humidity Sensor with RS485', 'c-sensors-connectivities/p-sht40-rs485-temperature-and-humidity-sensor', 35, 'A low-cost Modbus climate sensor.', 'thermo'),
  ultrasonic: item('A02YY4W IP67 Ultrasonic Ranging Sensor 3–450 cm (RS485)', 'c-industry-accessories/p-a02yy4w-ip67-waterproof-ultrasonic-ranging-sensor-3-450cm', 73.5, 'Tank level as a distance, over RS485.', 'radar'),
  ioExt: item('Industrial 8×DI + 8×DO Modbus RTU IO Extender', 'c-industrial-adapter-converter/p-industrial-8-ch-modbus-rtu-gpio-extender', 119, 'More inputs and outputs on the RS485 bus.', 'chip'),
  aiExt: item('Industrial 8-Ch Analog Input Extender (Modbus RTU)', 'c-industrial-adapter-converter/p-industrial-8-ch-analog-input-extender-module', 119, 'Eight more analog inputs on the RS485 bus.', 'chip'),
  rs485Hub: item('Industrial Isolated 8-Ch RS485 Hub', 'c-industry-accessories/p-industrial-grade-isolated-8-ch-rs485-hub', 189, 'Splits one RS485 port into 8 isolated branches.', 'hub'),
  ethCable: item('Gigabit Ethernet Cable', 'c-industry-accessories/p-gigabit-ethernet-cable', 12.9, 'From the ETH port to the switch or router.', 'net'),
  tsw202: item('TSW202 Industrial Managed PoE+ Switch', 'c-router-switch-gateway/p-tsw202-industrial-managed-poe-plus-switch', 686, 'Puts several controllers and the broker on one network.', 'net'),
  router4g: item('RUT200 LTE Cat 4 Industrial Router', 'c-router-switch-gateway/p-rut200-lte-cat-4-industrial-grade-router', 566, 'Reaches a cloud broker from a site with no wired internet.', 'router'),
  smarthub: item('IRIV SmartHub CM5', 'p-iriv-smarthub-cm5', 925, 'Runs the MQTT broker, Node-RED and the dashboard on site.', 'screen'),
  picontrol: item('IRIV PiControl (CM4 / CM5)', 'p-iriv-picontrol-cm4-industrial-controller', 1489, 'A full controller that can host the broker and the logic.', 'chip'),
  psu24: item('Meanwell DIN-Rail Power Supply 24 V', 'c-industrial-power-supply/p-meanwell-industry-din-rail-mount-power-supply-24v', 98, 'Clips on the rail beside the controller.', 'bolt'),
  psu36: item('Industry Switching Power Supply 24 V 36 W (wide AC/DC input)', 'c-industrial-power-supply/p-industry-switching-power-supply-24v-36w-wide-dc-and-ac-input-voltage', 89, 'A wide-input supply for remote sites.', 'bolt'),
  drc40: item('Meanwell DRC-40 DIN-Rail Supply with Battery Charger', 'c-industrial-power-supply/p-meanwell-drc-40-series-industry-din-rail-mount-power-supply', 190, 'Add a battery and alarms still go out in a power cut.', 'battery')
};

// One tab per terminal group. `view` is the photo and highlighted group(s) shown at the top of the tab.
const CONNECT = [
  { id: 'di', label: 'Switches & sensors', color: '#1a9e45', ports: 'DI0–DI10', view: ['front', ['di', 'di2']], devices: ['Sensors', 'Switches', 'Buttons'], icons: ['eye', 'drop', 'button'],
    lede: 'Anything that is on or off: a sensor, a float switch, a contact on a breaker, a push button. Eleven of them.',
    tips: ['Inputs are isolated and accept up to 50 V, so 24 V sensors wire straight in.', 'DI0–DI4 and DI5–DI10 have separate S/S commons: wire one group for sinking sensors and the other for sourcing.', 'Set a channel to "On Change" and it publishes only when the signal changes.'],
    generic: ['Breaker auxiliary contact', 'Door or guard switch', 'Machine run signal'],
    items: ['photo', 'prox', 'float', 'button'] },
  { id: 'do', label: 'Relays & lamps', color: '#f56300', ports: 'DO0–DO3', view: ['front', ['do']], devices: ['Relay', 'Lamp', 'Fan'], icons: ['relay', 'button', 'fan'],
    lede: 'Four isolated outputs, each on its own pair of terminals, to switch things from a dashboard or a rule.',
    tips: ['Outputs switch up to 50 V. Use a relay for mains loads, pumps and motors.', 'Each output has an LED on the front panel.', 'Check the datasheet for the output current limit before wiring a load directly.'],
    generic: ['Stack light', 'Siren', 'Solenoid valve'],
    items: ['relay', 'fan'] },
  { id: 'ai', label: 'Analog sensors', color: '#8e44ad', ports: 'AN0 · AN1', view: ['front', ['ai']], devices: ['4–20 mA', '0–10 V'], icons: ['radar', 'thermo'],
    lede: 'Two 12-bit analog inputs for the values that are not just on or off: pressure, level, flow, temperature.',
    tips: ['Set each input to voltage or current with the AN-IN MODE switch on the side.', 'Voltage mode reads 0–10.56 V; current mode reads 0–42.58 mA, which covers 4–20 mA transmitters.', 'Need more than two? Add an analog extender on RS485.'],
    generic: ['4–20 mA pressure transmitter', '0–10 V level sensor', '4–20 mA flow meter'],
    items: ['aiExt'] },
  { id: 'rs485', label: 'RS485 · Modbus', color: '#0a8a8f', ports: 'A · B · G', view: ['front', ['rs485']], devices: ['Meters', 'Sensors', 'Extenders'], icons: ['bolt', 'thermo', 'chip'],
    lede: 'The gateway polls Modbus RTU devices on its isolated RS485 port and publishes their values as MQTT, alongside its own inputs.',
    tips: ['Add a poll job for each register you want; it becomes a topic.', 'Daisy-chain A to A and B to B, and give every device its own address.', 'At the end of a long bus, switch on the built-in terminator on the side.'],
    items: ['meter', 'thIndustrial', 'sht40', 'ultrasonic', 'ioExt', 'aiExt', 'rs485Hub'] },
  { id: 'net', label: 'Network & broker', color: '#0071e3', ports: 'ETH', view: ['front', ['lan']], devices: ['Switch', '4G router', 'Broker'], icons: ['net', 'router', 'screen'],
    lede: 'One Ethernet cable takes every message to an MQTT broker: on site, or in the cloud.',
    tips: ['The connection is outbound only, so no ports need opening on your firewall.', 'An IRIV SmartHub or PiControl can run the broker and the dashboard locally.', 'The firmware uses standard MQTT on port 1883; route through a local secure broker where TLS is required.'],
    generic: ['HiveMQ', 'AWS IoT', 'Azure IoT', 'Mosquitto'],
    items: ['ethCable', 'tsw202', 'router4g', 'smarthub', 'picontrol'] },
  { id: 'power', label: 'Power', color: '#e5383b', ports: 'V+ · V− (10–30 V DC)', view: ['front', ['power']], devices: ['24 V supply', 'Backup'], icons: ['bolt', 'battery'],
    lede: 'One 24 V supply on the rail runs the controller and the sensors wired to it.',
    tips: ['Any DC supply from 10 to 30 V works; the input is surge protected.', 'A supply with a battery charger keeps alarms flowing through a power cut.'],
    items: ['psu24', 'psu36', 'drc40'] }
];

// Example systems, each a parts list with the terminal every part uses.
const RECIPES = [
  { id: 'pump', name: 'Pump station', color: '#0071e3', icon: 'drop', blurb: 'The demo above, for real: float switches for high and low level, a relay for the pump, an ultrasonic level sensor on RS485 and a 4G router to reach the cloud.',
    parts: [['ioc', 1, 'Gateway'], ['float', 2, 'DI0 · DI1'], ['relay', 1, 'DO0 → pump'], ['ultrasonic', 1, 'RS485'], ['router4g', 1, 'ETH'], ['ethCable', 1, 'ETH'], ['drc40', 1, 'V+ · V−']] },
  { id: 'machine', name: 'Machine monitor', color: '#1a9e45', icon: 'eye', blurb: 'Count cycles with a photoelectric sensor, catch stops from a guard switch, light a lamp through a relay and log the machine’s energy.',
    parts: [['ioc', 1, 'Gateway'], ['photo', 1, 'DI0 → cycle count'], ['prox', 1, 'DI2 → guard'], ['button', 1, 'DI3 → operator call'], ['relay', 1, 'DO1 → stack lamp'], ['meter', 1, 'RS485'], ['ethCable', 1, 'ETH'], ['psu24', 1, 'V+ · V−']] },
  { id: 'site', name: 'On-site dashboard', color: '#f56300', icon: 'screen', blurb: 'Three gateways around a plant room publish to a broker on an IRIV SmartHub, which shows everything on one screen.',
    parts: [['ioc', 3, 'Gateways'], ['smarthub', 1, 'Broker + dashboard'], ['tsw202', 1, 'Network'], ['ethCable', 4, 'ETH'], ['thIndustrial', 1, 'RS485'], ['psu24', 3, 'V+ · V−']] }
];

// Which controller resource each product takes up, for the system builder and the "Uses" line on each card.
const USES = {
  ioc: [], photo: ['di'], prox: ['di'], float: ['di'], button: ['di'], relay: ['do'], fan: ['do'], meter: ['rs485'], thIndustrial: ['rs485'], sht40: ['rs485'], ultrasonic: ['rs485'],
  ioExt: ['rs485'], aiExt: ['rs485'], rs485Hub: ['rs485'], ethCable: [], tsw202: [], router4g: [], smarthub: [], picontrol: [], psu24: ['vin'], psu36: ['vin'], drc40: ['vin']
};
const CONTROLLER = 'ioc';
const BUDGET = { di: 11, do: 4, ai: 2, rs485: 32, vin: 1 };
const ADDS = { ioExt: { di: 8, do: 8 }, aiExt: { ai: 8 } };
const RES = { di: ['Digital inputs', 'DI'], do: ['Digital outputs', 'DO'], ai: ['Analog inputs', 'AN'], rs485: ['RS485 devices', 'A · B · G'], vin: ['Power supply', 'V+ · V−'] };
const FIX = { di: 'add the 8×DI + 8×DO extender on RS485, or a second controller', do: 'add the IO extender on RS485, or a second controller', ai: 'add the 8-channel analog extender on RS485', rs485: 'split the bus with the isolated 8-channel RS485 hub' };
const POWER_HINT = 'Add the Meanwell 24 V DIN-rail supply.';
const extraChecks = () => [];

const ICONS = {
  thermo: '<path d="M10 14V5a2 2 0 1 1 4 0v9a4 4 0 1 1-4 0Z"/><path d="M12 9v7"/>',
  bolt: '<path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/>',
  drop: '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
  radar: '<path d="M4 12h3m10 0h3"/><circle cx="12" cy="12" r="2"/><path d="M7 7a7 7 0 0 1 10 0M7 17a7 7 0 0 0 10 0"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
  hub: '<circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21"/>',
  net: '<rect x="3" y="3" width="7" height="6" rx="1"/><rect x="14" y="3" width="7" height="6" rx="1"/><rect x="8.5" y="15" width="7" height="6" rx="1"/><path d="M6.5 9v3h11V9M12 12v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  magnet: '<path d="M6 3v9a6 6 0 0 0 12 0V3h-4v9a2 2 0 0 1-4 0V3H6Z"/><path d="M6 7h4m4 0h4"/>',
  button: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  relay: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 15h3l3-5h2M8 9h2"/>',
  router: '<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 13V8m10 5V8M7 16.5h.01M11 16.5h.01"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  battery: '<rect x="3" y="7" width="16" height="10" rx="2"/><path d="M21 11v2M7 10v4m4-4v4"/>',
  fan: '<circle cx="12" cy="12" r="2"/><path d="M12 10c0-4 1-7 3-7s2 4-1 7m0 4c4 0 7 1 7 3s-4 2-7-1m-4 0c0 4-1 7-3 7s-2-4 1-7m0-4c-4 0-7-1-7-3s4-2 7 1"/>'
};
const icon = (k, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.chip}</svg>`;
const rm = v => 'RM' + v.toLocaleString('en-MY', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
