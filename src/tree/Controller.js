class Controller {
	constructor(scene, renderer) {
		this.scene = scene;
		this.renderer = renderer;
	}

	// Breadth-first search of scene graph to update and render entities

	updateStates(worldTime) {
		this.renderer.clear();

		worldTime.updateTime();

		let stack = [...this.scene.entities];
		var entity;

		while (stack.length != 0) {
			
			entity = stack.pop();
			//console.log('entity:', entity);
			stack.push(...entity.getChildren());

			entity.act(worldTime);
			entity.updatePose();
			this.renderer.render(entity, this.scene.camera);
		}
	}
}