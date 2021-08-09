class Controller {
	constructor(scene, renderer) {
		this.scene = scene;
		this.renderer = renderer;
	}

	updateStates() {
		this.renderer.clear();
		
		for (let entity of this.scene.entities) {
			entity.act();
			this.renderer.render(entity, this.scene.camera);
		}
	}
}