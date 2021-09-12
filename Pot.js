const bezierPot = new BezierCubic(new Vector([0.0, 0.0, 0.0]),
								new Vector([0.4, 0.0, 0.0]),
								new Vector([0.1, 0.2, 0.0]),
								new Vector([0.2, 0.4, 0.0]))

const potFunc = (crossSection) => {

	return {

		aux(u, v) {

			this.path = crossSection.eval(u);
		},

		x(u, v) {

			return this.path.components[0] * Math.cos(v);
		},

		y(u, v) {

			return this.path.components[0] * Math.sin(v);
		},

		z(u, v) {

			return this.path.components[1];
		}
	}

}

const potSurface = new ParametricSurface(potFunc(bezierPot), 0.0, 1.0, 0.0, 2.0 * Math.PI);
const potMapping = {
					vMin: potSurface.vMin, 
					vMax: potSurface.vMax,
					uMin: potSurface.uMin, 
					uMax: potSurface.uMax
					};

const potTexture = new Texture('flower_stem1.png');
const potGeometry = new ParametricGeometry(potSurface, potMapping, 16, 32, false, false, true);

class Pot extends Entity {
	constructor() {

		super();

		const geometry = potGeometry;
		const material = new Material(potTexture);

		this.mesh = new Mesh(material, geometry);
		this.worldMatrix = identityMatrix;

		//this.colour = new Vector([0.15, 0.15, 0.4]);
		//this.colour = new Vector([0.8, 0.8, 0.8]);
		this.colour = new Vector([Math.random(), Math.random(), Math.random()]);

		this.mesh.shaders.uniforms['ambientColour'] = this.colour;
	}

	act(worldTime) {
		this.mesh.shaders.uniforms['ambientColour'] = this.colour;
	}
}