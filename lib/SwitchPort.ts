/**
 * Created by kraig on 7/2/16.
 */

import {GPIOPort, GPIOState} from "./GPIOPort";
import {asDoorState, asOperationState, getDoorState} from "./DoorStateExtension";

var Characteristic;

export default class SwitchPort extends GPIOPort {
	private isOperating: boolean;
	private service;
	private log;

	static init(exportTypes) {
		Characteristic = exportTypes.Characteristic;
	}

	constructor(pin, service, log, doorSensor, doorOpensInSeconds) {
		super(pin, 'out');
		this.service = service;
		this.log = log;
		this.isOperating = false;
		var self = this;
		var targetState = service.getCharacteristic(Characteristic.TargetDoorState);
		targetState.on('set', function (state, callback) {
			var curState = getDoorState(service);
			switch (curState) {
				case Characteristic.CurrentDoorState.OPENING:
				case Characteristic.CurrentDoorState.CLOSING:
					callback(new Error('Must wait until operation is finished'));
					break;
				default:
					if (asDoorState(state) == curState) {
						callback();
						return;
					}
					break;
			}
			self.isOperating = true;
			self.log.debug("Started operation");
			self.writeAsync(GPIOState.On)
				.then(function () {
					service.setCharacteristic(Characteristic.CurrentDoorState, asOperationState(state));
				})
				.asCallback(callback)
				.delay(1000)
				.then(function () {
					return self.writeAsync(GPIOState.Off);
				})
				.delay(doorOpensInSeconds * 1000)
				.catch(function (err) {
					self.log.error(err);
				})
				.finally(function () {
					self.isOperating = false;
					self.log.debug("Finished operation");
					doorSensor.reset();
					self.refresh();
					//TODO: log issues
				});
		});
	}

	refresh(): void {
		if (this.isOperating) return;
		this.service.getCharacteristic(Characteristic.TargetDoorState)
			.setValue(getDoorState(this.service) == Characteristic.CurrentDoorState.OPEN ?
				Characteristic.TargetDoorState.OPEN :
				Characteristic.TargetDoorState.CLOSED);
	};
}
