class Entity {
	constructor() {
		this.parent = null;
		this.children = [];
		this.worldMatrix = identityMatrix;
	}

	getChildren() {
		return this.children;
	}

	addChild(childEntity) {
		this.children.push(childEntity);
		childEntity.parent = this;
	}
}