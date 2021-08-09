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

function multiplyAux(matrixA, matrixB) {

	const reducer = (total, val) => total + val;

	var newCols = matrixB.map((vecB) => { 
						let newColVector = matrixA[0].map((val, i) => {
							let entry = matrixA.map((vecA, j) => vecA[i] * vecB[j]).reduce(reducer, 0.0);
							return entry;
						});
						return newColVector;
					});

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

function rotateX(angle) {
	let rotationXMatrix = new Matrix(
		[[1, 0, 0], [0, Math.cos(angle), Math.sin(angle)], [0, -1 * Math.sin(angle), Math.cos(angle)]]);
}

function rotateY(angle) {
	let rotationYMatrix = new Matrix(
		[[Math.cos(angle), 0, -1 * Math.sin(angle)], [0, 1, 0], [Math.sin(angle), 0, Math.cos(angle)]]);

	return rotationYMatrix;
}


function rotateZ(angle) {
	let rotationZMatrix = new Matrix(
				[[Math.cos(angle), Math.sin(angle), 0], [-1 * Math.sin(angle), Math.cos(angle), 0], [0, 0, 1]]);

	return rotationZMatrix;
}

function rotateInPlane(forward, dir, angle) {

	let rotationMatrix = new Matrix(
		[
		[Math.cos(angle), 0, 0, 0], 
		[0, Math.cos(angle), 0, 0], 
		[0, 0, Math.cos(angle), 0], 
		[dir.components[0] * Math.sin(angle), dir.components[1] * Math.sin(angle), dir.components[2] * Math.sin(angle), 1]
		]);

	return rotationMatrix;
}

const identityMatrix = new Matrix(
	[[1,0,0,0],
	[0,1,0,0],
	[0,0,1,0],
	[0,0,0,1]]);