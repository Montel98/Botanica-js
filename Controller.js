class Controller {
	constructor(scene, renderer) {
		this.scene = scene;
		this.renderer = renderer;
	}

	// Breadth-first search of scene graph to update and render entities

	updateStates() {
		this.renderer.clear();

		let stack = [...this.scene.entities];
		var entity;

		while (stack.length != 0) {
			
			entity = stack.pop();
			stack.push(...entity.getChildren());

			entity.act();
			this.renderer.render(entity, this.scene.camera);
		}
	}
}