import Vector from './Vector.js';

export default class ParametricSurface {
	
	constructor(functions, uMin, uMax, vMin, vMax) {
		this.functions = functions;

		this.uMin = uMin;
		this.uMax = uMax;
		this.vMin = vMin;
		this.vMax = vMax;
	}

	eval(u, v) {
		this.functions.aux(u, v);

		/*return new Vector([Math.round(this.functions.x(u, v) * 10000) / 10000,
				Math.round(this.functions.y(u, v) * 10000) / 10000,
				Math.round(this.functions.z(u, v) * 10000) / 10000]
				);*/

		return new Vector([this.functions.x(u, v),
							this.functions.y(u, v),
							this.functions.z(u, v)]
				);
	}
}