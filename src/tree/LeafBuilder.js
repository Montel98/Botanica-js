import Vector, {zeroVector, upVector, cross, add, subtract} from './Vector.js';
import ParametricGeometry from './ParametricGeometry.js';
import ParametricSurface from './ParametricSurface.js';
import Matrix, {translate, multiply,  rotate4X, rotate4Y} from './Matrix.js';
import BezierCubic from './BezierCubic.js';
import { FourierTerm, FourierSeries } from './FourierSeries.js';

// XY morph target leaf profiles
const leafProfileStart = (x) => {
	return -0.4 * x;
}

const leafProfileMature = (x) => {
	return 0.4 * x ** 2.0; 
}

// Defines leaf surface as a function g(u, v)
// Where u is an angle in radians, v is a distance
// foldFactor determines the 'bumpiness' magnitude of leaf surface
// foldFrequency determines the frequency of bumps
const leafFunc = (fourier, foldFactor, foldFrequency, profileFunc, vMax) => { 
	return {
		aux(u, v) {
			this.r = v * fourier.sum(u);
		},

		x(u, v) {
			return 0.14 * ((this.r * (Math.cos(u))) - (vMax * fourier.sum(Math.PI) * Math.cos(Math.PI))) + 0.005;
		},

		y(u, v) {
			return 0.12 * this.r * Math.sin(u);
		},

		z(u, v) {
			return 0.14 * (Math.abs(foldFactor * Math.sin(foldFrequency * this.r * Math.sin(u))) + 0.01*(Math.sin(5*u) + Math.sin(5*v))) - profileFunc(this.r * Math.cos(u));
		}
	}
}

// Defines leaf stem as a 3D bezier curve with decreasing radius over length u
const leafStemFunc = (path) => {
	return {

		radius: 0.001,

		crossSection(gradient, v) {

			let right = cross(upVector.copy(), gradient).normalize();
			let up = cross(gradient, right).normalize();

			return add(right.scale(Math.cos(v)), up.scale(Math.sin(v))).scale(this.radius);
		},

		aux(u, v) {

			this.radius = 0.001 - 0.0007 * u
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

export function generateGeometry(genome, textureMapping) {

    let shapeAllele = genome.getGenotype('Leaf Shape').left.allele;
    let gene = genome.getGene('Leaf Shape');

    let halfGeneLength = 0.5 * (gene.sequenceEnd - gene.sequenceStart + 1);

    let magnitudeA = shapeAllele.geneticCode & (2**halfGeneLength - 1);
    let magnitudeB = (shapeAllele.geneticCode & ((2**halfGeneLength - 1) << halfGeneLength)) >> halfGeneLength;

    magnitudeA = 10;
    magnitudeB = 10;

	let termA = new FourierTerm(0.0, 0.5, 0.5, 2.0);
    let termB = new FourierTerm(0.0, 0.3, 0.5 * magnitudeA, 2.0);
    let termC  = new FourierTerm(0.0, 0.2, 0.5 * magnitudeB, 2.0);

    let fourier = new FourierSeries(0.0, [termA, termB, termC]);

    const leafSurfaceStart = new ParametricSurface(leafFunc(fourier, 0.1, 10.0, leafProfileStart, 0.2), 0.0, 2.0 * Math.PI, 0.0, 0.2);
    const leafSurfaceMature = new ParametricSurface(leafFunc(fourier, 0.02, 20.0, leafProfileMature, 0.2), 0.0, 2.0 * Math.PI, 0.0, 0.2);

	const leafStemPath = new BezierCubic(
		new Vector([0.0, 0.0, 0.0]),
		new Vector([0.002, 0.0, 0.0]),
		new Vector([0.003, 0.0, 0.0]),
		new Vector([0.005, 0.0, 0.0])
	);

    const leafStemSurfaceStart = new ParametricSurface(leafStemFunc(leafStemPath), 0.0, 1.0, 0.0, 2.0 * Math.PI);
    const leafStemSurfaceMature = new ParametricSurface(leafStemFunc(leafStemPath), 0.0, 1.0, 0.0, 2.0 * Math.PI);

	const leafGeometryMature = new ParametricGeometry(leafSurfaceMature, 64, 4, false, true, true, textureMapping);
	const leafGeometryStart = new ParametricGeometry(leafSurfaceStart, 64, 4, false, false, true);

	const leafStemGeometryMature = new ParametricGeometry(leafStemSurfaceMature, 8, 8, false, true, true, textureMapping);
	const leafStemGeometryStart = new ParametricGeometry(leafStemSurfaceStart, 8, 8, false, false, true);

	leafStemGeometryMature.addMorphTarget('Start', leafStemGeometryStart.vertices, leafStemGeometryStart.normals);

	let morphTargets = leafGeometryStart.vertices;

	leafGeometryMature.addMorphTarget('Start', leafGeometryStart.vertices, leafGeometryStart.normals);

	leafGeometryMature.addGeometry(leafStemGeometryMature);
	
	return leafGeometryMature;
}