import WorldTime from './WorldTime.js';
import { identityMatrix, multiply, translate } from './Matrix.js';

export default class Entity {

	constructor() {
		this.parent = null;
		this.children = [];
		this.localMatrix = identityMatrix;
		this.worldMatrix = this.localMatrix;

		this.isHidden = false;
	}

	getChildren() {
		return this.children;
	}

	addChild(childEntity) {
		this.children.push(childEntity);
		childEntity.parent = this;
	}

	// Linear search on entity to remove
	// If no match is found, no changes are made
	removeChild(childEntity) {
		for (let i = 0; i < this.children.length; i++) {
			if (this.children[i] == childEntity) {
				
				const child = this.children[i];
				this.children.splice(i, 1);
			}
		}
	}

	// Overridable generic act() behaviour, called by controller to update entity state
	act(worldTime) {

	}

	// Sets the world matrix, multiplied by parent matrix if it exists
	// To be called by the controller before rendering, not advisable to call prematurely
	updatePose() {

		if (this.parent) {
			this.worldMatrix = multiply(this.parent.worldMatrix, this.localMatrix);

			if (this.mesh.isInstanced) {
				const noInstances = this.mesh.localMatrices.length;

				for (let i = 0; i < noInstances; i++) {

					this.mesh.worldMatrices[i] = multiply(this.parent.worldMatrix, this.mesh.localMatrices[i]);
				}
			}
		}
	}

	setPosition(x, y, z) {
		this.localMatrix = translate(x, y, z);
		this.worldMatrix = this.localMatrix;
	}

	hide() {
		this.isHidden = true;
	}

	show() {
		this.isHidden = false;
	}
}