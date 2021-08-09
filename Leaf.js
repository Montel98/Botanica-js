var termC = new FourierTerm(0.0, 1.0, 0.5, 2.0);
var termD = new FourierTerm(0.0, 0.3, 6.0, 2.0);
var termE  = new FourierTerm(0.0, 0.1, 18.0, 2.0);
var fourier = new FourierSeries(0.0, [termC, termD, termE]);

const leafFunc = {
	aux(u, v) {
		this.xy = v * fourier.sum(u);
	},

	x(u, v) {
		return this.xy * Math.cos(u);
	},

	y(u, v) {
		return this.xy * Math.sin(u);
	},

	z(u, v) {
		return 1.0;
	}
}

const leafSurface = new ParametricSurface(leafFunc, 0.0, 2.0 * Math.PI, 0.0, 0.2);
const leafMapping = {
					vMin: leafSurface.vMin, 
					vMax: leafSurface.vMax,
					uMin: leafSurface.uMin, 
					uMax: leafSurface.uMax
					};

const leafGeometry = new ParametricGeometry(leafSurface, leafMapping, 128, 2, false, false, true);
const leafTexture = new Texture('flower_stem1.png');

class Leaf {
	constructor() {
		const geometry = leafGeometry;
		const material = new Material(leafTexture);
		this.mesh = new Mesh(material, geometry);
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