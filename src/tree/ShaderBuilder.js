//vec3(0.6, 0.4, 0.0) <- Gold Colour

const _NORMAL_MAP = 1;
const _TEXTURE_MAP = 2;
const _INSTANCING = 4;

const _MAX_ATTRIBUTE_LOCATIONS = 16;

const mapIndex = {
	'textureMap': _TEXTURE_MAP,
	'normalMap': _NORMAL_MAP
}

function shaderProgramDefault(useInstancing) {

	const vertexInit = 	`
						//precision mediump float;
						attribute vec3 aVertexPosition;
						attribute vec3 aNormal;
						attribute vec2 aTexCoord;

						uniform mat4 world;
						uniform mat4 camera;
						uniform mat4 perspective;

						varying vec3 vNormal;
						varying vec3 vVertexPosition;
						varying vec3 vWorldNormal;
						varying vec2 vTexCoord;

						${useInstancing ? `attribute mat4 offset;` : ``}`;

	const vertexMain = 	`
						void main() {

						${useInstancing ? `	gl_Position = perspective * camera * offset * vec4(aVertexPosition, 1.0);
											vVertexPosition = vec3(offset * vec4(aVertexPosition, 1.0));` :
										`	gl_Position = perspective * camera * world * vec4(aVertexPosition, 1.0);
											vVertexPosition = vec3(world * vec4(aVertexPosition, 1.0));`}
							vNormal = aNormal;
							vWorldNormal = vec3(world * vec4(aNormal, 1.0));
							vTexCoord = aTexCoord;
						}
						`;

	const fragmentInit = `
						precision mediump float;
						varying vec3 vNormal;
						varying vec3 vWorldNormal;
						varying vec2 vTexCoord;

						varying vec3 vVertexPosition;

						uniform vec3 ambientColour;
						uniform vec3 eye;

						uniform samplerCube uCubeSampler;
						uniform sampler2D uTexture;

						struct LightSource {
							float ambient;
							float diffuse;
							float specular;
							float reflectivity; 
						};

						uniform LightSource lightSource;

						`;

	const fragmentMain = `
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

							float specular = lightSource.specular * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 4.0);

							float light = ambient + diffuse + specular;

							vec3 potColour = texture2D(uTexture, vTexCoord).rgb;

							vec3 reflectedColour = vec3(textureCube(uCubeSampler, reflected));

							//gl_FragColor = vec4(light * potColour, 1.0);

							gl_FragColor = vec4(light * ((1.0 - lightSource.reflectivity) * potColour + (lightSource.reflectivity * reflectedColour)), 1.0);
						}
						`;

	let attribNames = [ShaderAttribute('aVertexPosition', 1), ShaderAttribute('aNormal', 1)];

	if (useInstancing) {
		attribNames.push(ShaderAttribute('offset', 1));
	}

	/*return {vertexShader: {init: vertexInit, main: vertexMain}, 
			fragmentShader: {init: fragmentInit, main: fragmentMain}
		}*/

	return {
			vertexShader: `${vertexInit}${vertexMain}`, 
			fragmentShader: `${fragmentInit}${fragmentMain}`
			};
}

const codeLines = {

	_TEXTURE_MAP: {
					vertexShader: 
								{
									init: `
										attribute vec2 aTexCoord;
										varying vec2 vTexCoord;
										`,
									main: `
										vTexCoord = aTexCoord;
										`
								},

					fragmentShader: 
								{
									init: `
										varying vec2 vTexCoord;
										`,
									main:`
										vec4 material = texture2D(uTexture, vTexCoord);
										gl_FragColor = vec4(light * material.rgb, 1.0);
										`
								}
					},

	_NORMAL_MAP: {vertexShader: {init: ``, main: ``}, fragmentShader: {init: ``, main: ``}}
};

const customShaders = {}

class ShaderBuilder {
	constructor() {
		this.shaders = {};

		// Table referencing indexes for attributes used across different shaders
		// Allows multiple shader programs to reference the same attribute
		// Compatability for WebGL/ES 1.0
		this.globalAttributeLocationTable = {'aVertexPosition': 0, 'aNormal': 1, 'aTexCoord': 2, 'aColourId': 3};
	}

	getDefaultShaders() {
		return this.getShader({}, false);
	}

	getShader(textureMaps, useInstancing) {

		let instancing = (useInstancing) ? _INSTANCING : 0;

		let shaderKey = Object.keys(textureMaps).reduce((result, textureMap) => 
		{
			return mapIndex[textureMap] ? result & mapIndex[textureMap] : result;
		}, instancing);

		if (shaderKey in this.shaders) {
			return this.shaders[shaderKey];
		}

		let shaderInfo = shaderProgramDefault(useInstancing);

		this.shaders[shaderKey] = {shaderSource: {vertexShaderSrc: shaderInfo.vertexShader,
												fragmentShaderSrc: shaderInfo.fragmentShader},
									programID: -1,
									uniforms: {}
								};

		return this.shaders[shaderKey];
	}

	buildShaders(textureMaps, useInstancing) {

		return ['init', 'main'].reduce((totalBody, bodyType) =>
				{

					return totalBody + Object.keys(textureMaps).reduce((str, textureMap) => 
						{

							let index = mapIndex[TextureMap];
							return index ? str + codeLines[index] : str;

						}, shaderProgramDefault(useInstancing));
					;

				}, ``);
	}

	/*buildShaderProgram(textureMaps, useInstancing) {

		let vertexShader = this.buildShader('vertexShader', textureMaps, useInstancing);
		let fragmentShader = this.buildShader('fragmentShader', textureMaps, useInstancing);

		return {
			vertexShaderSrc: vertexShader,
			fragmentShaderSrc: fragmentShader
		}
	}*/

	customShader(name, vertexShaderSource, fragmentShaderSource, uniformsInfo, attributeNames) {

		//console.log(name)

		/*if (name in customShaders) {
			return customShaders[name];
		}*/

		if (name in customShaders) {

			let existingShader = customShaders[name];
			return {
				shaderSource: existingShader.shaderSource,
				programID: existingShader.programID,
				uniforms: uniformsInfo
			}
		}

		const newShader = {
			shaderSource: {vertexShaderSrc: vertexShaderSource, fragmentShaderSrc: fragmentShaderSource},
			programID: -1,
			uniforms: uniformsInfo,
			//attributeLocations: this.initAttributeLocations(attributeNames)

			setUniform: function(uniformName, value) { uniforms[uniformName] = value }
		}

		customShaders[name] = newShader;

		//console.log(newShader.attributeLocations);

		return newShader;
	}

	// Need to test whether attributes taking up more than one index can fit without conflict

	initAttributeLocations(attributeNames) {

		let attributeLocations = {};

		let validLocations = new Set();
		let assignedAttributeIndexes = [];
		let attributeNamesCopy = [...attributeNames];

		for (let index = 0; index < _MAX_ATTRIBUTE_LOCATIONS; index++) {
			validLocations.add(index);
		}

		for (let i = 0; i < attributeNamesCopy.length; i++) {

			let attributeName = attributeNames[i].name;
			let span = attributeNames[i].span;

			//console.log(attributeName);

			if (attributeName in this.globalAttributeLocationTable) {

				assignedAttributeIndexes.push(i);

				let location = this.globalAttributeLocationTable[attributeName];
				attributeLocations[attributeName] = location;

				for (let offset = 0; offset < span; offset++) {

					validLocations.delete(location + offset);
				}
			}
		}

		// Remove assigned attribute
		for (let i = 0; i < assignedAttributeIndexes.length; i++) {

			let index = assignedAttributeIndexes[i] - i;
			attributeNamesCopy.splice(index, 1);
		}

		const locationIterator = validLocations.values();

		for (let i = 0; i < attributeNamesCopy.length; i++) {

			let attributeName = attributeNamesCopy[i].name;
			let span = attributeNamesCopy[i].span;

			if (!(attributeName in attributeNames) && !locationIterator.done) {

				let location = locationIterator.next().value;
				attributeLocations[attributeName] = location;

				for (let offset = 0; offset < span; offset++) {

					validLocations.delete(location + offset);
				}
			}
		}

		//console.log(attributeLocations);

		return attributeLocations;
	}

	addGlobalAttribute(attributeName, location) {

		this.globalAttributeLocationTable[attributeName] = location;
	}
}

export function ShaderAttribute(attributeName, attributeSpan) {
	return {
		name: attributeName,
		span: attributeSpan
	}
}

export default new ShaderBuilder();