export default class Vector {
	
	constructor(components) {
		this.components = components;
		this.noRows = components.length;

		for(let i = 0; i < this.noRows; i++) {
			if (components[i] == 0.0) {
				components[i] = 0.0;
			}
		}
	}

	getComponents() {
		return this.cols;
	}

	magnitude() {
		/*const reducer = (accumulator, val) => accumulator + (val ** 2.0);
		let sum = this.components.reduce(reducer, 0.0);*/

		let sum = 0;

		for (let i = 0; i < this.components.length; i++) {

			sum += this.components[i] ** 2.0;
		}

		return Math.sqrt(sum);
	}

	scale(factor) {
		//let scaledComponents = this.components.map((val) => val * factor);

		let scaledComponents = new Array(this.components.length);

		for (let i = 0; i < this.components.length; i++) {

			scaledComponents[i] = factor * this.components[i];
		}

		return new Vector(scaledComponents);
	}

	normalize() {
		let magnitude = this.magnitude();

		if (magnitude == 0) {
			throw 'Magnitude of vector ' + this.components + ' is 0';
		}

		let scaleFactor = 1.0 / this.magnitude();
		return this.scale(scaleFactor);
	}

	equals(vectorB) {
		let componentsA = this.components;
		let componentsB = vectorB.components;

		if (componentsA.length != componentsB.length) {
			return false;
		}

		if (componentsA == null || componentsB == null) {
			return false;
		}

		for (let i = 0; i < componentsA.length; i++) {
			if (componentsA[i] != componentsB[i]) {
				return false;
			}
		}

		return true
	}

	add(vectorB) {
		for (var i = 0; i < this.noRows; i++) {
			this.components[i] += vectorB.components[i];
		}
	}

	subtract(vectorB) {
		for (var i = 0; i < this.noRows; i++) {
			this.components[i] -= vectorB.components[i];
		}
	}

	copy() {
		return new Vector([...this.components]);
	}

	squeeze(component) {
		this.components.splice(component, 1);
		this.noRows -= 1;
	}

	addDim(value) {
		this.components.push(value);
		this.noRows += 1;
	}
}

export function add(vectorA, vectorB) {
	//let vectorSum = vectorA.components.map((val, i) => val + vectorB.components[i]);

	let vectorSum = new Array(vectorA.length);

	for (let i = 0; i < vectorA.components.length; i++) {

		vectorSum[i] = vectorA.components[i] + vectorB.components[i];
	}

	return new Vector(vectorSum);
}

export function subtract(vectorA, vectorB) {
	//let vectorSum = vectorA.components.map((val, i) => val - vectorB.components[i]);

	let vectorSum = new Array(vectorA.length);

	for (let i = 0; i < vectorA.components.length; i++) {

		vectorSum[i] = vectorA.components[i] - vectorB.components[i];
	}

	return new Vector(vectorSum);
}

export function dot(vectorA, vectorB) {
	//const reducer = (accumulator, val) => accumulator + val;

	//return vectorA.components.map((num, i) => num * vectorB.components[i]).reduce(reducer, 0.0);

	let sum = 0;

	for (let i = 0; i < vectorA.components.length; i++) {

		sum += vectorA.components[i] * vectorB.components[i];
	}

	return sum;
}

export function cross(vectorA, vectorB) {
	if (vectorA.noRows != 3 || vectorB.noRows != 3) {
		throw 'Cross product undefined for vectors that are not 3D';
	}

	let componentsA = vectorA.components;
	let componentsB = vectorB.components;

	let x = componentsA[1] * componentsB[2] - componentsA[2] * componentsB[1];
	let y = componentsA[2] * componentsB[0] - componentsA[0] * componentsB[2];
	let z = componentsA[0] * componentsB[1] - componentsA[1] * componentsB[0];

	return new Vector([x, y, z]);
}

export const upVector = new Vector([0.0, 0.0, 1.0]);
export const downVector = new Vector([0.0, 0.0, -1.0]);
export const leftVector = new Vector([-1.0, 0.0, 0.0]);
export const rightVector = new Vector([1.0, 0.0, 0.0]);
export const zeroVector = new Vector([0.0, 0.0, 0.0]);
export const zeroVector2D = new Vector([0.0, 0.0]);