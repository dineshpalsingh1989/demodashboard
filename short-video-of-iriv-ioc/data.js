// IRIV IO Controller MQTT: every terminal and connector, with its position in the product photos (in a 1000 × 1000 space).
// Specifications follow the Cytron product page: https://my.cytron.io/p-iriv-io-controller-mqtt-ir4.0-industrial-i-o-controller-with-mqtt-ready

const IMG = { hero: 'images/hero.webp', front: 'images/front.webp', iso: 'images/iso.webp', rail: 'images/rail.webp' };
const PRODUCT = 'IRIV IO Controller MQTT';

// Two 16-way push-in terminal blocks on the front panel: 8 columns × 2 rows each.
const XB = { 1: [417, 439, 462, 485, 508, 531, 553, 576], 2: [616, 639, 661, 684, 707, 730, 753, 775] };
const TOP = 664, BOT = 705;
const row = (block, r, list) => list.map(([name, fn, group], i) => ({ name, fn, group, block, row: r, x: XB[block][i], y: r === 'top' ? TOP : BOT }));

const TERMINALS = [
  ...row(1, 'top', [['V+', 'Power in, 10–30 V DC (surge protected)', 'power'], ['RS485 A', 'RS485 data A', 'rs485'], ['RS485 B', 'RS485 data B', 'rs485'], ['RS485 G', 'RS485 isolated ground', 'rs485'],
    ['AGND', 'Analog ground', 'ai'], ['AGND', 'Analog ground', 'ai'], ['AN0', 'Analog input 0 (voltage or current)', 'ai'], ['AN1', 'Analog input 1 (voltage or current)', 'ai']]),
  ...row(1, 'bottom', [['V−', 'Power ground', 'power'], ['DGND', 'Digital ground', 'di'], ['S/S', 'Common for DI0–DI4 (sink or source)', 'di'],
    ['DI0', 'Isolated digital input 0', 'di'], ['DI1', 'Isolated digital input 1', 'di'], ['DI2', 'Isolated digital input 2', 'di'], ['DI3', 'Isolated digital input 3', 'di'], ['DI4', 'Isolated digital input 4', 'di']]),
  ...row(2, 'top', [0, 0, 1, 1, 2, 2, 3, 3].map(n => ['DO' + n, 'Isolated digital output ' + n, 'do'])),
  ...row(2, 'bottom', [['DGND', 'Digital ground', 'di2'], ['S/S', 'Common for DI5–DI10 (sink or source)', 'di2'], ...[5, 6, 7, 8, 9, 10].map(n => ['DI' + n, 'Isolated digital input ' + n, 'di2'])])
];
const pinsOf = group => TERMINALS.filter(t => t.group === group).map(t => ({ label: t.name.replace('RS485 ', ''), x: t.x, y: t.y, row: t.row }));

const GROUPS = [
  { id: 'power', img: 'front', color: '#e5383b', name: 'Power', title: '10–30 V DC in.',
    body: 'One supply on V+ and V−, anywhere from 10 to 30 V DC, with surge protection. A 24 V DIN-rail supply suits it.',
    chips: ['V+', 'V−', '10–30 V DC', 'Surge protected'], rects: [[408, 654, 427, 716]] },
  { id: 'rs485', img: 'front', color: '#0a8a8f', name: 'RS485', title: 'Isolated RS485.',
    body: 'A galvanically isolated Modbus RTU port. Set up poll jobs in the web page and the values of meters and sensors on the bus are published as MQTT too.',
    chips: ['A', 'B', 'G', 'Modbus RTU', 'Isolated'], rects: [[429, 654, 496, 676]] },
  { id: 'ai', img: 'front', color: '#8e44ad', name: 'Analog inputs', title: 'Two analog inputs.',
    body: 'Two 12-bit inputs, each switchable between voltage (0–10.56 V) and current (0–42.58 mA), so 0–10 V sensors and 4–20 mA transmitters both fit.',
    chips: ['AN0', 'AN1', '12-bit', '0–10 V', '4–20 mA'], rects: [[498, 654, 587, 676]] },
  { id: 'di', img: 'front', color: '#1a9e45', name: 'Inputs 0–4', title: 'Five inputs, one common.',
    body: 'Isolated inputs DI0 to DI4 accept up to 50 V. They share the S/S0..4 common, which you wire for sinking or sourcing sensors.',
    chips: ['DI0–DI4', 'S/S0..4', 'Isolated', 'Up to 50 V'], rects: [[429, 694, 587, 717]] },
  { id: 'di2', img: 'front', color: '#0f7a35', name: 'Inputs 5–10', title: 'Six more, a second common.',
    body: 'DI5 to DI10 share their own S/S5..10 common, so one group can read sinking sensors while the other reads sourcing ones.',
    chips: ['DI5–DI10', 'S/S5..10', 'Isolated', 'Up to 50 V'], rects: [[606, 694, 786, 717]] },
  { id: 'do', img: 'front', color: '#f56300', name: 'Digital outputs', title: 'Four isolated outputs.',
    body: 'DO0 to DO3 each have their own pair of terminals and switch up to 50 V. Use them for relays, lamps, sirens and valves.',
    chips: ['DO0', 'DO1', 'DO2', 'DO3', 'Up to 50 V'], rects: [[606, 654, 786, 676]] },
  { id: 'lan', img: 'front', color: '#0071e3', name: 'Ethernet', title: 'One cable to the broker.',
    body: 'An RJ45 port (W5500 controller) carries every message out to your MQTT broker, and serves the setup web page.',
    chips: ['RJ45', 'MQTT', 'Web setup'], rects: [[796, 580, 906, 641]], labels: [{ label: 'ETH', x: 851, y: 580, row: 'top' }] },
  { id: 'usb', img: 'front', color: '#5e5ce6', name: 'USB-C', title: 'USB-C for setup.',
    body: 'The PROG port is for local configuration and firmware updates. In service, everything runs over Ethernet.',
    chips: ['PROG', 'USB-C', 'Firmware'], rects: [[113, 620, 172, 644]], labels: [{ label: 'PROG', x: 142, y: 620, row: 'top' }] },
  { id: 'status', img: 'front', color: '#d4a000', name: 'LEDs & buttons', title: 'A light for every channel.',
    body: 'Eleven input LEDs and four output LEDs show each channel, with PWR, USR and RS485 lights. RESET, BOOT and a programmable USER button sit above them.',
    chips: ['DIN 0–10', 'DOUT 0–3', 'PWR', 'USR', '485', 'USER'], rects: [[182, 604, 394, 646], [110, 646, 394, 665]],
    labels: [{ label: 'RESET', x: 206, y: 604, row: 'top' }, { label: 'BOOT', x: 286, y: 604, row: 'top' }, { label: 'USER', x: 366, y: 604, row: 'top' }, { label: 'Input LEDs', x: 250, y: 665, row: 'bottom' }] },
  { id: 'switches', img: 'rail', color: '#c07a00', name: 'Side switches', title: 'Two switches on the side.',
    body: 'One turns on the RS485 terminator at the end of a bus. The other sets each analog input to voltage or current.',
    chips: ['R-Term', 'AN0 mode', 'AN1 mode'], rects: [[440, 457, 483, 516], [440, 522, 485, 583]],
    labels: [{ label: 'RS485 terminator', x: 461, y: 457, row: 'top' }, { label: 'Analog V / mA', x: 462, y: 583, row: 'bottom' }] },
  { id: 'din', img: 'rail', color: '#86868b', name: 'DIN rail', title: 'Clips onto a DIN rail.',
    body: 'A fanless metal case with a rail clip on the back. It sits in the cabinet beside the power supply and the terminals it reads.',
    chips: ['DIN rail', 'Metal case', 'Fanless'], rects: [[330, 308, 366, 540]], labels: [{ label: 'DIN-rail clip', x: 348, y: 308, row: 'top' }] }
];
GROUPS.forEach(g => { const p = pinsOf(g.id); if (p.length) g.pins = p; });
const G = Object.fromEntries(GROUPS.map(g => [g.id, g]));
const BLOCK_TITLES = { 1: 'Left block · power, RS485, analog, inputs 0–4', 2: 'Right block · outputs 0–3, inputs 5–10' };

const FEATURES = [
  ['Digital inputs', '11 isolated inputs, up to 50 V, in two groups with separate commons'], ['Digital outputs', '4 isolated outputs, up to 50 V'],
  ['Analog inputs', '2× 12-bit, each 0–10.56 V or 0–42.58 mA'], ['Serial', '1× galvanically isolated RS485, Modbus RTU'],
  ['Network', 'RJ45 Ethernet (W5500 controller)'], ['MQTT', 'JSON payloads on standard MQTT, port 1883. Per-channel topic, QoS and retain; report on change or on a timer'],
  ['Processor', 'Raspberry Pi RP2350, dual Arm Cortex-M33 at 150 MHz · 520 KB SRAM · 2 MB flash'], ['Setup', 'Built-in web interface over Ethernet; USB-C for local configuration and firmware'],
  ['On board', 'LEDs for power, RS485 and every input and output; reset, boot and user buttons; buzzer'], ['Power', 'DC 10–30 V, surge protected'],
  ['Build', 'Metal enclosure, fanless, DIN-rail mount'], ['Warranty', '12 months']
];
const KITS = [
  ['Zero code', 'Tick the channels to publish, give each a name and a topic, and save. There is nothing to program.'],
  ['Report by exception', 'A channel can publish only when its value changes, which keeps traffic and mobile data low.'],
  ['Good to know', 'The firmware uses standard MQTT on port 1883. Where TLS is required, route it through a local secure broker or edge gateway.']
];
