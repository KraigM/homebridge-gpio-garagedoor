/// <reference path="typings/index.d.ts" />

import DoorSensorPort from "./lib/DoorSensorPort";
import SwitchPort from "./lib/SwitchPort";
import GPIOGarageDoorAccessory from "./lib/GPIOGarageDoorAccessory";
import DoorStateExtension from "./lib/DoorStateExtension";

export default function(homebridge) {
  var exportTypes = {
    Accessory: homebridge.hap.Accessory,
    Service: homebridge.hap.Service,
    Characteristic: homebridge.hap.Characteristic,
    uuid: homebridge.hap.uuid,
  };

  DoorStateExtension.init(exportTypes);
  DoorSensorPort.init(exportTypes);
  SwitchPort.init(exportTypes);
  GPIOGarageDoorAccessory.init(exportTypes);

  homebridge.registerAccessory("homebridge-gpio-garagedoor", "GPIOGarageDoor", GPIOGarageDoorAccessory);
};
