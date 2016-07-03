/**
 * Created by kraig on 7/2/16.
 */

import util = require("util");
import Promise = require("bluebird");
import onoff = require("onoff");
import Bluebird = require("~bluebird/bluebird");
import Gpio = __ONOFF.Gpio;

var gpioReadAsync = Bluebird.promisify(Gpio.prototype.read);
var gpioWriteAsync = Bluebird.promisify(Gpio.prototype.write);

export enum GPIOState {
	On = 1,
	Off = 0,
}

export type GPIODirection =
	'in' |
	'out' |
	'high' |
	'low';

export type GPIOEdge =
	'none' |
	'rising' |
	'falling' |
	'both';

export class GPIOPort extends __ONOFF.Gpio {

	constructor(gpio:number, direction:GPIODirection, edge?:GPIOEdge) {
		super(gpio, direction, edge);
		var self = this;
		process.on('SIGINT', function () {
			self.unexport();
		});
	};

	getState(retryCount?:number):GPIOState {
		retryCount = retryCount != null ? retryCount : 3;
		let val:number = 0;
		for (var i = 0; i < retryCount; i++) {
			val = this.readSync();
			if (val == 1) {
				break;
			}
		}
		return val;
	};

	readAsync(state:GPIOState): Bluebird<any> {
		return gpioReadAsync.call(this);
	}

	writeAsync(state:GPIOState): Bluebird<any> {
		return gpioWriteAsync.call(this);
	}
}

