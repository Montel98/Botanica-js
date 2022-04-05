import Vector, {zeroVector, upVector, cross, add, subtract} from './Vector.js';
import Mesh from './Mesh.js';
import Material from './Material.js';
import InstancedMesh from './InstancedMesh.js';
import Matrix, {translate, multiply,  rotate4X, rotate4Y} from './Matrix.js';
import BezierCubic from './BezierCubic.js';
import ShaderBuilder, { ShaderAttribute } from './ShaderBuilder.js';
import * as TextureBuilder from './TextureBuilder.js';
import Entity from './Entity.js';
import * as LeafBuilder from './LeafBuilder.js';

import leafVertexShader from './Shaders/LeafVertex.glsl';
import leafFragmentShader from './Shaders/LeafFragment.glsl';

export default class Leaves extends Entity {

	static maxAge = 1.0;

	constructor(genome) {

		super();
		this.basePoses = [];
		this.removalList = [];

		this.startRad = 0.001;
		this.growthRate = 0.5;

		this.mesh = this.initMesh(genome);

		this.defaultShader = this.mesh.shaderPrograms['Default'];

		this.colourStart = new Vector([0.2, 0.5, 0.1]);
		this.colourEnd = new Vector([...this.getColour(genome).rgb]);

		this.shaderUniforms = this.defaultShader.uniforms;
		this.shaderUniforms['colourStart'] = this.colourStart;
		this.shaderUniforms['colourEnd'] = this.colourEnd;

		this.startTime = Date.now() / 1000;

		this.shaderUniforms['t'] = new Vector([Date.now() / 1000 - this.startTime]);

		this.leaves = [];

	}

	initMesh(genome) {

		const colourInfo = this.getColour(genome);
		const patternInfo = this.getPatternInfo(genome);
		const leafTexture = patternInfo.textureFunc(32, 32, 4);

		const material = new Material(leafTexture);
		material.maps['textureMap'] = leafTexture;
        material.setPhongComponents(0.2, 0.6, 1.5);
        material.setReflectivity(colourInfo.reflectivity);

		const geometry = LeafBuilder.generateGeometry(genome, patternInfo.mapping);
		const ages = [];
		const deathAges = [];

		const mesh = new InstancedMesh(material, geometry, 0);
		mesh.setInstanceBufferSize(80000);

		mesh.addInstanceBufferAttribute(
			'aAge', 
			1, 
			mesh.instanceBufferAttributes.bufferLength,
			ages
		);

		mesh.addInstanceBufferAttribute(
			'aDeathAge',
			1,
			mesh.instanceBufferAttributes.bufferLength,
			deathAges
		);

		mesh.setShaderProgram(
			'Default', ShaderBuilder.customShader(
			'leaf_shader', 
			leafVertexShader, 
            leafFragmentShader, 
            {},
            []
            )
		);

		return mesh;
	}

	// Adds leaves instances to instanced mesh and projects orientation to that of parent stem
	// Leaves are equally spaced and form a circle around the stem
	addLeaves(noLeaves, xAngle, poseMatrix, parentStem) {

		let leaves = [];

		for (let leafIndex = 0; leafIndex < noLeaves; leafIndex++) {

			let zAngle = (leafIndex * 2.0 * Math.PI) / noLeaves;

			let newLeaf = this.addLeaf(poseMatrix, xAngle, zAngle, parentStem);
			leaves.push(newLeaf);
		}

		return leaves;
	}

	// Removes any leaf instances marked for removal
	removeDeadLeaves() {

		while (this.removalList.length > 0) {

			let leafIndex = this.removalList.pop();
			this.mesh.removeInstance(leafIndex);

			this.leaves.splice(leafIndex, 1);
		}
	}

	act(worldTime) {
		this.updateLeaves(worldTime);
		this.removeDeadLeaves();

		this.shaderUniforms['colourStart'] = this.colourStart;
		this.shaderUniforms['colourEnd'] = this.colourEnd;
		this.shaderUniforms['t'].components[0] = (Date.now() / 1000) - this.startTime;
	}

	// Updates pose, age and death age states of all leaf instances
	updateLeaves(worldTime) {

		for (let leafIndex = 0; leafIndex < this.leaves.length; leafIndex++) {

			let leaf = this.leaves[leafIndex];

			leaf.grow(worldTime);

			if (leaf.isDying) {
				leaf.die(worldTime);
			}

			this.mesh.localMatrices[leafIndex] = leaf.getCurrentPose();
			this.mesh.getInstanceBufferAttribute('aAge').bufferData[leafIndex] = leaf.age;
			this.mesh.getInstanceBufferAttribute('aDeathAge').bufferData[leafIndex] = leaf.deathAge;

			if (leaf.isDestroyed) {
				this.remove(leafIndex);
			}
		}
	}

	// Marks a leaf instance by index for removal
	remove(leafIndex) {
		this.removalList.push(leafIndex);
		this.leaves[leafIndex].parentStem.stem.removeLeaves();
	}

	getColour(genome) {

		if (!this.colourEnd) {

			const colourAlleles = genome.getGenotype('Leaf Colour');
			const leftAllele = colourAlleles.left;
			const colourId = leftAllele.allele.geneticCode;
			const colourInfo = geneTable.colours[1]; // Murky green

			return colourInfo;
		}

		return this.colourEnd;
	}

	getPatternInfo(genome) {
		
		const patternAlleles = genome.getGenotype('Leaf Pattern');
		const leftAllele = patternAlleles.left;

		const patternId = leftAllele.allele.geneticCode;

		return geneTable.patterns[patternId];
	}

	// Adds leaf instance to instanced mesh and inserts corresponding age / death age / pose attributes
	addLeaf(poseMatrix, xAngle, zAngle, parentStem) {

		let newLeaf = new Leaf(poseMatrix, xAngle, zAngle, parentStem);
		this.mesh.addInstance(newLeaf.localPose, {'aAge': newLeaf.age, 'aDeathAge': newLeaf.deathAge});
		this.leaves.push(newLeaf);

		return newLeaf;
	}
}

class Leaf {

	static startRad = 0.001;
	static growthRate = 0.5;
	static maxAge = 1.0;

	constructor(poseMatrix, xAngle, zAngle, parentStem) {

		let stem = parentStem.stem;
		let radius = Leaf.startRad + (stem.postStemGeometry.surface.functions.r(1.0) - Leaf.startRad) * stem.branch.age;

		let x = xAngle;
		let z = zAngle;

		let basePose = new Matrix([[Math.cos(z), Math.cos(x)*Math.sin(z), Math.sin(x)*Math.sin(z), 0],
								[-Math.sin(z), Math.cos(x)*Math.cos(z), Math.cos(z)*Math.sin(x), 0],
								[0, -Math.sin(x), Math.cos(x), 0],
								[radius * Math.cos(z), radius * Math.sin(z), 0, 1]]);

		this.basePose = {'poseMatrix': poseMatrix, 'xAngle': xAngle, 'zAngle': zAngle};
		this.localPose = multiply(poseMatrix, basePose);
		this.age = new Vector([0.0]);
		this.deathAge = new Vector([0.0]);
		this.parentStem = parentStem;
		this.isDestroyed = false;
		this.isDying = false;
		this.deathRate = 0.3;
	}

	grow(worldTime) {

		let newAge = this.age.components[0] + worldTime.dt * Leaf.growthRate;

		if (newAge >= Leaf.maxAge) {
	    	newAge = Leaf.maxAge;

	    	if (this.parentStem.stackFrame.branch.level <= 2) {
	    		this.kill(0.1);
	    	}
		}

    	let stem = this.parentStem.stem;
    	let radius = Leaf.startRad + (stem.postStemGeometry.surface.functions.r(1.0) - Leaf.startRad) * stem.branch.age;
    	let growthDir = this.parentStem.stackFrame.axis.forward.scale(0.03 * stem.stemLength);

    	let x = this.basePose.xAngle;
    	let z = this.basePose.zAngle;

		let t = (Date.now() / 400) - 2.0 * x;
		let windAngle = 0.03 * Math.PI * 2.0 * ((0.5 * Math.cos(Math.PI * t / 5) * Math.cos(Math.PI * t / 5) * Math.cos(Math.PI * 3 * t / 5) * Math.cos(Math.PI * x)) + (Math.sin(Math.PI * x) * 0.1));
		let w = windAngle;

		let basePose = new Matrix([[Math.cos(w)*Math.cos(z) + Math.sin(w)*Math.sin(x)*Math.sin(z), Math.cos(x)*Math.sin(z), Math.cos(w)*Math.sin(x)*Math.sin(z) - Math.cos(z)*Math.sin(w), 0],
								[-Math.cos(w)*Math.sin(z) + Math.cos(z)*Math.sin(w)*Math.sin(x), Math.cos(x)*Math.cos(z), Math.cos(w)*Math.cos(z)*Math.sin(x) + Math.sin(w)*Math.sin(z), 0],
								[Math.cos(x)*Math.sin(w), -Math.sin(x), Math.cos(w)*Math.cos(x), 0],
								[Math.cos(w)*Math.cos(z)*radius, radius*Math.sin(z), -Math.cos(z)*radius*Math.sin(w), 1]]);

    	this.localPose = multiply(translate(...growthDir.components), multiply(this.basePose.poseMatrix, basePose));

	   	this.age.components[0] = newAge;
	}

	die(worldTime) {

		let newDeathAge = this.deathAge.components[0] + worldTime.dt * this.deathRate;

		if (newDeathAge >= Leaf.maxAge) {
			newDeathAge = Leaf.maxAge;
			this.isDestroyed = true;
		}

		this.deathAge.components[0] = newDeathAge;
	}

	getCurrentPose() {
		return this.localPose;
	}

	kill(deathRate) {
		this.isDying = true;
		this.deathRate = deathRate;
		//this.isDestroyed = true;
	}

	purge() {
		this.isDestroyed = true;
	}

	setAge(newAge) {
		this.age.components[0] = newAge > Leaf.maxAge ? Leaf.maxAge : newAge;
	}

	setDeathAge(newAge) {
		this.deathAge.components[0] = newAge > Leaf.maxAge ? Leaf.maxAge : newAge;
	}

	isMaxAge() {
		return this.age.components[0] == Leaf.maxAge;
	}
}

// Get the minimum value in a list
function min(list) {
	let currentMin = 100000;

	for (let i = 0; i < list.length; i++) {
		if (currentMin > list[i]) {
			currentMin = list[i];
		}
	}

	return currentMin;
}

// Get the maximum value in a list
function max(list) {
	let currentMax = -100000;

	for (let i = 0; i < list.length; i++) {
		if (currentMax < list[i]) {
			currentMax = list[i];
		}
	}

	return currentMax;
}

// Leaves have their own unique texture mapping
// This is due to leaf geometry being generated as a function of angle and distance
// Will not be needed when leaf geometry is refactored as a 'grid' of vertices
function leafTextureMapping(geometry) {

	const stMap = new Array(geometry.uSteps * geometry.vSteps);

	const deltaU = (geometry.surface.uMax - geometry.surface.uMin) / (geometry.uSteps - 1);
    const deltaV = (geometry.surface.vMax - geometry.surface.vMin) / (geometry.vSteps - 1);

    let u = 0;
    let v = 0;

    const xProjectedPositions = [];
    const yProjectedPositions = [];

    for (let uStep = 0; uStep < geometry.uSteps; uStep++) {

    	let lastVertex = zeroVector.copy();
    	let currentLength = 0;

    	u = geometry.surface.uMin + (uStep * deltaU);

    	for (let vStep = 0; vStep < geometry.vSteps; vStep++) {

    		v = geometry.surface.vMin + (vStep * deltaV);

    		let vertex = geometry.surface.eval(u, v);

    		currentLength = currentLength + subtract(vertex, lastVertex).magnitude();

    		let xProjected = currentLength * Math.cos(u);
    		let yProjected = currentLength * Math.sin(u);

    		xProjectedPositions.push(xProjected);
    		yProjectedPositions.push(yProjected);

    		lastVertex = vertex;

    		stMap[(geometry.uSteps * vStep) + uStep] = new Vector([xProjected, yProjected]);
    	}
    }

    let xMin = min(xProjectedPositions);
    let xMax = max(xProjectedPositions);

    let yMin = min(yProjectedPositions);
    let yMax = max(yProjectedPositions);

    for (let i = 0; i < stMap.length; i++) {

    	let texturePoint = stMap[i];

    	texturePoint.components[0] = (texturePoint.components[0] - xMin) / (xMax - xMin);
    	texturePoint.components[1] = (texturePoint.components[1] - yMin) / (yMax - yMin);

    }

    return stMap;
}

const geneTable = {

	colours: {
		'0': {rgb: [0.0, 0.0, 0.4], reflectivity: 0.0}, // Midnight blue
		'1': {rgb: /*[0.6, 0.6, 0.4]*/[0.15, 0.15, 0.06], reflectivity: 0.0}, // Murky Green
		'2': {rgb: [0.8, 0.0, 0.6], reflectivity: 0.0}, // Fuschia
		'3': {rgb: [1.0, 0.4, 0.0], reflectivity: 0.0}, // Orange
		'4': {rgb: /*[1.0, 0.8, 1.0]*/[0.8, 0.3, 0.8], reflectivity: 0.0}, // Blossom
		'5': {rgb: [1.0, 1.0, 1.0], reflectivity: 0.0}, // White
		'6': {rgb: [0.8, 0.0, 0.0], reflectivity: 0.0}, // Fiery Red
		'7': {rgb: [0.0, 0.4, 0.15], reflectivity: 0.0}, // Verdant Green
		'8': {rgb: /*[0.1, 1.0, 0.8]*/[0.01, 0.8, 0.61], reflectivity:  0.0}, // Aqua Green
		'9': {rgb: [0.8, 0.6, 0.0], reflectivity: 0.0}, // Mustard Brown
		'10': {rgb: [0.75, 0.75, 0.75], reflectivity: 0.3}, // Silver
		'11': {rgb: [/*0.83, 0.68, 0.21*//*0.66*/0.83, 0.42, 0.03], reflectivity: 0.5}, // Gold
		'12': {rgb: [1.0, 0.85, 0.72], reflectivity: 0.0}, // Peach
		'13': {rgb: [0.6, 0.6, 0.6], reflectivity: 0.0}, // Grey
		'14': {rgb: /*[0.8, 1.0, 0.2]*/[0.6, 0.8, 0.03], reflectivity: 0.0}, // Lime Yellow
		'15': {rgb: [1.0, 1.0, 0.6], reflectivity: 0.0}, // Trippy
		'16': {rgb: [1.0, 1.0, 0.6], reflectivity: 0.0}, // Hypnosis
		'17': {rgb: [/*0.87, 0.75, 0.72*/0.73, 0.53, 0.48], reflectivity: 0.3}, // Rose Gold
	},

	patterns: {
		'0': {textureFunc: TextureBuilder.generateRadialLeafTexture, mapping: null},
		'1': {textureFunc: TextureBuilder.generateRadialLeafTexture, mapping: null},
		'2': {textureFunc: TextureBuilder.generateRadialLeafTexture, mapping: null},
		'3': {textureFunc: TextureBuilder.generateRadialLeafTexture, mapping: null}
	}
}