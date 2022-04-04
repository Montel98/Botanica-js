import { add } from './Vector.js';

export function radiusProperties(rStart, rEnd, length, shift) {

	return {
		radiusStart: rStart,
		radiusEnd: rEnd,
		branchLength: length,
		shift: shift
	}
}

// Defines the radius over the length (u) of a stem body or tip
export function radiusFunc(radius, u) {

	var decayRate;

	if (radius.radiusEnd == radius.radiusStart) {
		decayRate = 0.0; // Radius is constant
	}
	else {
		decayRate = (-1.0 / radius.branchLength) * Math.log((0.9 * radius.radiusEnd) / (radius.radiusStart - radius.radiusEnd));
	}

	return radius.radiusEnd + (radius.radiusStart - radius.radiusEnd) * Math.exp(-decayRate * (u + radius.shift));
}

// Defines the radius over length (u) of an immature stem
export function stemTipRadiusFunc(radius, u) {

	return radiusFunc(radius, 0.0) * (1.0 - u**2);
}

// Defines the radius over length (u) of a mature stem
export function stemTipRadiusFuncEnd(radius, u) {

	return radiusFunc(radius, 1.0) * (1.0 - u**2);
}

// Defines a position of a vertex along length (u) and angle (v) about the forward axis
export const crossSection = (radius, u, v, axis) => {

	let position = add(axis.left.scale(radius * Math.cos(v)), axis.up.scale(radius * Math.sin(v)));
	position = position.scale(0.9 + (0.1 * Math.cos(3 * v) ** 2.0));

	return position;
}

// Defines the shape of a stem geometry as the function: g(u, v)
// Where g is a 3D vector
export const stemFunc = (axis, path, radiusFunc, crossSectionFunc, radiusProperties) => {

	return {

		path: path,

		r(u) {
			return radiusFunc(radiusProperties, u);
		},

		aux(u, v) {

			this.bezierPoint = path.eval(u);
			this.bezierGradient = path.derivative(u);

			this.crossSectionPoint = crossSectionFunc(this.r(u), radiusProperties.shift, v, axis);
		},

		x(u, v) {
			return this.bezierPoint.components[0] + this.crossSectionPoint.components[0];
		},

		y(u, v) {
			return this.bezierPoint.components[1] + this.crossSectionPoint.components[1];
		},

		z(u, v) {
			return this.bezierPoint.components[2] + this.crossSectionPoint.components[2];
		}
	}
}