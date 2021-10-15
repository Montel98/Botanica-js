const rowMax = 32;
const colMax = 32;

function generateSoilTexture(width, height, noChannels) {

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

	return LocalTexture(width, height, buffer);
}

function generateLeafTexture(width, height, noChannels) {

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

	var xNorm, yNorm;

	let index = 0;

	let rMax = 1.0;

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

			//console.log(dist);

			let pixelColour = 120 + 135 * (1.0 - step(0.003, dist));

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

	return LocalTexture(width, height, buffer);
}

function generateLeafTexture1(width, height, noChannels) {

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

	return LocalTexture(width, height, buffer);
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