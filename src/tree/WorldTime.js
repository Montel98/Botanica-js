export default class WorldTime {
	
	constructor(germinationDate) {
		this.timeNow = Date.now() / 1000;
		this.timePrev = this.timeNow;
		this.dt = 0;
		this.start = this.timeNow;
		this.date = new Date();
	}

	updateTime() {
		this.timePrev = this.timeNow;
		this.timeNow = Date.now() / 1000;
		this.dt = this.timeNow - this.timePrev;
	}

	/*updateTime(newTick=getTicksElapsed(germinationDate, Date.now())) {
		this.timePrev = this.timeNow;
		this.timeNow = newTick
		this.dt = this.timeNow - this.timePrev;
	}*/

	getTimeElapsed() {
		return Date.now() / 1000 - this.start;
	}

	getMonth() {
		return this.date.getMonth();
	}

    getTimeElapsed2(dateFrom, dateTo) {

        return dateTo - dateFrom;
    }
}