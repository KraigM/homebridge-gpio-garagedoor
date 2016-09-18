/**
 * Created by kraig on 7/2/16.
 */

import {GPIOPort } from "./GPIOPort";
import {getDoorState} from "./DoorStateExtension";

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
			self.refresh();
		});
		this.reset();
	}

	reset(): void {
		this.isClosed = this.getState() == this.closedSensorValue;
		this.update();
	};

	refresh(): void {
		switch (getDoorState(this.service)) {
			case Characteristic.CurrentDoorState.CLOSING:
			case Characteristic.CurrentDoorState.OPENING:
				return;
			default:
				this.update();
		}
	};

	update(): void {
		this.service.getCharacteristic(Characteristic.CurrentDoorState)
			.setValue(this.isClosed ? Characteristic.CurrentDoorState.CLOSED : Characteristic.CurrentDoorState.OPEN);
	};
}