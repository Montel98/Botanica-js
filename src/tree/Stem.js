import Vector from './Vector.js';
import { mergeGeometry } from './Geometry.js';
import * as TextureBuilder from './TextureBuilder.js';
import Material from './Material.js';
import Mesh from './Mesh.js';
import { add } from './Vector.js';
import { identityMatrix } from './Matrix.js';
import ShaderBuilder, { ShaderAttribute } from './ShaderBuilder.js';
import BezierCubic from './BezierCubic.js';
import Entity from './Entity.js';

const stemVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec3 aEndVertexPosition;
attribute vec3 aMatureStartVertexPosition;
attribute vec3 aStartVertexPosition;
attribute vec2 aTexCoord;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float du;
uniform float age;

void main() {

	//vec3 currentGirthPos = aMorphTarget2 + age * (aVertexPosition - aMorphTarget2);
	//vec3 currentGirthPos2 = aMorphTarget3 + age * (aMorphTarget - aMorphTarget3);

	vec3 currentGirthPos = aMatureStartVertexPosition + age * (aVertexPosition - aMatureStartVertexPosition);
	vec3 currentGirthPos2 = aStartVertexPosition + age * (aEndVertexPosition - aStartVertexPosition);

	vec3 currentPos = currentGirthPos2 + du * (currentGirthPos - currentGirthPos2);

	gl_Position = perspective * camera * world * vec4(currentPos, 1.0);

	vVertexPosition = vec3(world * vec4(currentPos, 1.0));
	vNormal = aNormal;
	vWorldNormal = vec3(world * vec4(aNormal, 1.0));
	vTexCoord = aTexCoord;
}
`;

const stemFragmentShader = 
`
precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;

uniform vec3 ambientColour;
uniform vec3 eye;

uniform samplerCube uCubeSampler;
uniform sampler2D uTexture;

uniform float age;

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

	vec3 lightPos = vec3(0.0, -10.0, 10.0);
	//vec3 lightDir = normalize(lightPos - vVertexPosition);
	vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

	float ambient = lightSource.ambient;
	float diffuse = lightSource.diffuse * clamp(dot(worldNorm, lightDir), 0.0, 1.0);

	vec3 reflected = lightDir - 2.0 * dot(worldNorm, lightDir) * worldNorm;
	vec3 viewDirection = normalize(vVertexPosition - eye);

	//float specular = 0.7 * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 4.0);
    float specular = lightSource.specular * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 4.0); //<- power was 16

	float light = ambient + diffuse + specular;
	vec3 reflectedColour = vec3(textureCube(uCubeSampler, reflected));

	vec3 stemColour = (1.0 - age) * ambientColour + age * texture2D(uTexture, vTexCoord).rgb;

	//gl_FragColor = vec4(light * (0.7 * ambientColour + 0.3 * reflectedColour), 1.0); //0.2
	//gl_FragColor = vec4(light * ambientColour, 1.0); 
    //gl_FragColor = light * ((1.0 - age) * vec4(ambientColour, 1.0) + age * texture2D(uTexture, vTexCoord));

    gl_FragColor = vec4(light * ((1.0 - lightSource.reflectivity) * stemColour + (lightSource.reflectivity) * reflectedColour), 1.0); //0.2
    //gl_FragColor = vec4(light * stemColour, 1.0); //0.2
}
`;


const bezier = new BezierCubic(new Vector([0.0, 0.0, 0.0]), 
					new Vector([0.0, 0.0, 0.2]), 
					new Vector([0.0, 0.0, 0.4]), 
					new Vector([0.0, 0.0, 0.6]));

export const trunkCrossSection = (radius, u, v, axis) => {

	let position = add(axis.left.scale(radius * Math.cos(v)), axis.up.scale(radius * Math.sin(v)));

	//let base = 0.4 * Math.exp(-u) * ( (Math.sin(0.5*(v - 1))**150) + (Math.sin(0.5*(v - 2))**150) + (Math.sin(0.5*(v - 5))**150) + (Math.sin(0.5*(v - 3.5))**150) );
	let base = 0;
	position = position.scale(0.9 + (0.1 * (Math.cos(3 * v) ** 2.0)) + base);

	return position;
}

export const crossSection = (radius, u, v, axis) => {

	let position = add(axis.left.scale(radius * Math.cos(v)), axis.up.scale(radius * Math.sin(v)));
	position = position.scale(0.9 + (0.1 * Math.cos(3 * v) ** 2.0));

	return position;
}

export const stemFunc = (axis, path, radiusFunc, crossSectionFunc, radiusProperties) => {

	return {

		path: path,

		r(u) {
			return radiusFunc(radiusProperties, u);
		},

		aux(u, v) {

			this.bezierPoint = path.eval(u);
			this.bezierGradient = path.derivative(u);

			this.crossSectionPoint = crossSectionFunc(this.r(u), radiusProperties.shift, v, axis);
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

export default class Stem extends Entity {

	static terminalLength = 1.0;
	static stemCount = 0;
	static growthRate = 2.0 / 3;

	static stemMaterial = null;

	constructor(genome, matureGeometry, immatureGeometry, branch) {

		super();

		//this.worldMatrix = translate(-0.2, -0.2, 0);
		this.worldMatrix = identityMatrix;

		this.colour = new Vector([0.25, 0.18, 0.12]);
		//this.colour = new Vector([0.83, 0.68, 0.21]); // Gold
        //this.colourEnd = new Vector([0.75, 0.75, 0.75]); // Silver
		//this.colour = new Vector([0.87, 0.75, 0.72]);

		// Experimental

		this.tree = null;
		this.branch = branch;

		this.stringLoc = 0; // Corresponding location in L-String this stem corresponds to

		this.stemLength = 0.0;
		//this.growthRate = 0.05; // Growth Rate in units/second
		//this.growthRate = 0.2;
		//this.growthRate = 2.0;
		this.growthRate = 2.0 / 3;

		// Merge stem tip and body

		this.geometryParts = {matureGeometry: matureGeometry,
								immatureGeometry: immatureGeometry};

		let endGeometry = mergeGeometry([matureGeometry.endBodyGeometry, matureGeometry.endTipGeometry]);
		let startGeometry = mergeGeometry([matureGeometry.startBodyGeometry, matureGeometry.startTipGeometry]);

		this.morphTargets = [];
		this.girthMorphTargets = startGeometry.vertices;
		this.girthMorphTargets2 = [];

		//endGeometry.setFaceCulling(true);

		let endBodyGeometrySteps = matureGeometry.endBodyGeometry.uSteps;

		for (let i = 0; i < matureGeometry.endBodyGeometry.vertices.length; i++) {

			this.morphTargets.push(endGeometry.vertices[(endBodyGeometrySteps * (Math.floor(i / endBodyGeometrySteps)))]);
			this.girthMorphTargets2.push(startGeometry.vertices[(endBodyGeometrySteps * (Math.floor(i / endBodyGeometrySteps)))]);
		}

		for (let i = matureGeometry.endBodyGeometry.vertices.length; i < endGeometry.vertices.length; i++) {

			let j = i - matureGeometry.endBodyGeometry.vertices.length;

			this.morphTargets.push(immatureGeometry.endTipGeometry.vertices[j]);
			this.girthMorphTargets2.push(immatureGeometry.startTipGeometry.vertices[j]);
		}

		endGeometry.addMorphTarget('End', this.morphTargets);
		endGeometry.addMorphTarget('MatureStart', this.girthMorphTargets);
		endGeometry.addMorphTarget('Start', this.girthMorphTargets2);

		this.postStemGeometry = matureGeometry.endBodyGeometry;

		let postGirthMorphTargets = this.girthMorphTargets.slice(0, matureGeometry.startBodyGeometry.vertices.length);

		this.postStemGeometry.addMorphTarget('MatureStart', postGirthMorphTargets);

		this.material = this.getMaterial(genome);

		this.mesh = new Mesh(/*stemMaterial*/this.material, endGeometry); // Set main geometry as the final form

		this.mesh.setShaderProgram('Default', ShaderBuilder.customShader('meristem_shader', 
														stemVertexShader, 
														stemFragmentShader, {'du': new Vector([0.0]), 'age': new Vector([0.0])},
														[ShaderAttribute('aVertexPosition', 1), 
														ShaderAttribute('aNormal', 1), 
														ShaderAttribute('aMorphTarget', 1),
														ShaderAttribute('aMorphTarget2', 1),
														ShaderAttribute('aMorphTarget3', 1)]
														)
		);

		this.defaultShader = this.mesh.shaderPrograms['Default'];

		this.defaultShader.uniforms['ambientColour'] = this.colour;

		// Experimental
		this.isAlive = true;
		this.isReached = false;
		this.isTerminal = false;

		this.flowers = [];
		this.leaves = [];

		// Buffer Test

		if (Stem.stemCount >= 305) {
			endGeometry.useBufferByName('stemBuffer2');
		}
		else {
			endGeometry.useBufferByName('stemBuffer1');
		}

		endGeometry.setVertexBufferSize(6528*305);
		endGeometry.setIndexBufferSize(1323*305);

		Stem.stemCount++;
		//console.log('stems:', Stem.stemCount);
	}

	act(worldTime) {

		this.grow(worldTime);

		this.defaultShader.uniforms['ambientColour'] = this.tree.currentColour;
		//this.defaultShader.uniforms['ambientColour'] = add(this.tree.colourStart.scale(1.0 - this.branch.age**0.2), this.tree.colourEnd.scale(this.branch.age**0.2));
		this.defaultShader.uniforms['du'].components[0] = this.stemLength;
		//this.defaultShader.uniforms['age'].components[0] = this.tree.age;
		this.defaultShader.uniforms['age'].components[0] = this.branch.age;
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

	hasFlowers() {

		return this.flowers.length > 0;
	}

	hasLeaves() {
		
		return this.leaves.length > 0;
	}

	addFlowers(flowerIndices) {

		this.flowers.push(...flowerIndices);
	}

	addLeaves(leafIndices) {

		this.leaves.push(...leafIndices);
	}

	killLeaves(deathRate=0.05) {

		for (let leafIndex = 0; leafIndex < this.leaves.length; leafIndex++) {

			let leaf = this.leaves[leafIndex];
			leaf.kill(deathRate);
		}
	}

	removeLeaves() {

		this.leaves = [];
	}

	purgeLeaves() {

		for (let leafIndex = 0; leafIndex < this.leaves.length; leafIndex++) {

			let leaf = this.leaves[leafIndex];
			leaf.purge();
		}

		//this.leaves = [];
		this.removeLeaves();
	}

	removeFlowers() {

		for (let flowerIndex = 0; flowerIndex < this.flowers.length; flowerIndex++) {

			let flower = this.flowers[flowerIndex];
			flower.kill();
		}

		this.flowers = [];
	}

	purgeFlowers() {

		for (let flowerIndex = 0; flowerIndex < this.flowers.length; flowerIndex++) {

			let flower = this.flowers[flowerIndex];
			flower.purge();
		}

		this.flowers = [];
	}

	setStemLength(newLength) {

		this.stemLength = newLength > Stem.terminalLength ? Stem.terminalLength : newLength;
	}

	getMaterial(genome) {

		if (Stem.stemMaterial) {
			return Stem.stemMaterial;
		}

		const woodTypeAllele = genome.getGenotype('Wood Type').left.allele;

		let reflectivity = 0.0;

		let stemTexture = undefined;

		switch (woodTypeAllele.name) {

			case 'Birch':
				stemTexture = TextureBuilder.generateBirchTexture(1024, 1024);
				break;
			case 'Light Wood':
				stemTexture = TextureBuilder.generateLightWoodTexture(256, 256);
				break;
			case'Dark Wood':
				stemTexture = TextureBuilder.generateLightWoodTexture(256, 256);
				break;
			case'Silver':
				stemTexture = TextureBuilder.generateMonochromeTexture(new Vector([0.75, 0.75, 0.75]), 256, 256);
				reflectivity = 0.3;
				break;
			case 'Gold':
				stemTexture = TextureBuilder.generateMonochromeTexture(new Vector([0.83, 0.68, 0.21]), 256, 256)
				reflectivity = 0.3;
			default:
				stemTexture = TextureBuilder.generateMonochromeTexture(new Vector([0.87, 0.75, 0.72]), 256, 256);
				reflectivity = 0.3;
		}

		const stemMaterial = new Material(stemTexture);

		stemMaterial.maps['textureMap'] = stemTexture;

		stemMaterial.setPhongComponents(0.3, 0.6, 0.4);
		stemMaterial.setReflectivity(reflectivity);

		Stem.stemMaterial = stemMaterial;

		return stemMaterial;
	}
}

function meristemGeometry(treeLevel) {

}