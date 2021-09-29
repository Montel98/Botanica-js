const leafVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec3 aMorphTarget;
attribute vec2 aTexCoord;

attribute float aAge;
attribute mat4 offset;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;

varying float vAge;

uniform mat4 camera;
uniform mat4 perspective;

//uniform float age;

void main() {

    vec3 currentPos = (aAge * aMorphTarget) + aAge * (aVertexPosition - (aAge * aMorphTarget));

    gl_Position = perspective * camera * offset * vec4(currentPos, 1.0);

    vVertexPosition = vec3(offset * vec4(currentPos, 1.0));
    vNormal = vec3(offset * vec4(aNormal, 1.0));
    vAge = aAge;
    vTexCoord = aTexCoord;
}
`;

const leafFragmentShader = 
`
precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec2 vTexCoord;

varying float vAge;

uniform vec3 colourStart;
uniform vec3 colourEnd;

uniform sampler2D uTexture;

uniform vec3 eye;

void main() {
	vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);

	vec3 lightPos = vec3(0.0, -10.0, 10.0);
	vec3 lightDir = normalize(lightPos - vVertexPosition);

	float ambient = 0.2;
	float diffuse = 0.6 * clamp(dot(norm, lightDir), 0.0, 1.0);

	vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
	vec3 viewDirection = normalize(vVertexPosition - eye);

	float specular = 0.5 * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 16.0);
	//float specular = 0.0;

	float light = ambient + diffuse + specular;

	float ageTransformed = sqrt(vAge);

	float textureColour = texture2D(uTexture, vTexCoord).r;

	//float textureColour = fract(length(vec2(1.0) - 2.0 * vTexCoord));
	//float textureColour = floor(floor(12.0 * length(vec2(1.0) - 2.0 * vTexCoord)) / 2.0);

	vec3 ambientColour = (ageTransformed * colourEnd * textureColour) + ((1.0 - ageTransformed) * colourStart);

	gl_FragColor = vec4(light * ambientColour, 1.0); //0.2
}
`;

const leafProfileStart = (x) => {
	return -0.4 * x;
}

const leafProfileEnd = (x) => {
	return 0.4 * x ** 2.0; 
}

const leafFunc = (fourier, foldFactor, foldFrequency, profileFunc, vMax) => { 
	return {
		aux(u, v) {
			this.r = v * fourier.sum(u);
		},

		x(u, v) {
			return 0.14 * ((this.r * (Math.cos(u))) - (vMax * fourier.sum(Math.PI) * Math.cos(Math.PI)));
		},

		y(u, v) {
			return 0.1 * this.r * Math.sin(u);
		},

		z(u, v) {
			return 0.14 * Math.abs(foldFactor * Math.sin(foldFrequency * this.r * Math.sin(u))) - profileFunc(this.r * Math.cos(u));
		}
	}
}

//const leafTexture = new Texture('flower_stem1.png');

const leafTexture = generateLeafTexture(512, 512, 4);

// Test instancing:

class Leaves extends Entity {

	static maxAge = 1.0;

	constructor(sequence) {

		super();

		const geometry = this.generateGeometry(sequence);
		const material = new Material(leafTexture);
		material.maps['textureMap'] = leafTexture;

		this.ages = [];
		this.basePoses = [];

		this.mesh = new InstancedMesh(material, geometry, 0);
		this.mesh.setInstanceBufferSize(80000);

		this.startRad = 0.001;

		this.mesh.addInstanceBufferAttribute('aAge', 
												1, 
												this.mesh.instanceBufferAttributes.bufferLength,
												this.ages
												);

		this.growthRate = 0.05;

		this.mesh.shaders = shaderBuilder.customShader('leaf_shader', 
                                                        leafVertexShader, 
                                                        leafFragmentShader, {/*'age': new Vector([0.0])*/}
                                                        );

		this.colourStart = new Vector([0.2, 0.5, 0.1]);
		this.colourEnd = new Vector([Math.random(), Math.random(), Math.random()]);

		this.shaderUniforms = this.mesh.shaders.uniforms;
		this.shaderUniforms['colourStart'] = this.colourStart;
		this.shaderUniforms['colourEnd'] = this.colourEnd;

		//console.log(this.textureMapping());
	}

	addLeaves(noLeaves, poseMatrix, parentStem) {

		let stem = parentStem.stem;

		let radius = this.startRad + (stem.mesh.geometry.surface.functions.r(1.0) - this.startRad) * stem.tree.age;

		for (let leafIndex = 0; leafIndex < noLeaves; leafIndex++) {

			let randomAngle = (Math.PI * 0.25 * Math.random()) - (Math.PI * 0.125);

			let zAngle = (leafIndex * 2.0 * Math.PI) / noLeaves;

			let basePose = multiply(rotate4Z(zAngle), multiply(translate(radius, 0, 0), rotate4X(randomAngle)));
			this.basePoses.push({'parentStem': parentStem, 'poseMatrix': poseMatrix, 'xAngle': randomAngle, 'zAngle': zAngle});

			let localPose = multiply(poseMatrix, basePose);

			let newAge = new Vector([0.0]);

			this.mesh.addInstance(localPose, {'aAge': newAge});
		}
	}

	act(worldTime) {
		this.grow(worldTime);

		this.shaderUniforms['colourStart'] = this.colourStart;
		this.shaderUniforms['colourEnd'] = this.colourEnd;
	}

	grow(worldTime) {

		for (let i = 0; i < this.ages.length; i++) {
			let newAge = this.ages[i].components[0] + worldTime.dt * this.growthRate;

        	if (newAge >= Leaves.maxAge) {
            	newAge = Leaves.maxAge;
        	}

        	let parentStem = this.basePoses[i].parentStem;
        	let stem = parentStem.stem;

        	let radius = this.startRad + (stem.mesh.geometry.surface.functions.r(1.0) - this.startRad) * stem.tree.age;

        	let growthDir = parentStem.stackFrame.axis.forward.scale(0.03 * stem.stemLength);

        	let basePose = multiply(rotate4Z(this.basePoses[i].zAngle), multiply(translate(radius, 0, 0), rotate4X(this.basePoses[i].xAngle)));

        	this.mesh.localMatrices[i] = multiply(translate(...growthDir.components), multiply(this.basePoses[i].poseMatrix, basePose));
        	this.ages[i].components[0] = newAge;
		}
	}

	generateGeometry(sequence) {

		//let magnitudeA = sequence & 15;
        //let magnitudeB = (sequence & (15 << 4)) >> 4;

        let magnitudeA = Math.floor(16 * Math.random());
        let magnitudeB = Math.floor(magnitudeA * Math.random());

		let termA = new FourierTerm(0.0, 0.6, 0.5, 2.0);
        let termB = new FourierTerm(0.0, 0.3, 0.5 * magnitudeA, 2.0);
        let termC  = new FourierTerm(0.0, 0.1, 0.5 * magnitudeB, 2.0);

        let fourier = new FourierSeries(0.0, [termA, termB, termC]);

        const leafSurfaceEnd = new ParametricSurface(leafFunc(fourier, 0.02, 20.0, leafProfileEnd, 0.2), 0.0, 2.0 * Math.PI, 0.0, 0.2);
        const leafSurfaceStart = new ParametricSurface(leafFunc(fourier, 0.1, 10.0, leafProfileStart, 0.2), 0.0, 2.0 * Math.PI, 0.0, 0.2);


		/*const leafMapping = {
					vMin: leafSurfaceEnd.vMin, 
					vMax: leafSurfaceEnd.vMax,
					uMin: leafSurfaceEnd.uMin, 
					uMax: leafSurfaceEnd.uMax
					};*/

		const leafGeometryEnd = new ParametricGeometry(leafSurfaceEnd, 200, 6, false, true, true, textureMapping);
		const leafGeometryStart = new ParametricGeometry(leafSurfaceStart, 200, 6, false, false, false);

		let morphTargets = leafGeometryStart.vertices;

		leafGeometryEnd.addBufferAttribute('aMorphTarget', 3, leafGeometryEnd.bufferAttributes.bufferLength, morphTargets);

		return leafGeometryEnd;
	}
}

function min(list) {
	let currentMin = 100000;

	for (let i = 0; i < list.length; i++) {
		if (currentMin > list[i]) {
			currentMin = list[i];
		}
	}

	return currentMin;
}

function max(list) {
	let currentMax = -100000;

	for (let i = 0; i < list.length; i++) {
		if (currentMax < list[i]) {
			currentMax = list[i];
		}
	}

	return currentMax;
}

function textureMapping(geometry) {

	const stMap = new Array(geometry.uSteps * geometry.vSteps);

	//const geometry = this.mesh.geometry;

	const deltaU = (geometry.surface.uMax - geometry.surface.uMin) / (geometry.uSteps - 1);
    const deltaV = (geometry.surface.vMax - geometry.surface.vMin) / (geometry.vSteps - 1);

    var u, v;

    const xProjectedPositions = [];
    const yProjectedPositions = [];

    for (let uStep = 0; uStep < geometry.uSteps; uStep++) {

    	let lastVertex = zeroVector.copy();
    	let currentLength = 0;

    	u = geometry.surface.uMin + (uStep * deltaU);

    	for (let vStep = 0; vStep < geometry.vSteps; vStep++) {

    		v = geometry.surface.vMin + (vStep * deltaV);

    		let vertex = geometry.surface.eval(u, v);

    		currentLength = currentLength + subtract(vertex, lastVertex).magnitude();

    		let xProjected = currentLength * Math.cos(u);
    		let yProjected = currentLength * Math.sin(u);

    		xProjectedPositions.push(xProjected);
    		yProjectedPositions.push(yProjected);

    		lastVertex = vertex;

    		//stMap.push(new Vector([xProjected, yProjected]));

    		//console.log(u, v, 'xy:', xProjected, yProjected);

    		stMap[(geometry.uSteps * vStep) + uStep] = new Vector([xProjected, yProjected]);
    	}
    }

    let xMin = min(xProjectedPositions);
    let xMax = max(xProjectedPositions);

    //console.log(xMax, xMin);

    let yMin = min(yProjectedPositions);
    let yMax = max(yProjectedPositions);

    //console.log(yMax, yMin);

    for (let i = 0; i < stMap.length; i++) {

    	let texturePoint = stMap[i];

    	texturePoint.components[0] = (texturePoint.components[0] - xMin) / (xMax - xMin);
    	texturePoint.components[1] = (texturePoint.components[1] - yMin) / (yMax - yMin);

    }

    //console.log(stMap);

    return stMap;
}