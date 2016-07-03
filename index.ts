import util = require("util");
import Promise = require("bluebird");
import GPIO = require("onoff");
import {initDoorStateExtension} from "./lib/DoorStateExtension";
import {initDoorSensorPort} from "./lib/DoorSensorPort";
import {initSwitchPort} from "./lib/SwitchPort";
import {GPIOGarageDoorAccessory, initGPIOGarageDoorAccessory} from "./lib/GPIOGarageDoorAccessory";

module.exports = function(homebridge) {
  var exportTypes = {
    Accessory: homebridge.hap.Accessory,
    Service: homebridge.hap.Service,
    Characteristic: homebridge.hap.Characteristic,
    uuid: homebridge.hap.uuid,
  };

  initDoorStateExtension(exportTypes);
  initDoorSensorPort(exportTypes);
  initSwitchPort(exportTypes);
  initGPIOGarageDoorAccessory(exportTypes);

  homebridge.registerAccessory("homebridge-gpio-garagedoor", "GPIOGarageDoor", GPIOGarageDoorAccessory);
};
