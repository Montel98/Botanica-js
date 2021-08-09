// 0 - New stem and flower
// 1 - New stem
// - 30 degrees left
// + 30 degrees right
// [ push to stack
// ] pop from stack

const rotation30 = rotateY(Math.PI / 8);
const rotationNegative30 = rotateY(-Math.PI / 8);

const rotationX30 = rotateX(Math.PI / 8);
const rotationXNegative30 = rotateX(-Math.PI / 8);

class LSystem {
	constructor(startPos, startDir) {
		this.startPos = startPos;
		this.startDir = startDir;

		this.rules = {
			'0': (pos, dir, r) => {

				dir = dir.normalize();

				let tempFactor = 0.2;

				let p0 = new Vector([...pos.components]);
				let p1 = add(pos, dir.scale(0.1 * tempFactor));
				let p2 = add(pos, dir.scale(0.2 * tempFactor));
				let p3 = add(pos, dir.scale(0.3 * tempFactor));


				let stemPath = new BezierCubic(p0, p1, p2, p3);

				let sSurface = new ParametricSurface(stemFunc(stemPath, r), 0.0, 1.0, 0.0, 2.0 * Math.PI);

				pos.add(dir.scale(0.3 * tempFactor));

				let newStem = new Stem(sSurface);

				return newStem;
			},

			'1': (pos, dir, r) => {

				let p0 = new Vector([...pos.components]);
				let p1 = add(pos, dir.scale(0.1));
				let p2 = add(pos, dir.scale(0.2));
				let p3 = add(pos, dir.scale(0.3));

				let stemPath = new BezierCubic(p0, p1, p2, p3);

				let sSurface = new ParametricSurface(stemFunc(stemPath, r), 0.0, 1.0, 0.0, 2.0 * Math.PI);

				pos.add(dir.scale(0.3));

				let newStem = new Stem(sSurface);

				return newStem;
			}
		}
	}

	generateStems(inputStr) {
		let stack = [];
		let pos = new Vector(this.startPos.components);
		let dir = new Vector(this.startDir.components);
		let r = 0.02;

		let items = [];

		for (let i = 0; i < inputStr.length; i++) {

			var symbol = inputStr[i];

			if (symbol === '[') {
				/*stack.push(new Vector([...pos.components]), new Vector([...dir.components]));
				dir = transform(dir, rotation30);*/

				let randAngle = (0.25 * Math.PI * Math.random()) - (Math.PI * 0.125); // angle between pi and -pi

				stack.push({pos: new Vector([...pos.components]), dir: new Vector([...dir.components]), angle: randAngle, radius: r});

				let up = cross(dir, upVector);

				if (up.equals(zeroVector)) {
					up = cross(dir, leftVector);
				}

				/*dir = new Vector(transform(dir, rotateInPlane(dir.normalize(), up.normalize(), randAngle))
					.components.slice(0, 3));*/

				let tempDir = new Vector([dir.components[0], dir.components[1], dir.components[2], 1]);

				dir = new Vector(transform(tempDir, rotateInPlane(dir.normalize(), up.normalize(), randAngle))
					.components.slice(0, 3));

				if(r > 0.002) {
					r *= 0.95;
				}

				//console.log(dir.components);
			}
			else if (symbol === ']') {
				/*dir = transform(stack.pop(), rotationNegative30);
				pos = stack.pop();*/

				let prevParams = stack.pop();
				let up = cross(prevParams.dir, upVector);

				if (up.equals(zeroVector)) {
					up = cross(prevParams.dir, leftVector);
				}

				/*dir = new Vector(transform(prevParams.dir, rotateInPlane(prevParams.dir.normalize(), up.normalize(), -prevParams.angle))
					.components.slice(0, 3));*/

				dir = prevParams.dir;
				pos = prevParams.pos;
				r = prevParams.radius;

				let tempDir = new Vector([dir.components[0], dir.components[1], dir.components[2], 1]);

				dir = new Vector(transform(tempDir, rotateInPlane(dir.normalize(), up.normalize(), -r))
					.components.slice(0, 3));

				if(r > 0.002) {
					r *= 0.95;
				}
			}
			else {
				items.push(this.rules[symbol](pos, dir, r));
			}
		}

		return items;
	}
}

function generateMesh(items) {

	let geometries = items.map(item => item.mesh.geometry);
	return mergeGeometry(geometries);
}

const rules = {};

//rules['0'] = '1[0]0';
rules['1'] = '11';
rules['0'] = '0[0]0';


function buildString(start, depth) {
	let inputStr = start;
	let outputStr = start;

	for (var i = 0; i < depth; i++) {

		outputStr = "";

		for (var s = 0; s < inputStr.length; s++) {
			var symbol = inputStr[s];

			if (symbol in rules) {
				outputStr += rules[symbol];
			}
			else {
				outputStr += symbol;
			}
		}

		inputStr = outputStr;
	}

	return outputStr;
}