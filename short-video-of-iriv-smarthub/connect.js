// What plugs into each port of the IRIV SmartHub CM5, using products listed on my.cytron.io.
// Names, links and prices (RM, excluding tax) were taken from the store on 11 November 2026.

const CY = 'https://my.cytron.io/';
const item = (name, path, price, note, icon) => ({ name, url: CY + path, price, note, icon });

const PRODUCTS = {
  smarthub: item('IRIV SmartHub CM5 (2 to 16 GB RAM)', 'p-iriv-smarthub-cm5', 925, 'The computer, from RM925 depending on RAM, storage and kit.', 'chip'),
  edatec: item('Edatec Industrial Touchscreen LCD Monitor', 'c-hmi/p-edatec-industrial-touchscreen-lcd-monitor', 528, 'A cashier or operator screen: HDMI for the picture, USB for touch.', 'screen'),
  touch: item('10.4" / 7" HDMI Touch Screen with Industrial Enclosure', 'c-hmi/p-industrial-lcd-display-capacitive-touchscreen', 650, 'A sealed touch panel for the shop floor.', 'screen'),
  monitor: item('Raspberry Pi 15.6 inch HDMI Monitor', 'p-raspberry-pi-monitor-15.6-inch-1920x1080-ips', 446.7, 'A slim Full HD screen for a customer display or a dashboard.', 'screen'),
  hdmi: item('Official RPi HDMI to HDMI Cable (1 m)', 'p-official-rpi-hdmi-to-hdmi-cable-1m-white', 17, 'One per screen. The same cable as in the Essential kit.', 'plug'),
  keyboard: item('Wireless USB Keyboard with Touch Pad', 'p-wireless-usb-keyboard-with-touch-pad', 21.5, 'For setting up, then put it away.', 'button'),
  usbCam: item('USB 3.0 Industrial Camera 2 MP (CS lens)', 'c-industry-accessories/p-usb-3.0-industrial-camera-2mp-with-cs-adjustable-lens', 328, 'A camera for label checks or a view of the line.', 'camera'),
  usbSerial: item('USB to RS232/485 Serial Converter', 'c-industrial-adapter-converter/p-usb-to-rs232-485-serial-converter', 65, 'Lets the SmartHub read Modbus meters and scales.', 'hub'),
  usb2ch: item('USB to 2-Ch RS485 Isolated Converter', 'c-industrial-adapter-converter/p-usb-to-2ch-rs485-isolated-converter', 89, 'Two isolated RS485 buses from one USB port.', 'hub'),
  ethCable: item('Gigabit Ethernet Cable', 'c-industry-accessories/p-gigabit-ethernet-cable', 12.9, 'For the wired network.', 'net'),
  tsw202: item('TSW202 Industrial Managed PoE+ Switch', 'c-router-switch-gateway/p-tsw202-industrial-managed-poe-plus-switch', 686, 'Joins the SmartHub, IO controllers and cameras on one network.', 'net'),
  router4g: item('RUT200 LTE Cat 4 Industrial Router', 'c-router-switch-gateway/p-rut200-lte-cat-4-industrial-grade-router', 566, 'Internet for kiosks and sites with no wired network.', 'router'),
  lte: item('Quectel EC25-EM LTE Cat 4 Mini PCIe Module + Antenna Kit', 'c-sensors-connectivities/p-quectel-lte-cat-4-ec25-em-mini-pcie-module-south-east-asia', 445, 'Built-in 4G in the mini PCIe socket, with the SIM in the front slot.', 'cell'),
  ant4g: item('4G High-Gain SMA Antenna (outdoor, magnetic base)', 'c-industry-accessories/p-4g-high-gain-sma-antenna-for-outdoor-condition-waterproof-magnetic-base', 30, 'Better signal from inside a kiosk or cabinet.', 'ant'),
  ioc: item('IRIV IO Controller MQTT', 'p-iriv-io-controller-mqtt-ir4.0-industrial-i-o-controller-with-mqtt-ready', 334.95, '11 inputs, 4 outputs and 2 analog inputs, published as MQTT for the SmartHub to use.', 'chip'),
  ug65: item('UG65 LoRaWAN Gateway', 'c-router-switch-gateway/p-ug65-semi-industrial-lorawan-gateway-with-without-cellular', 1610.05, 'Brings wireless Milesight sensors to a dashboard on the SmartHub.', 'router'),
  relayEth: item('Dual Ethernet 8-Ch Relay Module', 'c-industrial-adapter-converter/p-dual-ethernet-ports-8-ch-relay-module', 229, 'Eight relays the SmartHub switches over the network.', 'relay'),
  psu27: item('Raspberry Pi 27 W USB-C PD Power Supply', 'p-raspberry-pi-usb-c-power-delivery-27w-psu', 53.6, 'Desk power over USB-C. The supply in the Essential kit.', 'bolt'),
  psu24dc: item('Industrial Grade 24 V 1.5 A Adapter (DC jack)', 'p-industrial-grade-24v-1.5a-psu-5.5-2.1-dc-jack-uk-plug', 42, 'Plugs straight into the DC barrel jack.', 'bolt'),
  psu12: item('Industrial Grade 12 V 2 A Power Adapter (DC jack)', 'c-industrial-power-supply/p-industrial-grade-12v-2a-psu-5.5-2.1-dc-jack-uk-plug', 38, 'A 12 V option for the DC barrel jack.', 'bolt')
};

// One tab per port. `view` is the photo and highlighted group(s) shown at the top of the tab.
const CONNECT = [
  { id: 'screen', label: 'Screens', color: '#0071e3', ports: 'HDMI0 · HDMI1', view: ['rear', ['hdmi']], devices: ['Cashier screen', 'Customer display', 'Signage'], icons: ['screen', 'screen', 'screen'],
    lede: 'Two full-size HDMI 2.0 ports drive two screens at once, each up to 4K at 60 Hz.',
    tips: ['Show different content on each screen, or mirror them.', 'A touchscreen needs HDMI for the picture and one USB port for touch.', 'Any HDMI TV or monitor works for signage.'],
    generic: ['Any HDMI TV or monitor', '4K signage display'],
    items: ['edatec', 'touch', 'monitor', 'hdmi'] },
  { id: 'usb', label: 'USB devices', color: '#5e5ce6', ports: '2× USB 2.0 · 2× USB 3.0', view: ['rear', ['usb2']], devices: ['Scanner', 'Printer', 'Camera'], icons: ['eye', 'box', 'camera'],
    lede: 'Four USB ports: two USB 2.0 at the back for devices that stay plugged in, two USB 3.0 on the front for fast ones.',
    tips: ['Barcode scanners and receipt printers work as ordinary USB devices.', 'Put cameras and external drives on the front USB 3.0 ports.', 'A USB-to-RS485 converter lets the SmartHub read Modbus meters.'],
    generic: ['USB barcode scanner', 'USB receipt printer', 'USB flash drive'],
    items: ['keyboard', 'usbCam', 'usbSerial', 'usb2ch'] },
  { id: 'net', label: 'Network', color: '#8e44ad', ports: 'Gigabit Ethernet · Wi-Fi', view: ['rear', ['lan']], devices: ['Switch', 'Router', 'Wi-Fi'], icons: ['net', 'router', 'ant'],
    lede: 'Wired Gigabit Ethernet for reliability, with dual-band Wi-Fi and Bluetooth built in.',
    tips: ['Use the wired port where you can; keep Wi-Fi for places a cable cannot reach.', 'A switch puts the SmartHub, IO controllers and cameras on one network.', 'A 4G router gives a kiosk its own internet connection.'],
    items: ['ethCable', 'tsw202', 'router4g'] },
  { id: 'cell', label: '4G & storage', color: '#c07a00', ports: 'mini PCIe · SIM · M.2', view: ['front', ['cell']], devices: ['4G module', 'Antenna', 'NVMe SSD'], icons: ['cell', 'ant', 'chip'],
    lede: 'Add built-in 4G for remote sites, and an NVMe SSD when the eMMC is not enough.',
    tips: ['The mini PCIe socket carries USB 2.0 only, which suits 4G modules.', 'The SIM goes in the slot on the front panel.', 'The M.2 Key-M socket takes an NVMe SSD. Check the user manual for the supported length.'],
    generic: ['M.2 Key-M NVMe SSD'],
    items: ['lte', 'ant4g'] },
  { id: 'family', label: 'Sensors & control', color: '#1a9e45', ports: 'Ethernet · MQTT', view: ['rear', ['lan']], devices: ['IO Controller', 'LoRaWAN', 'Relays'], icons: ['chip', 'router', 'relay'],
    lede: 'The SmartHub has no wiring terminals. It gathers data over the network from the devices that do, then shows and stores it.',
    tips: ['An IRIV IO Controller MQTT publishes machine signals straight to a broker on the SmartHub.', 'A LoRaWAN gateway brings in wireless sensors from across a site.', 'Node-RED on the SmartHub turns the data into dashboards and rules.'],
    items: ['ioc', 'ug65', 'relayEth'] },
  { id: 'power', label: 'Power', color: '#f56300', ports: 'USB-C · DC 10–30 V', view: ['rear', ['usbc', 'power']], devices: ['USB-C supply', 'DC adapter'], icons: ['bolt', 'bolt'],
    lede: 'Two ways in: USB-C on a desk, or 10 to 30 V DC on the barrel jack in a cabinet.',
    tips: ['Use one power input at a time.', 'The DC input is surge protected.', 'A 24 V adapter matches the supply used by most control cabinets.'],
    items: ['psu27', 'psu24dc', 'psu12'] }
];

// Example systems, each a parts list with the port every part uses.
const RECIPES = [
  { id: 'pos', name: 'Shop checkout', color: '#0071e3', icon: 'screen', blurb: 'The demo above, for real: a touchscreen for the cashier, a second screen for the customer, and your own USB scanner and receipt printer.',
    parts: [['smarthub', 1, 'Computer'], ['edatec', 1, 'HDMI0 + USB → cashier'], ['monitor', 1, 'HDMI1 → customer'], ['hdmi', 2, 'HDMI0 · HDMI1'], ['ethCable', 1, 'Gigabit Ethernet'], ['psu27', 1, 'USB-C']] },
  { id: 'signage', name: 'Two-screen signage', color: '#f56300', icon: 'screen', blurb: 'One SmartHub behind two screens, on 4G so it works anywhere. Add your own HDMI displays.',
    parts: [['smarthub', 1, 'Computer'], ['hdmi', 2, 'HDMI0 · HDMI1'], ['router4g', 1, 'Gigabit Ethernet'], ['ethCable', 1, 'Gigabit Ethernet'], ['psu24dc', 1, 'DC jack']] },
  { id: 'mes', name: 'Production tracker', color: '#1a9e45', icon: 'chip', blurb: 'Two IO Controllers count machine cycles and stoppages; the SmartHub runs the broker, Node-RED and the dashboard on a touchscreen.',
    parts: [['smarthub', 1, 'Computer'], ['ioc', 2, 'MQTT over Ethernet'], ['tsw202', 1, 'Gigabit Ethernet'], ['ethCable', 3, 'Network'], ['touch', 1, 'HDMI0 + USB'], ['hdmi', 1, 'HDMI0'], ['psu24dc', 1, 'DC jack']] }
];

// Which SmartHub resource each product takes up, for the system builder and the "Uses" line on each card.
const USES = {
  smarthub: [], edatec: ['hdmi', 'usb'], touch: ['hdmi', 'usb'], monitor: ['hdmi'], hdmi: [], keyboard: ['usb'], usbCam: ['usb'], usbSerial: ['usb'], usb2ch: ['usb'],
  ethCable: [], tsw202: ['lan'], router4g: ['lan'], lte: ['pcie'], ant4g: [], ioc: [], ug65: [], relayEth: [], psu27: ['vin'], psu24dc: ['vin'], psu12: ['vin']
};
const CONTROLLER = 'smarthub';
const BUDGET = { hdmi: 2, usb: 4, lan: 1, pcie: 1, vin: 1 };
const ADDS = { tsw202: { lan: 4 } };   // shortcut: counts the switch as 4 extra ports for the builder, check the switch's own port count when ordering
const RES = { hdmi: ['HDMI screens', 'HDMI'], usb: ['USB ports', 'USB'], lan: ['Ethernet port', 'Ethernet'], pcie: ['mini PCIe', 'mini PCIe'], vin: ['Power supply', 'USB-C or DC jack'] };
const FIX = { hdmi: 'two screens per SmartHub; add a second SmartHub for more', usb: 'add a powered USB hub', lan: 'add a network switch such as the TSW202', pcie: 'only one mini PCIe module fits' };
const POWER_HINT = 'Add the 27 W USB-C supply or a 24 V DC adapter.';
function extraChecks(sys, used) {
  return Object.keys(sys).length > 1 && !used.hdmi ? ['<div><b>No screen yet.</b> Fine for a headless server; add an HDMI screen for a checkout, signage or dashboard.</div>'] : [];
}

const ICONS = {
  bolt: '<path d="M13 2 5 14h6l-1 8 8-12h-6l1-8Z"/>',
  chip: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
  hub: '<circle cx="12" cy="12" r="2.5"/><path d="M12 3v6.5M12 14.5V21M3 12h6.5M14.5 12H21"/>',
  plug: '<path d="M9 2v5m6-5v5M6 7h12v4a6 6 0 0 1-12 0V7Zm6 10v5"/>',
  net: '<rect x="3" y="3" width="7" height="6" rx="1"/><rect x="14" y="3" width="7" height="6" rx="1"/><rect x="8.5" y="15" width="7" height="6" rx="1"/><path d="M6.5 9v3h11V9M12 12v3"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  button: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/>',
  relay: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 15h3l3-5h2M8 9h2"/>',
  router: '<rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 13V8m10 5V8M7 16.5h.01M11 16.5h.01"/>',
  camera: '<rect x="3" y="7" width="18" height="13" rx="2"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
  screen: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>',
  cell: '<path d="M4 20h2v-4H4zM9 20h2v-8H9zM14 20h2V8h-2zM19 20h2V4h-2z"/>',
  ant: '<path d="M12 21V9"/><path d="M8.5 5.5a5 5 0 0 1 7 0M6 3a8.5 8.5 0 0 1 12 0"/><circle cx="12" cy="9" r="1.5"/>',
  box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4V7Z"/><path d="M3 7l9 4 9-4M12 11v10"/>'
};
const icon = (k, size = 22) => `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[k] || ICONS.chip}</svg>`;
const rm = v => 'RM' + v.toLocaleString('en-MY', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 });
