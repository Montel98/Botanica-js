import Vector, { add, subtract, scale, cross, dot } from './Vector.js';
import { transform } from './Matrix.js';

const EPSILON = 0.000001;

// Get the projected height of intersection with a ray along a stem axis, if any
export function testIntersections(origin, direction, segment, worldMatrix) {

	let out = new Vector([0, 0, 0]);
	let triangles = segment.boundingGeometry;
	let forward = segment.stackFrame.axis.forward;

	let intersections = [];
	let minDistance = 100000;
	let closestPoint = null;

	for (let i = 0; i < triangles.length; i++) {

		let intersection = rayIntersectTriangle(origin, add(origin, direction), triangles[i]);

		if (intersection) {
			if (intersection.distance <= minDistance) {
				closestPoint = intersection.hitPoint;
				minDistance = intersection.distance;
			}
		}
	}

	if (closestPoint) {

		let pos = segment.stackFrame.pos;
		let posTransformed = transform(new Vector([...pos.components, 1.0]), worldMatrix);
		posTransformed.squeeze(3);
				
		let toCentre = subtract(closestPoint, posTransformed);

		let height = Math.abs(dot(toCentre, forward.normalize())) / 0.03;

		return height;
	}

	return null;
}

// Implementation of the Möller–Trumbore intersection algorithm
function rayIntersectTriangle(p0, p1, triangle) {

	let v0 = triangle[0];
	let v1 = triangle[1];
	let v2 = triangle[2];

	let p1p0 = subtract(p1, p0);
	let v0p0 = subtract(v0, p0);

	let u = subtract(v1, v0);
	let v = subtract(v2, v0);
	let normal = cross(u, v);
	let b = dot(normal, p1p0);
	let a = dot(normal, v0p0);

	var rI;

	if (b == 0.0) {
		if (a != 0.0) {

			return null;
		}
		else {

			rI = 0.0;
		}
	}
	else {
		rI = a / b;
	}
	if (rI < 0.0) {
		return null;
	}

	let point = add(p0, p1p0.scale(rI));

	let w = subtract(point, v0);

	let denom = dot(u, v) * dot(u, v) - dot(u, u) * dot(v, v);
	let si = (dot(u, v) * dot(w, v) - dot(v, v) * dot(w, u)) / denom;

	if ((si < 0.0) || (si > 1.0)) {
		//console.log('t1');
		return null;
	}

	let ti = (dot(u, v) * dot(w, u) - dot(u, u) * dot(w, v)) / denom;

	if ((ti < 0.0) || (si + ti > 1.0)) {
		return null;
	}

	return {hitPoint: point, distance: rI};
}