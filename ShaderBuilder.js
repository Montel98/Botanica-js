const _NORMAL_MAP = 1;
const _TEXTURE_MAP = 2;
const _INSTANCING = 4;

const mapIndex = {
	'textureMap': _TEXTURE_MAP,
	'normalMap': _NORMAL_MAP
}

function shaderProgramDefault1(useInstancing) {

	const vertexInit = 	`
						//precision mediump float;
						attribute vec3 aVertexPosition;
						attribute vec3 aNormal;

						uniform mat4 world;
						uniform mat4 camera;
						uniform mat4 perspective;

						varying vec3 vNormal;
						varying vec3 vVertexPosition;

						${useInstancing ? `attribute vec3 offset;` : ``}`;

	const vertexMain = 	`
						void main() {
							vec3 finalPosition;

						${useInstancing ? `	finalPosition = aVertexPosition + offset;
											gl_Position = perspective * camera * vec4(finalPosition, 1.0);` :
										`	finalPosition = aVertexPosition;
							gl_Position = perspective * camera * world * vec4(finalPosition, 1.0);`}
							vNormal = aNormal;
						}
						`;

	const fragmentInit = `
						precision mediump float;
						varying vec3 vNormal;
						varying vec3 vVertexPosition;
						`;

	const fragmentMain = `
						void main() {
							vec3 norm = normalize(vNormal);
							vec3 lightPos = normalize(vec3(0.0, 0.0, 20.0) - vVertexPosition);

							float ambient = 0.2;
							//float ambient = 0.15;
							float diffuse = clamp(dot(norm, lightPos), 0.0, 1.0);
							float light = ambient + diffuse;

							gl_FragColor = vec4(light * vec3(0.2, 0.5, 0.0), 1.0);
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

						}, shaderProgramDefault1(useInstancing)[shaderType][bodyType]);
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

	customShader(vertexShaderSource, fragmentShaderSource, uniformsInfo) {
		const newShader = {
			shaderSource: {vertexShaderSrc: vertexShaderSource, fragmentShaderSrc: fragmentShaderSource},
			programID: -1,
			uniforms: uniformsInfo
		}

		return newShader;
	}
}

const shaderBuilder = new ShaderBuilder();