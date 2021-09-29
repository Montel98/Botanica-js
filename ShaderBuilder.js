//vec3(0.6, 0.4, 0.0) <- Gold Colour

const _NORMAL_MAP = 1;
const _TEXTURE_MAP = 2;
const _INSTANCING = 4;

const mapIndex = {
	'textureMap': _TEXTURE_MAP,
	'normalMap': _NORMAL_MAP
}

function shaderProgramDefault(useInstancing) {

	const vertexInit = 	`
						//precision mediump float;
						attribute vec3 aVertexPosition;
						attribute vec3 aNormal;

						uniform mat4 world;
						uniform mat4 camera;
						uniform mat4 perspective;

						varying vec3 vNormal;
						varying vec3 vVertexPosition;

						${useInstancing ? `attribute mat4 offset;` : ``}`;

	const vertexMain = 	`
						void main() {

						${useInstancing ? `	gl_Position = perspective * camera * offset * vec4(aVertexPosition, 1.0);
											vVertexPosition = vec3(offset * vec4(aVertexPosition, 1.0));` :
										`	gl_Position = perspective * camera * world * vec4(aVertexPosition, 1.0);
											vVertexPosition = vec3(world * vec4(aVertexPosition, 1.0));`}
							vNormal = aNormal;
						}
						`;

	const fragmentInit = `
						precision mediump float;
						varying vec3 vNormal;
						varying vec3 vVertexPosition;

						uniform vec3 ambientColour;
						uniform vec3 eye;
						`;

	const fragmentMain = `
						void main() {
							vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);

							vec3 lightPos = vec3(0.0, -10.0, 10.0);
							vec3 lightDir = normalize(lightPos - vVertexPosition);

							float ambient = 0.2;
							float diffuse = 0.6 * clamp(dot(norm, lightDir), 0.0, 1.0);

							vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
							vec3 viewDirection = normalize(vVertexPosition - eye);

							float specular = 0.6 * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 4.0);

							float light = ambient + diffuse + specular;

							gl_FragColor = vec4(light * ambientColour, 1.0); //0.2
						}
						`;

	return {vertexShader: {init: vertexInit, main: vertexMain}, fragmentShader: {init: fragmentInit, main: fragmentMain}};
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

var customShaders = {}

class ShaderBuilder {
	constructor() {
		this.shaders = {};
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

		let newShaders = this.buildShaders(textureMaps, useInstancing);
		
		this.shaders[shaderKey] = {shaderSource: newShaders, programID: -1, uniforms: {}};

		return this.shaders[shaderKey];
	}

	buildShader(shaderType, textureMaps, useInstancing) {

		return ['init', 'main'].reduce((totalBody, bodyType) =>
				{

					return totalBody + Object.keys(textureMaps).reduce((str, textureMap) => 
						{

							let index = mapIndex[TextureMap];
							return index ? str + codeLines[index][shaderType][bodyType] : str;

						}, shaderProgramDefault(useInstancing)[shaderType][bodyType]);
					;

				}, ``);
	}

	buildShaders(textureMaps, useInstancing) {

		let vertexShader = this.buildShader('vertexShader', textureMaps, useInstancing);
		let fragmentShader = this.buildShader('fragmentShader', textureMaps, useInstancing);

		return {
			vertexShaderSrc: vertexShader,
			fragmentShaderSrc: fragmentShader
		}
	}

	customShader(name, vertexShaderSource, fragmentShaderSource, uniformsInfo) {

		if (name in customShaders) {
			return customShaders[name];
		}

		const newShader = {
			shaderSource: {vertexShaderSrc: vertexShaderSource, fragmentShaderSrc: fragmentShaderSource},
			programID: -1,
			uniforms: uniformsInfo
		}

		customShaders[name] = newShader;

		//console.log(customShaders);

		return newShader;
	}
}

const shaderBuilder = new ShaderBuilder();