import ShaderBuilder from './ShaderBuilder.js';

export default class Mesh {
	constructor(material, geometry) {

		this.material = material;
		this.geometry = geometry;
		this.isInstanced = false;

		//this.shaders = shaderBuilder.getShader(/*material.maps*/ {}, this.isInstanced);
		this.shaderPrograms = {'Default': ShaderBuilder.getShader(/*material.maps*/ {}, this.isInstanced)};
	}

	setShaderProgram(name, shaderProgram) {

		this.shaderPrograms[name] = shaderProgram;
	}
}