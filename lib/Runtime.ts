/**
 * Created by kraig on 7/2/16.
 */

import {inherits} from "util";

export function mixin(Class: any, MixinClass: any, doOverride?: boolean) {
	var mixinMethods = MixinClass.prototype || MixinClass;
	var cls = Class.prototype || Class;
	Object.getOwnPropertyNames(mixinMethods).forEach(name => {
		if (!doOverride && cls[name] != undefined) return;
		cls[name] = mixinMethods[name];
	});
}

export function changeBase(Class: any, BaseClass: any) {
	var orig = Class.prototype;
	inherits(Class, BaseClass);
	Class.prototype.parent = BaseClass.prototype;
	mixin(Class, orig, true);
}
