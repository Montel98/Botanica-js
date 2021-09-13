const leafVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec3 aMorphTarget;
attribute float aAge;

attribute mat4 offset;

varying vec3 vVertexPosition;
varying vec3 vNormal;

uniform mat4 camera;
uniform mat4 perspective;

//uniform float age;

void main() {

    vec3 currentPos = (aAge * aMorphTarget) + aAge * (aVertexPosition - (aAge * aMorphTarget));
    //vec3 currentPos = aVertexPosition;
    //vec3 currentPos = aMorphTarget + aAge * (aVertexPosition - aMorphTarget);

    gl_Position = perspective * camera * offset * vec4(currentPos, 1.0);

    vVertexPosition = vec3(offset * vec4(currentPos, 1.0));
    vNormal = aNormal;
}
`;

const leafFragmentShader = 
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

var termC = new FourierTerm(0.0, 0.7, 0.5, 2.0);
var termD = new FourierTerm(0.0, 0.2, 4.0, 2.0);
var termE  = new FourierTerm(0.0, 0.1, 12.0, 2.0); // 12 should be max

var fourier = new FourierSeries(0.0, [termC, termD, termE]);

const leafProfileStart = (x) => {
	return -0.3 * x;
}

const leafProfileEnd = (x) => {
	return 0.4 * x ** 2.0; 
}

const leafFunc = (foldFactor, foldFrequency, profileFunc, vMax) => { 
	return {
		aux(u, v) {
			this.r = v * fourier.sum(u);
		},

		x(u, v) {
			return 0.2 * ((this.r * (Math.cos(u))) - (vMax * fourier.sum(Math.PI) * Math.cos(Math.PI)));
		},

		y(u, v) {
			return 0.14 * this.r * Math.sin(u);
		},

		z(u, v) {
			return 0.2 * Math.abs(foldFactor * Math.sin(foldFrequency * this.r * Math.sin(u))) - profileFunc(this.r * Math.cos(u));
		}
	}
}

const leafSurface = new ParametricSurface(leafFunc(0.02, 10.0, leafProfileEnd, 0.2), 0.0, 2.0 * Math.PI, 0.0, 0.2);
const leafSurfaceStart = new ParametricSurface(leafFunc(0.1, 10.0, leafProfileStart, 0.2), 0.0, 2.0 * Math.PI, 0.0, 0.2);

const leafMapping = {
					vMin: leafSurface.vMin, 
					vMax: leafSurface.vMax,
					uMin: leafSurface.uMin, 
					uMax: leafSurface.uMax
					};

const leafGeometry = new ParametricGeometry(leafSurface, leafMapping, 200, 6, false, false, true);
const leafGeometryStart = new ParametricGeometry(leafSurfaceStart, leafMapping, 200, 6, false, false, false);
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

	static maxAge = 1.0;

	constructor() {

		super();

		const geometry = leafGeometry;
		const material = new Material(leafTexture);

		this.ages = [];
		this.basePoses = [];

		this.mesh = new InstancedMesh(material, geometry, 0);
		this.mesh.setInstanceBufferSize(40000);

		this.startRad = 0.002;

		this.mesh.addInstanceBufferAttribute('aAge', 
												1, 
												this.mesh.instanceBufferAttributes.bufferLength,
												this.ages
												);

		this.morphTargets = leafGeometryStart.vertices;

		//this.age = 0;
		this.growthRate = 0.1;

		geometry.addBufferAttribute('aMorphTarget', 3, geometry.bufferAttributes.bufferLength, this.morphTargets);

		this.mesh.shaders = shaderBuilder.customShader('leaf_shader', 
                                                        leafVertexShader, 
                                                        leafFragmentShader, {/*'age': new Vector([0.0])*/}
                                                        );

		this.colour = new Vector([Math.random(), Math.random(), Math.random()]);
		this.shaderUniforms = this.mesh.shaders.uniforms;
		this.shaderUniforms['ambientColour'] = this.colour;
	}

	addLeaves(noLeaves, poseMatrix, stem) {

		let radius = this.startRad + (stem.mesh.geometry.surface.functions.r(1.0) - this.startRad) * stem.tree.age;

		console.log(this.mesh.geometry.surface.eval(Math.PI, 0.2).components[0]);

		for (let leafIndex = 0; leafIndex < noLeaves; leafIndex++) {

			let randomAngle = (Math.PI * 0.25 * Math.random()) - (Math.PI * 0.125);

			let zAngle = (leafIndex * 2.0 * Math.PI) / noLeaves;

			let basePose = multiply(rotate4Z(zAngle), multiply(translate(radius, 0, 0), rotate4X(randomAngle)));
			this.basePoses.push({'parentStem': stem, 'poseMatrix': poseMatrix, 'xAngle': randomAngle, 'zAngle': zAngle});

			let localPose = multiply(poseMatrix, basePose);

			let newAge = new Vector([0.0]);

			this.mesh.addInstance(localPose, {'aAge': newAge});
		}
	}

	act(worldTime) {
		this.grow(worldTime);

		this.shaderUniforms['ambientColour'] = this.colour;
		//this.shaderUniforms['age'].components[0] = this.age;
	}

	grow(worldTime) {

		for (let i = 0; i < this.ages.length; i++) {
			let newAge = this.ages[i].components[0] + worldTime.dt * this.growthRate;

        	if (newAge >= Leaves.maxAge) {
            	newAge = Leaves.maxAge;
        	}

        	let parentStem = this.basePoses[i].parentStem;

        	let radius = this.startRad + (parentStem.mesh.geometry.surface.functions.r(1.0) - this.startRad) * parentStem.tree.age;

        	let basePose = multiply(rotate4Z(this.basePoses[i].zAngle), multiply(translate(radius, 0, 0), rotate4X(this.basePoses[i].xAngle)));

        	this.mesh.localMatrices[i] = multiply(this.basePoses[i].poseMatrix, basePose);
        	this.ages[i].components[0] = newAge;
		}
	}
}