class WorldTime {
	constructor() {
		this.timeNow = Date.now() / 1000;
		this.timePrev = this.timeNow;
		this.dt = 0;
	}

	updateTime() {
		this.timePrev = this.timeNow;
		this.timeNow = Date.now() / 1000;
		this.dt = this.timeNow - this.timePrev;
	}
}