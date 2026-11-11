// IRIV SmartHub CM5: every connector, with its position in the product photos (in a 1000 × 1000 space).
// Specifications follow the Cytron product page: https://my.cytron.io/p-iriv-smarthub-cm5

const IMG = { hero: 'images/hero.webp', rear: 'images/rear.webp', front: 'images/front.webp', top: 'images/top.webp', iso: 'images/iso.webp' };
const PRODUCT = 'IRIV SmartHub CM5';
const TERMINALS = [];   // no terminal block; the shared film helper looks this up

const GROUPS = [
  { id: 'lan', img: 'rear', color: '#8e44ad', name: 'Ethernet', title: 'Gigabit Ethernet.',
    body: 'One RJ45 port, 10/100/1000M. Wire it to the shop, plant or building network for the most reliable link.',
    chips: ['RJ45', '10/100/1000M'], rects: [[187, 472, 289, 559]], labels: [{ label: 'GIGABIT', x: 238, y: 472, row: 'top' }] },
  { id: 'usb2', img: 'rear', color: '#5e5ce6', name: 'USB 2.0', title: 'Two USB 2.0 ports.',
    body: 'For the things that stay plugged in: a barcode scanner, a receipt printer, a keyboard or a touch panel.',
    chips: ['2× USB 2.0', 'Scanner', 'Printer', 'Touch'], rects: [[322, 458, 409, 552]], labels: [{ label: 'USB 2.0 ×2', x: 365, y: 458, row: 'top' }] },
  { id: 'hdmi', img: 'rear', color: '#0071e3', name: 'Dual HDMI', title: 'Two 4K screens.',
    body: 'Two full-size HDMI 2.0 ports, each up to 4K at 60 Hz. Run a cashier screen and a customer display, or two signage screens, from one box.',
    chips: ['HDMI0', 'HDMI1', '4K @ 60 Hz', 'Full-size'], rects: [[455, 450, 499, 552], [555, 450, 598, 552]],
    labels: [{ label: 'HDMI0', x: 477, y: 450, row: 'top' }, { label: 'HDMI1', x: 577, y: 450, row: 'top' }] },
  { id: 'usbc', img: 'rear', color: '#e5383b', name: 'USB-C', title: 'USB-C: power and boot.',
    body: 'One USB-C port powers the SmartHub and is also how you reflash the operating system. One cable on the desk.',
    chips: ['USB-C', 'Power', 'Reflash OS'], rects: [[636, 533, 700, 563]], labels: [{ label: 'POWER / BOOT', x: 668, y: 533, row: 'top' }] },
  { id: 'power', img: 'rear', color: '#f56300', name: 'DC power', title: '10–30 V DC in.',
    body: 'A DC barrel jack takes 10 to 30 V with surge protection, so the SmartHub runs from the 12 V or 24 V supply already in the cabinet.',
    chips: ['DC barrel jack', '10–30 V DC', 'Surge protected'], rects: [[763, 483, 828, 561]], labels: [{ label: 'DC 10–30 V', x: 795, y: 483, row: 'top' }] },
  { id: 'usb3', img: 'front', color: '#0a8a8f', name: 'USB 3.0', title: 'Two USB 3.0 ports.',
    body: 'Fast ports on the front for a USB camera, an external drive or a backup stick.',
    chips: ['2× USB 3.0', 'Camera', 'Storage'], rects: [[216, 456, 310, 555]], labels: [{ label: 'USB 3.0 ×2', x: 263, y: 456, row: 'top' }] },
  { id: 'buttons', img: 'front', color: '#1a9e45', name: 'Buttons', title: 'Power and USER buttons.',
    body: 'A power button, and a programmable USER button for whatever your application needs: next slide, reprint, call for help.',
    chips: ['PWR', 'USER (programmable)'], rects: [[354, 514, 385, 545], [434, 510, 476, 610]],
    labels: [{ label: 'USER', x: 369, y: 514, row: 'top' }, { label: 'PWR', x: 455, y: 610, row: 'bottom' }] },
  { id: 'leds', img: 'front', color: '#d4a000', name: 'Status LEDs', title: 'Status at a glance.',
    body: 'Power, activity and M.2 lights, plus two LEDs your program controls. A buzzer and a real-time clock are inside.',
    chips: ['LED0', 'LED1', 'PWR', 'ACT', 'M.2'], rects: [[495, 527, 705, 562]],
    labels: [{ label: 'LED0', x: 513, y: 562, row: 'bottom' }, { label: 'LED1', x: 556, y: 562, row: 'bottom' }, { label: 'PWR', x: 602, y: 562, row: 'bottom' }, { label: 'ACT', x: 647, y: 562, row: 'bottom' }, { label: 'M.2', x: 692, y: 562, row: 'bottom' }] },
  { id: 'wifi', img: 'front', color: '#0071e3', name: 'Wireless', title: 'Wireless, built in.',
    body: 'Dual-band 2.4 / 5 GHz Wi-Fi and Bluetooth 5.0 with BLE. The antenna is in the box.',
    chips: ['Wi-Fi 2.4 / 5 GHz', 'Bluetooth 5.0', 'Antenna included'], rects: [[760, 440, 820, 502]], labels: [{ label: 'WIFI antenna', x: 790, y: 440, row: 'top' }] },
  { id: 'cell', img: 'front', color: '#c07a00', name: '4G & SIM', title: 'Room for 4G.',
    body: 'A mini PCIe socket (USB 2.0 only) takes a 4G module, with the SIM slot and a second antenna hole on the front. PWR and STAT LEDs show the modem.',
    chips: ['mini PCIe (USB 2.0)', 'SIM slot', 'ANT'], rects: [[505, 445, 560, 500], [710, 511, 805, 560], [704, 566, 794, 610]],
    labels: [{ label: 'ANT', x: 532, y: 445, row: 'top' }, { label: 'SIM', x: 749, y: 610, row: 'bottom' }] },
  { id: 'mount', img: 'top', color: '#86868b', name: 'Mounting', title: 'Fanless. Screws down flat.',
    body: 'A finned metal case with no fan and no moving parts, 147 × 94 × 35.7 mm. Keyhole flanges fix it to a wall, a panel or the back of a screen.',
    chips: ['Fanless', 'Metal case', '147 × 94 × 35.7 mm'], rects: [[200, 281, 642, 332], [200, 903, 642, 972]], labels: [{ label: 'Mounting flange', x: 421, y: 281, row: 'top' }] }
];
const G = Object.fromEntries(GROUPS.map(g => [g.id, g]));

const VARIANTS = [['2 GB', '16 GB eMMC'], ['4 GB', '32 GB eMMC'], ['8 GB', '64 GB eMMC'], ['16 GB', '64 GB eMMC']];
const FEATURES = [
  ['Processor', 'Raspberry Pi CM5: Broadcom BCM2712, quad-core Cortex-A76, 64-bit, 2.4 GHz'], ['Memory & storage', '2 / 4 / 8 / 16 GB RAM · 16 / 32 / 64 GB eMMC · M.2 Key-M socket for an NVMe SSD'],
  ['Displays', '2× full-size HDMI 2.0, up to 4K at 60 Hz'], ['USB', '2× USB 3.0, 2× USB 2.0, 1× USB-C (power and reflashing)'],
  ['Network', 'Gigabit Ethernet, Wi-Fi 2.4 / 5 GHz (802.11 b/g/n/ac), Bluetooth 5.0, BLE'], ['Expansion', 'mini PCIe socket (USB 2.0 only; no PCIe signal) with SIM slot'],
  ['On board', 'RTC (CR2032 holder), buzzer, 2 programmable LEDs, programmable button, power button'],
  ['Power & build', 'DC 10–30 V barrel jack (surge protected) or USB-C · metal, fanless, 147 × 94 × 35.7 mm without antenna · 12-month warranty']
];
const KITS = [
  ['SmartHub only', 'The SmartHub CM5 with your choice of RAM and eMMC, a dual-band antenna, a screwdriver and 4 silicone bumpers.'],
  ['Essential kit', 'Everything above, plus a Raspberry Pi 27 W USB-C PD power supply and a 1 m official HDMI cable.']
];
