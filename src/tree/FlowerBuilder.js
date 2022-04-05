import Vector, { zeroVector2D, upVector, add, cross } from './Vector.js';
import ParametricGeometry from './ParametricGeometry.js';
import ParametricSurface from './ParametricSurface.js';
import { FourierTerm, FourierSeries } from './FourierSeries.js';
import BezierCubic from './BezierCubic.js';
import { identityMatrix, transform, multiply, rotate3Z, rotate4Z, scale } from './Matrix.js';

// Define all paths describing the flower shapes, only used internally by the FlowerBuilder
const budMidTermA = new FourierTerm(0.0, 0.85, 2.0, 2.0);
const budMidTermB = new FourierTerm(0.0, 0.05, 2.0, 200.0);

const budClosedXY = new FourierSeries(1.0, []); // Bud Closed
const budMidXY = new FourierSeries(0.1, [budMidTermA, budMidTermB]); // Bud Mid

const flowerOpen = new BezierCubic(
	new Vector([0.0, 0.0]), 
	new Vector([0.5, 1.0]), 
	new Vector([1.5, 1.0]), 
	new Vector([2.0, 0.5])
);

const budClosed = new BezierCubic(
	new Vector([0.0, 0.0]),
	new Vector([1.0, 1.0]),
	new Vector([0.0, 1.0]),
	new Vector([0.0, 2.0])
);

const flowerClosed = new BezierCubic(
	new Vector([0.0, 0.0]),
	new Vector([0.5, 1.0]),
	new Vector([0.0, 1.0]),
	new Vector([0.0, 1.8])
);

const budHalfOpened = new BezierCubic(
	new Vector([0.0, 0.0]),
	new Vector([0.75, 0.5]),
	new Vector([0.25, 1.25]),
	new Vector([0.75, 1.75])
);

const budOpened = new BezierCubic(
	new Vector([0.0, 0.0]),
	new Vector([0.5, 0.5]),
	new Vector([0.75, 0.25]),
	new Vector([1.0, 0.0])
);

const flowerStemPath = new BezierCubic(
	new Vector([0.0, 0.0, 0.0]),
	new Vector([0.9, 0.0, 0.3]),
	new Vector([1.2, 0.0, 0.9]),
	new Vector([1.6, 0.0, 1.8])
);

const filamentPointsEnd = [
	new Vector([0.0, 0.0, 0.0]),
	new Vector([0.02, 0.0, 0.4]),
	new Vector([0.4, 0.0, 0.6]),
	new Vector([0.5, 0.0, 1.25])
];

const filamentPointsStart = [
	new Vector([0.0, 0.0, 0.0]),
	new Vector([0.14, 0.0, 0.4]),
	new Vector([0.2, 0.0, 1.0]),
	new Vector([0.03, 0.0, 1])
];

const flowerStemMapping = {sMin: 0.51, sMax: 0.74, tMin: 0.0, tMax: 1.0};
const antherMapping = {sMin: 0.76, sMax: 0.99, tMin: 0.0, tMax: 1.0};


// Defines the flower petal geoemtry as a function g(u, v)
// u is an angle in radius, v is a distance, g is a 3D vector
// dTheta is an angle offset, useful for overlapping petals in future
const flowerFunc = (dTheta, petalSideProfile, petalTopProfile) => {
	return {
		aux(u, v) {

			let theta = u + dTheta;
			this.r = v * petalTopProfile.sum(theta);
			this.profile = petalSideProfile.eval(this.r);
			let pos = new Vector([this.r * Math.cos(u), this.r * Math.sin(u)]);

			this.normPos = pos.equals(zeroVector2D) ? pos : pos.normalize();
		},

		r(u, v) {
			let theta = u + dTheta;
			return v * petalTopProfile.sum(theta);
		},

		x(u, v) {
			//return this.r * Math.cos(u);
			return this.normPos.components[0] * this.profile.components[0];
		},

		y(u, v) {
			//return this.r * Math.sin(u);
			return this.normPos.components[1] * this.profile.components[0];
		},

		z(u, v) {
			//return 1.0;
			return this.profile.components[1] + 0.05 * Math.cos(10 * u);
		}
	}
}

// Defines the flower stem geometry as a function g(u, v)
// Modelled as a 3D bezier curve with a decreasing radius
const flowerStemFunc = (path, radiusStart) => {
	return {

		crossSection(gradient, v) {

			let right = cross(upVector.copy(), gradient).normalize();
			let up = cross(gradient, right).normalize();

			return add(right.scale(Math.cos(v)), up.scale(Math.sin(v))).scale(this.radius);
		},

		aux(u, v) {

			//this.radius = 0.1 - 0.07 * u;
			this.radius = radiusStart - (0.7 * radiusStart * u);
			this.bezierPoint = path.eval(u);
			this.bezierGradient = path.derivative(u);
			this.crossSectionPoint = this.crossSection(this.bezierGradient, v);
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

// Models filament as a 3D bezier path similar to the flower stem
const filamentFunc = (angleZ, points) => {

	const bezierPointsRotated = points.map(point => transform(point, rotate3Z(angleZ)));
	const path = new BezierCubic(...bezierPointsRotated);

	return flowerStemFunc(path, 0.03);
}

// Models anther as a concave 2D bezier cross section rotated about the z axis
const antherFunc = () => {

	const crossSectionXZ = new BezierCubic(
		new Vector([0.0, 0.0]),
		new Vector([0.07, 0.0]),
		new Vector([0.07, 0.4]),
		new Vector([0.0, 0.4])
	);

	return {

		aux(u, v) {
			this.pathXZ = crossSectionXZ.eval(u);
		},

		x(u, v) {
			return this.pathXZ.components[0] * Math.cos(v);
		},

		y(u, v) {
			return this.pathXZ.components[0] * Math.sin(v);
		},

		z(u, v) {
			return this.pathXZ.components[1];
		}
	}
}

function generateFlowerStemGeometry() {

		const stemSurface = new ParametricSurface(flowerStemFunc(flowerStemPath, 0.09), 0.0, 1.0, 0.0, 2.0 * Math.PI);
		const stemGeometry = new ParametricGeometry(stemSurface, 8, 8, false, true, true, null, flowerStemMapping);

		stemGeometry.addMorphTarget('Start', stemGeometry.vertices, stemGeometry.normals);
		stemGeometry.addMorphTarget('Mid', stemGeometry.vertices, stemGeometry.normals);

		return stemGeometry;
	}

function generateFilamentGeometry(angleZ) {

	const filamentSurfaceEnd = new ParametricSurface(filamentFunc(angleZ, filamentPointsEnd), 0.0, 1.0, 0.0, 2.0 * Math.PI);
	const filamentGeometryEnd = new ParametricGeometry(filamentSurfaceEnd, 8, 8, false, true, true, null, flowerStemMapping);

	filamentGeometryEnd.translate(...flowerStemPath.p3.components);

	const filamentSurfaceStart = new ParametricSurface(filamentFunc(angleZ, filamentPointsStart), 0.0, 1.0, 0.0, 2.0 * Math.PI);
	const filamentGeometryStart = new ParametricGeometry(filamentSurfaceStart, 8, 8, false, true, true, null, flowerStemMapping);

	filamentGeometryStart.translate(...flowerStemPath.p3.components);

	filamentGeometryEnd.addMorphTarget('Start', filamentGeometryStart.vertices, filamentGeometryStart.normals);
	filamentGeometryEnd.addMorphTarget('Mid', filamentGeometryStart.vertices, filamentGeometryStart.normals);

	return filamentGeometryEnd;
}

function generateAntherGeometry(angleX, angleZ) {

	const antherSurfaceEnd = new ParametricSurface(antherFunc(), 0.0, 1.0, 0.0, 2.0 * Math.PI);
	const antherGeometryEnd = new ParametricGeometry(antherSurfaceEnd, 5, 5, false, true, true, null, antherMapping);

	const antherOriginEnd = add(flowerStemPath.p3, transform(filamentPointsEnd[3], rotate3Z(angleZ)));

	antherGeometryEnd.rotateX(angleX);
	antherGeometryEnd.translate(...antherOriginEnd.components);

	const antherSurfaceStart = new ParametricSurface(antherFunc(), 0.0, 1.0, 0.0, 2.0 * Math.PI);
	const antherGeometryStart = new ParametricGeometry(antherSurfaceStart, 5, 5, false, true, true, null, antherMapping);

	const antherOriginStart = add(flowerStemPath.p3, transform(filamentPointsStart[3], rotate3Z(angleZ)));

	antherGeometryStart.rotateX(angleX);
	antherGeometryStart.translate(...antherOriginStart.components);

	antherGeometryEnd.addMorphTarget('Start', antherGeometryStart.vertices, antherGeometryStart.normals);
	antherGeometryEnd.addMorphTarget('Mid', antherGeometryStart.vertices, antherGeometryStart.normals);

	return antherGeometryEnd;
}

function generateBudGeometry() {

	const budSurfaceStart = new ParametricSurface(flowerFunc(0, budClosed, budClosedXY), 0.0, 2.0 * Math.PI, 0.0, 1.0);
	const budSurfaceMid = new ParametricSurface(flowerFunc(0, budHalfOpened, budMidXY), 0.0, 2.0 * Math.PI, 0.0, 1.0);
	const budSurfaceEnd = new ParametricSurface(flowerFunc(0, budOpened, budMidXY), 0.0, 2.0 * Math.PI, 0.0, 1.0);

	const budGeometryStart = new ParametricGeometry(budSurfaceStart, 256, 8, true, true, true, null, flowerStemMapping);
	const budGeometryMid = new ParametricGeometry(budSurfaceMid, 256, 8, true, true, true, null, flowerStemMapping);
	const budGeometryEnd = new ParametricGeometry(budSurfaceEnd, 256, 8, true, true, true, null, flowerStemMapping);

	budGeometryStart.translate(...flowerStemPath.p3.components);
	budGeometryMid.translate(...flowerStemPath.p3.components);
	budGeometryEnd.translate(...flowerStemPath.p3.components);

	budGeometryEnd.addMorphTarget('Start', budGeometryStart.vertices, budGeometryStart.normals);
	budGeometryEnd.addMorphTarget('Mid', budGeometryMid.vertices, budGeometryMid.normals);

	return budGeometryEnd;
}

function generatePetalGeometry(genome) {

	const flowerMapping = {sMin: 0.01, sMax: 0.49, tMin: 0.0, tMax: 1.0};

	let shapeAllele = genome.getGenotype('Flower Shape').left.allele;
	let gene = genome.getGene('Flower Shape');

	let halfGeneLength = 0.5 * (gene.sequenceEnd - gene.sequenceStart + 1);

    let magnitudeA = shapeAllele.geneticCode & (2**halfGeneLength - 1);
    let magnitudeB = (shapeAllele.geneticCode & ((2**halfGeneLength - 1) << halfGeneLength)) >> halfGeneLength;

    magnitudeA = 3;
    magnitudeB = 6;

    let mainTerm = new FourierTerm(0.0, 0.45, 0.5 * magnitudeA, 2.0);
    let outerTerm = new FourierTerm(0.0, 0.3, 0.5 * magnitudeB, 2.0);

    let flowerFourier = new FourierSeries(0.3, [mainTerm, outerTerm]);

	const flowerSurfaceStart = new ParametricSurface(flowerFunc(0, flowerClosed, flowerFourier), 0.0, 2.0 * Math.PI, 0.0, 1.0);
	const flowerSurfaceMid = new ParametricSurface(flowerFunc(0, flowerClosed, flowerFourier), 0.0, 2.0 * Math.PI, 0.0, 1.0);
	const flowerSurfaceEnd = new ParametricSurface(flowerFunc(0, flowerOpen, flowerFourier), 0.0, 2.0 * Math.PI, 0.0, 1.0);

	const flowerGeometryStart = new ParametricGeometry(flowerSurfaceStart, 256, 8, false, true, true, null, flowerMapping);
	const flowerGeometryMid = new ParametricGeometry(flowerSurfaceMid, 256, 8, false, true, true, null, flowerMapping);
	const flowerGeometryEnd = new ParametricGeometry(flowerSurfaceEnd, 256, 8, false, true, true, null, flowerMapping);

	flowerGeometryStart.translate(...flowerStemPath.p3.components);
	flowerGeometryMid.translate(...flowerStemPath.p3.components);
	flowerGeometryEnd.translate(...flowerStemPath.p3.components);

	flowerGeometryEnd.addMorphTarget('Start', flowerGeometryStart.vertices, flowerGeometryStart.normals);
	flowerGeometryEnd.addMorphTarget('Mid', flowerGeometryMid.vertices, flowerGeometryMid.normals);

	return flowerGeometryEnd;
}

export function generateFlowerGeometry(genome) {

	const stemGeometry = generateFlowerStemGeometry();
	const budGeometryEnd = generateBudGeometry();
	const flowerGeometry = generatePetalGeometry(genome);
	budGeometryEnd.addGeometry(flowerGeometry);
	budGeometryEnd.addGeometry(stemGeometry);

	const noFilaments = Math.floor(3.0 + 3.0 * Math.random());

	for (let filament = 0; filament < noFilaments; filament++) {

		const angleZ = Math.PI * 2.0 * (filament / noFilaments);
		const randomAngleX = (0.25 * Math.PI) - (0.5 * Math.PI * Math.random());

		const filamentGeometry = generateFilamentGeometry(angleZ);
		const antherGeometry = generateAntherGeometry(randomAngleX, angleZ);

		budGeometryEnd.addGeometry(filamentGeometry);
		budGeometryEnd.addGeometry(antherGeometry);
	}

	return budGeometryEnd;
}