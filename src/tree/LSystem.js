import Vector, { add } from './Vector.js';
import BezierCubic from './BezierCubic.js';
import BezierLinear from './BezierLinear.js';
import Branch from './Branch.js';
import Stem from './Stem.js';
import { radiusFunc, radiusProperties, generateStemGeometries } from './StemBuilder.js';
import { rotateFrameVertical, rotateFrameHorizontal, rotateFrameRoll } from './Matrix.js';
import TreeSeed from './Seed.js';

export default class LSystem {
	constructor(inputStr, genome) {

		this.stringGenRules = this.initStringGenRules();

		this.LString = this.buildString(inputStr, 4);
		this.genome = genome; // Used for getting the wood type

		// Defines the characters that can generate stems
		this.buildRules = {
			'0': (stackFrame) => {
				return this.generateBranch(stackFrame);
			},
			'1': (stackFrame) => {
				return this.generateBranch(stackFrame);
			},
			'4': (stackFrame) => {
				return this.generateBranch(stackFrame);
			}
		}
	}

	generateStem(stackFrame) {
		return generateStemGeometries(this.genome, stackFrame);
	}

	generateBranch(stackFrame) {
		let newStemGeometry = this.generateStem(stackFrame);

		return {
			stemGeometry: newStemGeometry,
		}
	}

	// Creates a tree of stems and returns the root node
	generateStems(startStackFrame, endIndex) {

		let frames = [];
		let rootStems = [];
		let stackFrame = copyStack(startStackFrame);
		let currentStem = startStackFrame.prevStem;

		for (let index = startStackFrame.stringIndex; index < endIndex; index++) {

			let symbol = this.LString[index].symbol;
			let params = this.LString[index].params;

			stackFrame.stringIndex = index;

			// Save ancestor stem on stack
			// Reset stack frame with new branch and smaller starting stem radii
			if (symbol === '[') {

				frames.push({stem: currentStem, stackFrame: copyStack(stackFrame)});

				let connectParent = false;

				if (params.length > 0) {
					connectParent = params[0];
				}

				let prevStem = stackFrame.prevStem;

				let rStart = 1.2 * radiusFunc(
					stackFrame.radius, 
					stackFrame.count
				);
				let rEnd = 0.3 * radiusFunc(
					stackFrame.radius, 
					stackFrame.branch.branchLength - 1
				);

				let newBranch = new Branch(
					this.getNoSegmentsInRange(
					index + 1, 
					this.skipBranch(index) + 1
					),
					stackFrame.branch.level + 1);

				stackFrame.branch = newBranch;
				stackFrame.radius = radiusProperties(rStart, rEnd, newBranch.branchLength, 0);
				stackFrame.count = 0;
				stackFrame.stringIndex++;
				stackFrame.radius.shift = stackFrame.count;
				stackFrame.connectParent = connectParent;

			}

			// Retrieve ancestor stem and its properties
			else if (symbol === ']') {

				let parentStem = frames.pop();
				currentStem = parentStem.stem;
				stackFrame = parentStem.stackFrame;
			}

			// Specified rotation in local x-y plane
			else if (symbol === '+') {

				rotateFrameVertical(stackFrame.axis, params[1]);
				rotateFrameHorizontal(stackFrame.axis, params[0]);
			}

			// Normally distributed rotation in local x-y plane
			else if (symbol === '*') {

				let variance = params[0];

				rotateFrameVertical(stackFrame.axis, randomNormal(0, variance));
				rotateFrameHorizontal(stackFrame.axis, randomNormal(0, variance));
			}

			else if (symbol === 'r') {

				rotateFrameRoll(stackFrame.axis, params[0]);
			}

			else if (symbol === 'h') {

				rotateFrameHorizontal(stackFrame.axis, params[0]);
			}
			else if (symbol === 'v') {

				rotateFrameVertical(stackFrame.axis, params[0]);
			} 

			// Generate stem
			else if (symbol !== '0') {

				stackFrame.prevStem = currentStem;

				// Get individual stem geomtries
				let stemParts = this.buildRules[symbol](stackFrame);

				let meristem = new Stem(this.genome,
										stemParts.stemGeometry.matureGeometry, 
										stemParts.stemGeometry.immatureGeometry, stackFrame.branch);

				let newStem = {stem: meristem, stackFrame: copyStack(stackFrame)};

				if (stackFrame.prevStem == startStackFrame.prevStem) {
					rootStems.push(newStem);
				}
				else {
					currentStem.stackFrame.nextStems.push(newStem);
				}

				currentStem = newStem;

				// Update stack parameters and progress to next symbol
				stackFrame.count++;
				stackFrame.radius.shift = stackFrame.count;
				stackFrame.pos = add(stackFrame.pos, stackFrame.axis.forward.scale(0.03));
				stackFrame.depth++;
				stackFrame.connectParent = true;
			}
		}

		return rootStems;
	}

	// Returns the index of the first symbol belonging to the parent branch
	// If only 1 branch is present, the final index is returned ( Length(LString) - 1 )
	skipBranch(index) {

		let parenthesisCount = 1;

		while (parenthesisCount != 0 && index + 1 < this.LString.length) {
			index++;

			if (this.LString[index].symbol === '[') {
				parenthesisCount++;
			}

			else if (this.LString[index].symbol === ']') {
				parenthesisCount--;
			}
		}

		return index;
	}

	// Returns the number of 'stems' that would be generated within a substring of the input string
	getNoSegmentsInRange(startIndex, endIndex) {

		let segmentCount = 0;

		for (let index = startIndex; index < endIndex; index++) {

			if (this.LString[index].symbol === '[') {

				index = this.skipBranch(index);
				continue;
			}

			if (this.LString[index].symbol === '1') {

				segmentCount++;
			}
		}

		return segmentCount;
	}

	// For probabilistic L-Systems, returns a random rule from the defined distibution of a given symbol
	getRandomRule(symbol, params) {

		let randValue = Math.random();
		let rule = this.stringGenRules[symbol](params);
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

	// Iteratively generates an L-String from an initial start string [depth] times
	// Rules are replaced with their respective strings each iteration
	buildString(start, depth) {
		let inputStr = start;
		let outputStr = start;

		for (var i = 0; i < depth; i++) {

			outputStr = [];

			for (var s = 0; s < inputStr.length; s++) {
				var symbol = inputStr[s].symbol;
				var params = inputStr[s].params;

				if (symbol in this.stringGenRules) {
					outputStr.push(...this.getRandomRule(symbol, params));
				}
				else {
					outputStr.push(newSymbol(symbol, params));
				}
			}

			inputStr = outputStr;
		}

		return outputStr;
	}

	// Defines the shape of the bonsai trees
	initStringGenRules() {
		const rules = {};

		rules['0'] = (params) => 
		{
			return [{ symbols: [ 	
			newSymbol('+', [0.0, Math.PI / 16]),
			newSymbol('1', []),
			newSymbol('*', [Math.PI / 16]),
			newSymbol('1', []),
			newSymbol('*', [Math.PI / 16]),
			newSymbol('1', []),
			newSymbol('*', [Math.PI / 16]),
			newSymbol('1', []),
			newSymbol('[', []),
			newSymbol('+', [Math.PI / 6.0, 0.0]),
			newSymbol('0', []),
			newSymbol(']', []),
			newSymbol('*', [Math.PI / 16]),
			newSymbol('1', []),
			newSymbol('*', [Math.PI / 16]),
			newSymbol('1', []),
			newSymbol('[', []),
			newSymbol('+', [-Math.PI / 6.0, 0.0]),
			newSymbol('0', []),
			newSymbol(']', []),
			newSymbol('*', [Math.PI / 16]),
			newSymbol('1', []),
			newSymbol('[', [true]),
			newSymbol('h', [(Math.PI / 5) + ((2.0 * (TreeSeed.growth.randomFloat() * (Math.PI / 8))) - (Math.PI / 4))]),
			newSymbol('1', []),							
			newSymbol(']', []),
			newSymbol('[', [true]),
			newSymbol('h', [-(Math.PI / 5) - ((2.0 * (TreeSeed.growth.randomFloat() * (Math.PI / 8))) - (Math.PI / 4))]),
			newSymbol('1', []),
			newSymbol(']', [])], probability: 1.0 }];
		};

		rules['4'] = (params) => 
		{
			return [{ symbols: [ 	
			newSymbol('[', [true]),
			newSymbol('+', [Math.PI / 6.0, 0.0]),
			newSymbol('0', []),
			newSymbol(']', []),
			newSymbol('[', [true]),
			newSymbol('+', [-Math.PI / 6.0, 0.0]),
			newSymbol('0', []),
			newSymbol(']', [])], probability: 1.0 }];
		};

		return rules;
	}
}

export function copyStack(stackFrame) {
	const stackFrameCopy = {};

	for (let param in stackFrame) {

		if (param == 'axis') {
			stackFrameCopy['axis'] = copyAxis(stackFrame.axis);
		}
		else if (param == 'pos') {
			stackFrameCopy['pos'] = stackFrame.pos.copy();
		}
		else if (param == 'radius') {
			let r = stackFrame.radius;
			stackFrameCopy['radius'] = radiusProperties(
				r.radiusStart, 
				r.radiusEnd,
				r.branchLength,
				r.shift
			);
		}
		else if (param == 'nextStems') {
			stackFrameCopy['nextStems'] = [...stackFrame.nextStems];
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


export function newSymbol(symbolString, parameters) {
	return {
		symbol: symbolString,
		params: parameters
	}
}

// Generate an (approximate) normally distrbuted value with mean and variance
function randomNormal(mean, variance) {
	let u = 1.0 - TreeSeed.growth.randomFloat();
	let v = 1.0 - TreeSeed.growth.randomFloat();

	return mean + (variance * (Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)));
}