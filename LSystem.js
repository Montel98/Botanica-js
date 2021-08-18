// 0 - New stem and flower
// 1 - New stem
// - 30 degrees left
// + 30 degrees right
// [ push to stack
// ] pop from stack

class LSystem {
	constructor(startPos, startDir) {
		this.startPos = startPos;
		this.startDir = startDir;

		this.rules = {
			'0': (pos, axis, r, level) => {
				return this.generateBranch(pos, axis, r, level);
			},

			'1': (pos, axis, r, level) => {
				return this.generateBranch(pos, axis, r, level);
			}
		}
	}

	generateStem(pos, axis, r, level) {
		let normDir = axis.forward.normalize();

		let tempFactor = 0.1;

		let p0 = new Vector([...pos.components]);
		let p1 = add(pos, normDir.scale(0.1 * tempFactor));
		let p2 = add(pos, normDir.scale(0.2 * tempFactor));
		let p3 = add(pos, normDir.scale(0.3 * tempFactor));

		let stemPath = new BezierCubic(p0, p1, p2, p3);

		let sSurface = new ParametricSurface(stemFunc(stemPath, r), 0.0, 1.0, 0.0, 2.0 * Math.PI);

		pos.add(normDir.scale(0.3 * tempFactor));

		let newStem = new Stem(sSurface);

		/*var leafMatrix = null;

		if (level > 1) {
			leafMatrix = projectToNewAxis(axis, add(pos, normDir.scale(0.15 * tempFactor)));
		}*/

		/*return {stem: newStem,
				leafPose: leafMatrix
				};*/

		return newStem;
	}

	generateLeaves(pos, axis, r, level) {

		var leafMatrix = null;

		if (level > 2) {
			leafMatrix = projectToNewAxis(axis, pos);
			console.log(leafMatrix.components);
		}

		return leafMatrix;
	}

	generateBranch(pos, axis, r, level) {
		let newStem = this.generateStem(pos, axis, r, level);
		let leafMatrix = this.generateLeaves(pos, axis, r, level);

		return {
			stem: newStem,
			leafPose: leafMatrix
		}
	}

	generateStems(inputStr) {
		let stack = [];
		let pos = new Vector(this.startPos.components);

		//let dir = new Vector(this.startDir.components);
		//let up = new Vector([0, -1, 0]);
		//let left = new Vector([-1, 0, 0]);

		let axis = {
			//forward: new Vector([...this.startDir.components]),
			forward: new Vector([0, 0, 1]),
			up: new Vector([0, -1, 0]),
			left: new Vector([-1, 0, 0])
		}

		let r = 0.03;
		let l = 0;

		let items = [];
		let leafMatrices = [];

		for (let i = 0; i < inputStr.length; i++) {

			var symbol = inputStr[i].symbol;
			var params = inputStr[i].params;

			if (symbol === '+') {
				rotateFrameVertical(axis, params[1]);
				rotateFrameHorizontal(axis, params[0]);

			}

			else if (symbol === '*') {

				//rotateFrameRoll(axis, 2.0 * Math.PI * Math.random());
				//rotateFrameRoll(axis, Math.PI / 2.0);

				rotateFrameVertical(axis, randomNormal(0, Math.PI / 32));
				rotateFrameHorizontal(axis, randomNormal(0, Math.PI / 32));
			}

			else if (symbol === '[') {

				//rotateFrameRoll(axis, 2.0 * Math.PI * Math.random());

				stack.push({pos: new Vector([...pos.components]), 
							axis: {forward: new Vector([...axis.forward.components]), 
									up: new Vector([...axis.up.components]), 
									left: new Vector([...axis.left.components])}, 
									radius: r,
									level: l});

				if (r > 0.002) {
					r *= 0.6;
				}

				l++
			}

			else if (symbol === ']') {

				let prevParams = stack.pop();

				pos = prevParams.pos;
				axis = prevParams.axis;
				r = prevParams.radius;
				l = prevParams.level;
			}

			else {
				items.push(this.rules[symbol](pos, axis, r, l));
			}
		}

		return items;
	}
}

function generateMesh(items) {

	let geometries = items.map(item => item.mesh.geometry);
	return mergeGeometry(geometries);
}

function generateTree(inputStr) {
	let tempLSystem = new LSystem(zeroVector.copy(), upVector.copy());

	let items = tempLSystem.generateStems(inputStr);

	let stems = items.map(item => item.stem);
	let geometry = generateMesh(stems);

	const textureTest = new Texture('s');
	const testEntity = new Entity();
	testEntity.mesh = new Mesh(new Material(textureTest), geometry);

	let leafPoses = items.map(item => item.leafPose).filter(i => i);

	const leaves = new Leaves();

	const leafCount = 2;

	for (let leafIndex = 0; leafIndex < leafPoses.length; leafIndex++) {

		leaves.addLeaves(leafCount, leafPoses[leafIndex]);
	}

	testEntity.addChild(leaves);

	return testEntity;
}

const rules = {};

rules['0'] = [{ symbols: [ 	newSymbol('+', [0.0, Math.PI / 16]),
							newSymbol('1', []),
							newSymbol('*', []),
							newSymbol('1', []),
							newSymbol('*', []),
							newSymbol('1', []),
							newSymbol('*', []),
							newSymbol('1', []),
							newSymbol('[', []),
							newSymbol('+', [Math.PI / 4.0, 0.0]),
							newSymbol('0', []),
							newSymbol(']', []),
							newSymbol('*', []),
							newSymbol('1', []),
							newSymbol('*', []),
							newSymbol('1', []),
							newSymbol('[', []),
							newSymbol('+', [-Math.PI / 4.0, 0.0]),
							newSymbol('0', []),
							newSymbol(']', []),
							newSymbol('*', []),
							newSymbol('1', []),
							newSymbol('*', []),
							newSymbol('1', []),
							/*newSymbol('+', [-Math.PI / 5, 0.0])*/], probability: 1.0 }];

function newSymbol(symbolString, parameters) {
	return {
		symbol: symbolString,
		params: parameters
	}
}

function buildString(start, depth) {
	let inputStr = start;
	let outputStr = start;

	for (var i = 0; i < depth; i++) {

		outputStr = [];

		for (var s = 0; s < inputStr.length; s++) {
			var symbol = inputStr[s].symbol;
			var params = inputStr[s].params;

			if (symbol in rules) {
				outputStr.push(...getRandomRule(symbol));
			}
			else {
				outputStr.push(newSymbol(symbol, params));
			}
		}

		inputStr = outputStr;
	}

	console.log('output:', outputStr);

	return outputStr;
}

function getRandomRule(symbol) {

	let randValue = Math.random();
	let rule = rules[symbol];
	let successor = rule[0];

	for (let i = 0; i < rule.length; i++) {
		successor = rule[i];

		let probability = successor.probability;

		if (randValue <= probability) {

			return successor.symbols;
		}
	}

	return successor.symbols;
}

function randomNormal(mean, variance) {
	let u = 1.0 - Math.random();
	let v = 1.0 - Math.random();

	return mean + (variance * (Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)));
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

	/*const leftNorm = axis.left.normalize().components;
	const forwardNorm = axis.forward.normalize().components;
	const upNorm = axis.up.normalize().components;*/

	const newLeft = new Vector([axis.left.components[0], axis.left.components[1], 0]).normalize();
	const newUp = upVector.copy();
	const newForward = cross(newLeft, newUp).normalize();

	/*return new Matrix([
		[leftNorm[0], forwardNorm[0], upNorm[0], 0],
		[leftNorm[1], forwardNorm[1], upNorm[1], 0],
		[leftNorm[2], forwardNorm[2], upNorm[2], 0],
		[position.components[0], position.components[1], position.components[2], 1],
		]);*/

	return new Matrix([
		[newLeft.components[0], newForward.components[0], newUp.components[0], 0],
		[newLeft.components[1], newForward.components[1], newUp.components[1], 0],
		[newLeft.components[2], newForward.components[2], newUp.components[2], 0],
		[position.components[0], position.components[1], position.components[2], 1],
		]);
}