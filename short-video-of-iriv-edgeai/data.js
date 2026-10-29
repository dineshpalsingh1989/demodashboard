// IRIV EdgeAI CM5: every connector, with its position in the product photos (pixels of the 800×800 images).
// Specifications follow the Cytron product page: https://my.cytron.io/c-industrial-edge-controller/p-iriv-edge-ai-cm5

const IMG = { front: 'images/front.png', iso: 'images/iso.png', back: 'images/back.png' };
const PRODUCT = 'IRIV EdgeAI CM5';

// One 16-way push-in terminal block on the front panel: 8 columns × 2 rows.
const X1 = [370, 385, 400, 415, 430, 445, 460, 475];
const TOP = 553, BOT = 567;

const TERMINALS = [
  ['VIN', 'Power in, 10–30 V DC (surge protected)', 'power'], ['RS485 A', 'RS485 data A (D+)', 'rs485'], ['RS485 B', 'RS485 data B (D−)', 'rs485'], ['RS485 G', 'RS485 isolated ground', 'rs485'],
  ['DO0', 'Dry-contact output 0', 'do'], ['DO0', 'Dry-contact output 0', 'do'], ['L0 +', 'Light driver 0, positive', 'led'], ['L0 −', 'Light driver 0, negative', 'led'],
  ['GND', 'Power ground', 'power'], ['S/S', 'Digital input common (sink or source)', 'di'], ['DI0', 'Isolated digital input 0', 'di'], ['DI1', 'Isolated digital input 1', 'di'],
  ['DO1', 'Dry-contact output 1', 'do'], ['DO1', 'Dry-contact output 1', 'do'], ['L1 +', 'Light driver 1, positive', 'led'], ['L1 −', 'Light driver 1, negative', 'led']
].map(([name, fn, group], i) => ({ name, fn, group, block: 1, row: i < 8 ? 'top' : 'bottom', x: X1[i % 8], y: i < 8 ? TOP : BOT }));

const pins = (...names) => names.map(([label, col, row]) => ({ label, x: X1[col], y: row === 't' ? TOP : BOT, row: row === 't' ? 'top' : 'bottom' }));
const pairs = (...names) => names.map(([label, col, row]) => ({ label, x: (X1[col] + X1[col + 1]) / 2, y: row === 't' ? TOP : BOT, row: row === 't' ? 'top' : 'bottom', pair: [X1[col], X1[col + 1]] }));

const GROUPS = [
  { id: 'cams', img: 'iso', color: '#0071e3', name: 'Camera ports', title: 'Two MIPI camera ports.',
    body: 'Two 4-lane MIPI CSI ports take Raspberry Pi cameras directly, with no USB bandwidth used. Run two cameras on one controller, such as top and side views of the same part.',
    chips: ['MIPI0', 'MIPI1', '4-lane CSI'], rects: [[612, 584, 662, 627], [659, 556, 703, 586]],
    labels: [{ label: 'MIPI0', x: 637, y: 627, row: 'bottom' }, { label: 'MIPI1', x: 681, y: 556, row: 'top' }] },
  { id: 'usb', img: 'iso', color: '#5e5ce6', name: 'USB 3.0 & HDMI', title: 'USB 3.0 and 4K HDMI.',
    body: 'Two USB 3.0 ports carry high-resolution industrial cameras at full speed. HDMI 2.0 drives a 4K 60 Hz screen for live inspection results.',
    chips: ['2× USB 3.0', 'HDMI 2.0', '4K @ 60 Hz'], rects: [[506, 617, 558, 698], [562, 608, 610, 657]],
    labels: [{ label: 'USB 3.0 ×2', x: 532, y: 698, row: 'bottom' }, { label: 'HDMI', x: 586, y: 608, row: 'top' }] },
  { id: 'cell', img: 'iso', color: '#c07a00', name: '4G & SIM', title: '4G, anywhere.',
    body: 'An mPCIe socket (USB 2.0) takes a 4G or LoRa module, with the SIM slot on the side. The 4G PWR and WWAN LEDs on the front show its status.',
    chips: ['mPCIe (USB 2.0)', 'SIM slot', '4G or LoRa'], rects: [[662, 578, 701, 607]], labels: [{ label: 'SIM', x: 681, y: 607, row: 'bottom' }] },
  { id: 'power', img: 'front', color: '#e5383b', name: 'Power', title: '10–30 V DC in.',
    body: 'Surge protected up to 60 V for 20 ms, and 11 W at full load, so a standard 24 V DIN-rail supply runs it with room for lights and sensors.',
    chips: ['VIN', 'GND', '10–30 V DC', '11 W max'], rects: [[362, 545, 378, 575]], pins: pins(['VIN', 0, 't'], ['GND', 0, 'b']) },
  { id: 'rs485', img: 'front', color: '#0a8a8f', name: 'RS485', title: 'Isolated RS485.',
    body: 'Up to 500 kbps with 5000 Vrms isolation. Send results to a PLC over Modbus, or read meters and sensors next to the camera.',
    chips: ['A', 'B', 'G', '5000 Vrms'], rects: [[377, 545, 423, 561]], pins: pins(['A', 1, 't'], ['B', 2, 't'], ['G', 3, 't']) },
  { id: 'di', img: 'front', color: '#1a9e45', name: 'Digital inputs', title: 'Two trigger inputs.',
    body: 'Isolated and bidirectional, 3–50 V high. Wire a photoelectric sensor to DI0 so a part arriving triggers the camera. S/S is the shared common for sinking or sourcing sensors.',
    chips: ['S/S', 'DI0', 'DI1', 'Up to 50 V'], rects: [[377, 559, 423, 575]], pins: pins(['S/S', 1, 'b'], ['DI0', 2, 'b'], ['DI1', 3, 'b']) },
  { id: 'do', img: 'front', color: '#f56300', name: 'Digital outputs', title: 'Two dry-contact outputs.',
    body: 'Isolated relay-style contacts, up to 50 V and 500 mA. Fire a reject pusher, open a barrier or switch a stack light when the AI decides.',
    chips: ['DO0', 'DO1', '50 V', '500 mA'], rects: [[422, 545, 453, 575]], pins: pairs(['DO0', 4, 't'], ['DO1', 4, 'b']) },
  { id: 'led', img: 'front', color: '#d4a000', name: 'Light drivers', title: 'Built-in light drivers.',
    body: 'L0 and L1 power inspection lights straight from VIN, up to 2 A each, with PWM dimming. Strobe a ring or dome light in time with each capture.',
    chips: ['L0', 'L1', '2 A each', 'PWM dimming'], rects: [[452, 545, 483, 575]], pins: pairs(['L0 + −', 6, 't'], ['L1 + −', 6, 'b']) },
  { id: 'lan', img: 'front', color: '#8e44ad', name: 'Ethernet', title: 'Two Gigabit ports.',
    body: 'Bring in IP and CCTV cameras over RTSP on one port, and send results to the plant or cloud on the other.',
    chips: ['ETH0', 'ETH1', '10/100/1000M'], rects: [[500, 522, 573, 585], [584, 522, 657, 585]],
    labels: [{ label: 'ETH0', x: 536, y: 522, row: 'top' }, { label: 'ETH1', x: 620, y: 522, row: 'top' }] },
  { id: 'status', img: 'front', color: '#86868b', name: 'LEDs & buttons', title: 'Status at a glance.',
    body: 'Power, activity, M.2, 4G power and WWAN LEDs, two programmable LEDs, a programmable USER button and a POWER button. An OLED and a buzzer are inside.',
    chips: ['PWR', 'ACT', 'M.2', '4G', 'WWAN', 'LED0', 'LED1', 'USER', 'POWER'], rects: [[188, 585, 348, 600], [267, 551, 342, 574]],
    labels: [{ label: 'USER', x: 277, y: 553, row: 'top' }, { label: 'POWER', x: 331, y: 553, row: 'top' }, { label: 'PWR', x: 196, y: 600, row: 'bottom' }, { label: 'ACT', x: 214.5, y: 600, row: 'bottom' }, { label: 'M.2', x: 233, y: 600, row: 'bottom' },
      { label: '4G', x: 268, y: 600, row: 'bottom' }, { label: 'WWAN', x: 287, y: 600, row: 'bottom' }, { label: 'LED0', x: 321, y: 600, row: 'bottom' }, { label: 'LED1', x: 340, y: 600, row: 'bottom' }] },
  { id: 'boot', img: 'front', color: '#e5383b', name: 'Boot / debug', title: 'USB-C for setup.',
    body: 'Flash the eMMC and debug over USB-C. Day to day you log in over the network.',
    chips: ['USB-C', 'BOOT / DBG'], rects: [[697, 564, 743, 585]], labels: [{ label: 'BOOT / DBG', x: 720, y: 585, row: 'bottom' }] },
  { id: 'wifi', img: 'front', color: '#0071e3', name: 'Wireless', title: 'Wireless, built in.',
    body: 'Dual-band 2.4 / 5 GHz Wi-Fi and Bluetooth 5.0 with BLE. The antenna is included.',
    chips: ['Wi-Fi 2.4 / 5 GHz', 'Bluetooth 5.0', 'Antenna included'], rects: [[24, 154, 66, 542], [60, 493, 170, 541]],
    labels: [{ label: 'Dual-band antenna', x: 45, y: 230, row: 'side' }] },
  { id: 'din', img: 'back', color: '#86868b', name: 'DIN rail', title: 'Clips onto a DIN rail.',
    body: 'A metal, fanless case, 139 × 88 × 38 mm, rated −20 to 60 °C. It clips onto a standard 35 mm rail next to the camera’s power supply.',
    chips: ['DIN rail', 'Fanless', '−20 to 60 °C'], rects: [[180, 478, 470, 638]], labels: [{ label: 'DIN-rail clip', x: 325, y: 478, row: 'top' }] }
];
const G = Object.fromEntries(GROUPS.map(g => [g.id, g]));

const SPECS = [
  ['Variant', '13 TOPS', '26 TOPS'],
  ['AI accelerator', 'Raspberry Pi AI HAT+, 13 TOPS', 'Raspberry Pi AI HAT+, 26 TOPS'],
  ['CPU', 'Raspberry Pi CM5, Cortex-A76 2.4 GHz', 'Raspberry Pi CM5, Cortex-A76 2.4 GHz'],
  ['RAM', '8 GB LPDDR4-4267', '8 or 16 GB LPDDR4-4267'],
  ['eMMC', '32 GB', '32 or 64 GB']
];
const FEATURES = [
  ['Cameras', '2× MIPI CSI (4-lane), 2× USB 3.0, IP cameras over Ethernet'], ['AI', 'Up to 26 TOPS on PCIe: detection, classification, OCR, counting'],
  ['Digital I/O', '2 isolated inputs (3–50 V), 2 dry-contact outputs (50 V, 500 mA)'], ['Light drivers', '2 outputs from VIN, 2 A each, PWM dimming'],
  ['Serial', '1× isolated RS485, up to 500 kbps'], ['Network', '2× Gigabit Ethernet, Wi-Fi 5, Bluetooth 5.0'],
  ['Expansion', 'mPCIe (USB 2.0) for 4G or LoRa, M.2 Key-M for NVMe SSD'], ['On board', 'RTC, ATECC608B crypto, 0.96" OLED, buzzer, 2 LEDs, 2 buttons'],
  ['Power', 'DC 10–30 V, surge protected, 11 W max'], ['Build', 'Metal, fanless, DIN rail · 139 × 88 × 38 mm · −20 to 60 °C']
];
const KITS = [
  ['Edge AI only', 'The controller, antenna, screwdriver and 4 silicone bumpers.'],
  ['Basic kit', 'Adds a 24 V / 24 W DIN-rail supply, a 2 MP USB 3.0 industrial camera with adjustable lens, a 175 mm dome light and a camera stand.'],
  ['Complete kit', 'Everything in the Basic kit, plus a 1 m HDMI cable and a wireless keyboard and mouse.']
];
