import { transform, lookAt, inverseLookAt, perspective, inversePerspective } from './Matrix.js';
import Vector, { add, subtract, cross } from './Vector.js';

export default class Camera {
	constructor(eye, centre, up) {
		this.origin = eye;
		this.centre = centre;

		// Required to define the camera matrix
		this.vertical = up.normalize();
		this.direction = subtract(eye, centre).normalize();
		this.left = cross(this.vertical, this.direction).normalize();

		this.zNear = 0.1;
		this.zFar = 100.0;

	}

	// Rotate horizontally with respect to current axis
	rotateHorizontal(angle) {

		let rot = rotate3Z(angle);

		this.direction = transform(this.direction, rot).normalize();
		this.left = transform(this.left, rot).normalize();
		//this.left = cross(this.vertical, this.direction).normalize();
	}

	// Rotate vertically with respect to current axis
	rotateVertical(angle) {
		
		let f = this.direction.scale(Math.cos(angle));
		let v = this.vertical.scale(Math.sin(angle));

		this.direction = add(f, v).normalize();

		this.vertical = cross(this.direction, this.left).normalize();
		
	}

	movePosition(x, y, z) {

		this.origin.add(this.left.scale(x));
		this.origin.add(this.vertical.scale(y));
		this.origin.subtract(this.direction.scale(z));
	}

	zoom() {
		
	}

	getCameraMatrices(canvas) {

		return {
			camera: lookAt(this.origin, this.direction, this.left, this.vertical),
			perspective: perspective(Math.PI * 0.25, this.zNear, this.zFar, canvas.width / canvas.height)
		}
	}

	getInverseCameraMatrices(canvas) {

		return {
			camera: inverseLookAt(this.origin, this.direction, this.left, this.vertical),
			perspective: inversePerspective(Math.PI * 0.25, this.zNear, this.zFar, canvas.width / canvas.height)
		}
	}

	getCameraPosition() {
		
		return this.origin.copy();
	}

	setOrigin(x, y, z) {

		this.origin = new Vector([x, y, z]);
	}

	setCentre(x, y, z) {

		this.centre = new Vector([x, y, z]);
	}

	setMode(mode) {
		
	}
}