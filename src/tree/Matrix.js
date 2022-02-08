import Vector, { cross, add, upVector, leftVector, zeroVector } from './Vector.js';

export default class Matrix {
	constructor(components) {
		this.components = components;

		//this.noCols = cols.length;
		//this.noRows = cols[0].length;
	}

	getComponents() {
		return this.components;
	}

	copy() {
		let newComponents = [];

		for (let col = 0; col < this.components.length; col++) {
			newComponents.push([...this.components[col]]);
		}

		return new Matrix(newComponents);
	}
}

// Convert to normal nested loop

function multiplyAux(matrixA, matrixB) {

	let newCols = [];

	for (let i = 0; i < matrixB.length; i++) {

		let vecB = matrixB[i];

		let newColVector = [];

		for (let j = 0; j < matrixA[0].length; j++) {

			let sum = 0;

			for (let k = 0; k < matrixA.length; k++) {

				let vecA = matrixA[k];

				sum += vecA[j] * vecB[k];
			}

			newColVector.push(sum);
		}

		newCols.push(newColVector);
	}

	return newCols;
}

export function multiply(matrixA, matrixB) {
	let mA = matrixA.components;
	let mB = matrixB.components;

	return new Matrix(multiplyAux(mA, mB));
}

export function transform(vector, matrix) {
	let vComponents = [vector.components];
	let mComponents = matrix.components;

	return new Vector(multiplyAux(mComponents, vComponents).flat());
}

export function perspective(fov, near, far, aspect) {
	let xyInv = 1.0 / Math.tan(0.5 * fov);

	return new Matrix(
		[[xyInv / aspect, 0, 0, 0], 
		[0, xyInv, 0, 0],
		[0, 0, (far + near) / (near - far), -1],
		[0, 0, (2 * far * near) / (near - far), 0]]);
}

export function inversePerspective(fov, near, far, aspect) {
	let xyInv = 1.0 / Math.tan(0.5 * fov);

	return new Matrix(
		[[aspect / xyInv, 0, 0, 0],
		[0, 1 / xyInv, 0, 0],
		[0, 0, 0, -1],
		[0, 0, 0.5 * (near - far) / (far * near), 0.5 * (far + near) / (far * near)]]);
}

export function lookAt(eye, direction, left, vertical) {
	let xCol = [left.components[0], vertical.components[0], direction.components[0], 0];
	let yCol = [left.components[1], vertical.components[1], direction.components[1], 0];
	let zCol = [left.components[2], vertical.components[2], direction.components[2], 0];

	let projectionMatrix = new Matrix([xCol, yCol, zCol, [0, 0, 0, 1]]);

	let translationMatrix = translate(-1.0 * eye.components[0], 
									-1.0 * eye.components[1], 
									-1.0 * eye.components[2]);

	return multiply(projectionMatrix, translationMatrix);
}

export function inverseLookAt(eye, direction, left, vertical) {
	let xCol = [left.components[0], left.components[1], left.components[2], 0];
	let yCol = [vertical.components[0], vertical.components[1], vertical.components[2], 0];
	let zCol = [direction.components[0], direction.components[1], direction.components[2], 0];

	let inverseProjectionMatrix = new Matrix([xCol, yCol, zCol, [0, 0, 0, 1]]);
	
	let inverseTranslationMatrix = translate(eye.components[0],
											eye.components[1],
											eye.components[2]);

	return multiply(inverseTranslationMatrix, inverseProjectionMatrix);
}

export function translate(dx, dy, dz) {
	let translationMatrix = new Matrix(
		[[1, 0, 0, 0], [0, 1, 0, 0], [0, 0, 1, 0], [dx, dy, dz, 1]]);

	return translationMatrix;
}

export function scale(x, y, z) {
	let scalingMatrix = new Matrix(
		[[x, 0, 0, 0], [0, y, 0, 0], [0, 0, z, 0], [0, 0, 0, 1]]);

	return scalingMatrix;
}

export function rotate3X(angle) {
	let rotationXMatrix = new Matrix(
		[[1, 0, 0], [0, Math.cos(angle), Math.sin(angle)], [0, -1 * Math.sin(angle), Math.cos(angle)]]);

	return rotationXMatrix;
}

export function rotate4X(angle) {
	let rotationXMatrix = new Matrix(
		[[1, 0, 0, 0], [0, Math.cos(angle), Math.sin(angle), 0], [0, -1 * Math.sin(angle), Math.cos(angle), 0], [0, 0, 0, 1]]);

	return rotationXMatrix;
}

export function rotate3Y(angle) {
	let rotationYMatrix = new Matrix(
		[[Math.cos(angle), 0, -1 * Math.sin(angle)], [0, 1, 0], [Math.sin(angle), 0, Math.cos(angle)]]);

	return rotationYMatrix;
}

export function rotate4Y(angle) {
	let rotationYMatrix = new Matrix(
		[[Math.cos(angle), 0, -1 * Math.sin(angle), 0], [0, 1, 0, 0], [Math.sin(angle), 0, Math.cos(angle), 0], [0, 0, 0, 1]]);

	return rotationYMatrix;
}

export function rotate3Z(angle) {
	let rotationZMatrix = new Matrix(
				[[Math.cos(angle), Math.sin(angle), 0], [-1 * Math.sin(angle), Math.cos(angle), 0], [0, 0, 1]]);

	return rotationZMatrix;
}

export function rotate4Z(angle) {
	let rotationZMatrix = new Matrix(
				[[Math.cos(angle), Math.sin(angle), 0, 0], [-1 * Math.sin(angle), Math.cos(angle), 0, 0], [0, 0, 1, 0], [0, 0, 0, 1]]);

	return rotationZMatrix;
}

export function rotateVectorHorizontal(dir, angle) {

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

export function rotateVectorVertical(dir, angle) {

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

export function rotateFrameHorizontal(axis, angle) {

	let forwardTemp = axis.forward.copy();

	axis.forward = add(forwardTemp.scale(Math.cos(angle)), axis.left.scale(Math.sin(angle))).normalize();
	axis.left = add(forwardTemp.scale(Math.cos(angle + 0.5 * Math.PI)), axis.left.scale(Math.sin(angle + 0.5 * Math.PI))).normalize();

}

export function rotateFrameVertical(axis, angle) {

	let forwardTemp = axis.forward.copy();

	axis.forward = add(forwardTemp.scale(Math.cos(angle)), axis.up.scale(Math.sin(angle))).normalize();
	axis.up = add(forwardTemp.scale(Math.cos(angle + 0.5 * Math.PI)), axis.up.scale(Math.sin(angle + 0.5 * Math.PI))).normalize();
}

export function rotateFrameRoll(axis, angle) {

	let upTemp = axis.up.copy();

	axis.up = add(axis.left.scale(Math.cos(angle)), upTemp.scale(Math.sin(angle))).normalize();
	axis.left = add(axis.left.scale(Math.cos(angle + 0.5 * Math.PI)), upTemp.scale(Math.sin(angle + 0.5 * Math.PI))).normalize();
}

export function projectToLeafAxis(axis, position) {

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

export function projectToFlowerAxis(axis, position) {

	let translationMatrix = translate(...position.components);

	let projectionMatrix = new Matrix([
		[axis.left.components[0], axis.left.components[1], axis.left.components[2], 0],
		[axis.forward.components[0], axis.forward.components[1], axis.forward.components[2], 0],
		[axis.up.components[0], axis.up.components[1], axis.up.components[2], 0],
		[0, 0, 0, 1],
	]);

	return multiply(translationMatrix, projectionMatrix);
}

export function projectToStumpAxis(axis, position) {

	let translationMatrix = translate(...position.components);

	let projectionMatrix = new Matrix([
		[axis.left.components[0], axis.left.components[1], axis.left.components[2], 0],
		[axis.up.components[0], axis.up.components[1], axis.up.components[2], 0],
		[axis.forward.components[0], axis.forward.components[1], axis.forward.components[2], 0],
		[0, 0, 0, 1],
	]);

	return multiply(translationMatrix, projectionMatrix);
}

export const identityMatrix = new Matrix(
	[[1,0,0,0],
	[0,1,0,0],
	[0,0,1,0],
	[0,0,0,1]]);