class Entity {
	constructor() {
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