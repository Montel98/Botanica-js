import Vector, { add, subtract, scale, cross, dot } from './Vector.js';
import { transform } from './Matrix.js';

const EPSILON = 0.000001;

function intersectTriangle(out, pt, dir, tri) {
    let edge1 = subtract(tri[1], tri[0]);
    let edge2 = subtract(tri[2], tri[0]);
    
    let pvec = cross(dir, edge2);
    let det = dot(edge1, pvec);
    
    //if (det < EPSILON) return null;

    let tvec = subtract(pt, tri[0]);

    let u = dot(tvec, pvec);
    if (u < 0 || u > det) return null;
    let qvec = cross(tvec, edge1);
    let v = dot(dir, qvec);
    if (v < 0 || u + v > det) return null;
    
    var t = dot(edge2, qvec) / det;
    out.components[0] = pt.components[0] + t * dir.components[0];
    out.components[1] = pt.components[1] + t * dir.components[1];
    out.components[2] = pt.components[2] + t * dir.components[2];

    return out;
}

function rayTriangle(origin, direction, tri) {

	console.log(tri);
    let v0v1 = subtract(tri[1], tri[0]);
    let v0v2 = subtract(tri[2], tri[0]);

    let normal = cross(v0v1, v0v2);
    let area2 = normal.magnitude();

    let d = dot(normal, tri[0]);

    let t = dot(normal, origin) + d;

    if (t < 0) return null;

    let P = add(origin, direction.scale(t));

    var C;

    let edge0 = subtract(tri[1], tri[0]);
    let vp0 = subtract(P, tri[0]);
    //C = cross(edge0, vp0);
    C = cross(vp0, edge0);

    if (dot(normal, C) < 0) return null; // P is on right side

    let edge1 = subtract(tri[2], tri[1]);
    let vp1 = subtract(P, tri[1]);
    //C = cross(edge1, vp1);
    C = cross(vp1, edge1);

    if (dot(normal, C) < 0) return null; // P is on right side

    let edge2 = subtract(tri[0], tri[2]);
    let vp2 = subtract(P, tri[2]);
    //C = cross(edge2, vp2);
    C = cross(vp2, edge2);
    
    if (dot(normal, C) < 0) return null; // P is on right side

    return P;
}

export function testIntersections(origin, direction, segment, worldMatrix) {

	let out = new Vector([0, 0, 0]);
	let triangles = segment.boundingGeometry;
	let forward = segment.stackFrame.axis.forward;

	let intersections = [];
	let minDistance = 100000;
	let closestPoint = null;

	for (let i = 0; i < triangles.length; i++) {

		//let intersection = intersectTriangle(out, origin, direction, triangles[i]);
		let intersection = ray_intersect_triangle(origin, add(origin, direction), triangles[i]);

		//console.log(origin, add(origin, direction), triangles[i]);

		if (intersection) {

			if (intersection.distance <= minDistance) {
				closestPoint = intersection.hitPoint;
				minDistance = intersection.distance;
			}

		}
	}

	if (closestPoint) {

		//console.log('closest point:', closestPoint);

		//let realPos = subtract(segment.stackFrame.pos, forward.scale(0.03));
		let pos = segment.stackFrame.pos;
		let posTransformed = transform(new Vector([...pos.components, 1.0]), worldMatrix);
		posTransformed.squeeze(3);
				
		//let toCentre = subtract(closestPoint, add(pos, new Vector([0.0, 0.0, 0.28])));
		let toCentre = subtract(closestPoint, posTransformed);

		let height = Math.abs(dot(toCentre, forward.normalize())) / 0.03;

		return height;
	}

	return null;
}

function ray_intersect_triangle(p0, p1, triangle) {

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

	/*console.log('p1p0', p1p0);
	console.log('v0p0', v0p0);
	console.log('u:', u);
	console.log('v:', v);
	console.log('normal:', normal);
	console.log('a:', a);
	console.log('b:', b)*/

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

	//console.log('si:', si);

	if ((si < 0.0) || (si > 1.0)) {
		//console.log('t1');
		return null;
	}

	let ti = (dot(u, v) * dot(w, u) - dot(u, u) * dot(w, v)) / denom;

	//console.log('ti:', si);

	if ((ti < 0.0) || (si + ti > 1.0)) {
		//console.log('t2');
		return null;
	}

	return {hitPoint: point, distance: rI};
}