import { subtract } from './Vector.js';

export default class BezierLinear {

	constructor(p0, p1) {

		this.p0 = p0;
		this.p1 = p1;
		this.gradient = subtract(this.p1, this.p0);
	}

	eval(t) {

		let t1 = this.p0.scale(1 - t);
		let t2 = this.p1.scale(t);

		t1.add(t2);

		return t1;
	}

	derivative(t) {

		return this.gradient;
	}
}