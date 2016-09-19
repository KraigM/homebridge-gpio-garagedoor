# homebridge-gpio-garagedoor
[RPi](https://www.raspberrypi.org) GPIO based Garage Door plugin for [Homebridge](https://github.com/nfarina/homebridge)

# Installation

1. Install homebridge using: npm install -g homebridge
2. Install this plugin using: npm install -g homebridge-gpio-garagedoor
3. Update your configuration file. See sample config.json snippet below. 

# Configuration

Configuration sample:

 ```
	"accessories": [
		{
			"accessory": "GPIOGarageDoor",
			"name": "Garage Door",
			"doorSwitchPin": 23,
			"doorSensorPin": 24,
			"isNCSensor": false,
			"doorOpensInSeconds": 14
		}
	]
```

Fields: 

* "accessory": Must always be "GPIOGarageDoor" (required)
* "name": Can be anything (required)
* "doorSwitchPin": GPIO pin that is used to trigger the garage door switch (required)
* "doorSensorPin": GPIO pin that is used to detect if the state of the garage door (required)
* "isNCSensor": Specifies whether the door sensor is a Normally Closed (NC) type or Normally Open (NO) type (optional, default false NO)
* "doorOpensInSeconds": Number of seconds for the garage door to open completely (required)
