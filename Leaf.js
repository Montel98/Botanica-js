/*var termC = new FourierTerm(0.0, 1.0, 0.5, 2.0);
var termD = new FourierTerm(0.0, 0.3, 6.0, 2.0);
var termE  = new FourierTerm(0.0, 0.1, 18.0, 2.0);*/

var termC = new FourierTerm(0.0, 1.0, 0.5, 2.0);
var termD = new FourierTerm(0.0, 0.7, 4.0, 2.0);
var termE  = new FourierTerm(0.0, 0.3, 12.0, 2.0); // 12 should be max

var fourier = new FourierSeries(0.0, [termC, termD, termE]);

const leafFunc = (foldFactor, droopFactor) => { 
	return {
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
			return Math.abs(foldFactor * Math.sin(10.0 * this.r * Math.sin(u))) - ((droopFactor * this.r * Math.cos(u)) ** 2.0);
		}
	}
}

const leafSurface = new ParametricSurface(leafFunc(0.02, 1.2), 0.0, 2.0 * Math.PI, 0.0, 0.2);
//const leafSurfaceStart = new ParametricSurface()

const leafMapping = {
					vMin: leafSurface.vMin, 
					vMax: leafSurface.vMax,
					uMin: leafSurface.uMin, 
					uMax: leafSurface.uMax
					};

const leafGeometry = new ParametricGeometry(leafSurface, leafMapping, 200, 6, false, false, true);
//const leafGeometryStart = new ParametricGeometry()
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

class Leaves extends Entity {
	constructor() {

		super();

		const geometry = leafGeometry;
		const material = new Material(leafTexture);

		this.mesh = new InstancedMesh(material, geometry, 0);
		this.mesh.setInstanceBufferSize(10000);

		let offset = leafGeometry.surface.eval(Math.PI, leafGeometry.surface.vMax);

		this.xScale = 0.1;
		this.yScale = 0.06;
		this.zScale = 0.1;

		this.dx = -this.xScale * offset.components[0];
		this.dy = -this.yScale * offset.components[1];

		const geometryStart = 

		this.morphTargets = [];

		this.colour = new Vector([Math.random(), Math.random(), Math.random()]);
		this.shaderUniforms = this.mesh.shaders.uniforms;
		this.shaderUniforms['ambientColour'] = this.colour;
	}

	addLeaves(noLeaves, poseMatrix) {
		for (let leafIndex = 0; leafIndex < noLeaves; leafIndex++) {

			let randomAngle = (Math.PI * 0.25 * Math.random()) - (Math.PI * 0.125);

			let basePose = multiply(rotate4Z((leafIndex * 2.0 * Math.PI) / noLeaves), 
							multiply(translate(this.dx, this.dy, 0), 
							multiply(rotate4X(randomAngle), scale(this.xScale, this.yScale, this.zScale))));

			let localPose = multiply(poseMatrix, basePose);

			this.mesh.addInstance(localPose);
		}
	}

	act() {
		this.shaderUniforms['ambientColour'] = this.colour;
	}
}