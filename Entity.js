class Entity {
	constructor() {
		this.parent = null;
		this.children = [];
		this.localMatrix = identityMatrix;
		this.worldMatrix = this.localMatrix;
	}

	getChildren() {
		return this.children;
	}

	addChild(childEntity) {
		this.children.push(childEntity);
		childEntity.parent = this;
	}

	removeChild(childEntity) {
		for (let i = 0; i < this.children.length; i++) {
			if (this.children[i] == childEntity) {
				this.children.splice(i, 1);
			}
		}
	}

	act(worldTime) {

	}

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
}