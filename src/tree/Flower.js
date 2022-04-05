import Vector, { zeroVector2D, upVector, add, cross } from './Vector.js';
import Mesh from './Mesh.js';
import Material from './Material.js';
import InstancedMesh from './InstancedMesh.js';
import { FourierTerm, FourierSeries } from './FourierSeries.js';
import BezierCubic from './BezierCubic.js';
import { identityMatrix, transform, multiply, rotate3Z, rotate4Z, scale } from './Matrix.js';
import ShaderBuilder from './ShaderBuilder.js';
import * as TextureBuilder from './TextureBuilder.js';
import Entity from './Entity.js';
import { generateFlowerGeometry } from './FlowerBuilder.js';

import flowerVertexShader from './Shaders/FlowerVertex.glsl';
import flowerFragmentShader from './Shaders/FlowerFragment.glsl';

export default class Flowers extends Entity {

	static maxAge = 1.0;

	constructor(genome) {

		super();

		const flowerTexture = TextureBuilder.generateFlowerTexture(this.getFlowerColourInfo(), 128, 128);
		const material = new Material(flowerTexture);
		material.maps['textureMap'] = flowerTexture;

		this.ages = [];

		const geometry = generateFlowerGeometry(genome);

		this.mesh = new InstancedMesh(material, geometry, 0);
		this.mesh.setInstanceBufferSize(80000);

		this.mesh.addInstanceBufferAttribute(
			'aAge',
			1,
			this.mesh.instanceBufferAttributes.bufferLength,
			this.ages
		);

		this.mesh.setShaderProgram('Default', ShaderBuilder.customShader(
			'flower_shader',
			flowerVertexShader,
			flowerFragmentShader,
			{},
			[])
		);

		this.worldMatrix = identityMatrix;

		this.defaultShader = this.mesh.shaderPrograms['Default'];

		this.growthRate = 0.1;
		this.colour = new Vector([0.2, 0.5, 0.0]);
		this.defaultShader.uniforms['ambientColour'] = this.colour;

		this.flowers = [];
		this.removalList = [];
	}

	act(worldTime) {

		this.updateFlowers(worldTime);
		this.defaultShader.uniforms['ambientColour'] = this.colour;
		this.removeDeadFlowers();
	}

	getFlowerColourInfo() {
		//const randomIndex = Math.floor(Object.keys(FlowerColours).length * Math.random());
		const randomIndex = 0;
		return FlowerColours[randomIndex];
	}

	// Adds flower instance to instanced mesh and inserts corresponding age/pose attributes
	addFlower(pose, zAngle, parentStem) {

		let newFlower = new Flower(pose, zAngle, parentStem);
		this.ages.push(newFlower.age);

		this.mesh.addInstance(pose, {'aAge': newFlower.age});
		this.flowers.push(newFlower);

		return newFlower;
	}

	// Updates pose and age states of all flower instances
	updateFlowers(worldTime) {

		for (let flowerIndex = 0; flowerIndex < this.flowers.length; flowerIndex++) {

			let flower = this.flowers[flowerIndex];

			flower.grow(worldTime);

			this.mesh.localMatrices[flowerIndex] = flower.getCurrentPose();
			this.ages[flowerIndex] = flower.age;

			if (flower.isDestroyed) {
				this.remove(flowerIndex);
			}
		}
	}

	// Marks a flower instance by index for removal
	remove(flowerIndex) {
		this.removalList.push(flowerIndex);
	}

	// Removes any flower instances marked for removal
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
	//static growthRate = 0.1;

	constructor(poseMatrix, zAngle, parentStem) {
		let stem = parentStem.stem;

		this.age = new Vector([0.0]);
		this.parentStem = parentStem;
		this.isDestroyed = false;
		this.isDying = false;

		this.poseMatrix = multiply(poseMatrix, multiply(scale(0.012, 0.012, 0.012), rotate4Z(zAngle)));
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

function FlowerColour(hueA, hueB, hueC, antherHue, threshold) {

	return {
		colourA: hueA,
		colourB: hueB,
		colourC: hueC,
		innerThreshold: threshold,
		antherColour: antherHue
	}
}

// Possible flower colour combinations
// Colour components are in the range [0, 255]
const FlowerColours = {
	'0': FlowerColour(new Vector([255, 204, 0]), new Vector([102, 0, 51]), new Vector([255, 255, 255]), new Vector([204, 153, 0]), 0.25),
	'1': FlowerColour(new Vector([255, 204, 0]), new Vector([75, 0, 130]), new Vector([123, 104, 238]), new Vector([204, 153, 0]), 0.25),
	'2': FlowerColour(new Vector([255, 204, 0]), new Vector([250, 196, 180]), new Vector([250, 249, 222]), new Vector([204, 153, 0]), 0.25),
	'3': FlowerColour(new Vector([255, 80, 20]), new Vector([255, 166, 0]), new Vector([240, 216, 41]), new Vector([184, 80, 40]), 0.25)
}