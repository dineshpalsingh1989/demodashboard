// IRIV PiControl: every connector, with its position in the product photos (pixels of the 1000×1000 images).
// Specifications follow the Cytron product page: https://my.cytron.io/p-iriv-picontrol-cm4-industrial-controller

const IMG = { front: 'images/front.png', side: 'images/side.png', inside: 'images/inside.png' };

// Two 16-way push-in terminal blocks on the front panel: 8 columns × 2 rows each.
const X1 = [354, 370.7, 387.3, 404, 420.7, 437.3, 454, 470.7];
const X2 = [501.7, 518.3, 535, 551.7, 568.3, 585, 601.7, 618.3];
const TOP = 650, BOT = 667;

const TERMINALS = [
  ['VIN', 'Power in, 10–30 V DC (surge protected)', 'power'], ['RS485 A', 'RS485 data A (D+)', 'rs485'], ['RS485 B', 'RS485 data B (D−)', 'rs485'], ['485G', 'RS485 isolated ground', 'rs485'],
  ['DO0', 'Isolated digital output 0', 'do'], ['DO0', 'Isolated digital output 0', 'do'], ['DO2', 'Isolated digital output 2', 'do'], ['DO2', 'Isolated digital output 2', 'do'],
  ['GND', 'Power ground', 'power'], ['RS232 TX', 'RS232 transmit', 'rs232'], ['RS232 RX', 'RS232 receive', 'rs232'], ['232G', 'RS232 isolated ground', 'rs232'],
  ['DO1', 'Isolated digital output 1', 'do'], ['DO1', 'Isolated digital output 1', 'do'], ['DO3', 'Isolated digital output 3', 'do'], ['DO3', 'Isolated digital output 3', 'do'],
  ['DI0 +', 'Isolated digital input 0, positive', 'di'], ['DI0 −', 'Isolated digital input 0, negative', 'di'], ['DI2 +', 'Isolated digital input 2, positive', 'di'], ['DI2 −', 'Isolated digital input 2, negative', 'di'],
  ['AN0', 'Analog input 0 (0–5 V / 0–10 V / 0–20 mA)', 'an'], ['AGND', 'Analog ground (common)', 'an'], ['AN2', 'Analog input 2', 'an'], ['AGND', 'Analog ground (common)', 'an'],
  ['DI1 +', 'Isolated digital input 1, positive', 'di'], ['DI1 −', 'Isolated digital input 1, negative', 'di'], ['DI3 +', 'Isolated digital input 3, positive', 'di'], ['DI3 −', 'Isolated digital input 3, negative', 'di'],
  ['AN1', 'Analog input 1', 'an'], ['AGND', 'Analog ground (common)', 'an'], ['AN3', 'Analog input 3', 'an'], ['AGND', 'Analog ground (common)', 'an']
].map(([name, fn, group], i) => {
  const block = i < 16 ? 1 : 2, k = i % 16, row = k < 8 ? 'top' : 'bottom';
  return { name, fn, group, block, row, x: (block === 1 ? X1 : X2)[k % 8], y: row === 'top' ? TOP : BOT };
});

const pins = (...names) => names.map(([label, col, row, block = 1]) => ({ label, x: (block === 1 ? X1 : X2)[col], y: row === 't' ? TOP : BOT, row: row === 't' ? 'top' : 'bottom' }));
const pairs = (...names) => names.map(([label, col, row, block = 1]) => { const X = block === 1 ? X1 : X2; return { label, x: (X[col] + X[col + 1]) / 2, y: row === 't' ? TOP : BOT, row: row === 't' ? 'top' : 'bottom', pair: [X[col], X[col + 1]] }; });

// Each group: where it is, what it is, and what it is for.
const GROUPS = [
  { id: 'power', img: 'front', color: '#e5383b', name: 'Power', title: '10–30 V DC in.',
    body: 'A wide input range with surge protection, so it runs from a standard 12 V or 24 V DIN-rail supply.',
    chips: ['VIN', 'GND', '10–30 V DC', 'Surge protected'], rects: [[345, 640, 363, 677]], pins: pins(['VIN', 0, 't'], ['GND', 0, 'b']) },
  { id: 'rs485', img: 'front', color: '#0071e3', name: 'RS485', title: 'Isolated RS485.',
    body: 'Talk Modbus RTU to energy meters, drives, PLCs and sensors over one twisted pair, isolated from the controller.',
    chips: ['A', 'B', '485G', 'Isolated'], rects: [[362, 640, 413, 660]], pins: pins(['A', 1, 't'], ['B', 2, 't'], ['485G', 3, 't']) },
  { id: 'rs232', img: 'front', color: '#5e5ce6', name: 'RS232', title: 'Isolated RS232.',
    body: 'For barcode scanners, older PLCs, modems and lab instruments that still speak point-to-point serial.',
    chips: ['TX', 'RX', '232G', 'Isolated'], rects: [[362, 657, 413, 677]], pins: pins(['TX', 1, 'b'], ['RX', 2, 'b'], ['232G', 3, 'b']) },
  { id: 'do', img: 'front', color: '#f56300', name: 'Digital outputs', title: 'Four isolated outputs.',
    body: 'Switch relays, contactors, beacons and valves. Each output has its own pair of terminals and handles up to 50 V.',
    chips: ['DO0', 'DO1', 'DO2', 'DO3', 'Up to 50 V'], rects: [[412, 640, 479, 677]], pins: pairs(['DO0', 4, 't'], ['DO2', 6, 't'], ['DO1', 4, 'b'], ['DO3', 6, 'b']) },
  { id: 'di', img: 'front', color: '#1a9e45', name: 'Digital inputs', title: 'Four isolated inputs.',
    body: 'Read push buttons, limit switches, door contacts and pulse meters. Each input has + and − terminals and accepts up to 50 V.',
    chips: ['DI0', 'DI1', 'DI2', 'DI3', 'Up to 50 V'], rects: [[493, 640, 560, 677]], pins: pairs(['DI0 + −', 0, 't', 2], ['DI2 + −', 2, 't', 2], ['DI1 + −', 0, 'b', 2], ['DI3 + −', 2, 'b', 2]) },
  { id: 'an', img: 'front', color: '#0a8a8f', name: 'Analog inputs', title: 'Four analog inputs.',
    body: 'Isolated inputs for 0–5 V, 0–10 V or 0–20 mA transmitters: pressure, level, temperature and flow. They share a common analog ground (AGND).',
    chips: ['AN0–AN3', 'AGND', '0–5 V', '0–10 V', '0–20 mA'], rects: [[560, 640, 627, 677]],
    pins: pins(['AN0', 4, 't', 2], ['AGND', 5, 't', 2], ['AN2', 6, 't', 2], ['AGND', 7, 't', 2], ['AN1', 4, 'b', 2], ['AGND', 5, 'b', 2], ['AN3', 6, 'b', 2], ['AGND', 7, 'b', 2]) },
  { id: 'lan', img: 'front', color: '#8e44ad', name: 'Ethernet', title: 'Two Ethernet ports.',
    body: 'One Gigabit and one 10/100 port, so the controller can sit on two networks at once, for example the machine network and the office network.',
    chips: ['RJ45 Gigabit', 'RJ45 10/100M'], rects: [[644, 619, 723, 691], [736, 619, 815, 691]],
    labels: [{ label: 'GIGABIT', x: 683, y: 619, row: 'top' }, { label: '10/100M', x: 775, y: 619, row: 'top' }] },
  { id: 'status', img: 'front', color: '#c07a00', name: 'LEDs & button', title: 'Status at a glance.',
    body: 'Power, M.2 drive and activity LEDs, two programmable LEDs, and a programmable USER button. A reset button and an active buzzer are inside.',
    chips: ['PWR', 'M.2', 'ACT', 'LED0', 'LED1', 'USER'], rects: [[257, 678, 337, 705], [297, 653, 320, 677]],
    labels: [{ label: 'USER', x: 308, y: 655, row: 'top' }, { label: 'M.2', x: 266, y: 684, row: 'top', up: 70 }, { label: 'PWR', x: 266, y: 697, row: 'bottom' }, { label: 'ACT', x: 287, y: 697, row: 'bottom', down: 80 }, { label: 'LED0', x: 307, y: 697, row: 'bottom' }, { label: 'LED1', x: 329, y: 697, row: 'bottom', down: 80 }] },
  { id: 'wifi', img: 'front', color: '#0071e3', name: 'Wireless', title: 'Wireless, built in.',
    body: 'Dual-band 2.4 / 5 GHz Wi-Fi (802.11 b/g/n/ac) and Bluetooth 5.0 with BLE. The dual-band antenna is included and screws on.',
    chips: ['Wi-Fi 2.4 / 5 GHz', 'Bluetooth 5.0', 'BLE', 'Antenna included'], rects: [[72, 240, 124, 668], [118, 612, 238, 662]],
    labels: [{ label: 'Dual-band antenna', x: 98, y: 300, row: 'side' }] },
  { id: 'usb', img: 'side', color: '#0071e3', name: 'USB & HDMI', title: 'USB and 4K HDMI.',
    body: 'Two USB 2.0 ports for keyboards, scanners or storage, and a full-size HDMI 2.0 port that drives a display at up to 4K 60 Hz.',
    chips: ['2× USB 2.0', 'HDMI 2.0', '4K @ 60 Hz'], rects: [[276, 672, 390, 793], [444, 746, 568, 795]],
    labels: [{ label: 'USB 2.0 ×2', x: 333, y: 672, row: 'top' }, { label: 'HDMI', x: 506, y: 795, row: 'bottom' }] },
  { id: 'usbc', img: 'side', color: '#e5383b', name: 'Boot / debug & antennas', title: 'USB-C and four antenna ports.',
    body: 'USB-C is for flashing the eMMC and debugging. Four knock-outs (ANT0–ANT3) take extra antennas, for example for a 4G module in the Mini PCIe slot.',
    chips: ['USB-C BOOT/DBG', 'ANT0–ANT3'], rects: [[672, 771, 748, 804], [432, 626, 796, 689]],
    labels: [{ label: 'BOOT / DBG', x: 710, y: 804, row: 'bottom' }, { label: 'ANT3', x: 464, y: 626, row: 'top' }, { label: 'ANT2', x: 564, y: 626, row: 'top' }, { label: 'ANT1', x: 664, y: 626, row: 'top' }, { label: 'ANT0', x: 764, y: 626, row: 'top' }] },
  { id: 'oled', img: 'inside', color: '#f56300', name: 'OLED display', title: 'A small screen on the device.',
    body: 'A 0.96-inch SSD1306 OLED shows the IP address, live values or alarms right on the controller, with no laptop needed.',
    chips: ['0.96" OLED', 'SSD1306'], rects: [[200, 418, 282, 582]], labels: [{ label: 'OLED 0.96"', x: 241, y: 418, row: 'top' }] },
  { id: 'expand', img: 'inside', color: '#8e44ad', name: 'M.2 & Mini PCIe', title: 'Room to expand.',
    body: 'An M.2 Key-M socket for an NVMe SSD, plus a Mini PCIe socket (USB 2.0 and SPI only) for add-on modules such as 4G.',
    chips: ['M.2 Key-M (NVMe)', 'Mini PCIe (USB 2.0 + SPI)'], rects: [[448, 468, 586, 572], [578, 488, 668, 602]],
    labels: [{ label: 'M.2 NVMe', x: 517, y: 468, row: 'top' }, { label: 'Mini PCIe', x: 623, y: 602, row: 'bottom' }] },
  { id: 'rtc', img: 'inside', color: '#1a9e45', name: 'Clock, security & buzzer', title: 'Keeps time. Keeps keys safe.',
    body: 'A PCF85063A real-time clock with coin-cell backup, an ATECC608B crypto chip for secure keys, and an active buzzer for local alarms.',
    chips: ['RTC PCF85063A', 'CR2032 backup', 'ATECC608B', 'Buzzer'], rects: [[395, 522, 527, 622], [346, 396, 404, 448]],
    labels: [{ label: 'RTC battery', x: 461, y: 622, row: 'bottom' }, { label: 'Buzzer', x: 375, y: 396, row: 'top' }] }
];
const G = Object.fromEntries(GROUPS.map(g => [g.id, g]));

const SPECS = [
  ['Compute module', 'Raspberry Pi CM4', 'Raspberry Pi CM5'],
  ['CPU', 'Quad-core Cortex-A72, 1.5 GHz', 'Quad-core Cortex-A76, 2.4 GHz'],
  ['GPU', 'VideoCore VI, 700 MHz', 'VideoCore VII, 800 MHz'],
  ['RAM', '1 / 2 / 4 / 8 GB', '2 / 4 / 8 / 16 GB'],
  ['eMMC', '8 / 16 / 32 GB', '8 / 16 / 32 / 64 GB']
];
const FEATURES = [
  ['Power', 'DC 10–30 V, surge protected'], ['Digital I/O', '4 isolated inputs, 4 isolated outputs, up to 50 V'],
  ['Analog', '4 isolated inputs, 0–5 V / 0–10 V / 0–20 mA, common ground'], ['Serial', '1× isolated RS232, 1× isolated RS485'],
  ['Ethernet', '1× Gigabit RJ45, 1× 10/100M RJ45'], ['Wireless', 'Wi-Fi 2.4 / 5 GHz 802.11ac, Bluetooth 5.0, BLE'],
  ['Video & USB', 'HDMI 2.0 (4K60), 2× USB 2.0, USB-C boot/debug'], ['Expansion', 'M.2 Key-M (NVMe), Mini PCIe (USB 2.0 + SPI)'],
  ['On board', 'RTC, ATECC608B crypto, 0.96" OLED, buzzer, 2 LEDs, 2 buttons'], ['Build', 'Metal, fanless, DIN rail · 141.2 × 83.5 × 39.5 mm']
];
