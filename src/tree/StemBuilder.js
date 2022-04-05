import Vector, { add } from './Vector.js';
import BezierLinear from './BezierLinear.js';
import ParametricSurface from './ParametricSurface.js';
import ParametricGeometry from './ParametricGeometry.js';

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

export function generateStemGeometries(genome, stackFrame) {

	let pos = stackFrame.pos;
	let axis = stackFrame.axis;
	let rEnd = stackFrame.radius;
	let branch = stackFrame.branch;
	let prevStem = stackFrame.prevStem;

	let normDir = axis.forward.normalize();

	let p0 = new Vector([...pos.components]);
	let p1 = add(pos, normDir.scale(0.03));
	let p2 = add(pos, normDir.scale(0.042));
	let p3 = add(pos, normDir.scale(0.012));

	let stemPath = new BezierLinear(p0, p1);
	let stemTipPath = new BezierLinear(p1, p2);
	let immatureStemTipPath = new BezierLinear(p0, p3);

	let rStart = radiusProperties(0.001, 0.001, branch.branchLength, 0);

	const crossSectionFunc = crossSection;

	// Construct stem body surface functions
	let endStemBodySurface = new ParametricSurface(stemFunc(axis, stemPath, radiusFunc, crossSectionFunc, rEnd),
													 0.0, 1.0, 0.0, 2.0 * Math.PI);

	let startStemBodySurface = new ParametricSurface(stemFunc(axis, stemPath, radiusFunc, crossSectionFunc, rStart), 
													0.0, 1.0, 0.0, 2.0 * Math.PI);

	// Construct stem tip surface function
	let endStemTipSurface = new ParametricSurface(stemFunc(axis, stemTipPath, stemTipRadiusFuncEnd, crossSectionFunc, rEnd), 
													0.0, 1.0, 0.0, 2.0 * Math.PI);

	let startStemTipSurface = new ParametricSurface(stemFunc(axis, stemTipPath, stemTipRadiusFuncEnd, crossSectionFunc, rStart), 
													0.0, 1.0, 0.0, 2.0 * Math.PI);

	let endImmatureStemTipSurface = new ParametricSurface(stemFunc(axis, immatureStemTipPath, stemTipRadiusFunc, crossSectionFunc, rEnd), 
														0.0, 1.0, 0.0, 2.0 * Math.PI);

	let startImmatureStemTipSurface = new ParametricSurface(stemFunc(axis, immatureStemTipPath, stemTipRadiusFunc, crossSectionFunc, rStart), 
														0.0, 1.0, 0.0, 2.0 * Math.PI);

	let uResolution = 2;
	let uTipResolution = 3;
	let vResolution = 16;

	const stemUVMapping = getMappingByWoodType(genome, stackFrame);

	// Construct stem body and tip geometries
	let endStemBodyGeometry = new ParametricGeometry(endStemBodySurface, uResolution, vResolution, false, true, true, null, stemUVMapping);
	let startStemBodyGeometry = new ParametricGeometry(startStemBodySurface, uResolution, vResolution, false, true, false, null, stemUVMapping);

	let endStemTipGeometry = new ParametricGeometry(endStemTipSurface, uTipResolution, vResolution, false, true, true, null, stemUVMapping);
	let startStemTipGeometry = new ParametricGeometry(startStemTipSurface, uTipResolution, vResolution, false, true, false, null, stemUVMapping);

	let endImmatureStemTipGeometry = new ParametricGeometry(endImmatureStemTipSurface, uTipResolution, vResolution, false, true, true, null, stemUVMapping);
	let startImmatureStemTipGeometry = new ParametricGeometry(startImmatureStemTipSurface, uTipResolution, vResolution, false, true, false, null, stemUVMapping);


	// Connect previous stem geometry to current stem geometry (vertices and normals)
	// endImmatureStemBody and startImmatureStemBody have been ignored as they are equal to the base 'ring' vertices of the stem body
	// Logic has been delegated to stem class itself, perhaps refactor
	if (stackFrame.connectParent && stackFrame.prevStem) {

		let prevStemGeometry = prevStem.stem.geometryParts;
		let offset = uResolution - 1;

		for (let i = 0; i < endStemBodyGeometry.vSteps; i++) {

			let prevEndBody = prevStemGeometry.matureGeometry.endBodyGeometry;
			let prevStartBody = prevStemGeometry.matureGeometry.startBodyGeometry;

			endStemBodyGeometry.vertices[(uResolution * i)] = prevEndBody.vertices[(uResolution * i) + offset].copy();
			endStemBodyGeometry.normals[(uResolution * i)] = prevEndBody.normals[(uResolution * i) + offset].copy();

			endImmatureStemTipGeometry.vertices[(uTipResolution * i)] = prevEndBody.vertices[(uResolution * i) + offset].copy();
			endImmatureStemTipGeometry.normals[(uTipResolution * i)] = prevEndBody.normals[(uResolution * i) + offset].copy();

			startStemBodyGeometry.vertices[(uResolution * i)] = prevStartBody.vertices[(uResolution * i) + offset].copy();
			startImmatureStemTipGeometry.vertices[(uTipResolution * i)] = prevStartBody.vertices[(uResolution * i) + offset].copy();
		}
	}

	// Return main and morph target geometries to be parsed by the stem class
	// Segmented to be merged and assembled in the stem class
	// A seperate copy of stem body like this is required by the tree and segment selector classes
	return {matureGeometry: {endBodyGeometry: endStemBodyGeometry, startBodyGeometry: startStemBodyGeometry,
							endTipGeometry: endStemTipGeometry, startTipGeometry: startStemTipGeometry},

			immatureGeometry: {endTipGeometry: endImmatureStemTipGeometry, startTipGeometry: startImmatureStemTipGeometry}
		};
}

function getMappingByWoodType(genome, stackFrame) {

	let sMinUV = 0.0;
	let sMaxUV = 1.0;

	const woodTypeAllele = genome.getGenotype('Wood Type').left.allele;

	if (woodTypeAllele.name == 'Birch') {

		const sWrapTrunk = 8;

		if (stackFrame.branch.level == 0) {

			sMinUV = (stackFrame.count % sWrapTrunk) / sWrapTrunk;
			sMaxUV = (stackFrame.count + 1) % sWrapTrunk == 0 ? 1.0 : ((stackFrame.count + 1) % sWrapTrunk) / sWrapTrunk;
		}
	}
	else if (woodTypeAllele.name == 'Dark Wood' || woodTypeAllele.name == 'Light Wood') {

		if (stackFrame.branch.level == 0) {

			sMinUV = (stackFrame.count % 16) / 16;
			sMaxUV = (stackFrame.count + 1) % 16 == 0 ? 1.0 : ((stackFrame.count + 1) % 16) / 16;
		}
		else {
			sMinUV = 0.7;
			sMaxUV = 0.9;
		}
	}

	return {sMin: sMinUV, sMax: sMaxUV, tMin: 0.0, tMax: 1.0};
}