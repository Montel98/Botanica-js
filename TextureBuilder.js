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

	let points = [];

	for (let i = 0; i < 40; i++) {
		points.push({'location': new Vector([2.0 * Math.random() - 1.0, 2.0 * Math.random() - 1.0]), 'radius': 0.08 - (0.04 * Math.random())});
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
			let pixelColour = 220;

			xNorm = x / (width - 1);

			currentPos.components[0] = 2.0 * xNorm - 1.0;
			currentPos.components[1] = 2.0 * yNorm - 1.0;

			for (let i  = 0; i < points.length; i++) {

				let d = subtract(currentPos, points[i].location).magnitude();
				pixelColour -= (/*175*/100 * (1.0 - step(points[i].radius, d)));
			}

			pixelColour = clamp(110, 255, pixelColour);


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

/*const planeTexture = generateLeafTexture(1024, 1024, 4);

class PlaneEntity extends Entity {

	constructor(camera) {
		super();

		const geometry = Plane();
		const material = new Material(planeTexture);
		material.maps['textureMap'] = planeTexture;
		this.mesh = new Mesh(material, geometry);

		this.mesh.shaders = shaderBuilder.customShader('plane_shader',
														planeVertexShader,
														planeFragmentShader, {}
														);

		this.colour = new Vector([0.05, 0.2, 0.0]);
		//this.colour = new Vector([Math.random(), Math.random(), Math.random()]);

		this.mesh.shaders.uniforms['ambientColour'] = this.colour;
		this.mesh.shaders.uniforms['eye'] = camera.getCameraPosition();

	}

	act(worldTime) {

		this.mesh.shaders.uniforms['ambientColour'] = this.colour;
		this.mesh.shaders.uniforms['eye'] = camera.getCameraPosition();
	}
}*/