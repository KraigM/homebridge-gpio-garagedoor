/**
 * Created by kraig on 7/2/16.
 */

/// <reference path="../typings/globals/onoff/index.d.ts" />
/// <reference path="../typings/modules/bluebird/index.d.ts" />

import util = require("util");
import Promise = require("bluebird");
import onoff = require("onoff");
import Gpio = onoff.Gpio;

var gpioReadAsync = Promise.promisify(Gpio.prototype.read);
var gpioWriteAsync = Promise.promisify(Gpio.prototype.write);

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

export class GPIOPort extends Gpio {

	constructor(gpio: number, direction: GPIODirection, edge?: GPIOEdge) {
		super(gpio, direction, edge);
		var self = this;
		process.on('SIGINT', function () {
			self.unexport();
		});
	};

	getState(retryCount?: number): GPIOState {
		retryCount = retryCount != null ? retryCount : 3;
		let val: number = 0;
		for (var i = 0; i < retryCount; i++) {
			val = this.readSync();
			if (val == 1) {
				break;
			}
		}
		return val;
	};

	readAsync(state: GPIOState): Promise<any> {
		return gpioReadAsync.call(this, state);
	}

	writeAsync(state: GPIOState): Promise<any> {
		return gpioWriteAsync.call(this, state);
	}
}

