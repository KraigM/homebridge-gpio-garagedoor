/**
 * Created by kraig on 7/2/16.
 */

var Characteristic;

export default class DoorStateExtension {
	static init(exportedTypes): void {
		Characteristic = exportedTypes.Characteristic;
	}
}

export function getCurrentDoorState(service): any {
	return service.getCharacteristic(Characteristic.CurrentDoorState).value;
}

export function getTargetDoorState(service): any {
	return service.getCharacteristic(Characteristic.TargetDoorState).value;
}

export function asDoorState(targetState): any {
	switch (targetState) {
		case Characteristic.TargetDoorState.OPEN:
			return Characteristic.CurrentDoorState.OPEN;
		case Characteristic.TargetDoorState.CLOSED:
			return Characteristic.CurrentDoorState.CLOSED;
	}
}

export function asOperationState(targetState): any {
	switch (targetState) {
		case Characteristic.TargetDoorState.OPEN:
			return Characteristic.CurrentDoorState.OPENING;
		case Characteristic.TargetDoorState.CLOSED:
			return Characteristic.CurrentDoorState.CLOSING;
	}
}

export function getCurrentDoorStateDescription(doorState): any {
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
}

export function getTargetDoorStateDescription(doorState): any {
	switch (doorState) {
		case Characteristic.TargetDoorState.OPEN:
			return "OPEN";
		case Characteristic.CurrentDoorState.CLOSED:
			return "CLOSED";
	}
}