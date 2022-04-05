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

		return new Vector([this.functions.x(u, v),
							this.functions.y(u, v),
							this.functions.z(u, v)]
				);
	}
}