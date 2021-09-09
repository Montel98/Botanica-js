class Matrix {
	constructor(components) {
		this.components = components;

		//this.noCols = cols.length;
		//this.noRows = cols[0].length;
	}

	getComponents() {
		return this.components;
	}
}

// Convert to normal nested loop

function multiplyAux(matrixA, matrixB) {

	const reducer = (total, val) => total + val;

	var newCols = matrixB.map((vecB) => { 
						let newColVector = matrixA[0].map((val, i) => {
							let entry = matrixA.map((vecA, j) => vecA[i] * vecB[j]).reduce(reducer, 0.0);
							return entry;
						});
						return newColVector;
					});

	/*for (let i = 0; i < matrixB.length; i++) {

		for (let j = 0; i < matrixA[0].length; j++) {

			for (let k = 0; k < matrixA.length; k++) {


			}
		}
	}*/

	return newCols;
}

function multiply(matrixA, matrixB) {
	let mA = matrixA.components;
	let mB = matrixB.components;

	return new Matrix(multiplyAux(mA, mB));
}

function transform(vector, matrix) {
	let vComponents = [vector.components];
	let mComponents = matrix.components;

	return new Vector(multiplyAux(mComponents, vComponents).flat());
}

function perspective(fov, near, far, aspect) {
	let xyInv = 1.0 / Math.tan(0.5 * fov);

	return new Matrix(
		[[xyInv / aspect, 0, 0, 0], 
		[0, xyInv, 0, 0],
		[0, 0, (far + near) / (near - far), -1],
		[0, 0, (2 * far * near) / (near - far), 0]]);
}

function lookAt(eye, direction, left, vertical) {
	let xCol = [left.components[0], vertical.components[0], direction.components[0], 0];
	let yCol = [left.components[1], vertical.components[1], direction.components[1], 0];
	let zCol = [left.components[2], vertical.components[2], direction.components[2], 0];

	let projectionMatrix = new Matrix([xCol, yCol, zCol, [0, 0, 0, 1]]);

	let translationMatrix = translate(-1.0 * eye.components[0], 
									-1.0 * eye.components[1], 
									-1.0 * eye.components[2]);

	return multiply(projectionMatrix, translationMatrix);
}

function translate(dx, dy, dz) {
	let translationMatrix = new Matrix(
		[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [dx, dy, dz, 1]]);

	return translationMatrix;
}

function scale(x, y, z) {
	let scalingMatrix = new Matrix(
		[[x, 0, 0, 0], [0, y, 0, 0], [0, 0, z, 0], [0, 0, 0, 1]]);

	return scalingMatrix;
}

function rotate3X(angle) {
	let rotationXMatrix = new Matrix(
		[[1, 0, 0], [0, Math.cos(angle), Math.sin(angle)], [0, -1 * Math.sin(angle), Math.cos(angle)]]);

	return rotationXMatrix;
}

function rotate4X(angle) {
	let rotationXMatrix = new Matrix(
		[[1, 0, 0, 0], [0, Math.cos(angle), Math.sin(angle), 0], [0, -1 * Math.sin(angle), Math.cos(angle), 0], [0, 0, 0, 1]]);

	return rotationXMatrix;
}

function rotate3Y(angle) {
	let rotationYMatrix = new Matrix(
		[[Math.cos(angle), 0, -1 * Math.sin(angle)], [0, 1, 0], [Math.sin(angle), 0, Math.cos(angle)]]);

	return rotationYMatrix;
}

function rotate4Y(angle) {
	let rotationYMatrix = new Matrix(
		[[Math.cos(angle), 0, -1 * Math.sin(angle), 0], [0, 1, 0, 0], [Math.sin(angle), 0, Math.cos(angle), 0], [0, 0, 0, 1]]);

	return rotationYMatrix;
}

function rotate3Z(angle) {
	let rotationZMatrix = new Matrix(
				[[Math.cos(angle), Math.sin(angle), 0], [-1 * Math.sin(angle), Math.cos(angle), 0], [0, 0, 1]]);

	return rotationZMatrix;
}

function rotate4Z(angle) {
	let rotationZMatrix = new Matrix(
				[[Math.cos(angle), Math.sin(angle), 0, 0], [-1 * Math.sin(angle), Math.cos(angle), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);

	return rotationZMatrix;
}

function rotateVectorHorizontal(dir, angle) {

	let left = cross(dir, upVector);

	if (left.equals(zeroVector)) {
		left = cross(dir, leftVector);
	}

	left = left.normalize();
	dir = dir.normalize();

	let rotationMatrix = new Matrix(
		[
		[Math.cos(angle), 0, 0, 0], 
		[0, Math.cos(angle), 0, 0], 
		[0, 0, Math.cos(angle), 0], 
		[left.components[0] * Math.sin(angle), left.components[1] * Math.sin(angle), left.components[2] * Math.sin(angle), 1]
		]);

	return rotationMatrix;
}

function rotateVectorVertical(dir, angle) {

	let up = cross(dir, leftVector);

	if (up.equals(zeroVector)) {
		up = cross(dir, upVector);
	} 

	up = up.normalize();
	dir = dir.normalize();

	let rotationMatrix = new Matrix(
		[
		[Math.cos(angle), 0, 0, 0], 
		[0, Math.cos(angle), 0, 0], 
		[0, 0, Math.cos(angle), 0], 
		[up.components[0] * Math.sin(angle), up.components[1] * Math.sin(angle), up.components[2] * Math.sin(angle), 1]
		]);

	return rotationMatrix;
}

function rotateFrameHorizontal(axis, angle) {

	let forwardTemp = axis.forward.copy();

	axis.forward = add(forwardTemp.scale(Math.cos(angle)), axis.left.scale(Math.sin(angle))).normalize();
	axis.left = add(forwardTemp.scale(Math.cos(angle + 0.5 * Math.PI)), axis.left.scale(Math.sin(angle + 0.5 * Math.PI))).normalize();

}

function rotateFrameVertical(axis, angle) {

	let forwardTemp = axis.forward.copy();

	axis.forward = add(forwardTemp.scale(Math.cos(angle)), axis.up.scale(Math.sin(angle))).normalize();
	axis.up = add(forwardTemp.scale(Math.cos(angle + 0.5 * Math.PI)), axis.up.scale(Math.sin(angle + 0.5 * Math.PI))).normalize();
}

function rotateFrameRoll(axis, angle) {

	let upTemp = axis.up.copy();

	axis.up = add(axis.left.scale(Math.cos(angle)), upTemp.scale(Math.sin(angle))).normalize();
	axis.left = add(axis.left.scale(Math.cos(angle + 0.5 * Math.PI)), upTemp.scale(Math.sin(angle + 0.5 * Math.PI))).normalize();
}

function projectToNewAxis(axis, position) {

	const newLeft = new Vector([axis.left.components[0], axis.left.components[1], 0]).normalize();
	const newUp = upVector.copy();
	const newForward = cross(newLeft, newUp).normalize();

	return new Matrix([
		[newLeft.components[0], newForward.components[0], newUp.components[0], 0],
		[newLeft.components[1], newForward.components[1], newUp.components[1], 0],
		[newLeft.components[2], newForward.components[2], newUp.components[2], 0],
		[position.components[0], position.components[1], position.components[2], 1],
		]);
}

const identityMatrix = new Matrix(
	[[1,0,0,0],
	[0,1,0,0],
	[0,0,1,0],
	[0,0,0,1]]);