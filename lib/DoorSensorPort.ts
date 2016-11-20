/**
 * Created by kraig on 7/2/16.
 */

import {GPIOPort} from "./GPIOPort";
import {getCurrentDoorState, getTargetDoorState} from "./DoorStateExtension";

var Characteristic;

export default class DoorSensorPort extends GPIOPort {
	private service: any;
	private log: any;
	private closedSensorValue;
	isClosed;

	static init(exportTypes) {
		Characteristic = exportTypes.Characteristic;
	}

	constructor(pin, service, log, isNCSensor) {
		super(pin, 'in', 'both');
		this.service = service;
		this.log = log;
		this.closedSensorValue = isNCSensor ? 0 : 1;

		var self = this;
		this.watch(function (err, value) {
			if (err) {
				log.error(err);
				return;
			}

			self.isClosed = value == self.closedSensorValue;
			self.handleStateChange();

		});
		this.reset();
	}

	handleStateChange() {
		var currentState = getCurrentDoorState(this.service);
		var targetState = getTargetDoorState(this.service);
		switch (currentState) {
			case Characteristic.CurrentDoorState.CLOSING:
			case Characteristic.CurrentDoorState.OPENING:
				return;
			default:
				this.updateCurrentDoorState();
		}

		// Handle external state change.
		if ((this.isClosed && targetState == Characteristic.TargetDoorState.OPEN)
			|| (!this.isClosed && targetState == Characteristic.TargetDoorState.CLOSED)) {
			this.service.getCharacteristic(Characteristic.TargetDoorState)
				.setValue(this.isClosed ? Characteristic.TargetDoorState.CLOSED : Characteristic.TargetDoorState.OPEN);
		}
	}

	reset(): void {
		this.isClosed = this.getState() == this.closedSensorValue;
		this.updateCurrentDoorState();
	};

	updateCurrentDoorState(): void {
		this.service.getCharacteristic(Characteristic.CurrentDoorState)
			.setValue(this.isClosed ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN);
	};
}