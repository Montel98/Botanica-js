const bezier = new BezierCubic(new Vector([0.0, 0.0, 0.0]), 
					new Vector([0.0, 0.0, 1.0]), 
					new Vector([0.0, 0.0, 2.0]), 
					new Vector([0.0, 0.0, 3.0]));

/*const bezier = new BezierCubic(new Vector([0.0, 0.0, 0.0]), 
					new Vector([1.0, 1.0, 1.0]), 
					new Vector([2.0, 2.0, 2.0]), 
					new Vector([3.0, 3.0, 3.0]));*/

const crossSection = (radius, v, gradient) => {

	var left;
	var up;

	let gradientNorm = gradient.normalize();


	left = cross(gradientNorm, upVector);

	if (/*!(Math.abs(dot(gradientNorm, upVector)) == 1)*/ !(left.equals(zeroVector))) {

		left = left.normalize();
		up = cross(left, gradientNorm).normalize();
	}
	else {
		left = cross(gradientNorm, leftVector).normalize();
		up = cross(left, gradientNorm).normalize();
	}

	let position = add(left.scale(radius * Math.cos(v)), up.scale(radius * Math.sin(v)));

	return position;
}

var stemFunc = (path, radius) => {
	return {
		r(u) {
			//return 0.2 + (0.3 * Math.exp(-5.0 * u));
			return radius;
		},

		bla(u) {
			return path;
		},

		aux(u, v) {
			this.bezierPoint = path.eval(u);
			this.bezierGradient = path.derivative(u);

			this.crossSectionPoint = crossSection(this.r(u), v, this.bezierGradient);
		},

		x(u, v) {
			return this.bezierPoint.components[0] + this.crossSectionPoint.components[0];
		},

		y(u, v) {
			return this.bezierPoint.components[1] + this.crossSectionPoint.components[1];
		},

		z(u, v) {
			return this.bezierPoint.components[2] + this.crossSectionPoint.components[2];
		}
	}
}

class Stem {

	constructor(surface) {

		//const textureTest = new Texture('flower_stem1.png');
		//const textureTest = new Texture('https://1.bp.blogspot.com/-GGitkLBsnsQ/WOvE3VpBODI/AAAAAAAAEEY/iy7SedxxjDszylYIkAEiPC_Neu384FongCLcB/s1600/BS_Flower_Stems_512_15.png');
		const textureTest = new Texture('https://64.media.tumblr.com/458dd49feded9a00cc1f6e9f6664c1bc/ad9a34ac4fa33c3f-69/s540x810/aea77a994bf1bddbb3c6c04401c609c694ceac6d.jpg');
		//const textureTest = new Texture('https://i.imgur.com/yLGmqUK.jpg');
		//const textureTest = new Texture('https://www.filterforge.com/filters/2674-normal.jpg');
		const materialTest = new Material(textureTest);

		let stMapping = {
							vMin: surface.vMin, 
							vMax: surface.vMax,
							uMin: surface.uMin, 
							uMax: surface.uMax
						};

		const geometry = new ParametricGeometry(surface, stMapping, 2, 16, true, false, true);

		this.mesh = new Mesh(materialTest, geometry);

		this.worldMatrix = identityMatrix;
	}

	act() {

	}
}

const stemSurface = new ParametricSurface(stemFunc(bezier, 0.02), 0.0, 1.0, 0.0, 2.0 * Math.PI);