//import SimplexNoise from '/static/dependencies/simplex-noise.js';
import Vector from './Vector.js';
import {add, subtract, dot, zeroVector2D} from './Vector.js';
import FastSimplexNoise from './FastSimplexNoise.js';
import * as Texture from './Texture.js';

const rowMax = 32;
const colMax = 32;

//const rowMax = 8;
//const colMax = 8;

export function generateSoilTexture(width, height, noChannels) {

	let buffer = new Uint8Array(width * height * noChannels);

	let centre = new Vector([0, 0]);

	let currentPos = new Vector([0, 0]);

	var xNorm, yNorm;

	let index = 0;

	let testAngles = [5 * Math.PI / 6, 4 * Math.PI / 6, 3 * Math.PI / 6, 2 * Math.PI / 6, -5 * Math.PI / 6, -4 * Math.PI / 6, -3 * Math.PI / 6, -2 * Math.PI / 6, 0.01 + Math.PI];

	let points = [];

	for (let x = 0; x < rowMax; x++) {

		points.push([]);

		for (let y = 0; y < colMax; y++) {

			points[x].push(new Vector([Math.random(), Math.random()]));
		}
	}

	let rMax = 1.0;

	for (let y = 0; y < height; y++) {

		yNorm = y / (height - 1);

		for (let x = 0; x < width; x++) {

			xNorm = x / (width - 1);

			currentPos.components[0] = 2.0 * xNorm - 1.0;
			currentPos.components[1] = 2.0 * yNorm - 1.0;

			let theta = Math.atan2(2.0 * yNorm - 1.0, 2.0 * xNorm - 1.0) + Math.PI;

			let d = subtract(currentPos, centre).magnitude();


			let pixelColour = 255 * (1.0 - step(1.0, d));
			//let pixelColour = 80 + (175 * (1.0 - step(0.5, d)));


			buffer[index] = pixelColour;
			buffer[index + 1] = pixelColour;
			buffer[index + 2] = pixelColour;
			buffer[index + 3] = pixelColour;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generateLeafTexture(width, height, noChannels) {

	const rowMax = 8;
	const colMax = 8;

	let points = [];

	/*for (let i = 0; i < 40; i++) {
		points.push({'location': new Vector([2.0 * Math.random() - 1.0, 2.0 * Math.random() - 1.0]), 'radius': 0.08 - (0.04 * Math.random())});
	}*/

	for (let x = 0; x < rowMax; x++) {

		points.push([]);

		for (let y = 0; y < colMax; y++) {

			points[x].push(new Vector([Math.random(), Math.random()]));
		}
	}

	let buffer = new Uint8Array(width * height * noChannels);

	let centre = new Vector([0, 0]);

	let currentPos = new Vector([0, 0]);

	let midLine = new Vector([0.5, 0.5]);

	var xNorm, yNorm;

	let index = 0;

	let rMax = 1.0;

	let noise = new FastSimplexNoise({frequency: 4.0, octaves: 8});

	for (let y = 0; y < height; y++) {

		yNorm = y / (height - 1);

		for (let x = 0; x < width; x++) {

			//let pixelColour = 80;
			//let pixelColour = 220;

			xNorm = x / (width - 1);

			//currentPos.components[0] = 2.0 * xNorm - 1.0;
			//currentPos.components[1] = 2.0 * yNorm - 1.0;

			currentPos.components[0] = xNorm;
			currentPos.components[1] = yNorm;

			let closest = closestPoint(currentPos.scale(rowMax), points);

			let dist = closest.distance;

			midLine.components[0] = xNorm;
			let midDist = subtract(currentPos, midLine).magnitude();

			//console.log('mid dist:', midDist);

			//console.log(dist);

			//let pixelColour = 120 + 135 * (1.0 - step(0.003, dist)); <- super bright!
			//let pixelColour = 120 + 60 * (1.0 - step(0.003, dist));

			let offset = (1 + noise.get2DNoise(xNorm, yNorm));

			let pixelColour = 50 + (140 * (1.0 - step(0.003, dist))) + (40 * offset);

			//let pixelColour = 120 + clamp(0, 135, 135 * ((1.0 - step(0.003, dist)) + (1.0 - step(0.02, midDist))));
			//let pixelColour = 120 + 60 * offset;
			//let pixelColour = 120 + 135 * (1.0 - step(0.01, midDist));

			/*for (let i  = 0; i < points.length; i++) {

				let d = subtract(currentPos, points[i].location).magnitude();
				pixelColour -= (100 * (1.0 - step(points[i].radius, d)));
			}*/

			//pixelColour = clamp(0, 255, pixelColour);


			buffer[index] = pixelColour;
			buffer[index + 1] = pixelColour;
			buffer[index + 2] = pixelColour;
			buffer[index + 3] = pixelColour;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generateCellularLeafTexture(width, height, noChannels) {

	let points = [];

	for (let i = 0; i < 200; i++) {
		points.push({'location': new Vector([2.0 * Math.random() - 1.0, 2.0 * Math.random() - 1.0]), 'radius': 0.1 - (0.05 * Math.random())});
	}

	let buffer = new Uint8Array(width * height * noChannels);

	let centre = new Vector([0, 0]);

	let currentPos = new Vector([0, 0]);

	var xNorm, yNorm;

	let index = 0;

	let rMax = 1.0;

	for (let y = 0; y < height; y++) {

		yNorm = y / (height - 1);

		for (let x = 0; x < width; x++) {

			let pixelColour = 120;

			xNorm = x / (width - 1);

			currentPos.components[0] = 2.0 * xNorm - 1.0;
			currentPos.components[1] = 2.0 * yNorm - 1.0;

			for (let i  = 0; i < points.length; i++) {

				let d = subtract(currentPos, points[i].location).magnitude();
				pixelColour += (135 * (1.0 - smoothStep(0.9 * points[i].radius, points[i].radius, d)));
			}

			pixelColour = clamp(0, 255, pixelColour);

			buffer[index] = pixelColour;
			buffer[index + 1] = pixelColour;
			buffer[index + 2] = pixelColour;
			buffer[index + 3] = pixelColour;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generateRadialLeafTexture(width, height, noChannels) {

	let buffer = new Uint8Array(width * height * 4);

	let index = 0;

	let currentPos = new Vector([0, 0]);

	for (let x = 0; x < width; x++) {

		let xNorm = x / (width - 1);

		for (let y = 0; y < height; y++) {

			let yNorm = y / (height - 1);

			let lighter = new Vector([220, 220, 220]);
			let darker = new Vector([120, 120, 120]);

			let distance = xNorm;

			const lowerThreshold = 0.6;
			const upperThreshold = 0.8;


			let s1 = smoothStep(lowerThreshold, upperThreshold, xNorm);

			let baseColour = add(darker.scale(1 - s1), lighter.scale(s1));

			buffer[index] = baseColour.components[0];
			buffer[index + 1] = baseColour.components[1];
			buffer[index + 2] = baseColour.components[2];
			buffer[index + 3] = 255;

			//console.log(baseColour.components);

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generateLeafTexture3(leafSurface, width, height, noChannels) {

	let buffer = new Uint8Array(width * height * 4);

	let index = 0;

	let currentPos = new Vector([0, 0]);

	for (let x = 0; x < width; x++) {

		let xNorm = x / (width - 1);

		for (let y = 0; y < height; y++) {

			let yNorm = y / (height - 1);

			let lighter = new Vector([220, 220, 220]);
			let darker = new Vector([120, 120, 120]);

			//let distance = xNorm

			let baseColour = new Vector([b, b, b]);


			buffer[index] = baseColour.components[0];
			buffer[index + 1] = baseColour.components[1];
			buffer[index + 2] = baseColour.components[2];
			buffer[index + 3] = 255;

			//console.log(baseColour.components);

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

//var noColumns = 8;
var columns = 16;
var rows = 3;

var segments = [1, 0.7, 0.5, 0.4, 0.3, 0.25]
var noSegments = segments.length;
var squashFactor = 1;

function generatePoints(noRows, noColumns) {

	let points = [];

	for (let row = 0; row < noRows; row++) {

		for (let col = 0; col < noColumns; col++) {

			points.push([(col / noColumns) + (Math.random() / noColumns),
							(row / noRows) + (Math.random() / noRows)]);
		}

		let firstPoint = points[points.length - noColumns];
		let lastPoint = points[points.length - 1];

		points.push([1 + firstPoint[0], firstPoint[1]]);
		points.push([(-1 / noColumns) + (lastPoint[0] - ((noColumns - 1) / noColumns)), lastPoint[1]]);
	}

	return points;
}

function closestPointFrom(xNorm, yNorm, points) {

	let minDistance = 100000;
	var closest;

	for (let i = 0; i < points.length; i++) {

		let point = points[i];

		let distance = Math.sqrt((point[0] - xNorm)**2 + (squashFactor / noSegments) * (point[1] - (yNorm % 1))**2)

		if (distance < minDistance) {

			closest = point;
			minDistance = distance;
		}
	}

	return minDistance;
}

function closestPointFrom2(xNorm, yNorm, points) {

	let minDistance = 100000;
	var closest;

	for (let i = 0; i < points.length; i++) {

		let point = points[i];

		let distance = Math.sqrt((point[0] - xNorm)**2 + (point[1] - yNorm)**2)

		if (distance < minDistance) {

			closest = point;
			minDistance = distance;
		}
	}

	return minDistance;
}

export function generateBirchTexture(width, height) {

	let buffer = new Uint8Array(width * height * 4);

	let noise = new FastSimplexNoise({frequency: 2.0, octaves: 8});
	let points = generatePoints(rows, columns);

	//console.log(points);

	let index = 0;

	for (let x = 0; x < width; x++) {

		let xNorm = x / (width - 1);

		for (let y = 0; y < height; y++) {

			let yNorm = y / (height - 1);

			let angle = 2.0 * Math.PI * xNorm;

			/*let n = 0;
			let amp = 1;
			let ampSum = 0;
			let freq = 1;

			for (let octave = 0; octave < noOctaves; octave++) {

				n += amp * noise.noise3D(freq * Math.cos(angle), freq * Math.sin(angle), freq * noColumns * yNorm);
				amp /= 2;
				freq *= 2;
				ampSum += amp;

			}*/

			let offset = 1 + noise.get3DNoise(Math.cos(angle), Math.sin(angle), columns * yNorm);
			let distance = closestPointFrom(xNorm + 0.05 * offset, noSegments * (yNorm + 0.005 * offset), points);

			//let offset = 1 + noise.noise3D(freq * Math.cos(angle), freq * Math.sin(angle), freq * noColumns * yNorm);
			/*let d1 = smoothStep(0.0, 0.02, distance)
            let d2 = smoothStep(0.02, 0.04, distance)
            let d3 = smoothStep(0.04, 0.1, distance)*/

            /*let d1 = smoothStep(0.0, 0.01, distance)
            let d2 = smoothStep(0.01, 0.03, distance)
            let d3 = smoothStep(0.03, 0.06, distance)*/

            let d1 = smoothStep(0.0, 0.0025, distance)
            let d2 = smoothStep(0.0025, 0.0075, distance)
            let d3 = smoothStep(0.0075, 0.015, distance)

            let r = Math.floor(255 * ((0.0 * (1.0 - d1) + d1 * 0.4) + (d2 * 0.2) + (d3 * 0.4)));
            let g = Math.floor(255 * ((0.0 * (1.0 - d1) + d1 * 0.2) + (d2 * 0.4) + (d3 * 0.4)));
            let b = Math.floor(255 * ((0.0 * (1.0 - d1) + d1 * 0.0) + (d2 * 0.6) + (d3 * 0.23)));

			buffer[index] = r;
			buffer[index + 1] = g;
			buffer[index + 2] = b;
			buffer[index + 3] = 255;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generateGradientWoodTexture(baseColour, bodyColour, width, height) {

	let buffer = new Uint8Array(width * height * 4);
	let noise = new FastSimplexNoise({frequency: 2.0, octaves: 2});

	let noRows = rowMax;
	let noColumns = colMax;
	let points = generatePoints(32, 32);

	//for (let p = 0; p < pointsRaw.length; p++) {
	//	points.push(new Vector(pointsRaw[p]));
	//}

	for (let x = 0; x < rowMax; x++) {

		points.push([]);

		for (let y = 0; y < colMax; y++) {

			points[x].push(new Vector([Math.random(), Math.random()]));
		}
	}

	let currentPos = new Vector([0.0, 0.0]);

	let index = 0;

	for (let x = 0; x < width; x++) {

		let xNorm = x / (width - 1);

		for (let y = 0; y < height; y++) {

			let yNorm = y / (height - 1);

			//let bodyColour = new Vector([112, 97, 80]);
			//let baseColour = new Vector([48, 45, 41]);

			let threshold = 0.5;
			let weight = smoothStep(0, threshold, yNorm);

			let colour = add(bodyColour.scale(weight), baseColour.scale(1 - weight));

			buffer[index] = colour.components[0];
			buffer[index + 1] = colour.components[1];
			buffer[index + 2] = colour.components[2];
			buffer[index + 3] = 255;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generatePotTexture(width, height) {

	let buffer = new Uint8Array(width * height * 4);
	let noise = new FastSimplexNoise({frequency: 1.0, octaves: 6});

	let index = 0;

	for (let x = 0; x < width; x++) {

		let xNorm = x / (width - 1);

		for (let y = 0; y < height; y++) {

			let yNorm = y / (height - 1);

			const beige = new Vector([0.96, 0.96, 0.86]); //<- this one
			//const beige = new Vector([0.66, 0.66, 0.52]);
			//const beige = new Vector([0.9, 0.9, 0.7]);
			//const green = new Vector([0.5, 0.5, 0.2]); <- this one
			//const green = new Vector([0.46, 0.46, 0.27]);
			const green = new Vector([0.5, 0.4, 0.2]);

			const darkDarkBrown = new Vector([0.4, 0.2, 0.15]);
			const darkBrown = new Vector([0.5, 0.4, 0.2]);

			let s1 = smoothStep(0.0, 0.5, yNorm);

			let baseColour = add(green.scale(1 - s1), beige.scale(s1)).scale(1.0 - step(0.5, yNorm));

			let s2 = smoothStep(0.5, 1.0, yNorm);

			let topHalf = subtract(add(beige.scale(1 - s2), green.scale(s2)), baseColour);

			//baseColour *= step(0.5, yNorm);
			baseColour = add(baseColour, topHalf.scale(step(0.5, yNorm)));

			//let noise2D = noise.get2DNoise(xNorm * 200, yNorm * 200);

			//let subValue = 0.7 * smoothStep(0.5, 0.75, noise2D);
			//baseColour = subtract(baseColour, new Vector([subValue, subValue, subValue]));

			// Use half of the 'canvas'
			baseColour = baseColour.scale(1.0 - step(0.5, xNorm));

			baseColour = add(baseColour, subtract(add(darkDarkBrown.scale(1 - yNorm), darkBrown.scale(yNorm)), baseColour).scale(step(0.5, xNorm)));

			buffer[index] = 255 * clamp(0, 255, baseColour.components[0]);
			buffer[index + 1] = 255 * clamp(0, 255, baseColour.components[1]);
			buffer[index + 2] = 255 * clamp(0, 255, baseColour.components[2]);

			buffer[index + 3] = 255;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generatePlainPotTexture(width, height) {

	let buffer = new Uint8Array(width * height * 4);

	let index = 0;

	for (let x = 0; x < width; x++) {

		let xNorm = x / (width - 1);

		for (let y = 0; y < height; y++) {

			let yNorm = y / (height - 1);

			const baseColour = new Vector([1.0, 1.0, 1.0]);

			buffer[index] = 255 * clamp(0, 255, baseColour.components[0]);
			buffer[index + 1] = 255 * clamp(0, 255, baseColour.components[1]);
			buffer[index + 2] = 255 * clamp(0, 255, baseColour.components[2]);
			buffer[index + 3] = 255;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generateGradientPotTexture(colourStart, colourEnd, width, height) {

	let buffer = new Uint8Array(width * height * 4);
	let noise = new FastSimplexNoise({frequency: 1.0, octaves: 6});

	let index = 0;

	for (let x = 0; x < width; x++) {

		let xNorm = x / (width - 1);

		for (let y = 0; y < height; y++) {

			let yNorm = y / (height - 1);

			//const yellow = new Vector([1.0, 0.9, 0.24]);
			//const orange = new Vector([0.96, 0.44, 0.05]);

			let s1 = smoothStep(0.0, 1.0, yNorm);

			let baseColour = add(colourStart.scale(1 - s1), colourEnd.scale(s1));

			//baseColour *= step(0.5, yNorm);

			// Use half of the 'canvas'
			baseColour = baseColour.scale(1.0 - step(0.5, xNorm));

			buffer[index] = 255 * clamp(0, 255, baseColour.components[0]);
			buffer[index + 1] = 255 * clamp(0, 255, baseColour.components[1]);
			buffer[index + 2] = 255 * clamp(0, 255, baseColour.components[2]);

			buffer[index + 3] = 255;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generateWavyPotTexture(width, height) {

	let buffer = new Uint8Array(width * height * 4);
	let noise = new FastSimplexNoise({frequency: 1.0, octaves: 1});

	let index = 0;

	for (let x = 0; x < width; x++) {

		let xNorm = x / (width - 1);

		for (let y = 0; y < height; y++) {

			let yNorm = y / (height - 1);

			const lightTeal = new Vector([0.3, 0.7, 0.7]);
			const darkTeal = new Vector([0, 0.3, 0.3]);

			const angle = 4.0 * Math.PI * xNorm;

			const yNormScaled = Math.abs(Math.floor(8.0 * (yNorm + 0.1 * noise.get3DNoise(Math.cos(angle), Math.sin(angle), yNorm))) % 2);

			let baseColour = add(lightTeal.scale(yNormScaled), darkTeal.scale(1 - yNormScaled));

			// Use half of the 'canvas'
			baseColour = baseColour.scale(1.0 - step(0.5, xNorm));

			buffer[index] = 255 * clamp(0, 255, baseColour.components[0]);
			buffer[index + 1] = 255 * clamp(0, 255, baseColour.components[1]);
			buffer[index + 2] = 255 * clamp(0, 255, baseColour.components[2]);

			buffer[index + 3] = 255;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

const indigo = new Vector([75, 0, 130]);

export function generateFlowerTexture(colourInfo, width, height) {

	let buffer = new Uint8Array(width * height * 4);

	let index = 0;

	let currentPos = new Vector([0, 0]);

	for (let x = 0; x < width; x++) {

		let xNorm = x / (width - 1);

		for (let y = 0; y < height; y++) {

			let yNorm = y / (height - 1);

			/*let red = new Vector([255, 0, 0]);
			let yellow = new Vector([255, 204, 0]);

			let white = new Vector([255, 255, 255]);
			let purple = new Vector([102, 0, 51]);*/

			let distance = xNorm;

			const threshold = 0.2;

			let s1 = smoothStep(0.0, colourInfo.innerThreshold, xNorm);

			let baseColour = add(colourInfo.colourA.scale(1 - s1), colourInfo.colourB.scale(s1));

			//let baseColour = add(red.scale(1 - distance), yellow.scale(distance));

			let s2 = smoothStep(colourInfo.innerThreshold, 1.0, xNorm);
			let body = add(colourInfo.colourB.scale(1 - s2), colourInfo.colourC.scale(s2));
			baseColour = add(baseColour, subtract(body, baseColour).scale(step(threshold, xNorm)));

			buffer[index] = baseColour.components[0];
			buffer[index + 1] = baseColour.components[1];
			buffer[index + 2] = baseColour.components[2];
			buffer[index + 3] = 255;

			//console.log(baseColour.components);

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}

export function generateMonochromeTexture(colour, width, height) {

	let buffer = new Uint8Array(width * height * 4);

	let index = 0;

	for (let x = 0; x < width; x++) {

		for (let y = 0; y < height; y++) {

			buffer[index] = 255 * colour.components[0];
			buffer[index + 1] = 255 * colour.components[1];
			buffer[index + 2] = 255 * colour.components[2];
			buffer[index + 3] = 255;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);
}



export function generateStumpTexture(barkColour, stumpColour, width, height) {

	let buffer = new Uint8Array(width * height * 4);
	let noise = new FastSimplexNoise({frequency: 1.0, octaves: 6});

	let index = 0;

	let currentPos = new Vector([0, 0]);

	for (let y = 0; y < width; y++) {

		let yNorm = y / (width - 1);

		for (let x = 0; x < height; x++) {

			let xNorm = x / (height - 1);

			currentPos.components[0] = (2.0 * xNorm) - 1.0;
			currentPos.components[1] = (2.0 * yNorm) - 1.0;

			let theta = Math.atan2(currentPos.components[1], currentPos.components[0]) + Math.PI;

			let distance = currentPos.magnitude();

			const outerThreshold = 0.9 + (0.1 * (Math.cos(3 * theta) ** 2.0));
			const outerThreshold2 = 0.9 + (0.1 * (Math.cos(3 * (theta + 0.5*Math.PI)) ** 2.0));

			const innerThreshold = (0.9 * outerThreshold) + (0.05 * noise.get3DNoise(currentPos.components[0], currentPos.components[1], 1.0));

			const ringComponent = Math.floor(15 * (distance + 0.05 * noise.get3DNoise(currentPos.components[0], currentPos.components[1], outerThreshold2)) * outerThreshold2) % 2;

			let colour = add(stumpColour.scale(0.7 * ringComponent), stumpColour.scale(1.0 - ringComponent));

			colour = colour.scale(1.0 - step(innerThreshold, distance));

			colour = add(colour, barkColour.scale(step(innerThreshold, distance)));

			const alpha = 1.0 - step(outerThreshold, distance);

			buffer[index] = clamp(0, 255, colour.components[0]);
			buffer[index + 1] = clamp(0, 255, colour.components[1]);
			buffer[index + 2] = clamp(0, 255, colour.components[2]);
			buffer[index + 3] = alpha;

			index += 4;
		}
	}

	return Texture.LocalTexture(width, height, buffer);

}

function step(threshold, x) {
	return x >= threshold ? 1 : 0;
}

function smoothStep(start, end, x) {

	if (x >= start) {

		if (x <= end) {
			return (x - start) / (end - start);
		}

		return 1;
	}

	return 0;
}

function clamp(start, end, x) {
	if (x >= start) {

		if (x <= end) {
			return x;
		}

		return end;
	}

	return start;
}

function closestPoint(pos, points) {

	let row = Math.floor(pos.components[0]);
	let col = Math.floor(pos.components[1]);

	let dir = new Vector([0, 0]);
	let nearestGrid = [0, 0];

	let minDistance = 1000;

	for (let dRow = -1; dRow <= 1; dRow++) {

		for (let dCol = -1; dCol <= 1; dCol++) {

			if (row + dRow >= 0 && row + dRow < points[0].length && col + dCol >= 0 && col + dCol < points.length) {

				let point = points[row + dRow][col + dCol];

				dir.components[0] = (row + dRow + point.components[0]) - (pos.components[0]);
				dir.components[1] = (col + dCol + point.components[1]) - (pos.components[1]);

				let distance = dir.magnitude();

				if (distance < minDistance) {
					minDistance = distance;
					nearestGrid[0] = row + dRow;
					nearestGrid[1] = col + dCol;
				}
			}
		}
	}

	let minDistance2 = 1000;
	let nearestGrid2 = [0, 0];

	let row2 = nearestGrid[0];
	let col2 = nearestGrid[1];

	for (let dRow = -2; dRow <= 2; dRow++) {

		for (let dCol = -2; dCol <= 2; dCol++) {

			if (row2 + dRow >= 0 && row2 + dRow < points[0].length && col2 + dCol >= 0 && col2 + dCol < points.length) {

				let point = points[row2 + dRow][col2 + dCol];

				if (point != points[row2][col2]) {

					dir.components[0] = (row2 + dRow + point.components[0]) - (pos.components[0]);
					dir.components[1] = (col2 + dCol + point.components[1]) - (pos.components[1]);

					let distance = dir.magnitude();

					if (distance < minDistance2) {
						minDistance2 = distance;
						nearestGrid2[0] = row2 + dRow;
						nearestGrid2[1] = col2 + dCol;
					}
				}
			}
		}
	}

	let p1 = add(points[nearestGrid[0]][nearestGrid[1]], new Vector([nearestGrid[0], nearestGrid[1]]));
	let p2 = add(points[nearestGrid2[0]][nearestGrid2[1]], new Vector([nearestGrid2[0], nearestGrid2[1]]));

	let ab = subtract(p2, p1);
	ab = ab.equals(zeroVector2D) ? ab : ab.normalize();

	let midpoint = new Vector([0.5 * (p1.components[0] + p2.components[0]), 
								0.5 * (p1.components[1] + p2.components[1])]);

	let pm = subtract(midpoint, pos);

	let dist = Math.abs(dot(ab, pm));

	return {distance: dist / rowMax, ab: ab};
}