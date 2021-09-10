const stemVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec3 aMorphTarget;
attribute vec3 aMorphTarget2;
attribute vec3 aMorphTarget3;

varying vec3 vVertexPosition;
varying vec3 vNormal;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float du;
uniform float age;

//uniform vec3 direction;

void main() {

	vec3 currentGirthPos = aMorphTarget2 + age * (aVertexPosition - aMorphTarget2);
	vec3 currentGirthPos2 = aMorphTarget3 + age * (aMorphTarget - aMorphTarget3);

	//vec3 currentPos = aMorphTarget + du * (aVertexPosition - aMorphTarget);
	vec3 currentPos = currentGirthPos2 + du * (currentGirthPos - currentGirthPos2);

	gl_Position = perspective * camera * world * vec4(currentPos, 1.0);

	vVertexPosition = vec3(world * vec4(currentPos, 1.0));
	vNormal = aNormal;
}
`;

const stemFragmentShader = 
`
precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;

uniform vec3 ambientColour;

void main() {
	vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);
	vec3 lightPos = normalize(vec3(1.0, 1.0, 1.0) - vVertexPosition);

							float ambient = 0.2;
							float diffuse = clamp(dot(norm, lightPos), 0.0, 1.0);
							float light = ambient + diffuse;

							gl_FragColor = vec4(light * ambientColour, 1.0); //0.2	
}

`;


const bezier = new BezierCubic(new Vector([0.0, 0.0, 0.0]), 
					new Vector([0.0, 0.0, 0.2]), 
					new Vector([0.0, 0.0, 0.4]), 
					new Vector([0.0, 0.0, 0.6]));

const crossSection = (radius, v, axis) => {

	let position = add(axis.left.scale(radius * Math.cos(v)), axis.up.scale(radius * Math.sin(v)));

	position = position.scale(0.9 + 0.1 * Math.cos(3 * v) ** 2.0);

	return position;
}

var stemFunc = (axis, path, radius, radiusProperties) => {
	return {

		path: path,

		r(u) {
			return radius(radiusProperties.radiusStart, radiusProperties.radiusEnd, radiusProperties.shift, u);
		},

		aux(u, v) {

			this.bezierPoint = path.eval(u);
			this.bezierGradient = path.derivative(u);

			this.crossSectionPoint = crossSection(this.r(u), v, axis);
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

class Stem extends Entity {

	static terminalLength = 1.0;

	constructor(geometry, babyGeometry) {

		super();

		const textureTest = new Texture('https://64.media.tumblr.com/458dd49feded9a00cc1f6e9f6664c1bc/ad9a34ac4fa33c3f-69/s540x810/aea77a994bf1bddbb3c6c04401c609c694ceac6d.jpg');
		const materialTest = new Material(textureTest);

		this.mesh = new Mesh(materialTest, geometry);

		//this.worldMatrix = translate(-0.2, -0.2, 0);
		this.worldMatrix = identityMatrix;

		this.colour = new Vector([0.25, 0.18, 0.12]);
		//this.colour = new Vector([Math.random(), Math.random(), Math.random()]);
		this.mesh.shaders.uniforms['ambientColour'] = this.colour;

		// Experimental

		this.tree = null;

		this.stringLoc = 0; // Corresponding location in L-String this stem corresponds to

		this.stemLength = 0.0;
		//this.growthRate = 0.05; // Growth Rate in units/second
		this.growthRate = 0.2;

		this.morphTargets = [];
		this.girthMorphTargets = babyGeometry.vertices;
		this.girthMorphTargets2 = [];

		/*for (let i = 0; i < geometry.vertices.length; i++) {
			this.morphTargets.push(new Vector([0, 0, 0]));
		}*/

		for (let i = 0; i < geometry.vertices.length; i++) {

			this.morphTargets[i] = geometry.vertices[(2 * (Math.floor(i / 2)))];
			this.girthMorphTargets2[i] = babyGeometry.vertices[(2 * (Math.floor(i / 2)))];
		}

		geometry.addBufferAttribute('aMorphTarget', 3, geometry.bufferAttributes.bufferLength, this.morphTargets);
		geometry.addBufferAttribute('aMorphTarget2', 3, geometry.bufferAttributes.bufferLength, this.girthMorphTargets);
		geometry.addBufferAttribute('aMorphTarget3', 3 , geometry.bufferAttributes.bufferLength, this.girthMorphTargets2);

		this.mesh.shaders = shaderBuilder.customShader('meristem_shader', 
														stemVertexShader, 
														stemFragmentShader, {'du': new Vector([0.0]), 'age': new Vector([0.0])}
														);
	}

	act(worldTime) {

		this.grow(worldTime);

		this.mesh.shaders.uniforms['ambientColour'] = this.colour;
		this.mesh.shaders.uniforms['du'].components[0] = this.stemLength;
		this.mesh.shaders.uniforms['age'].components[0] = this.tree.age;

	}

	grow(worldTime) {

		let newLength = this.stemLength + this.growthRate * worldTime.dt;

		if (newLength >= Stem.terminalLength) {
			newLength = Stem.terminalLength;
		}

		this.stemLength = newLength;
	}

	isMaxHeight() {
		return this.stemLength == Stem.terminalLength;
	}
}

//const stemSurface = new ParametricSurface(stemFunc(bezier, 0.005), 0.0, 1.0, 0.0, 2.0 * Math.PI);