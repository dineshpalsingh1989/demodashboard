# Milesight additions

Official product references reviewed on 27 October 2026. The eight models add 59 fictional units to the demo's bill of materials, bringing the total to 387. Quantities, locations, readings, alerts and automation are simulated. The sample JSON represents illustrative application fields, not a manufacturer packet decoder.

| Model and official reference | Installation in this demo | Quantity | Selected configuration |
| --- | --- | ---: | --- |
| [EM400-TLD](https://www.milesight.com/iot/product/lorawan-sensor/em400-tld) | Park bins | 10 | LoRaWAN distance sensor; the app derives fill percentage from a configured bin height. |
| [EM300-SLD](https://www.milesight.com/iot/product/lorawan-sensor/em300-sld-zld) | Cooling-unit drains in the data center | 6 | Spot leak probe; reports conductive liquid presence, not water depth. |
| [EM500-PP](https://www.milesight.com/iot/product/lorawan-sensor/em500-pp) | Water distribution outlet | 4 | Pipe-pressure monitoring; does not measure flow or switch pumps. |
| [TS302](https://www.milesight.com/iot/product/lorawan-sensor/ts30x) | Clinic cold cabinets | 4 | One external temperature probe plus one door sensor. The 2–8 °C band is a fictional cabinet setting. |
| [VS341](https://www.milesight.com/iot/product/lorawan-sensor/vs34x) | Office desks | 24 | PIR plus thermopile occupancy, one desk per sensor. |
| [WS302](https://www.milesight.com/iot/product/lorawan-sensor/ws302) | School classrooms | 6 | Indoor IP30 sound-level sensor; A-weighted values displayed. |
| [UC511](https://www.milesight.com/iot/product/iot-controller/uc51x) | Remote irrigation zones | 4 | Solar variant controlling DC latching valves. PiControl remains the pump controller. |
| [SG50](https://www.milesight.com/iot/product/lorawan-gateway/sg50) | Remote farmyard mast | 1 | Solar/battery gateway with 4G backhaul to a network server; MQTT carries application data to IRIV Edge. |

The SG50 demo serves the existing 10 remote soil sensors, four paddy level sensors and four new valve controllers. Its animation represents the logical connection through the network server. Coverage and message timing are not radio-network predictions.

The leak scenario moves from detection to staff acknowledgement, repair and clearance. The cold-storage scenario pairs a door event with a temperature excursion and a staff response. Both reset their temporary sensor state when stopped, completed or replaced.

## Illustration credits

The eight SVG illustrations in `images/` were downloaded from Milesight's official product navigation. Some show multiple models in a product family. The device card identifies the selected model; the lightbox credits Milesight. The illustrations and product names remain the property of their respective owners.

Base URL: `https://www.milesight.com/static/pc/en/nav/new/iot-products/`

| Local file | Official source path relative to the base URL |
| --- | --- |
| `EM400-TLD.svg` | `iot-lorawan-sensors/em400-series/tof-laser-distance-sensor-em400-tld-illus.svg` |
| `EM300-SLD.svg` | `iot-lorawan-sensors/em300-series/spot-zone-leakage-detection-sensor-em300-sld-zld-illus.svg` |
| `EM500-PP.svg` | `iot-lorawan-sensors/em500-series/pipe-pressure-sensor-em500-pp-illus.svg` |
| `TS302.svg` | `iot-lorawan-sensors/ts-series/lorawan-temperature-sensor-ts30x-illus.svg` |
| `VS341.svg` | `iot-lorawan-sensors/people-sensing-series/desk-seat-occupancy-sensor-vs340-vs341-illus.svg` |
| `WS302.svg` | `iot-lorawan-sensors/cowork-series/sound-level-sensor-ws302-illus.svg` |
| `UC511.svg` | `iot-controllers/lorawan-solenoid-valve-controller-uc51x-illus.svg` |
| `SG50.svg` | `lorawan-gateways/ultra-low-power-solar-lorawan-gateway-sg50-illus.svg` |
