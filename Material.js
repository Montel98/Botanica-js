class Material {
	constructor(texture) {
		this.maps = {
			//normalMap: null,
			//textureMap: null
		}

		//this.shaders = shaderBuilder.getDefaultShaders();
	}

	/*setShaderProgramID(location) {
		this.shaders.programID = location;
	}*/
}

class Texture {
	constructor(imgSrc) {
		this.imgSrc = imgSrc;
		this.textureID = -1;
	}

	setTextureID(handle) {
		this.textureID = handle;
	}
}