import Vector from './Vector.js';

export default class Scene {
	constructor(camera) {

		this.camera = camera;
		this.entities = [] 

		this.lightDirection = new Vector([0.0, 0.0, 1.0]);
	}

	addEntity(entity) {
		this.entities.push(entity);
	}

	removeEntity(entity) {

		for (let i = 0; i < this.entities.length; i++) {

			if (entity == this.entities[i]) {

				this.entities.splice(i, 1);
			}
		}
	}

	setBackground(cubeMap) {
		this.background = cubeMap;
	}
}