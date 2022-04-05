import SegmentSelector from './SegmentSelector.js';
import { add, cross } from './Vector.js';
import { transform } from './Matrix.js';
import { radiusProperties } from './StemBuilder.js';
import BezierCubic from './BezierCubic.js';
import Vector, { upVector } from './Vector.js';
import { testIntersections } from './Intersection.js';

export default class Controller {

	constructor(scene, renderer) {
		this.scene = scene;
		this.renderer = renderer;

		this.mouseX = -1;
		this.mouseY = -1;
		this.segment = null;

		this.pixelColour = new Uint8Array(4);

		if (scene.background) {
			this.renderer.initEnvironmentMap(scene.background);
		}
	}

	initSegmentSelector(tree) {
		this.segmentSelector = new SegmentSelector(tree);
		this.segmentSelector.setPosition(0.0, 0.0, 0.28);
		this.scene.addEntity(this.segmentSelector);
	}

	// Breadth-first search of scene graph to update and render entities
	updateStates(worldTime) {
		this.renderer.clear();

		worldTime.updateTime();

		let stack = [...this.scene.entities];
		let entity = undefined;
		let visibleEntities = [];

		while (stack.length != 0) {
			
			entity = stack.pop();
			stack.push(...entity.getChildren());

			entity.act(worldTime);
			entity.updatePose();

			if (!entity.isHidden) {
				visibleEntities.push(entity);
			}
		}

		this.renderer.renderScene(this.scene, visibleEntities);
		this.pixelColour = this.getPixelColour(this.mouseX, this.mouseY);
	}

	getPixelColour(x, y) {

		const pixel = new Uint8Array(4);
		this.renderer.getPixelColour(pixel, x, y);
		return pixel;
	}

	sendRay(tree) {

		const canvasWidth = this.renderer.canvas.width;
		const canvasHeight = this.renderer.canvas.height;
		const rayX = 2.0 * (this.mouseX / canvasWidth) - 1.0;
		const rayY = 2.0 * (this.mouseY / canvasHeight) - 1.0;

		const inverseMatrices = this.scene.camera.getInverseCameraMatrices(this.renderer.canvas);
		let rayCamera = transform(new Vector([rayX, rayY, -1.0, 1.0]), inverseMatrices.perspective);

		rayCamera.components[2] = -1.0;
		rayCamera.components[3] = 0.0;
		let rayWorld = transform(rayCamera, inverseMatrices.camera);
		rayWorld.squeeze(3);
		rayWorld = rayWorld.normalize();

		let cameraPos = this.scene.camera.getCameraPosition();

		let radius = radiusProperties(0.001, 0.001, 0);

		let rayUp = cross(upVector.copy(), rayWorld).normalize();
		let rayLeft = cross(rayUp, rayWorld).normalize();

		let axis = {
			forward: rayWorld,
			up: rayUp,
			left: rayLeft
		};

		let segment = tree.getSegmentTag(this.pixelColour);

		if (segment) {
			tree.updateBoundingGeometry(segment);
			let height = testIntersections(cameraPos, rayWorld, segment, tree.worldMatrix);

			if (height) {
				this.segmentSelector.changeToSegment(segment, height);
			}
		}

		this.segment = segment;
	}
}