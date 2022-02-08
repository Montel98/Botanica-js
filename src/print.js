//import PlaneGeometry from './NFT/PrimitiveShapes.js';
import Tree from './NFT/Tree.js'
import { buildString, newSymbol } from './NFT/LSystem.js';

function getLString() {

	const testString = buildString([ newSymbol('1', []),
                        newSymbol('*', [Math.PI / 32]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 32]), 
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]), 
                        newSymbol('1', []),  
                        newSymbol('[', []),
                        newSymbol('+', [Math.random() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('[', []),
                        newSymbol('+', [Math.random() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]), 
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]), 
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('[', []),
                        newSymbol('+', [Math.random() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('4', [])], 4);

	return testString;
}

export default function printMe() {

	//const newTree = new Tree(getLString());
	//console.log('I get called from print.js!', newTree);
}