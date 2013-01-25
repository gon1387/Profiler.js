/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
(function(window) {"use strict";

	var Time = {};
	var Profile = {};
	var Profiler = {};
	var _profileCount = 0;
	var _profiles = {};
	var ___ = window.__;

	//TODO: add a halted status for stopping all on-going profiler
	Profiler.STARTED = 0;
	Profiler.PAUSED = 1;
	Profiler.RESUMED = 2;
	Profiler.STOPPED = 4;

	Profile.data = function() {
		return {
			status: null,
			runCount: 0,
			cycles: {}
		};
	};

	Profile.cycle = function() {
		return {
			track: null,
			lapse: []
		};
	};

	Profiler.init = function() {
		Profiler.start("__PROFILER");
	};
	Profiler.start = function(name, now) {
		now = now || Time.timeStamp();
		//throw an error if the profile was already started
		if (_profiles[name] && (_profiles[name].status === Profiler.STARTED || _profiles[name].status & (Profiler.PAUSED | Profiler.RESUMED))) {
			throw Error("Cannot start another profiler for " + name + ". Should stop the running profile first.");
			//create a new profile if non existent
		} else if (!_profiles[name]) {
			_profiles[name] = new Profile.data();
			_profileCount++;
		}

		_profiles[name].status = Profiler.STARTED;
		_profiles[name].cycles[_profiles[name].runCount] = new Profile.cycle();
		_profiles[name].cycles[_profiles[name].runCount].track = new Time.period();
		_profiles[name].cycles[_profiles[name].runCount].track.start = now;
		_profiles[name].runCount++;
		console.log(_profiles[name]);

		return now;
	};
	Profiler.stop = function(name, now) {
		now = now || Time.timeStamp();
		if (!_profiles[name]) {
			throw Error("Stopping a non-existing profile named " + name);
		} else if (_profiles[name].status & Profiler.STOPPED) {
			throw Error("Stopping a stopped profile named " + name);
		} else if (_profiles[name].status & Profiler.PAUSED) {
			throw Error("Stopping a paused profile named " + name);
		}

		_profiles[name].status = Profiler.STOPPED;
		_profiles[name].cycles[_profiles[name].runCount - 1].track.end = now;
		return now;

	};
	Profiler.pause = function(name, now) {
		var period = null;
		now = now || Time.timeStamp();
		if (!_profiles[name]) {
			throw Error("Pausing a non-existing profile named " + name);
		} else if (_profiles[name].status & Profiler.STOPPED) {
			throw Error("Pausing a stopped profile named " + name);
		} else if (_profiles[name].status & Profiler.PAUSED) {
			throw Error("Pausing a paused profile named " + name);
		}

		period = new Time.period();
		period.start = now;
		_profiles[name].cycles[_profiles[name].runCount - 1].lapse.push(period);
		_profiles[name].status = Profiler.PAUSED;
		return now;
	};
	Profiler.resume = function(name, now) {
		var period = null;
		now = now || Time.timeStamp();
		if (!_profiles[name]) {
			throw Error("Resumming a non-existing profile named " + name);
		} else if (_profiles[name].status & Profiler.STOPPED) {
			throw Error("Resumming a stopped profile named " + name);
		} else if (_profiles[name].status === Profiler.STARTED || _profiles[name].status & Profiler.RESUMED) {
			throw Error("Resumming a running profile named " + name);
		}

		period = _profiles[name].cycles[_profiles[name].runCount - 1].lapse.pop();
		period.end = now;
		_profiles[name].cycles[_profiles[name].runCount - 1].lapse.push(period);
		_profiles[name].status = Profiler.RESUMED;
		return now;
	};
	Profiler.reset = function(reinit){
		var profilerProfile = {};
		
		//reinitialize the starting point
		if(!reinit){
			_profiles = {};
			Profiler.start("__PROFILER");
		} else {
			_profileCount = 1;
			profilerProfile = _profiles["__PROFILER"];
			_profiles = {};
			_profiles["__PROFILER"] = profilerProfile;
		}
	};
	Profiler.stopAll = function() {
		var i = 0;
		var profileNames = Object.getOwnPropertyNames(_profiles);
		var stopTimestamp = Time.timeStamp();

		// TODO: make sure eveything gets handled when the profiler stops
		for (i = 0; i < _profileCount; i++) {
			switch(_profiles[profileNames[i]].status) {
				case Profiler.PAUSED:
					//assign the stop time value for paused running profile
					Profiler.stop(profileNames[i], Profiler.resume(profileNames[i], stopTimestamp));
					break;
				case Profiler.RESUMED:
					//stop the resumed running profile and assing the stop time value
					Profiler.stop(profileNames[i], stopTimestamp);
					break;
				case Profiler.STARTED:
					//stop the running profile and assign the stop timestamp
					Profiler.stop(profileNames[i], stopTimestamp);
					break;
				case Profiler.STOPPED:
				default:
					//great nothing to do here
					break;
			}
		}
	};
	Profiler.getProfileData = function(name) {
		var i;
		var profiles = {};
		
		//check if the argument a string or array
		if ( typeof name !== "string" || name instanceof Array) {
			throw new TypeError("getProfileData method accepts String names of profile/s in array or a single string");
		}
		if (name) {
			//Get single profile
			if ( typeof name === "string") {
				if (!_profiles[name]) {
					throw new Error("There's no existing profile for " + name + ".");
				}
				return _profiles[name];
			//get multiple profile
			} else {
				for (i = 0, arrayLen = name.length; i < arrayLen; i++) {
					if (_profiles[name[i]]) {
						throw new Error("There's no existing profile for " + name + ".");
					} else {
						profiles[name[i]] = _profiles[name[i]];
					}
				}
				return profiles;
			}
		} else {
			return _profiles;
		}
	};
	
	Profiler.report = function(reporter){
		if(typeof reporter !== 'object'){
			throw Error("Should pass a valid Profiler reporter object.");
		}
		reporter.show();
	};

	Profiler.noConflict = function() {
		if (window.__ === Profiler) {
			window.__ = ___;
		}

		return Profiler;
	};
	
	Time = {
		isHighRes: false,
		
		period: function() {
			return {
				start: null,
				end: null
			}
		},
		timeStamp: (function() {
			var now;
			if (performance) {
				if ( now = (performance.now || performance.webkitNow || performance.mozNow || performance.msNow || performance.oNow)) {
					Time.isHighRes = true;
					return function() {
						return now.call(performance);
					};
				}
			}
			if (Date.now) {
				return function() {
					return Date.now();
				};
			} else {
				return function() {
					return (new Date()).getTime();
				};
			}
		})()
	};
	
	Profiler.ver = {
		major: "0",
		minor: "1",
		build: "0"
	};

	window.Profiler = window.__ = Profiler;
})(window);
