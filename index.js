var GPIO = require('onoff').Gpio;
var inherits = require('util').inherits;
var Promise = require('bluebird');

var Accessory, Service, Characteristic, uuid;

module.exports = function(homebridge) {
  Accessory = homebridge.hap.Accessory;
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  uuid = homebridge.hap.uuid;

  var acc = GPIOGarageDoorAccessory.prototype;
  inherits(GPIOGarageDoorAccessory, Accessory);
  GPIOGarageDoorAccessory.prototype.parent = Accessory.prototype;
  for (var mn in acc) {
    GPIOGarageDoorAccessory.prototype[mn] = acc[mn];
  }

  homebridge.registerAccessory("homebridge-gpio-garagedoor", "GPIOGarageDoor", GPIOGarageDoorAccessory);
};

function GPIOGarageDoorAccessory(log, config) {
  this.log = log;
  this.name = config["name"];

  var id = uuid.generate('gpio-garagedoor.' + (config['id'] || this.name));
  Accessory.call(this, this.name, id);
  this.uuid_base = id;

  var garageDoorOpener = this.addService(Service.GarageDoorOpener);

  var doorSensorPin = config["doorSensorPin"];
  log("Door Sensor Pin: " + doorSensorPin);
  if (doorSensorPin) {
    var isNCSensor = config['isNCSensor'] == true;
    log("Is NC Sensor: " + isNCSensor);
    this.doorSensor = new DoorSensorPort(doorSensorPin, garageDoorOpener, log, isNCSensor);
  }

  var doorSwitchPin = config["doorSwitchPin"];
  log("Door Switch Pin: " + doorSwitchPin);
  var doorOpensInSeconds = config["doorOpensInSeconds"];
  log("Door Opens (in seconds): " + doorOpensInSeconds);
  if (doorSwitchPin) {
    this.doorSwitch = new SwitchPort(doorSwitchPin, garageDoorOpener, log, this.doorSensor, doorOpensInSeconds);
  }

  garageDoorOpener.getCharacteristic(Characteristic.CurrentDoorState)
      .on('change', function (change) {
        log("Garage Door state changed to " + getDoorStateDescription(change.newValue));
      });

  this.getService(Service.AccessoryInformation)
      .setCharacteristic(Characteristic.Model, "GPIO Garage Door");
}

GPIOGarageDoorAccessory.prototype.getServices = function() {
    return this.services;
};

var getDoorState = function(service) {
  return service.getCharacteristic(Characteristic.CurrentDoorState).value;
};

function GPIOPort() {
  GPIO.apply(this, arguments);
  var self = this;
  process.on('SIGINT', function () {
    self.unexport();
  });
}
inherits(GPIOPort, GPIO);

GPIOPort.prototype.getState = function(retryCount){
  retryCount = retryCount != null ? retryCount : 3;
    var val;
    for (var i = 0; i < retryCount; i++) {
      val = this.readSync();
      if (val == 1) {
        break;
      }
    }
  return val == 1;
};

GPIOPort.ON = 1;
GPIOPort.OFF = 0;

GPIOPort.prototype.readAsync = Promise.promisify(GPIO.prototype.read);
GPIOPort.prototype.writeAsync = Promise.promisify(GPIO.prototype.write);

function DoorSensorPort(pin, service, log, isNCSensor) {
  GPIO.call(this, pin, 'in', 'both');
  this.service = service;
  this.log = log;
  var self = this;
  this.closedSensorValue = isNCSensor ? 0 : 1;

  this.watch( function(err, value) {
    if (err) {
      log.error(err);
      return;
    }
    self.isClosed = value == self.closedSensorValue;
    self.refresh();
  });
  this.reset();
}
inherits(DoorSensorPort, GPIOPort);

DoorSensorPort.prototype.reset = function() {
  this.isClosed = this.getState() == this.closedSensorValue;
  this.update();
};

DoorSensorPort.prototype.refresh = function() {
  switch (getDoorState(this.service)) {
    case Characteristic.CurrentDoorState.CLOSING:
    case Characteristic.CurrentDoorState.OPENING:
      return;
    default:
      this.update();
  }
};

DoorSensorPort.prototype.update = function() {
  this.service.getCharacteristic(Characteristic.CurrentDoorState)
      .setValue(this.isClosed ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN);
};

var asDoorState = function(targetState) {
  switch (targetState) {
    case Characteristic.TargetDoorState.OPEN:
      return Characteristic.CurrentDoorState.OPEN;
    case Characteristic.TargetDoorState.CLOSED:
      return Characteristic.CurrentDoorState.CLOSED;
  }
};
var asOperationState = function(targetState) {
  switch (targetState) {
    case Characteristic.TargetDoorState.OPEN:
      return Characteristic.CurrentDoorState.OPENING;
    case Characteristic.TargetDoorState.CLOSED:
      return Characteristic.CurrentDoorState.CLOSING;
  }
};
var getDoorStateDescription = function(doorState) {
  switch (doorState) {
    case Characteristic.CurrentDoorState.OPEN:
      return "OPEN";
    case Characteristic.CurrentDoorState.OPENING:
      return "OPENING";
    case Characteristic.CurrentDoorState.CLOSING:
      return "CLOSING";
    case Characteristic.CurrentDoorState.CLOSED:
      return "CLOSED";
    case Characteristic.CurrentDoorState.STOPPED:
      return "STOPPED";
  }
};
function SwitchPort(pin, service, log, doorSensor, doorOpensInSeconds) {
  GPIO.call(this, pin, 'out');
  this.service = service;
  this.log = log;
  this.isOperating = false;
  var self = this;
  var targetState = service.getCharacteristic(Characteristic.TargetDoorState);
  targetState.on('set', function (state, callback) {
    var curState = getDoorState(service);
    switch(curState) {
      case Characteristic.CurrentDoorState.OPENING:
      case Characteristic.CurrentDoorState.CLOSING:
        callback(new Error('Must wait until operation is finished'));
        break;
      default:
        if (asDoorState(state) == curState)
        {
          callback();
          return;
        }
        break;
    }
    self.isOperating = true;
    self.log.debug("Started operation");
    self.writeAsync(GPIOPort.ON)
        .then(function(){
          service.setCharacteristic(Characteristic.CurrentDoorState, asOperationState(state));
        })
        .asCallback(callback)
        .delay(1000)
        .then(function(){
          return self.writeAsync(GPIOPort.OFF);
        })
        .delay(doorOpensInSeconds * 1000)
        .catch(function(err) {
          self.log.error(err);
        })
        .finally(function(){
          self.isOperating = false;
          self.log.debug("Finished operation");
          doorSensor.reset();
          self.refresh();
          //TODO: log issues
        });
  });
}
inherits(SwitchPort, GPIOPort);

SwitchPort.prototype.refresh = function() {
  if (this.isOperating) return;
  this.service.getCharacteristic(Characteristic.TargetDoorState)
      .setValue(getDoorState(this.service) == Characteristic.CurrentDoorState.OPEN ?
          Characteristic.TargetDoorState.OPEN :
          Characteristic.TargetDoorState.CLOSED);
};
