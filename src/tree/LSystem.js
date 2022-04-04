import ParametricSurface from './ParametricSurface.js';
import ParametricGeometry from './ParametricGeometry.js';
import Vector, { add } from './Vector.js';
import BezierCubic from './BezierCubic.js';
import BezierLinear from './BezierLinear.js';
import Branch from './Branch.js';
//import Stem, { stemFunc, crossSection, trunkCrossSection } from './Stem.js';
import Stem from './Stem.js';
import {stemFunc, crossSection, stemTipRadiusFunc, stemTipRadiusFuncEnd, radiusFunc, radiusProperties } from './StemBuilder.js';
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

		let pos = stackFrame.pos;
		let axis = stackFrame.axis;
		let rEnd = stackFrame.radius;
		let branch = stackFrame.branch;
		let prevStem = stackFrame.prevStem;

		let normDir = axis.forward.normalize();

		let p0 = new Vector([...pos.components]);
		let p1 = add(pos, normDir.scale(0.03));
		let p2 = add(pos, normDir.scale(0.042));
		let p3 = add(pos, normDir.scale(0.012));

		let stemPath = new BezierLinear(p0, p1);
		let stemTipPath = new BezierLinear(p1, p2);
		let immatureStemTipPath = new BezierLinear(p0, p3);

		let rStart = radiusProperties(0.001, 0.001, branch.branchLength, 0);

		const crossSectionFunc = crossSection;

		// Construct stem body surface functions
		let endStemBodySurface = new ParametricSurface(stemFunc(axis, stemPath, radiusFunc, crossSectionFunc, rEnd),
														 0.0, 1.0, 0.0, 2.0 * Math.PI);

		let startStemBodySurface = new ParametricSurface(stemFunc(axis, stemPath, radiusFunc, crossSectionFunc, rStart), 
														0.0, 1.0, 0.0, 2.0 * Math.PI);

		// Construct stem tip surface function
		let endStemTipSurface = new ParametricSurface(stemFunc(axis, stemTipPath, stemTipRadiusFuncEnd, crossSectionFunc, rEnd), 
														0.0, 1.0, 0.0, 2.0 * Math.PI);

		let startStemTipSurface = new ParametricSurface(stemFunc(axis, stemTipPath, stemTipRadiusFuncEnd, crossSectionFunc, rStart), 
														0.0, 1.0, 0.0, 2.0 * Math.PI);

		let endImmatureStemTipSurface = new ParametricSurface(stemFunc(axis, immatureStemTipPath, stemTipRadiusFunc, crossSectionFunc, rEnd), 
															0.0, 1.0, 0.0, 2.0 * Math.PI);

		let startImmatureStemTipSurface = new ParametricSurface(stemFunc(axis, immatureStemTipPath, stemTipRadiusFunc, crossSectionFunc, rStart), 
															0.0, 1.0, 0.0, 2.0 * Math.PI);

		let uResolution = 2;
		let uTipResolution = 3;
		let vResolution = 16;

		const stemUVMapping = getMappingByWoodType(this.genome, stackFrame);

		// Construct stem body and tip geometries
		let endStemBodyGeometry = new ParametricGeometry(endStemBodySurface, uResolution, vResolution, false, true, true, null, stemUVMapping);
		let startStemBodyGeometry = new ParametricGeometry(startStemBodySurface, uResolution, vResolution, false, true, false, null, stemUVMapping);

		let endStemTipGeometry = new ParametricGeometry(endStemTipSurface, uTipResolution, vResolution, false, true, true, null, stemUVMapping);
		let startStemTipGeometry = new ParametricGeometry(startStemTipSurface, uTipResolution, vResolution, false, true, false, null, stemUVMapping);

		let endImmatureStemTipGeometry = new ParametricGeometry(endImmatureStemTipSurface, uTipResolution, vResolution, false, true, true, null, stemUVMapping);
		let startImmatureStemTipGeometry = new ParametricGeometry(startImmatureStemTipSurface, uTipResolution, vResolution, false, true, false, null, stemUVMapping);


		// Connect previous stem geometry to current stem geometry (vertices and normals)
		if (stackFrame.connectParent && stackFrame.prevStem) {

			let prevStemGeometry = prevStem.stem.geometryParts;
			let offset = uResolution - 1;

			for (let i = 0; i < endStemBodyGeometry.vSteps; i++) {

				let prevEndBody = prevStemGeometry.matureGeometry.endBodyGeometry;
				let prevStartBody = prevStemGeometry.matureGeometry.startBodyGeometry;

				endStemBodyGeometry.vertices[(uResolution * i)] = prevEndBody.vertices[(uResolution * i) + offset].copy();
				endStemBodyGeometry.normals[(uResolution * i)] = prevEndBody.normals[(uResolution * i) + offset].copy();

				endImmatureStemTipGeometry.vertices[(uTipResolution * i)] = prevEndBody.vertices[(uResolution * i) + offset].copy();
				endImmatureStemTipGeometry.normals[(uTipResolution * i)] = prevEndBody.normals[(uResolution * i) + offset].copy();

				startStemBodyGeometry.vertices[(uResolution * i)] = prevStartBody.vertices[(uResolution * i) + offset].copy();
				startImmatureStemTipGeometry.vertices[(uTipResolution * i)] = prevStartBody.vertices[(uResolution * i) + offset].copy();
			}
		}

		// Return main and morph target geometries to be parsed by the stem class
		return {matureGeometry: {endBodyGeometry: endStemBodyGeometry, startBodyGeometry: startStemBodyGeometry,
								endTipGeometry: endStemTipGeometry, startTipGeometry: startStemTipGeometry},

				immatureGeometry: {endTipGeometry: endImmatureStemTipGeometry, startTipGeometry: startImmatureStemTipGeometry}
			};
	}

	generateBranch(stackFrame) {
		let newStemGeometry = this.generateStem(stackFrame);

		return {
			stemGeometry: newStemGeometry,
		}
	}

	generateStems(startStackFrame, endIndex) {

		let frames = [];
		let rootStems = [];
		let stackFrame = copyStack(startStackFrame);
		let currentStem = startStackFrame.prevStem;

		for (let index = startStackFrame.stringIndex; index < endIndex; index++) {

			let symbol = this.LString[index].symbol;
			let params = this.LString[index].params;

			stackFrame.stringIndex = index;

			// Save ancestor stem in stack
			// Reset stack frame with new branch and smaller starting stem radii
			if (symbol === '[') {

				frames.push({stem: currentStem, stackFrame: copyStack(stackFrame)});

				let connectParent = false;

				if (params.length > 0) {
					connectParent = params[0];
				}

				let prevStem = stackFrame.prevStem;

				let rStart = 1.2 * radiusFunc(stackFrame.radius, 
												stackFrame.count);
				let rEnd = 0.3 * radiusFunc(stackFrame.radius, 
										stackFrame.branch.branchLength - 1);

				let newBranch = new Branch(this.getNoSegmentsInRange(index + 1, 
										this.skipBranch(index) + 1),
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

		rules['0'] = (params) => {
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
						newSymbol('+', [/*Math.PI / 4.0*/Math.PI / 6.0, 0.0]),
						newSymbol('0', []),
						newSymbol(']', []),
						newSymbol('*', [Math.PI / 16]),
						newSymbol('1', []),
						newSymbol('*', [Math.PI / 16]),
						newSymbol('1', []),
						newSymbol('[', []),
						newSymbol('+', [/*-Math.PI / 4.0*/-Math.PI / 6.0, 0.0]),
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

		rules['4'] = (params) => {
						return [{ symbols: [ 	
						newSymbol('[', [true]),
						newSymbol('+', [/*Math.PI / 4.0*/Math.PI / 6.0, 0.0]),
						newSymbol('0', []),
						newSymbol(']', []),
						newSymbol('[', [true]),
						newSymbol('+', [/*-Math.PI / 4.0*/-Math.PI / 6.0, 0.0]),
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
			stackFrameCopy['radius'] = radiusProperties(r.radiusStart, 
														r.radiusEnd,
														r.branchLength,
														r.shift);
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

// Only needs to be called once!

function getMappingByWoodType(genome, stackFrame) {

	let sMinUV = 0.0;
	let sMaxUV = 1.0;

	const woodTypeAllele = genome.getGenotype('Wood Type').left.allele;

	if (woodTypeAllele.name == 'Birch') {

		const sWrapTrunk = 8;

		if (stackFrame.branch.level == 0) {

			sMinUV = (stackFrame.count % sWrapTrunk) / sWrapTrunk;
			sMaxUV = (stackFrame.count + 1) % sWrapTrunk == 0 ? 1.0 : ((stackFrame.count + 1) % sWrapTrunk) / sWrapTrunk;
		}
	}
	else if (woodTypeAllele.name == 'Dark Wood' || woodTypeAllele.name == 'Light Wood') {

		if (stackFrame.branch.level == 0) {

			sMinUV = (stackFrame.count % 16) / 16;
			sMaxUV = (stackFrame.count + 1) % 16 == 0 ? 1.0 : ((stackFrame.count + 1) % 16) / 16;
		}
		else {
			sMinUV = 0.7;
			sMaxUV = 0.9;
		}
	}

	return {sMin: sMinUV, sMax: sMaxUV, tMin: 0.0, tMax: 1.0};
}