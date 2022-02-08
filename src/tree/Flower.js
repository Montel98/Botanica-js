import Vector, { zeroVector2D, upVector, add, cross } from './Vector.js';
import Mesh from './Mesh.js';
import Material from './Material.js';
import InstancedMesh from './InstancedMesh.js';
import ParametricGeometry from './ParametricGeometry.js';
import ParametricSurface from './ParametricSurface.js';
import { FourierTerm, FourierSeries } from './FourierSeries.js';
import BezierCubic from './BezierCubic.js';
import { identityMatrix, multiply, rotate4Z, scale } from './Matrix.js';
import ShaderBuilder from './ShaderBuilder.js';
import * as TextureBuilder from './TextureBuilder.js';
import Entity from './Entity.js';

const flowerVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute mat4 offset;

attribute vec3 aStartVertexPosition;
attribute vec3 aStartNormal;

attribute vec3 aMidVertexPosition;
attribute vec3 aMidNormal;
//attribute vec3 aColour;

attribute vec2 aTexCoord;

attribute float aAge;

//uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

varying vec3 vVertexPosition;
varying vec3 vNormal;
//varying vec3 vColour;

varying vec2 vTexCoord;

//uniform float age;

void main() {

	float threshold = 0.5;
	float factor = 1.0 / threshold;

	vec3 v1 = ((1.0 - factor * aAge) * aStartVertexPosition) + factor * aAge * aMidVertexPosition;
	vec3 v2 = ((1.0 - factor * (aAge - threshold)) * aMidVertexPosition) + (factor * (aAge - threshold) * aVertexPosition); 

	vec3 currentPos = mix(v1, v2, step(threshold, aAge));

	vec3 n1 = ((1.0 - factor * aAge) * aStartNormal) + factor * aAge * aMidNormal;
	vec3 n2 = ((1.0 - factor * (aAge - threshold)) * aMidNormal) + (factor * (aAge - threshold) * aNormal); 

	vec3 currentNormal = mix(n1, n2, step(threshold, aAge));

	gl_Position = perspective * camera * offset * vec4(currentPos, 1.0);

	vVertexPosition = currentPos;
	vNormal = currentNormal;
	//vColour = aColour;
	vTexCoord = aTexCoord;
}
`

const flowerFragmentShader = 
`
precision mediump float;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec3 vColour;

varying vec2 vTexCoord;

uniform float age;
uniform vec3 ambientColour;
uniform vec3 eye;

uniform sampler2D uTexture;

void main() {

	vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);
	vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

	float ambient = 0.2;
	float diffuse = 0.6 * clamp(dot(norm, lightDir), 0.0, 1.0);

	vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
	vec3 viewDirection = normalize(vVertexPosition - eye);

	float specular = 0.6 * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 4.0);
	float light = ambient + diffuse + specular;

	vec3 textureColour = texture2D(uTexture, vTexCoord).rgb;

	//gl_FragColor = vec4(light * vColour, 1.0); 
	gl_FragColor = vec4(light * textureColour, 1.0);
}
`

// 0.3 + 0.5a + 0.2b

//var termA = new FourierTerm(0.0, 0.6, 2.5, 2.0);
//var termB = new FourierTerm(0.0, 0.3, 4.5, 2.0);

const termA = new FourierTerm(0.0, 0.6, 2.5, 2.0);
const termB = new FourierTerm(0.0, 0.4, 2.5, 2.0);

//var termA = new FourierTerm(0.0, 0.5, 1.5, 2.0);
//var termB = new FourierTerm(0.0, 0.4, 3.0, 2.0);

//var termA = new FourierTerm(0.0, 0.6, 4.5, 2.0);
//var termB = new FourierTerm(0.0, 0.3, 8.0, 2.0);

const termBud = new FourierTerm(0.0, 0.85, 2.0, 2.0);
const termBud2 = new FourierTerm(0.0, 0.05, 2.0, 200.0);

//var f = new FourierSeries(0.0, [termA, termB]);
const f = new FourierSeries(0.4, [termA, termB]);
const f2 = new FourierSeries(1.0, []); // Bud Closed
const f3 = new FourierSeries(0.1, [termBud, termBud2]); // Bud Mid

const openPos = new BezierCubic(new Vector([0.0, 0.0]), 
								new Vector([1.0, 1.0]), 
								new Vector([1.0, 0.0]), 
								new Vector([2.0, 0.0]));

const openPos2 = new BezierCubic(new Vector([0.0, 0.0]), 
								new Vector([1.0, 1.0]), 
								new Vector([1.0, 1.0]), 
								new Vector([0.0, 2.0]));

const flowerOpen = new BezierCubic(new Vector([0.0, 0.0]), 
								new Vector([0.5, 1.0]), 
								new Vector([1.5, 1.0]), 
								new Vector([2.0, 0.5]));

const budClosed = new BezierCubic(new Vector([0.0, 0.0]),
								new Vector([1.0, 1.0]),
								new Vector([0.0, 1.0]),
								new Vector([0.0, 2.0]));

const flowerClosed = new BezierCubic(new Vector([0.0, 0.0]),
								new Vector([0.5, 1.0]),
								new Vector([0.0, 1.0]),
								new Vector([0.0, 1.8]));

/*const budHalfOpened = new BezierCubic(new Vector([0.0, 0.0]),
									new Vector([0.0, 0.5]),
									new Vector([0.25, 1.25]),
									new Vector([0.75, 1.75]));*/

const budHalfOpened = new BezierCubic(new Vector([0.0, 0.0]),
									new Vector([0.75, 0.5]),
									new Vector([0.25, 1.25]),
									new Vector([0.75, 1.75]));

/*const budOpened = new BezierCubic(new Vector([0.0, 0.0]),
									new Vector([0.5, 0.5]),
									new Vector([1.0, 0.5]),
									new Vector([1.5, 0.0]));*/

const budOpened = new BezierCubic(new Vector([0.0, 0.0]),
									new Vector([0.5, 0.5]),
									new Vector([0.75, 0.25]),
									new Vector([1.0, 0.0]));

const flowerStemPath = new BezierCubic(new Vector([0.0, 0.0, 0.0]),
									new Vector([0.9, 0.0, 0.3]),
									new Vector([1.2, 0.0, 0.9]),
									new Vector([1.6, 0.0, 1.8]));

const flowerFunc = (dTheta, petalSideProfile, petalTopProfile) => {
	return {
		aux(u, v) {

			let theta = u + dTheta;
			this.r = v * petalTopProfile.sum(theta);
			this.profile = petalSideProfile.eval(this.r);
			let pos = new Vector([this.r * Math.cos(u), this.r * Math.sin(u)]);

			//console.log(this.profile.components);

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

const flowerStemFunc = (path) => {
	return {

		radius: 0.1,

		crossSection(gradient, v) {

			let right = cross(upVector.copy(), gradient).normalize();
			let up = cross(gradient, right).normalize();

			return add(right.scale(Math.cos(v)), up.scale(Math.sin(v))).scale(this.radius);
		},

		aux(u, v) {

			this.radius = 0.1 - 0.07 * u
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

export default class Flowers extends Entity {

	static maxAge = 1.0;

	constructor(genome) {

		super();

		const flowerSurface = new ParametricSurface(flowerFunc(0, flowerOpen, f), 0.0, 2.0 * Math.PI, 0.0, 1.0);
		//const flowerTexture = TextureBuilder.generateFlowerTexture(flowerSurface, 512, 512);
		const flowerTexture = TextureBuilder.generateFlowerTexture(this.getFlowerColourInfo(), 512, 512);
		const material = new Material(flowerTexture);
		material.maps['textureMap'] = flowerTexture;

		this.ages = [];

		const geometry = this.generateGeometry(genome);

		this.mesh = new InstancedMesh(material, geometry, 0);
		this.mesh.setInstanceBufferSize(80000);

		this.mesh.addInstanceBufferAttribute('aAge',
											1,
											this.mesh.instanceBufferAttributes.bufferLength,
											this.ages
											);

		this.mesh.setShaderProgram('Default', ShaderBuilder.customShader('flower_shader',
														flowerVertexShader,
														flowerFragmentShader,
														{},
														[]));

		this.worldMatrix = identityMatrix;

		this.defaultShader = this.mesh.shaderPrograms['Default'];

		//this.age = 0.0;
		this.growthRate = 0.1;
		this.colour = new Vector([0.2, 0.5, 0.0]);
		this.defaultShader.uniforms['ambientColour'] = this.colour;

		// Experiment

		this.flowers = [];
		this.removalList = [];
	}

	act(worldTime) {

		//this.grow(worldTime);
		this.updateFlowers(worldTime);
		this.defaultShader.uniforms['ambientColour'] = this.colour;
		//this.defaultShader.uniforms['age'].components[0] = this.age;

		this.removeDeadFlowers();
	}

	getFlowerColourInfo() {
		//const randomIndex = Math.floor(Object.keys(FlowerColours).length * Math.random());
		const randomIndex = 0;

		return FlowerColours[randomIndex];
	}

	generateFlowerStemGeometry() {

		const stemSurface = new ParametricSurface(flowerStemFunc(flowerStemPath), 0.0, 1.0, 0.0, 2.0 * Math.PI);
		const stemGeometry = new ParametricGeometry(stemSurface, 8, 8, false, true, true);

		stemGeometry.addMorphTarget('Start', stemGeometry.vertices, stemGeometry.normals);
		stemGeometry.addMorphTarget('Mid', stemGeometry.vertices, stemGeometry.normals);

		return stemGeometry;
	}

	generateBudGeometry() {
	}

	generateGeometry(genome) {

		let shapeAllele = genome.getGenotype('Flower Shape').left.allele;

		console.log('FLOWER ALLELE: ', genome.getGenotype('Flower Shape'));

		let gene = genome.getGene('Flower Shape');

		let halfGeneLength = 0.5 * (gene.sequenceEnd - gene.sequenceStart + 1);

        let magnitudeA = shapeAllele.geneticCode & (2**halfGeneLength - 1);
        let magnitudeB = (shapeAllele.geneticCode & ((2**halfGeneLength - 1) << halfGeneLength)) >> halfGeneLength;

        console.log('Mag A:', magnitudeA, 'Mag B:', magnitudeB);

        let mainTerm = new FourierTerm(0.0, 0.6, 0.5 * magnitudeA, 2.0);
        let outerTerm = new FourierTerm(0.0, 0.4, 0.5 * magnitudeB, 2.0);

        let flowerFourier = new FourierSeries(0.4, [mainTerm, outerTerm]);

		const stemGeometry = this.generateFlowerStemGeometry();

		const budSurfaceStart = new ParametricSurface(flowerFunc(0, budClosed, f2), 0.0, 2.0 * Math.PI, 0.0, 1.0);
		const budSurfaceMid = new ParametricSurface(flowerFunc(0, budHalfOpened, f3), 0.0, 2.0 * Math.PI, 0.0, 1.0);
		const budSurfaceEnd = new ParametricSurface(flowerFunc(0, budOpened, f3), 0.0, 2.0 * Math.PI, 0.0, 1.0);

		const budGeometryStart = new ParametricGeometry(budSurfaceStart, 256, 8, true, true, true);
		const budGeometryMid = new ParametricGeometry(budSurfaceMid, 256, 8, true, true, true);
		const budGeometryEnd = new ParametricGeometry(budSurfaceEnd, 256, 8, true, true, true);

		budGeometryStart.translate(...flowerStemPath.p3.components);
		budGeometryMid.translate(...flowerStemPath.p3.components);
		budGeometryEnd.translate(...flowerStemPath.p3.components);

		budGeometryEnd.addMorphTarget('Start', budGeometryStart.vertices, budGeometryStart.normals);
		budGeometryEnd.addMorphTarget('Mid', budGeometryMid.vertices, budGeometryMid.normals);

		let budColours = [];
		let budColour = new Vector([0.2, 0.5, 0.0]);

		const flowerSurfaceStart = new ParametricSurface(flowerFunc(0, flowerClosed, /*f*/flowerFourier), 0.0, 2.0 * Math.PI, 0.0, 1.0);
		const flowerSurfaceMid = new ParametricSurface(flowerFunc(0, flowerClosed, /*f*/flowerFourier), 0.0, 2.0 * Math.PI, 0.0, 1.0);
		const flowerSurfaceEnd = new ParametricSurface(flowerFunc(0, flowerOpen, /*f*/flowerFourier), 0.0, 2.0 * Math.PI, 0.0, 1.0);

		const flowerGeometryStart = new ParametricGeometry(flowerSurfaceStart, 256, 8, false, true, true);
		const flowerGeometryMid = new ParametricGeometry(flowerSurfaceMid, 256, 8, false, true, true);
		const flowerGeometryEnd = new ParametricGeometry(flowerSurfaceEnd, 256, 8, false, true, true);

		flowerGeometryStart.translate(...flowerStemPath.p3.components);
		flowerGeometryMid.translate(...flowerStemPath.p3.components);
		flowerGeometryEnd.translate(...flowerStemPath.p3.components);

		flowerGeometryEnd.addMorphTarget('Start', flowerGeometryStart.vertices, flowerGeometryStart.normals);
		flowerGeometryEnd.addMorphTarget('Mid', flowerGeometryMid.vertices, flowerGeometryMid.normals);

		let flowerColours = [];
		//let flowerColour = new Vector([Math.random(), Math.random(), Math.random()]);
		let flowerColour = new Vector([1.0, 1.0, 1.0]);

		budGeometryEnd.addGeometry(flowerGeometryEnd);
		budGeometryEnd.addGeometry(stemGeometry);

		return budGeometryEnd;
	}

	addFlower(pose, zAngle, parentStem) {

		// Experimental

		let newFlower = new Flower(pose, zAngle, parentStem);
		this.ages.push(newFlower.age);

		this.mesh.addInstance(pose, {'aAge': newFlower.age});
		this.flowers.push(newFlower);

		return newFlower;
	}

	updateFlowers(worldTime) {

		for (let flowerIndex = 0; flowerIndex < this.flowers.length; flowerIndex++) {

			let flower = this.flowers[flowerIndex];

			if (flower.isDestroyed) {

			}

			flower.grow(worldTime);

			this.mesh.localMatrices[flowerIndex] = flower.getCurrentPose();
			this.ages[flowerIndex] = flower.age;

			if (flower.isDestroyed) {
				
				this.remove(flowerIndex);
			}
		}
	}

	remove(flowerIndex) {
		this.removalList.push(flowerIndex);
	}

	removeDeadFlowers() {

		while (this.removalList.length > 0) {

			let flowerIndex = this.removalList.pop();
			this.mesh.removeInstance(flowerIndex);

			this.flowers.splice(flowerIndex, 1);
		}
	}
}

class Flower {

	static startRad = 0.001;
	static maxAge = 1.0;
	static growthRate = 0.5;

	constructor(poseMatrix, zAngle, parentStem) {
		let stem = parentStem.stem;
		//let radius = Leaf.startRad + (stem.postStemGeometry.surface.functions.r(1.0) - Leaf.startRad) * stem.tree.age;

		this.age = new Vector([0.0]);
		this.parentStem = parentStem;
		this.isDestroyed = false;
		this.isDying = false;

		this.poseMatrix = multiply(poseMatrix, multiply(scale(0.012, 0.012, 0.012), rotate4Z(/*Math.random() * Math.PI * 2.0*/zAngle)));
	}

	grow(worldTime) {

		let newAge = this.age.components[0] + worldTime.dt * Flower.growthRate;

		if (newAge >= Flower.maxAge) {
			newAge = Flower.maxAge;
		}

		this.age.components[0] = newAge;
	}

	getCurrentPose() {
		return this.poseMatrix;
	}

	purge() {
		this.isDestroyed = true;
	}

	setAge(newAge) {
		this.age.components[0] = newAge > Flower.maxAge ? Flower.maxAge : newAge;
	}
}

function FlowerColour(hueA, hueB, hueC, thresholdA, thresholdB) {

	return {
		colourA: hueA,
		colourB: hueB,
		colourC: hueC,
		innerThreshold: thresholdA,
		outerThreshold: thresholdB
	}
}

const FlowerColours = {
	'0': FlowerColour(new Vector([255, 204, 0]), new Vector([102, 0, 51]), new Vector([255, 255, 255]), 0.2, 1.0),
	'1': FlowerColour(new Vector([255, 204, 0]), new Vector([75, 0, 130]), new Vector([123, 104, 238]), 0.2, 1.0),
	'2': FlowerColour(new Vector([255, 204, 0]), new Vector([250, 196, 180]), new Vector([250, 249, 222]), 0.2, 1.0),
}