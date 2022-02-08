import { subtract } from './Vector.js';

export default class BezierCubic {
	constructor(p0, p1, p2, p3) {
		this.p0 = p0;
		this.p1 = p1;
		this.p2 = p2;
		this.p3 = p3;
	}

	eval(t) {

		let t1 = this.p0.scale((1 - t) ** 3);
		let t2 = this.p1.scale(3 * t * (1 - t) ** 2);
		let t3 = this.p2.scale(3 * (1 - t) * (t ** 2));
		let t4 = this.p3.scale(t ** 3);

		t1.add(t2);
		t1.add(t3);
		t1.add(t4);

		return t1;
	}

	derivative(t) {

		let t1 = subtract(this.p1, this.p0).scale(3 * (1 - t) ** 2);
		let t2 = subtract(this.p2, this.p1).scale((6 * (1 - t) * t));
		let t3 = subtract(this.p3, this.p2).scale(3 * (t ** 2));

		t1.add(t2);
		t1.add(t3);

		return t1;
	}
}