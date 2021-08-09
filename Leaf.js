var termC = new FourierTerm(0.0, 1.0, 0.5, 2.0);
var termD = new FourierTerm(0.0, 0.3, 6.0, 2.0);
var termE  = new FourierTerm(0.0, 0.1, 18.0, 2.0);
var fourier = new FourierSeries(0.0, [termC, termD, termE]);

const leafFunc = {
	aux(u, v) {
		this.r = v * fourier.sum(u);
	},

	x(u, v) {
		return this.r * Math.cos(u);
	},

	y(u, v) {
		return this.r * Math.sin(u);
	},

	z(u, v) {
		//return Math.log(Math.abs(0.3 * this.r * Math.sin(u)) + 1.0);
		return Math.abs(0.02 * Math.sin(10.0 * this.r * Math.sin(u))) - ((this.r * Math.cos(u)) ** 2.0);
		//return 0.0;
	}
}

const leafSurface = new ParametricSurface(leafFunc, 0.0, 2.0 * Math.PI, 0.0, 0.2);
const leafMapping = {
					vMin: leafSurface.vMin, 
					vMax: leafSurface.vMax,
					uMin: leafSurface.uMin, 
					uMax: leafSurface.uMax
					};

const leafGeometry = new ParametricGeometry(leafSurface, leafMapping, 200, 8, false, false, true);
const leafTexture = new Texture('flower_stem1.png');

class Leaf extends Entity {
	constructor() {

		super();

		const geometry = leafGeometry;
		const material = new Material(leafTexture);
		this.mesh = new Mesh(material, geometry);

		this.worldMatrix = multiply(translate(-0.5, -0.5, 0.0), scale(0.5, 0.3, 0.5));
	}

	act() {

	}
}

// Test instancing:

class Leaves {
	constructor() {
		const geometry = leafGeometry;
		const material = new Material(leafTexture);

		this.mesh = new InstancedMesh(material, geometry);

		this.mesh.addInstance(new Vector([1, 1, 1]));
		this.mesh.addInstance(new Vector([0.5, 0.5, 0.5]));
		this.mesh.addInstance(new Vector([0, 0, 0]));
	}
}