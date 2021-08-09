class Scene {
	constructor(camera) {

		this.camera = camera;
		this.entities = []
	}

	addEntity(entity) {
		this.entities.push(entity);
	}
}