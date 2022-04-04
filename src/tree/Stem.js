import Vector from './Vector.js';
import { mergeGeometry } from './Geometry.js';
import * as TextureBuilder from './TextureBuilder.js';
import Material from './Material.js';
import Mesh from './Mesh.js';
import { add } from './Vector.js';
import { identityMatrix } from './Matrix.js';
import ShaderBuilder, { ShaderAttribute } from './ShaderBuilder.js';
import BezierCubic from './BezierCubic.js';
import Entity from './Entity.js';
//import { trunkCrossSection, crossSection, stemFunc } from './StemBuilder.js';

import stemVertexShader from './Shaders/StemVertex.glsl';
import stemFragmentShader from './Shaders/StemFragment.glsl';

export default class Stem extends Entity {

	static terminalLength = 1.0;
	static stemCount = 0;
	static growthRate = 2.0 / 3;
	static stemMaterial = null;

	constructor(genome, matureGeometry, immatureGeometry, branch) {

		super();

		this.worldMatrix = identityMatrix;

		this.colour = new Vector([0.25, 0.18, 0.12]);

		this.tree = null;
		this.branch = branch;

		this.stringLoc = 0; // Corresponding location in L-String this stem corresponds to

		this.stemLength = 0.0;
		this.growthRate = 2.0 / 3; // Growth Rate in units/second

		// Merge stem tip and body
		this.geometryParts = {
			matureGeometry: matureGeometry,
			immatureGeometry: immatureGeometry
		};

		const geometry = this.initStemGeometry(matureGeometry, immatureGeometry);

		this.postStemGeometry = matureGeometry.endBodyGeometry;
		let postGirthMorphTargets = geometry.getBufferAttribute('aMatureStartVertexPosition').bufferData.slice(
			0, matureGeometry.startBodyGeometry.vertices.length
		);

		this.postStemGeometry.addMorphTarget('MatureStart', postGirthMorphTargets);

		this.material = this.getMaterial(genome);

		this.mesh = new Mesh(this.material, geometry); // Set main geometry as the final form

		this.mesh.setShaderProgram('Default', ShaderBuilder.customShader(
			'meristem_shader', 
			stemVertexShader, 
			stemFragmentShader, {'du': new Vector([0.0]), 'age': new Vector([0.0])},
			[]
			)
		);

		this.defaultShader = this.mesh.shaderPrograms['Default'];

		this.defaultShader.uniforms['ambientColour'] = this.colour;

		// Experimental
		this.isReached = false;
		this.isTerminal = false;

		this.flowers = [];
		this.leaves = [];

		this.setBufferProperties(geometry);

		Stem.stemCount++;
	}

	act(worldTime) {

		this.grow(worldTime);

		this.defaultShader.uniforms['ambientColour'] = this.tree.currentColour;
		this.defaultShader.uniforms['du'].components[0] = this.stemLength;
		this.defaultShader.uniforms['age'].components[0] = this.branch.age;
	}

	grow(worldTime) {

		let newLength = this.stemLength + this.growthRate * worldTime.dt;

		if (newLength >= Stem.terminalLength) {
			newLength = Stem.terminalLength;
		}

		this.stemLength = newLength;
	}

	isMaxHeight() {

		return this.stemLength == Stem.terminalLength;
	}

	hasFlowers() {

		return this.flowers.length > 0;
	}

	hasLeaves() {
		
		return this.leaves.length > 0;
	}

	addFlowers(flowerIndices) {

		this.flowers.push(...flowerIndices);
	}

	addLeaves(leafIndices) {

		this.leaves.push(...leafIndices);
	}

	// Makes all leaves on stem go through 'death' process
	killLeaves(deathRate=0.15) {

		for (let leafIndex = 0; leafIndex < this.leaves.length; leafIndex++) {

			let leaf = this.leaves[leafIndex];
			leaf.kill(deathRate);
		}
	}

	removeLeaves() {

		this.leaves = [];
	}


	// Instantly Removes all leaves on stem without going through 'death' process
	purgeLeaves() {

		for (let leafIndex = 0; leafIndex < this.leaves.length; leafIndex++) {

			let leaf = this.leaves[leafIndex];
			leaf.purge();
		}

		this.removeLeaves();
	}

	// Makes all flowers on stem go through 'death' process
	removeFlowers() {

		for (let flowerIndex = 0; flowerIndex < this.flowers.length; flowerIndex++) {

			let flower = this.flowers[flowerIndex];
			flower.kill();
		}

		this.flowers = [];
	}

	// Instantly Removes all flowers on stem without going through 'death' process
	purgeFlowers() {

		for (let flowerIndex = 0; flowerIndex < this.flowers.length; flowerIndex++) {

			let flower = this.flowers[flowerIndex];
			flower.purge();
		}

		this.flowers = [];
	}

	setStemLength(newLength) {

		this.stemLength = newLength > Stem.terminalLength ? Stem.terminalLength : newLength;
	}

	getMaterial(genome) {

		if (Stem.stemMaterial) {
			return Stem.stemMaterial;
		}

		const woodTypeAllele = genome.getGenotype('Wood Type').left.allele;

		let reflectivity = 0.0;

		let stemTexture = undefined;

		switch (/*woodTypeAllele.name*/'Dark Wood'/*'Gold'*//*'Silver'*//*'Rose Gold'*/) {

			case 'Birch':
				stemTexture = TextureBuilder.generateBirchTexture(1024, 1024);
				break;
			case 'Light Wood':
				stemTexture = TextureBuilder.generateGradientWoodTexture(
					new Vector([48, 45, 41]), 
					new Vector([112, 97, 80]), 32, 32
				);
				break;
			case'Dark Wood':
				stemTexture = TextureBuilder.generateGradientWoodTexture(
					new Vector([26, 21, 20]),
					new Vector([54, 51, 50]), 32, 32);
				break;
			case'Silver':
				stemTexture = TextureBuilder.generateMonochromeTexture(new Vector([0.75, 0.75, 0.75]), 32, 32);
				reflectivity = 0.3;
				break;
			case 'Gold':
				stemTexture = TextureBuilder.generateMonochromeTexture(new Vector([0.83, 0.68, 0.21]), 32, 32)
				reflectivity = 0.3;
				break;
			default:
				stemTexture = TextureBuilder.generateMonochromeTexture(new Vector([0.87, 0.75, 0.72]), 32, 32);
				reflectivity = 0.3;
		}

		const stemMaterial = new Material(stemTexture);

		stemMaterial.maps['textureMap'] = stemTexture;

		stemMaterial.setPhongComponents(0.3, 0.6, 0.4);
		stemMaterial.setReflectivity(reflectivity);

		Stem.stemMaterial = stemMaterial;

		return stemMaterial;
	}

	// Builds the final stem geometry from the given parts
	// Merges the tip and body, and adds all morph targets
	initStemGeometry(matureGeometry, immatureGeometry) {

		let endGeometry = mergeGeometry([matureGeometry.endBodyGeometry, matureGeometry.endTipGeometry]);
		let startGeometry = mergeGeometry([matureGeometry.startBodyGeometry, matureGeometry.startTipGeometry]);

		let morphTargets = [];
		let girthMorphTargets = startGeometry.vertices;
		let girthMorphTargets2 = [];

		let endBodyGeometrySteps = matureGeometry.endBodyGeometry.uSteps;

		for (let i = 0; i < matureGeometry.endBodyGeometry.vertices.length; i++) {

			morphTargets.push(endGeometry.vertices[(endBodyGeometrySteps * (Math.floor(i / endBodyGeometrySteps)))]);
			girthMorphTargets2.push(startGeometry.vertices[(endBodyGeometrySteps * (Math.floor(i / endBodyGeometrySteps)))]);
		}

		for (let i = matureGeometry.endBodyGeometry.vertices.length; i < endGeometry.vertices.length; i++) {

			let j = i - matureGeometry.endBodyGeometry.vertices.length;

			morphTargets.push(immatureGeometry.endTipGeometry.vertices[j]);
			girthMorphTargets2.push(immatureGeometry.startTipGeometry.vertices[j]);
		}

		endGeometry.addMorphTarget('End', morphTargets);
		endGeometry.addMorphTarget('MatureStart', girthMorphTargets);
		endGeometry.addMorphTarget('Start', girthMorphTargets2);

		return endGeometry;
	}

	setBufferProperties(geometry) {

		if (Stem.stemCount >= 305) {
			geometry.useBufferByName('stemBuffer2');
		}
		else {
			geometry.useBufferByName('stemBuffer1');
		}

		geometry.setVertexBufferSize(6528*305);
		geometry.setIndexBufferSize(1323*305);
	}
}