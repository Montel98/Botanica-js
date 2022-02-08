class Camera {
	constructor(eye, centre, up) {
		this.origin = eye;
		this.centre = centre;

		this.vertical = up.normalize();
		this.direction = subtract(eye, centre).normalize();
		this.left = cross(this.vertical, this.direction).normalize();

		this.zNear = 0.1;
		this.zFar = 100.0;
	}

	rotateHorizontal(angle) {

		let rot = rotate3Z(angle);

		this.direction = transform(this.direction, rot).normalize();
		this.left = transform(this.left, rot).normalize();
		//this.left = cross(this.vertical, this.direction).normalize();
	}

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

	getCameraMatrices(canvas) {

		return {camera: lookAt(this.origin, this.direction, this.left, this.vertical),
				perspective: perspective(Math.PI * 0.25, this.zNear, this.zFar, canvas.scrollWidth / canvas.scrollHeight)
			}
	}

	getCameraPosition() {
		
		return this.origin;
	}

	setMode(mode) {
		
	}
}