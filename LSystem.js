// 0 - New stem and flower
// 1 - New stem
// - 30 degrees left
// + 30 degrees right
// [ push to stack
// ] pop from stack

class LSystem {
	constructor(inputStr) {

		this.LString = inputStr;

		this.rules = {
			'0': (pos, axis, r, level, prevStem) => {
				return this.generateBranch(pos, axis, r, level, prevStem);
			},

			'1': (pos, axis, r, level, prevStem) => {
				return this.generateBranch(pos, axis, r, level, prevStem);
			}
		}
	}

	generateStem(pos, axis, r, level, prevStem) {
		let normDir = axis.forward.normalize();

		let tempFactor = 0.1;

		let p0 = new Vector([...pos.components]);
		let p1 = add(pos, normDir.scale(0.1 * tempFactor));
		let p2 = add(pos, normDir.scale(0.2 * tempFactor));
		let p3 = add(pos, normDir.scale(0.3 * tempFactor));

		pos.add(normDir.scale(0.3 * tempFactor));

		let stemPath = new BezierCubic(p0, p1, p2, p3);

		let babyR = radiusProperties(0.005, 0.005, 0);

		let surface = new ParametricSurface(stemFunc(axis, stemPath, radiusFunc, r), 0.0, 1.0, 0.0, 2.0 * Math.PI);
		let babySurface = new ParametricSurface(stemFunc(axis, stemPath, radiusFunc, babyR), 0.0, 1.0, 0.0, 2.0 * Math.PI);

		let stMapping = {
							vMin: surface.vMin, 
							vMax: surface.vMax,
							uMin: surface.uMin, 
							uMax: surface.uMax
						};

		let resolution = 32;

		if (level > 2) {
			resolution = 8;
		}

		let stemGeometry = new ParametricGeometry(surface, stMapping, 2, resolution, false, false, true);
		let babyStemGeometry = new ParametricGeometry(babySurface, stMapping, 2, resolution, false, false, false);

		if (prevStem) {

			let prevStemGeometry = prevStem.stemGeometry;

			for (let i = 0; i < stemGeometry.vSteps; i++) {

				stemGeometry.vertices[(2 * i)] = prevStemGeometry.stemEnd.vertices[(2 * i) + 1].copy();
				stemGeometry.normals[(2 * i)] = prevStemGeometry.stemEnd.normals[(2 * i) + 1].copy();

				babyStemGeometry.vertices[(2 * i)] = prevStemGeometry.stemStart.vertices[(2 * i) + 1].copy();
			}
		}

		stemGeometry.vertexBuffer = stemGeometry.mergeAttributes();
		babyStemGeometry.vertexBuffer = babyStemGeometry.mergeAttributes();

		return {stemEnd: stemGeometry, stemStart: babyStemGeometry};
	}

	generateLeaves(pos, axis, r, level) {

		var leafMatrix = null;

		if (level > 2) {
			leafMatrix = projectToNewAxis(axis, pos);
		}

		return leafMatrix;
	}

	generateBranch(pos, axis, r, level, prevStem) {
		let newStemGeometry = this.generateStem(pos, axis, r, level, prevStem);
		let leafMatrix = this.generateLeaves(pos, axis, r, level);

		return {
			stemGeometry: newStemGeometry,
			leafPose: leafMatrix
		}
	}

	generateStems(startIndex, stackFrame) {
		let stack = [];

		let leafMatrices = [];

		let terminalStem = {};
		terminalStem['childStems'] = [];

		let newSegments = false;
		let i = startIndex;

		let symbol = this.LString[i].symbol;

		while (newSegments == false && i < this.LString.length && symbol !== ']') {

			symbol = this.LString[i].symbol;
			var params = this.LString[i].params;

			if (symbol === '+') {

				rotateFrameVertical(stackFrame.axis, params[1]);
				rotateFrameHorizontal(stackFrame.axis, params[0]);
			}

			else if (symbol === '*') {

				rotateFrameVertical(stackFrame.axis, randomNormal(0, Math.PI / 16));
				rotateFrameHorizontal(stackFrame.axis, randomNormal(0, Math.PI / 16));
			}

			else if (symbol === '[') {

				let stackFrameCopy = copyStack(stackFrame);

				let r = radiusFunc(stackFrame.radius.radiusStart, stackFrame.radius.radiusEnd, stackFrame.count, 0);

				stackFrame.radius = radiusProperties(0.7 * r, 0.4 * r, 0);

				stackFrame.level++

				stackFrame.prevStem = null;

				stackFrame.count = 0;

				terminalStem['childStems'].push(stackFrame); 
				i = this.skipBranch(i);
				stackFrame = stackFrameCopy;
			}

			else {

				let stemParts = this.rules[symbol](stackFrame.pos, 
													stackFrame.axis, 
													stackFrame.radius, 
													stackFrame.level, 
													stackFrame.prevStem);

				stackFrame.prevStem = stemParts;


				let meristem = new Stem(stemParts.stemGeometry.stemEnd, stemParts.stemGeometry.stemStart);

				terminalStem['stem'] = meristem;
				terminalStem['stackFrame'] = stackFrame;

				/*for (let i = 0; i < meristem.mesh.geometry.vertices.length; i++) {

					meristem.morphTargets[i] = meristem.mesh.geometry.vertices[(2 * (Math.floor(i / 2)))];
				}

				meristem.mesh.geometry.vertexBuffer = meristem.mesh.geometry.mergeAttributes();*/

				newSegments = true;
			}

			i++;
			stackFrame.stringIndex = i;
			stackFrame.count++;
		}

		return terminalStem;
	}

	skipBranch(index) {
		let parenthesisCount = 1;

		while (parenthesisCount != 0) {
			index++;

			if (this.LString[index].symbol === '[') {
				parenthesisCount++;
			}

			else if (this.LString[index].symbol === ']') {
				parenthesisCount--;
			}
			else continue;
		}

		return index + 1;
	}
}

function copyStack(stackFrame) {
	stackFrameCopy = {};

	for (let param in stackFrame) {

		if (param == 'axis') {
			stackFrameCopy['axis'] = copyAxis(stackFrame.axis);
		}
		else if (param == 'pos') {
			stackFrameCopy['pos'] = stackFrame.pos.copy();
		}
		else {
			stackFrameCopy[param] = stackFrame[param];
		}
	}

	return stackFrameCopy;
}

function copyAxis(axis) {
	return {forward: axis.forward.copy(),
			up: axis.up.copy(),
			left: axis.left.copy()}
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

function newBranch(terminalStemPos, currentLength) {
	return {
		index: terminalStemPos,
		terminalStemLength: currentLength
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

function radiusProperties(rStart, rEnd, shift) {
	return {
		radiusStart: rStart,
		radiusEnd: rEnd,
		shift: shift
	}
}

function radiusFunc(rStart, rEnd, shift, u) {
	return rEnd + (rStart - rEnd) * Math.exp(-1.0 * (u + shift + 1.0));
}