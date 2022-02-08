export default class Material {
	
	constructor(texture) {
		this.maps = {
			//normalMap: null,
			//textureMap: texture
		}

		this.lighting = {
			ambient: 0.0,
			diffuse: 0.0,
			specular: 0.0,
			reflectivity: 0.0
		}

		//this.shaders = shaderBuilder.getDefaultShaders();
	}

	/*setShaderProgramID(location) {
		this.shaders.programID = location;
	}*/

	setPhongComponents(ambient, diffuse, specular) {

		this.lighting.ambient = ambient;
		this.lighting.diffuse = diffuse;
		this.lighting.specular = specular;
	}

	setReflectivity(reflectivity) {

		this.lighting.reflectivity = reflectivity;
	}
}