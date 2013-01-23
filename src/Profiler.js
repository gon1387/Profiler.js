(function(){
	
	/*var Profiler = {
		_data: {},
		start: function(){},
		stop: function(){},
		summary: function(){}
	}*/
	
	var Profiler = {};
	var	_profileCount = 0;
	var	_profiles = {};
	var	___ = window.__;
		
	Profiler.STARTED = 0;
	Profiler.PAUSED = 1;
	Profiler.RESUMED = 2;
	Profiler.STOPPED = 4;
	
	Profiler.data = function(){
		this.status = 0;
		this.callCount = 0;
		this.cycles = {};
	};
	
	Profiler.runStat = function(){
		this.track = null;
		this.lapse =  [];
	};
	
	Profiler.period = function(){
		this.start = null;
		this.end = null;
	}
	
	Profiler.init = function(){
		Profiler.start("__PROFILER");
	};
	Profiler.start = function(name,now){
		now = now||Profiler.util.now();
		//throw an error if the profile was already started
		if(_profiles[name] && (_profiles[name].status === Profiler.STARTED || _profiles[name].status & (Profiler.PAUSED|Profiler.RESUMED)) ){
			throw Error("Cannot start another profiler for " + name + ". Should stop the running profile first.");
		//create a new profile if non existent
		} else if(!_profiles[name]){
			_profiles[name] = new Profiler.data();
			_profileCount++;
		}
		
		_profiles[name].status = Profiler.STARTED;
		_profiles[name].cycles[_profiles[name].callCount] = new Profiler.runStat();
		_profiles[name].cycles[_profiles[name].callCount].track = new Profiler.period();
		_profiles[name].cycles[_profiles[name].callCount].track.start = now;
		_profiles[name].callCount++;
		
		return now;
	};
	Profiler.stop = function(name,now){
		now = now||Profiler.util.now();
		if(!_profiles[name]){
			throw Error("Stopping a non-existing profile named " + name);
		} else if(_profiles[name].status & Profiler.STOPPED){
			throw Error("Stopping a stopped profile named " + name);
		} else if(_profiles[name].status & Profiler.PAUSED){
			throw Error("Stopping a paused profile named " + name);
		}
		
		_profiles[name].status = Profiler.STOPPED;
		_profiles[name].cycles[_profiles[name].callCount-1].track.end = now;
		return now;
		
	};
	Profiler.pause = function(name,now){
		var period = null;
		now = now||Profiler.util.now();
		if(!_profiles[name]){
			throw Error("Pausing a non-existing profile named " + name);
		} else if(_profiles[name].status & Profiler.STOPPED){
			throw Error("Pausing a stopped profile named " + name);
		} else if(_profiles[name].status & Profiler.PAUSED){
			throw Error("Pausing a paused profile named " + name);
		}
		
		period = new Profiler.period();
		period.start = now;
		_profiles[name].cycles[_profiles[name].callCount-1].lapse.push(period);
		_profiles[name].status = Profiler.PAUSED;
		return now;
	};
	Profiler.resume = function(name,now){
		var period = null;
		now = now||Profiler.util.now();
		if(!_profiles[name]){
			throw Error("Resumming a non-existing profile named " + name);
		} else if(_profiles[name].status & Profiler.STOPPED){
			throw Error("Resumming a stopped profile named " + name);
		} else if(_profiles[name].status === Profiler.STARTED || _profiles[name].status & Profiler.RESUMED){
			throw Error("Resumming a running profile named " + name);
		}
		
		
		period = _profiles[name].cycles[_profiles[name].callCount-1].lapse.pop();
		period.end = now;
		_profiles[name].cycles[_profiles[name].callCount-1].lapse.push(period);
		_profiles[name].status = Profiler.RESUMED;
		return now;
	};
	Profiler.stopAll = function(){
		var profile = Object.getOwnPropertyNames(_profiles);
		
		for(var i = 0; i< _profileCount; i++){
			switch(_profiles[profile].status){
				case Profiler.PAUSED:
					break;
				case Profiler.RESUMED:
					break;
				case Profiler.STARTED:
					break;
				case Profiler.STOPPED:
				default:
					break;
			}
		}
	};
	Profiler.report = function(){console.log(_profiles);};
	Profiler.noConflict = function(){
		if(window.__ === Profiler){
			window.__ = ___;
		}
		
		return Profiler;
	};
	
	Profiler.util={
		//use high resolution timer
		now: (function(){
				if(performance){
					if(now = (performance.now || performance.webkitNow || performance.mozNow || performance.msNow || performance.oNow)){
						return function(){return now.call(performance);};
					}
				}
				if(Date.now){
						return function(){return Date.now();};
					} else {
						return function(){return (new Date()).getTime();};
				}
			})()
	};
	
	window.Profiler = window.__ = Profiler;
})();