import Vector from './Vector.js';
import BezierCubic from './BezierCubic.js';
import * as TextureBuilder from './TextureBuilder.js';
import Material from './Material.js';
import Mesh from './Mesh.js';
import ShaderBuilder from './ShaderBuilder.js';
import ParametricSurface from './ParametricSurface.js';
import ParametricGeometry from './ParametricGeometry.js';
import FastSimplexNoise from './FastSimplexNoise.js';
import Entity from './Entity.js';
import { identityMatrix } from './Matrix.js';

const soilVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
//attribute vec2 aTexCoord;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec3 vWorldNormal;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

void main() {

    gl_Position = perspective * camera * world * vec4(aVertexPosition, 1.0);

    vVertexPosition = vec3(world * vec4(aVertexPosition, 1.0));
    vNormal = aNormal;
    vWorldNormal = vec3(world * vec4(aNormal, 1.0));
}
`;

const soilFragmentShader = 
`
precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec3 vWorldNormal;
//varying vec2 vTexCoord;

uniform vec3 ambientColour;
uniform vec3 eye;

struct LightSource {
	float ambient;
	float diffuse;
	float specular;
	float reflectivity; 
};

uniform LightSource lightSource;

void main() {
    vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);
	vec3 worldNorm = (vWorldNormal == vec3(0.0)) ? vec3(0.0) : normalize(vWorldNormal);

    vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));
    float ambient = lightSource.ambient;
    float diffuse = lightSource.diffuse * clamp(dot(worldNorm, lightDir), 0.0, 1.0);

    vec3 reflected = lightDir - 2.0 * dot(worldNorm, lightDir) * worldNorm;
    vec3 viewDirection = normalize(vVertexPosition - eye);
    float specular = lightSource.specular * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 2.0);
    float light = ambient + diffuse + specular;

    gl_FragColor = vec4(light * ambientColour, 1.0); //0.2
}
`;

const bezierPot = new BezierCubic(new Vector([0.0, 0.0, 0.0]),
								new Vector([0.4, 0.0, 0.0]),
								new Vector([0.2, 0.2, 0.0]),
								new Vector([0.3, 0.3, 0.0]));

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

function crossSectionXY(v) {

	let a = Math.atan(1 / 3);
	let point = new Vector([0, 0]);

	if (v >= a && v < Math.PI * 0.25) {

		let b = a;
		let theta = Math.PI * 0.5 * ((v - b) / (Math.PI * 0.25 - b));

		point.components[0] = 1 + 0.5 * Math.cos(theta);
		point.components[1] = 0.5 + 0.5 * Math.sin(theta);
	}
	else if (v >= Math.PI * 0.25 && v < Math.PI * 0.75) {

		point.components[0] = 1 / Math.tan(v);
		point.components[1] = 1;
	}
	else if (v >= Math.PI * 0.75 && v < Math.PI - a) {

		let b = Math.PI - a;
		let theta = Math.PI * 0.5 * ((v - Math.PI * 0.75) / (b - Math.PI * 0.75));

		point.components[0] = -1 - 0.5 * Math.cos(Math.PI * 0.5 - theta);
		point.components[1] = 0.5 + 0.5 * Math.sin(Math.PI * 0.5 - theta);

	}
	else if (v >= Math.PI - a && v < Math.PI + a) {

		point.components[0] = -1.5;
		point.components[1] = -Math.tan(v);
	}
	else if (v >= Math.PI + a && v < Math.PI * 1.25) {

		let b = Math.PI + a;
		let theta = Math.PI * 0.5 * ((v - b) / (Math.PI * 1.25 - b));

		point.components[0] = -1 - 0.5 * Math.cos(theta);
		point.components[1] = -0.5 - 0.5 * Math.sin(theta);
	}
	else if (v >= Math.PI * 1.25 && v < Math.PI * 1.75) {

		point.components[0] = -1 / Math.tan(v);
		point.components[1] = -1;
	}
	else if (v >= Math.PI * 1.75 && v < Math.PI * 1.75 + a) {

		let b = Math.PI * 1.75 + a;
		let theta = Math.PI * 0.5 * ((v - Math.PI * 1.75) / (b - Math.PI * 1.75));

		point.components[0] = 1 + 0.5 * Math.cos(Math.PI * 0.5 - theta);
		point.components[1] = -0.5 - 0.5 * Math.sin(Math.PI * 0.5 - theta);
	}
	else {

		point.components[0] = 1.5;
		point.components[1] = Math.tan(v);
	}

	return point;
}

function hexCrossSectionXY(v) {

	let t = Math.tan(Math.PI / 3);
	let s = Math.sin(Math.PI / 3);

	let point = new Vector([0.0, 0.0]);

	if (v >= 0 && v < Math.PI / 3) {

		point.components[0] = (t * Math.cos(v)) / (Math.sin(v) + t * Math.cos(v));
		point.components[1] = (t * Math.sin(v)) / (Math.sin(v) + t * Math.cos(v));
	}
	else if (v >= Math.PI / 3 && v < (2.0 * Math.PI) / 3) {

		point.components[0] = s / Math.tan(v);
		point.components[1] = s;
	}
	else if (v >= (2.0 * Math.PI) / 3 && v < Math.PI) {

		point.components[0] = (t * Math.cos(v)) / (Math.sin(v) - t * Math.cos(v));
		point.components[1] = (t * Math.sin(v)) / (Math.sin(v) - t * Math.cos(v));
	}
	else if (v >= Math.PI && v < (4.0 * Math.PI) / 3) {

		point.components[0] = (-t * Math.cos(v)) / (Math.sin(v) + t * Math.cos(v));
		point.components[1] = (-t * Math.sin(v)) / (Math.sin(v) + t * Math.cos(v));
	}
	else if (v >= (4.0 * Math.PI) / 3 && v < (5.0 * Math.PI) / 3) {

		point.components[0] = -s / Math.tan(v);
		point.components[1] = -s;
	}
	else {

		point.components[0] = (-t * Math.cos(v)) / (Math.sin(v) - t * Math.cos(v));
		point.components[1] = (-t * Math.sin(v)) / (Math.sin(v) - t * Math.cos(v));
	}

	return point;
}

function ovalCrossSectionXY(v) {

	let point = new Vector([0.0, 0.0]);

	point.components[0] = Math.cos(v);
	point.components[1] = 0.7 * Math.sin(v);

	return point;
}

function circleCrossSectionXY(v) {

	let point = new Vector([0.0, 0.0]);

	point.components[0] = Math.cos(v);
	point.components[1] = Math.sin(v);

	return point;
}

function legCrossSection(v) {
	let point = new Vector([0.0, 0.0]);

	if (v >= 0.0 && v < 1 / 6) {

		let t = v / (1/6);
		let p = 3.4141 + t * (2.5 -  3.4141);

		point.components[0] = p;
		point.components[1] = 2;

	}
	else if (v >= 1 / 6 && v < 2 / 6) {

		let t = (v - (1 / 6)) / (1/6);
		let p = 2 - 2 * t;

		point.components[0] = -2.5;
		point.components[1] = p;		

	}
	else if (v >= 2 / 6 && v < 3 / 6) {

		let t = (v - (2 / 6)) / (1/6);
		let p = -2.5 + t * 2.5;

		point.components[0] = p;
		point.components[1] = 0.0;

	}
	else if (v >= 3 / 6 && v < 4 / 6) {

		let t = (v - (3 / 6)) / (1/6);
		let theta = Math.PI * 0.75 * t;

		point.components[0] = 1 - Math.cos(theta);
		point.components[1] = Math.sin(theta);
	}
	else if (v >= 4 / 6 && v < 5 / 6) {

		let t = (v - (4 / 6)) / (1/6);
		let theta = Math.PI * 1.25 + (t * Math.PI * 0.75);

		point.components[0] = 2.41435 + Math.cos(theta);
		point.components[1] = 1.4141 + Math.sin(theta);
	}
	else {

		let t = (v - (5 / 6)) / (1/6);
		let p = 2 + t * (1.4141 - 2);

		point.components[0] = 3.4141;
		point.components[1] = p;
	}

	return point;
}

let testNoise = new FastSimplexNoise({frequency: 1.0, octaves: 2});

function zDisplacement(u, v) {
	let x = u * Math.cos(v);
	let y = u * Math.sin(v);

	let distance = Math.sqrt(x**2 + y**2);

	//return -0.2 + 0.6*(Math.cos(1.2 * distance)**2);
	//return -1.0 + 0.2 * Math.exp(-x*x) + Math.exp(-y*y);
	return -0.25 + 0.2 * (1.0 + testNoise.get2DNoise(x, y));
}

/*const newBezierPot = new BezierCubic(new Vector([1.25, 0.0]),
								new Vector([1.75, 0.0]),
								new Vector([1.4, 0.7]),
								new Vector([2.0, 1.0]));*/

const newBezierPot = new BezierCubic(new Vector([1.5, 0.1]),
								new Vector([1.9, 0.27]),
								new Vector([1.5, 1.0]),
								new Vector([2.0, 1.2]));

const newBezierPot2 = new BezierCubic(new Vector([0.5, 0.1]),
								new Vector([1.25, 0.1]),
								new Vector([1.5, 0.5]),
								new Vector([2.0, 1.2]));

const newBezierPot3 = new BezierCubic(new Vector([2.0, 0.1]),
								new Vector([3.0, 0.5]),
								new Vector([2.0, 0.8]),
								new Vector([2.0, 1.2]));

const newBezierPot4 = new BezierCubic(new Vector([2.0, 0.1]),
								new Vector([2.0, 0.5]),
								new Vector([2.0, 0.8]),
								new Vector([2.0, 1.2]));

const newBezierPotBase = new BezierCubic(new Vector([0.0, 0.0]),
								new Vector([0.0, 0.0]),
								new Vector([0.0, 0.0]),
								new Vector([1.5, 0.0]));

const newBezierPotBase2 = new BezierCubic(new Vector([0.0, 0.0]),
								new Vector([0.0, 0.0]),
								new Vector([0.0, 0.0]),
								new Vector([0.5, 0.0]));

const newBezierPotBase3 = new BezierCubic(new Vector([0.0, 0.0]),
								new Vector([0.0, 0.0]),
								new Vector([0.0, 0.0]),
								new Vector([2.0, 0.0]));

const newBezierPotBottom = new BezierCubic(new Vector([1.5, 0.0]),
								new Vector([1.5, 0.0]),
								new Vector([1.5, 0.0]),
								new Vector([1.5, 0.1]));

const newBezierPotBottom2 = new BezierCubic(new Vector([0.5, 0.0]),
								new Vector([0.5, 0.0]),
								new Vector([0.5, 0.0]),
								new Vector([0.5, 0.1]));

const newBezierPotBottom3 = new BezierCubic(new Vector([0.5, 0.0]),
								new Vector([2.0, 0.0]),
								new Vector([2.0, 0.0]),
								new Vector([2.0, 0.1]));

const newBezierPotTop = new BezierCubic(new Vector([2.0, 1.2]),
								new Vector([2.0, 1.2]),
								new Vector([2.0, 1.2]),
								new Vector([2.0, 1.3]));

/*const newBezierPotTop3 = new BezierCubic(new Vector([1.0, 1.2]),
								new Vector([1.0, 1.2]),
								new Vector([1.0, 1.2]),
								new Vector([1.0, 1.3]));*/

const newBezierPotInner = new BezierCubic(new Vector([2.0, 1.3]),
								new Vector([2.0, 1.3]),
								new Vector([2.0, 1.3]),
								new Vector([1.8, 1.3]));

/*const newBezierPotInner3 = new BezierCubic(new Vector([1.0, 1.3]),
								new Vector([1.0, 1.3]),
								new Vector([1.0, 1.3]),
								new Vector([0.8, 1.3]));*/

const bezierSoil = new BezierCubic(new Vector([0.001, 1.2]),
								new Vector([0.5, 1.2]),
								new Vector([1.0, 1.2]),
								new Vector([1.78, 1.2]));

const bezierSoil3 = new BezierCubic(new Vector([0.001, 1.2]),
								new Vector([0.25, 1.2]),
								new Vector([0.5, 1.2]),
								new Vector([0.78, 1.2]));


const newPotFunc = (crossSectionFuncXY, crossSectionFuncXZ, displacementFunc=null) => {

	return {

		aux(u, v) {
			this.pathXZ = crossSectionFuncXZ.eval(u);
			this.pathXY = crossSectionFuncXY(v);
		},
		
		x(u, v) {
			return this.pathXZ.components[0] * this.pathXY.components[0];
		},

		y(u, v) {
			return this.pathXZ.components[0] * this.pathXY.components[1];
		},

		z(u, v) {
			let z = this.pathXZ.components[1];
			return displacementFunc ? 0.97*z + displacementFunc(u, v) + 0.08 * Math.sin(5.0*u*Math.cos(v))*Math.sin(5.0*u*Math.sin(v)) : z;
		}
	}
}

const legFunc = (crossSectionXZ) => {

	return {

		aux(u, v) {
			this.pathXZ = crossSectionXZ(v);
		},

		x(u, v) {
			return this.pathXZ.components[0];
		},

		y(u, v) {

			return u;
		},

		z(u, v) {
			return this.pathXZ.components[1];
		}
	}
}

const legFaceFunc = (yPos) => {

	return {

		aux(u, v) {

			this.t = -2.5 + v * (3.4141 + 2.5);

			return;
		},

		x(u, v) {
			return this.t;
		},

		y(u, v) {
			return yPos;
		},

		z(u, v) {

			if (u == 1) {

				if (this.t >= -2.5 && this.t < 0) {
					return 0;
				}

				else if (this.t >= 0 && this.t < (1 - Math.cos(Math.PI * 0.75))) {
					return Math.sqrt(1 - (1-this.t)**2);
				}

				else if (this.t >= (1 - Math.cos(Math.PI * 0.75)) && this.t < 3.41435) {

					return 1.4141 - Math.sqrt(1 - (this.t - 2.41435)**2);
				}

				else {
					return 2;
				}
			}
			else {
				return 2;
			}
		}
	}
}

const potLegMapping = {sMin: 0.0, sMax: 1.0, tMin: 0.6, tMax: 0.9};
//const potMapping = {sMin: 0.0, sMax: 1.0, tMin: 0.0, tMax: 0.5};
const potMapping = {sMin: 0.0, sMax: 1.0, tMin: 0.1, tMax: 0.4};

//const potLegMapping = {sMin: 0.0, sMax: 1.0, tMin: 0.0, tMax: 1.0};
//const potMapping = {sMin: 0.0, sMax: 1.0, tMin: 0.0, tMax: 1.0};

const potParams = [

	{body: [ovalCrossSectionXY, newBezierPot2], 
	base: [ovalCrossSectionXY, newBezierPotBase2], 
	bottom: [ovalCrossSectionXY, newBezierPotBottom2], 
	top: [ovalCrossSectionXY, newBezierPotTop], 
	inner: [ovalCrossSectionXY, newBezierPotInner],
	soil: [ovalCrossSectionXY, bezierSoil, zDisplacement],
	hasLegs: false,
	scale: 0.14,
	textures: [{func: TextureBuilder.generatePlainPotTexture, params: [], reflectivity: 0.15, frequency: 0.33},
			   {func: TextureBuilder.generatePotTexture, params: [], reflectivity: 0.15, frequency: 0.33},
			   {func: TextureBuilder.generateGradientPotTexture, params: [new Vector([1.0, 0.9, 0.24]), new Vector([0.96, 0.44, 0.05])], reflectivity: 0.15, frequency: 0.33},
			   ],
	frequency: 0.2,
	},

	{body: [hexCrossSectionXY, newBezierPot], 
	base: [hexCrossSectionXY, newBezierPotBase], 
	bottom: [hexCrossSectionXY, newBezierPotBottom], 
	top: [hexCrossSectionXY, newBezierPotTop], 
	inner: [hexCrossSectionXY, newBezierPotInner],
	soil: [hexCrossSectionXY, bezierSoil, zDisplacement],
	hasLegs: false,
	scale: 0.14,
	textures: [{func: TextureBuilder.generatePlainPotTexture, params: [], reflectivity: 0.15, frequency: 0.33},
			   {func: TextureBuilder.generateWavyPotTexture, params: [], reflectivity: 0.15, frequency: 0.33},
			   {func: TextureBuilder.generatePotTexture, params: [], reflectivity: 0.15, frequency: 0.33}
			   ],
	frequency: 0.2,
	},

	{body: [crossSectionXY, newBezierPot], 
	base: [crossSectionXY, newBezierPotBase], 
	bottom: [crossSectionXY, newBezierPotBottom], 
	top: [crossSectionXY, newBezierPotTop], 
	inner: [crossSectionXY, newBezierPotInner],
	soil: [crossSectionXY, bezierSoil, zDisplacement],
	hasLegs: true,
	scale: 0.11,
	textures: [{func: TextureBuilder.generatePlainPotTexture, params: [], reflectivity: 0.15, frequency: 0.5},
			   {func: TextureBuilder.generateGradientPotTexture, params: [new Vector([0.4, 0.2, 0.15]), new Vector([0.5, 0.4, 0.2])], reflectivity: 0.15, frequency: 0.5},
			   ],
	frequency: 0.2,
	},

	{body: [circleCrossSectionXY, newBezierPot3], 
	base: [circleCrossSectionXY, newBezierPotBase3], 
	bottom: [circleCrossSectionXY, newBezierPotBottom3], 
	top: [circleCrossSectionXY, newBezierPotTop], 
	inner: [circleCrossSectionXY, newBezierPotInner],
	soil: [circleCrossSectionXY, bezierSoil, zDisplacement],
	hasLegs: false,
	scale: 0.12,
	textures: [{func: TextureBuilder.generatePlainPotTexture, params: [], reflectivity: 0.15, frequency: 0.33},
			   {func: TextureBuilder.generatePotTexture, params: [], reflectivity: 0.15, frequency: 0.33},
			   {func: TextureBuilder.generateWavyPotTexture, params: [], reflectivity: 0.15, frequency: 0.33},
			   ],
	frequency: 0.2,
	},

	{body: [circleCrossSectionXY, newBezierPot4],
	base: [circleCrossSectionXY, newBezierPotBase3],
	bottom: [circleCrossSectionXY, newBezierPotBottom3],
	top: [circleCrossSectionXY, newBezierPotTop], 
	inner: [circleCrossSectionXY, newBezierPotInner],
	soil: [circleCrossSectionXY, bezierSoil, zDisplacement],
	hasLegs: false,
	scale: 0.12,
	textures: [{func: TextureBuilder.generateGradientPotTexture, params: [new Vector([0, 0.3, 0.3]), new Vector([0.3, 0.7, 0.7])], reflectivity: 0.15, frequency: 0.5},
			   {func: TextureBuilder.generatePlainPotTexture, params: [], reflectivity: 0.85, frequency: 0.5},
			  ],
	frequency: 0.2,
},
];

function generateLeg(position, isFlipped) {

	const potLegSurface = new ParametricSurface(legFunc(legCrossSection), 0.0, 1.0, 0, 1.0);
	const potLegGeometry = new ParametricGeometry(potLegSurface, 4, 128, false, true, true, null, potLegMapping);

	const potLegFrontFaceSurface = new ParametricSurface(legFaceFunc(0.0), 0.0, 1.0, 0, 1.0);
	const potLegFrontFaceGeometry = new ParametricGeometry(potLegFrontFaceSurface, 2, 64, false, true, true, null, potLegMapping);

	const potLegBackFaceSurface = new ParametricSurface(legFaceFunc(1.0), 0.0, 1.0, 0, 1.0);
	const potLegBackFaceGeometry = new ParametricGeometry(potLegBackFaceSurface, 2, 64, false, true, true, null, potLegMapping);

	potLegGeometry.addGeometry(potLegFrontFaceGeometry);
	potLegGeometry.addGeometry(potLegBackFaceGeometry);

	if (isFlipped) {
		potLegGeometry.mirrorY();
	}

	potLegGeometry.scale(0.2, 0.15, 0.15);
	potLegGeometry.translate(...position.components);

	return potLegGeometry;

}

export default class Pot extends Entity {
	
	constructor() {

		super();

		const potId = this.getRandomPot();

		//const potTexture = this.getRandomPotStyle(potId);

		const geometry = this.generateGeometry(1);
		/*const material = new Material(potTexture);
		material.maps['textureMap'] = potTexture;
		material.setPhongComponents(0.2, 0.6, 0.4);
		material.setReflectivity(potParams[potId].texture.reflectivity);*/

		const material = this.getRandomPotStyle(1);

		//console.log('widePotGeometry:', widePotGeometry);

		this.mesh = new Mesh(material, geometry);
		this.worldMatrix = identityMatrix;

		//this.colour = new Vector([0.15, 0.15, 0.4]); // Dark blue
		//this.colour = new Vector([0.0, 0.55, 0.55]); // Dark teal
		//this.colour = new Vector([0.83, 0.68, 0.21]); // Gold
		this.colour = new Vector([1.0, 1.0, 1.0]);
		//this.colour = new Vector([Math.random(), Math.random(), Math.random()]);

		this.defaultShader = this.mesh.shaderPrograms['Default'];

		this.defaultShader.uniforms['ambientColour'] = this.colour;

		this.addChild(new Soil(1));
	}

	act(worldTime) {
		this.defaultShader.uniforms['ambientColour'] = this.colour;
	}

	getRandomPot() {

		const randomNo = Math.random();

		let totalProbability = 0;

		let chosenPotIndex = 0

		for (let potIndex = 0; potIndex < potParams.length; potIndex++) {

			totalProbability += potParams[potIndex].frequency;

			if (randomNo < totalProbability) {

				chosenPotIndex = potIndex;
				break;
			}
		}

		return chosenPotIndex;
	}

	getRandomPotStyle(potIndex) {

		const randomNo = Math.random();

		let totalProbability = 0;

		let chosenStyle = potParams[potIndex].textures[2];

		for (let styleIndex = 0; styleIndex < potParams[potIndex].textures.length; styleIndex++) {

			totalProbability += potParams[potIndex].textures[styleIndex].frequency;

			if (randomNo < totalProbability) {

				chosenStyle = potParams[potIndex].textures[2];
				break;
			}
		}

		const potTexture = chosenStyle.func(...chosenStyle.params, 32, 32/*512, 512*/);

		const material = new Material(potTexture);
		material.maps['textureMap'] = potTexture;
		material.setPhongComponents(0.2, 0.6, 0.4);
		material.setReflectivity(chosenStyle.reflectivity);

		return material;
	}

	generateGeometry(potId) {

		const params = potParams[potId];

		const widePotSurface = new ParametricSurface(newPotFunc(...params.body), 0.0, 1.0, 0.0, 2.0 * Math.PI);
		const widePotGeometry = new ParametricGeometry(widePotSurface, 16, 128, false, true, true, null, potMapping);

		const widePotBaseSurface = new ParametricSurface(newPotFunc(...params.base), 0.0, 1.0, 0.0, 2.0 * Math.PI);
		const widePotBaseGeometry = new ParametricGeometry(widePotBaseSurface, 4, 128, false, true, true, null, potLegMapping);

		const widePotBottomSurface = new ParametricSurface(newPotFunc(...params.bottom), 0.0, 1.0, 0.0, 2.0 * Math.PI);
		const widePotBottomGeometry = new ParametricGeometry(widePotBottomSurface, 4, 128, false, true, true, null, potLegMapping);

		const widePotTopSurface = new ParametricSurface(newPotFunc(...params.top), 0.0, 1.0, 0.0, 2.0 * Math.PI);
		const widePotTopGeometry = new ParametricGeometry(widePotTopSurface, 4, 128, false, true, true, null, potLegMapping);

		const widePotInnerSurface = new ParametricSurface(newPotFunc(...params.inner), 0.0, 1.0, 0.0, 2.0 * Math.PI);
		const widePotInnerGeometry = new ParametricGeometry(widePotInnerSurface, 4, 128, false, true, true, null, potLegMapping);

		if (params.hasLegs) {

			widePotGeometry.addGeometry(generateLeg(new Vector([-1.2, -1.2, -0.3]), false));
			widePotGeometry.addGeometry(generateLeg(new Vector([-1.2, 1.1, -0.3]), false));

			widePotGeometry.addGeometry(generateLeg(new Vector([1.2, -1.2, -0.3]), true));
			widePotGeometry.addGeometry(generateLeg(new Vector([1.2, 1.1, -0.3]), true));
		}

		widePotGeometry.addGeometry(widePotBaseGeometry);
		widePotGeometry.addGeometry(widePotBottomGeometry);
		widePotGeometry.addGeometry(widePotTopGeometry);
		widePotGeometry.addGeometry(widePotInnerGeometry);
		widePotGeometry.scale(params.scale, params.scale, params.scale);

		return widePotGeometry;
	}
}

class Soil extends Entity {

	constructor(potId) {

		super();

		//const geometry = soilGeometry;
		const geometry = this.generateGeometry(potId);
		const material = new Material();
		material.setPhongComponents(0.2, 0.7, 0.1);
		material.setReflectivity(0.0);

		this.mesh = new Mesh(material, geometry);
		this.colour = new Vector([0.6, 0.3, 0]);

		this.mesh.setShaderProgram('Default', ShaderBuilder.customShader('soil_shader', 
														soilVertexShader, 
														soilFragmentShader, {},
														[]
														)
		);

		this.defaultShader = this.mesh.shaderPrograms['Default'];
		this.defaultShader.uniforms['ambientColour'] = this.colour;
	}

	generateGeometry(potId) {

		const params = potParams[potId];

		const soilSurface = new ParametricSurface(newPotFunc(...params.soil), 0.0, 1.0, 0.0, 2.0 * Math.PI);
		const soilGeometry = new ParametricGeometry(soilSurface, 8, 128, false, true, true, null, potMapping);
		soilGeometry.scale(0.983*params.scale, 0.983*params.scale, 0.983*params.scale);

		return soilGeometry;
	}

	act(worldTime) {
		this.defaultShader.uniforms['ambientColour'] = this.colour;
	}
}