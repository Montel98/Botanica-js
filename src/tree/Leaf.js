import Vector, {zeroVector, upVector, cross, add, subtract} from './Vector.js';
import Mesh from './Mesh.js';
import Material from './Material.js';
import InstancedMesh from './InstancedMesh.js';
import ParametricGeometry from './ParametricGeometry.js';
import ParametricSurface from './ParametricSurface.js';
import Matrix, {translate, multiply,  rotate4X, rotate4Y} from './Matrix.js';
import BezierCubic from './BezierCubic.js';
import ShaderBuilder, { ShaderAttribute } from './ShaderBuilder.js';
import * as TextureBuilder from './TextureBuilder.js';
import Entity from './Entity.js';
import { FourierTerm, FourierSeries } from './FourierSeries.js';

const leafVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

attribute vec3 aStartVertexPosition;
attribute vec3 aStartNormal;

attribute float aAge;
attribute float aDeathAge;
attribute mat4 offset;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vVertexObject;

varying float vAge;
varying float vDeathAge;

uniform mat4 camera;
uniform mat4 perspective;

//uniform float age;

void main() {

    vec3 currentPos = (aAge * aStartVertexPosition) + aAge * (aVertexPosition - (aAge * aStartVertexPosition));
    vec3 currentNormal = (aAge * aStartNormal) + aAge * (aNormal - (aAge * aStartNormal));

    gl_Position = perspective * camera * offset * vec4(currentPos, 1.0);

    vVertexPosition = vec3(offset * vec4(currentPos, 1.0));
    vNormal = vec3(offset * vec4(currentNormal, 1.0));
    vAge = aAge;
    vDeathAge = aDeathAge;
    vTexCoord = aTexCoord;
    vVertexObject = aVertexPosition;
}
`;

const leafFragmentShader = 
`
precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec2 vTexCoord;
varying vec3 vVertexObject;

varying float vAge;
varying float vDeathAge;

uniform vec3 colourStart;
uniform vec3 colourEnd;

uniform sampler2D uTexture;
uniform samplerCube uCubeSampler;

uniform vec3 eye;

uniform float time;

struct LightSource {
    float ambient;
    float diffuse;
    float specular;
    float reflectivity; 
};

uniform LightSource lightSource;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

void main() {
	vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);

	vec3 lightPos = vec3(0.0, -10.0, 10.0);
    vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

	float ambient = lightSource.ambient;
	float diffuse = lightSource.diffuse * clamp(dot(norm, lightDir), 0.0, 1.0);

	vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
	vec3 viewDirection = normalize(vVertexPosition - eye);

	float specular = lightSource.specular * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 2.0); // was 16
	// was 0.7

	float light = ambient + diffuse + specular;

	//float ageTransformed = sqrt(vAge);
	float ageTransformed = vAge;
	float deathAgeTransformed = sqrt(vDeathAge);

	float textureColour = texture2D(uTexture, vTexCoord).r;

	vec3 ambientColour = (ageTransformed * colourEnd) + ((1.0 - ageTransformed) * colourStart);

	//EXPERIMENTAL

	vec2 st = vVertexObject.xy;

    vec3 colour = vec3(0.0);
    float d = 100.0 * length(st);
    float n = fbm(st * 80.0);
    
    vec3 green = vec3(0.4, 0.6, 0.0);
    vec3 red = vec3(1.0, 0.5, 0.0); // <- was 0.3
    vec3 orange = vec3(1.0, 1.0, 0.0);
    
    vec3 colourA = mix(orange, red, n);
    vec3 colourB = red * (0.3 + n);
    
    float offset = 0.2;
    float offset2 = 0.4;
	float t = clamp(1.0 - 3.0 * vDeathAge, 0.0, 1.0);
	float b = clamp(1.0 - 3.0 * (vDeathAge - 0.5), 0.0, 1.0);

    float c = smoothstep(t, t + offset, n * sqrt(d));
    float e = smoothstep(b, b + offset, n * sqrt(d));

    colour = mix(ambientColour, colourA, c);
    colour += mix(vec3(0,0,0), colourB - colour, e);

    ambientColour += step(0.01, vDeathAge) * (colour - ambientColour);

    vec3 reflectedColour = vec3(textureCube(uCubeSampler, reflected));

    vec3 leafColour = ((1.0 - lightSource.reflectivity) * ambientColour * textureColour) + (lightSource.reflectivity * reflectedColour);
    //vec3 leafColour = ambientColour * textureColour; 

	gl_FragColor = vec4(light * leafColour, 1.0);
}
`;

const leafFragmentShader2 = 
`
precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec2 vTexCoord;
varying vec3 vVertexObject;

varying float vAge;
varying float vDeathAge;

uniform vec3 colourStart;
uniform vec3 colourEnd;

uniform sampler2D uTexture;
uniform samplerCube uCubeSampler;

uniform vec3 eye;

uniform float t;

struct LightSource {
    float ambient;
    float diffuse;
    float specular;
    float reflectivity; 
};

uniform LightSource lightSource;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

void main() {
	vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);

	vec3 lightPos = vec3(0.0, -10.0, 10.0);
    vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

	float ambient = lightSource.ambient;
	float diffuse = lightSource.diffuse * clamp(dot(norm, lightDir), 0.0, 1.0);

	vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
	vec3 viewDirection = normalize(vVertexPosition - eye);

	float specular = lightSource.specular * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 2.0); // was 16
	// was 0.7

	float light = ambient + diffuse + specular;

	//float ageTransformed = sqrt(vAge);
	float ageTransformed = vAge;
	float deathAgeTransformed = sqrt(vDeathAge);

	//float textureColour = texture2D(uTexture, vTexCoord).r;

	//vec3 ambientColour = (ageTransformed * colourEnd) + ((1.0 - ageTransformed) * colourStart);

	//EXPERIMENTAL

	vec2 st = vVertexObject.xy;

	//vec3 ambientColour = vec3(vTexCoord.y);
	float hypnosis = 0.5 + 0.5*sin(20.0*vTexCoord.y - 4.0 * t - st.x*st.y);
	//vec3 ambientColour = vec3(hypnosis);
	//vec3 ambientColour = vec3(fract(t));
	vec3 ambientColour = (ageTransformed * vec3(hypnosis)) + ((1.0 - ageTransformed) * colourStart);

    vec3 colour = vec3(0.0);
    float d = 100.0 * length(st);
    float n = fbm(st * 80.0);
    
    vec3 green = vec3(0.4, 0.6, 0.0);
    vec3 red = vec3(1.0, 0.5, 0.0); // <- was 0.3
    vec3 orange = vec3(1.0, 1.0, 0.0);
    
    vec3 colourA = mix(orange, red, n);
    vec3 colourB = red * (0.3 + n);
    
    float offset = 0.2;
    float offset2 = 0.4;
	float t = clamp(1.0 - 3.0 * vDeathAge, 0.0, 1.0);
	float b = clamp(1.0 - 3.0 * (vDeathAge - 0.5), 0.0, 1.0);

    float c = smoothstep(t, t + offset, n * sqrt(d));
    float e = smoothstep(b, b + offset, n * sqrt(d));

    colour = mix(ambientColour, colourA, c);
    colour += mix(vec3(0,0,0), colourB - colour, e);

    ambientColour += step(0.01, vDeathAge) * (colour - ambientColour);

    vec3 reflectedColour = vec3(textureCube(uCubeSampler, reflected));

    vec3 leafColour = ((1.0 - lightSource.reflectivity) * ambientColour) + (lightSource.reflectivity * reflectedColour); 

	gl_FragColor = vec4(light * leafColour, 1.0);
}
`;


const geneTable = {

	colours: {
				'0': {rgb: [0.0, 0.0, 0.4], reflectivity: 0.0}, // Midnight blue
				'1': {rgb: [0.6, 0.6, 0.4], reflectivity: 0.0}, // Murky Green
				'2': {rgb: [0.8, 0.0, 0.6], reflectivity: 0.0}, // Fuschia
				'3': {rgb: [1.0, 0.4, 0.0], reflectivity: 0.0}, // Orange
				'4': {rgb: [1.0, 0.8, 1.0], reflectivity: 0.0}, // Blossom
				'5': {rgb: [1.0, 1.0, 1.0], reflectivity: 0.0}, // White
				'6': {rgb: [0.8, 0.0, 0.0], reflectivity: 0.0}, // Fiery Red
				'7': {rgb: [0.0, 0.4, 0.15], reflectivity: 0.0}, // Verdant Green
				'8': {rgb: [0.1, 1.0, 0.8], reflectivity:  0.0}, // Aqua Green
				'9': {rgb: [0.8, 0.6, 0.0], reflectivity: 0.0}, // Mustard Brown
				'10': {rgb: [0.75, 0.75, 0.75], reflectivity: 0.3}, // Silver
				'11': {rgb: [0.83, 0.68, 0.21], reflectivity: 0.3}, // Gold
				'12': {rgb: [1.0, 0.85, 0.72], reflectivity: 0.0}, // Peach
				'13': {rgb: [0.6, 0.6, 0.6], reflectivity: 0.0}, // Grey
				'14': {rgb: [0.8, 1.0, 0.2], reflectivity: 0.0}, // Lime Yellow
				'15': {rgb: [1.0, 1.0, 0.6], reflectivity: 0.0}, // Trippy
				'16': {rgb: [1.0, 1.0, 0.6], reflectivity: 0.0}, // Hypnosis
				'17': {rgb: [0.87, 0.75, 0.72], reflectivity: 0.3}, // Rose Gold
	},

	patterns: {
				'0': {textureFunc: TextureBuilder.generateRadialLeafTexture, mapping: null},
				'1': {textureFunc: TextureBuilder.generateRadialLeafTexture, mapping: null},
				'2': {textureFunc: TextureBuilder.generateRadialLeafTexture, mapping: null},
				'3': {textureFunc: TextureBuilder.generateRadialLeafTexture, mapping: null}
	}
}

const leafProfileStart = (x) => {
	return -0.4 * x;
}

const leafProfileMature = (x) => {
	return 0.4 * x ** 2.0; 
}

const leafProfileEnd = (x) => {
	return x ** 2.0;
}

const leafFunc = (fourier, foldFactor, foldFrequency, profileFunc, vMax) => { 
	return {
		aux(u, v) {
			this.r = v * fourier.sum(u);
		},

		x(u, v) {
			return 0.14 * ((this.r * (Math.cos(u))) - (vMax * fourier.sum(Math.PI) * Math.cos(Math.PI))) + 0.005;
			//return 0.14 * this.r * Math.cos(u);
		},

		y(u, v) {
			//return 0.1 * this.r * Math.sin(u);
			return 0.12 * this.r * Math.sin(u);
		},

		z(u, v) {
			return 0.14 * (Math.abs(foldFactor * Math.sin(foldFrequency * this.r * Math.sin(u))) + 0.01*(Math.sin(5*u) + Math.sin(5*v))) - profileFunc(this.r * Math.cos(u));
		}
	}
}

const leafStemFunc = (path) => {
	return {

		radius: 0.001,

		crossSection(gradient, v) {

			let right = cross(upVector.copy(), gradient).normalize();
			let up = cross(gradient, right).normalize();

			return add(right.scale(Math.cos(v)), up.scale(Math.sin(v))).scale(this.radius);
		},

		aux(u, v) {

			this.radius = 0.001 - 0.0007 * u
			this.bezierPoint = path.eval(u);
			this.bezierGradient = path.derivative(u);
			this.crossSectionPoint = this.crossSection(this.bezierGradient, v);
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

//const leafTexture = generateLeafTexture2(512, 512, 4);

// Test instancing:

export default class Leaves extends Entity {

	static maxAge = 1.0;

	constructor(genome) {

		super();

		const geometry = this.generateGeometry(genome);
		const colourInfo = this.getColour(genome);
		const patternInfo = this.getPatternInfo(genome);

		const leafTexture = patternInfo.textureFunc(1024, 1024, 4);

		const material = new Material(leafTexture);
		material.maps['textureMap'] = leafTexture;
        material.setPhongComponents(0.2, 0.6, 0.5);
        material.setReflectivity(colourInfo.reflectivity);

		this.ages = [];
		this.deathAges = [];
		this.basePoses = [];

		// Experimental
		this.removalList = [];

		this.mesh = new InstancedMesh(material, geometry, 0);
		this.mesh.setInstanceBufferSize(80000);

		this.startRad = 0.001;

		this.mesh.addInstanceBufferAttribute('aAge', 
												1, 
												this.mesh.instanceBufferAttributes.bufferLength,
												this.ages
												);

		this.mesh.addInstanceBufferAttribute('aDeathAge',
												1,
												this.mesh.instanceBufferAttributes.bufferLength,
												this.deathAges
												);

		//this.growthRate = 0.05;
		this.growthRate = 0.5;

		this.mesh.setShaderProgram('Default', ShaderBuilder.customShader('leaf_shader', 
														leafVertexShader, 
                                                        leafFragmentShader, {/*'age': new Vector([0.0])*/},
                                                        [ShaderAttribute('aVertexPosition', 1),
                                                        ShaderAttribute('aNormal', 1),
                                                        ShaderAttribute('aTexCoord', 1),
                                                        ShaderAttribute('aStartVertexPosition', 1),
                                                        ShaderAttribute('aStartNormal', 1),
                                                        ShaderAttribute('aAge', 1),
                                                        ShaderAttribute('offset', 4)]
                                                        )
		);

		this.defaultShader = this.mesh.shaderPrograms['Default'];

		this.colourStart = new Vector([0.2, 0.5, 0.1]);
		this.colourEnd = new Vector([...colourInfo.rgb]);

		this.shaderUniforms = this.defaultShader.uniforms;
		this.shaderUniforms['colourStart'] = this.colourStart;
		this.shaderUniforms['colourEnd'] = this.colourEnd;

		this.startTime = Date.now() / 1000;

		this.shaderUniforms['t'] = new Vector([Date.now() / 1000 - this.startTime]);

		this.leaves = [];

	}

	addLeaves(noLeaves, xAngle, poseMatrix, parentStem) {

		let leaves = [];

		for (let leafIndex = 0; leafIndex < noLeaves; leafIndex++) {

			let zAngle = (leafIndex * 2.0 * Math.PI) / noLeaves;

			let newLeaf = this.addLeaf(poseMatrix, xAngle, zAngle, parentStem);
			leaves.push(newLeaf);
		}

		return leaves;
	}

	removeDeadLeaves() {

		while (this.removalList.length > 0) {

			let leafIndex = this.removalList.pop();
			this.mesh.removeInstance(leafIndex);

			this.leaves.splice(leafIndex, 1);
		}
	}

	act(worldTime) {
		this.updateLeaves(worldTime);
		this.removeDeadLeaves();

		this.shaderUniforms['colourStart'] = this.colourStart;
		this.shaderUniforms['colourEnd'] = this.colourEnd;
		this.shaderUniforms['t'].components[0] = (Date.now() / 1000) - this.startTime;
	}

	updateLeaves(worldTime) {

		for (let leafIndex = 0; leafIndex < this.leaves.length; leafIndex++) {

			let leaf = this.leaves[leafIndex];

			leaf.grow(worldTime);

			if (leaf.isDying) {
				leaf.die(worldTime);
			}

			this.mesh.localMatrices[leafIndex] = leaf.getCurrentPose();
			this.ages[leafIndex] = leaf.age;
			this.deathAges[leafIndex] = leaf.deathAge;

			if (leaf.isDestroyed) {

				//this.removalList.push(leafIndex);
				this.remove(leafIndex);
			}
		}
	}

	remove(leafIndex) {
		this.removalList.push(leafIndex);

		// Experimental
		this.leaves[leafIndex].parentStem.stem.removeLeaves();
	}

	generateGeometry(genome) {

        let shapeAllele = genome.getGenotype('Leaf Shape').left.allele;
        //shapeAllele.geneticCode = 197;

        //console.log('Leaf Allele: ', shapeAllele.geneticCode);

        let gene = genome.getGene('Leaf Shape');

        let halfGeneLength = 0.5 * (gene.sequenceEnd - gene.sequenceStart + 1);

        let magnitudeA = shapeAllele.geneticCode & (2**halfGeneLength - 1);
        let magnitudeB = (shapeAllele.geneticCode & ((2**halfGeneLength - 1) << halfGeneLength)) >> halfGeneLength;

		let termA = new FourierTerm(0.0, 0.5, 0.5, 2.0);
        let termB = new FourierTerm(0.0, 0.3, 0.5 * magnitudeA, 2.0);
        let termC  = new FourierTerm(0.0, 0.2, 0.5 * magnitudeB, 2.0);

        let fourier = new FourierSeries(0.0, [termA, termB, termC]);

        const leafSurfaceStart = new ParametricSurface(leafFunc(fourier, 0.1, 10.0, leafProfileStart, 0.2), 0.0, 2.0 * Math.PI, 0.0, 0.2);
        const leafSurfaceMature = new ParametricSurface(leafFunc(fourier, 0.02, 20.0, leafProfileMature, 0.2), 0.0, 2.0 * Math.PI, 0.0, 0.2);

		const leafStemPath = new BezierCubic(new Vector([0.0, 0.0, 0.0]),
									new Vector([0.002, 0.0, 0.0]),
									new Vector([0.003, 0.0, 0.0]),
									new Vector([0.005, 0.0, 0.0]));

        const leafStemSurfaceStart = new ParametricSurface(leafStemFunc(leafStemPath), 0.0, 1.0, 0.0, 2.0 * Math.PI);
        const leafStemSurfaceMature = new ParametricSurface(leafStemFunc(leafStemPath), 0.0, 1.0, 0.0, 2.0 * Math.PI);

        const textureMapping = this.getPatternInfo(genome).mapping;

		const leafGeometryMature = new ParametricGeometry(leafSurfaceMature, /*180*/100, 4, false, true, true, textureMapping);
		const leafGeometryStart = new ParametricGeometry(leafSurfaceStart, /*180*/100, 4, false, false, true);

		const leafStemGeometryMature = new ParametricGeometry(leafStemSurfaceMature, 8, 8, false, true, true, textureMapping);
		const leafStemGeometryStart = new ParametricGeometry(leafStemSurfaceStart, 8, 8, false, false, true);

		leafStemGeometryMature.addMorphTarget('Start', leafStemGeometryStart.vertices, leafStemGeometryStart.normals);

		let morphTargets = leafGeometryStart.vertices;

		leafGeometryMature.addMorphTarget('Start', leafGeometryStart.vertices, leafGeometryStart.normals);

		leafGeometryMature.addGeometry(leafStemGeometryMature);
		return leafGeometryMature;
	}

	getColour(genome) {

		if (!this.colourEnd) {

			const colourAlleles = genome.getGenotype('Leaf Colour');
			const leftAllele = colourAlleles.left;

			const colourId = leftAllele.allele.geneticCode;
			const colourInfo = geneTable.colours[colourId];

			return colourInfo;
		}

		return this.colourEnd;
	}

	getPatternInfo(genome) {
		
		const patternAlleles = genome.getGenotype('Leaf Pattern');
		const leftAllele = patternAlleles.left;

		const patternId = leftAllele.allele.geneticCode;

		return geneTable.patterns[patternId];
	}

	addLeaf(poseMatrix, xAngle, zAngle, parentStem) {

		let newLeaf = new Leaf(poseMatrix, xAngle, zAngle, parentStem);
		this.ages.push(newLeaf.age);
		this.deathAges.push(newLeaf.deathAge);

		this.mesh.addInstance(newLeaf.localPose, {'aAge': newLeaf.age, 'aDeathAge': newLeaf.deathAge});

		this.leaves.push(newLeaf);

		return newLeaf;
	}
}

class Leaf {

	static startRad = 0.001;
	static growthRate = 0.5;
	static maxAge = 1.0;

	constructor(poseMatrix, xAngle, zAngle, parentStem) {

		let stem = parentStem.stem;
		//let radius = Leaf.startRad + (stem.postStemGeometry.surface.functions.r(1.0) - Leaf.startRad) * stem.tree.age;
		let radius = Leaf.startRad + (stem.postStemGeometry.surface.functions.r(1.0) - Leaf.startRad) * stem.branch.age;

		let x = xAngle;
		let z = zAngle;

		/*let basePose = new Matrix([[Math.cos(z), Math.cos(x)*Math.sin(z), Math.sin(x)*Math.sin(z), 0],
								[-Math.sin(z), Math.cos(x)*Math.cos(z), Math.cos(z)*Math.sin(x), 0],
								[0, -Math.sin(x), Math.cos(x), 0],
								[radius, 0, 0, 1]]);*/

		let basePose = new Matrix([[Math.cos(z), Math.cos(x)*Math.sin(z), Math.sin(x)*Math.sin(z), 0],
								[-Math.sin(z), Math.cos(x)*Math.cos(z), Math.cos(z)*Math.sin(x), 0],
								[0, -Math.sin(x), Math.cos(x), 0],
								[radius * Math.cos(z), radius * Math.sin(z), 0, 1]]);

		this.basePose = {'poseMatrix': poseMatrix, 'xAngle': xAngle, 'zAngle': zAngle};
		this.localPose = multiply(poseMatrix, basePose);
		this.age = new Vector([0.0]);
		this.deathAge = new Vector([0.0]);
		this.parentStem = parentStem;
		this.isDestroyed = false;
		this.isDying = false;

		this.deathRate = 0.1; // Default
	}

	grow(worldTime) {

		let newAge = this.age.components[0] + worldTime.dt * Leaf.growthRate;

		if (newAge >= Leaf.maxAge) {
	    	newAge = Leaf.maxAge;

	    	if (this.parentStem.stackFrame.branch.level <= 2) {
	    		this.kill(0.1);
	    	}
		}

    	let stem = this.parentStem.stem;

    	//let radius = Leaf.startRad + (stem.postStemGeometry.surface.functions.r(1.0) - Leaf.startRad) * stem.tree.age;
    	let radius = Leaf.startRad + (stem.postStemGeometry.surface.functions.r(1.0) - Leaf.startRad) * stem.branch.age;

    	let growthDir = this.parentStem.stackFrame.axis.forward.scale(0.03 * stem.stemLength);

    	let x = this.basePose.xAngle;
    	let z = this.basePose.zAngle;

		/*let basePose = new Matrix([[Math.cos(z), Math.cos(x)*Math.sin(z), Math.sin(x)*Math.sin(z), 0],
								[-Math.sin(z), Math.cos(x)*Math.cos(z), Math.cos(z)*Math.sin(x), 0],
								[0, -Math.sin(x), Math.cos(x), 0],
								[radius * Math.cos(z), radius * Math.sin(z), 0, 1]]);*/

		let t = (Date.now() / 400) - 2.0 * x;
		let windAngle = 0.03 * Math.PI * 2.0 * ((0.5 * Math.cos(Math.PI * t / 5) * Math.cos(Math.PI * t / 5) * Math.cos(Math.PI * 3 * t / 5) * Math.cos(Math.PI * x)) + (Math.sin(Math.PI * x) * 0.1));
		//let windMatrix = multiply(rotate4Y(windAngle), rotate4X(windAngle - 0.025));
		//let windMatrix = rotate4Y(windAngle);
		let w = windAngle;

		let basePose = new Matrix([[Math.cos(w)*Math.cos(z) + Math.sin(w)*Math.sin(x)*Math.sin(z), Math.cos(x)*Math.sin(z), Math.cos(w)*Math.sin(x)*Math.sin(z) - Math.cos(z)*Math.sin(w), 0],
								[-Math.cos(w)*Math.sin(z) + Math.cos(z)*Math.sin(w)*Math.sin(x), Math.cos(x)*Math.cos(z), Math.cos(w)*Math.cos(z)*Math.sin(x) + Math.sin(w)*Math.sin(z), 0],
								[Math.cos(x)*Math.sin(w), -Math.sin(x), Math.cos(w)*Math.cos(x), 0],
								[Math.cos(w)*Math.cos(z)*radius, radius*Math.sin(z), -Math.cos(z)*radius*Math.sin(w), 1]]);

    	//this.localPose = multiply(translate(...growthDir.components), multiply(this.basePose.poseMatrix, basePose));
    	//this.localPose = multiply(translate(...growthDir.components), multiply(this.basePose.poseMatrix, multiply(windMatrix, basePose)));
    	this.localPose = multiply(translate(...growthDir.components), multiply(this.basePose.poseMatrix, basePose));

	   	this.age.components[0] = newAge;
	}

	die(worldTime) {

		let newDeathAge = this.deathAge.components[0] + worldTime.dt * this.deathRate;

		if (newDeathAge >= Leaf.maxAge) {
			newDeathAge = Leaf.maxAge;
			this.isDestroyed = true;
		}

		this.deathAge.components[0] = newDeathAge;
	}

	getCurrentPose() {
		return this.localPose;
	}

	kill(deathRate) {
		this.isDying = true;
		this.deathRate = deathRate;
		//this.isDestroyed = true;
	}

	purge() {
		this.isDestroyed = true;
	}

	setAge(newAge) {
		this.age.components[0] = newAge > Leaf.maxAge ? Leaf.maxAge : newAge;
	}

	setDeathAge(newAge) {
		this.deathAge.components[0] = newAge > Leaf.maxAge ? Leaf.maxAge : newAge;
	}

	isMaxAge() {
		return this.age.components[0] == Leaf.maxAge;
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

function leafTextureMapping(geometry) {

	const stMap = new Array(geometry.uSteps * geometry.vSteps);

	//const geometry = this.mesh.geometry;

	const deltaU = (geometry.surface.uMax - geometry.surface.uMin) / (geometry.uSteps - 1);
    const deltaV = (geometry.surface.vMax - geometry.surface.vMin) / (geometry.vSteps - 1);

    let u = 0;
    let v = 0;

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

    return stMap;
}