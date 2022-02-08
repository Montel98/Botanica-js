class Material {
	constructor(texture) {
		this.maps = {
			//normalMap: null,
			//textureMap: texture
		}

		//this.shaders = shaderBuilder.getDefaultShaders();
	}

	/*setShaderProgramID(location) {
		this.shaders.programID = location;
	}*/
}

class Texture {
	constructor(imgSrc="") {
		this.imgSrc = imgSrc;
		this.textureID = -1;
	}

	setTextureID(handle) {
		this.textureID = handle;
	}

	setCustomBufferData(width, height, bufferData /*, target*/) {
		this.textureBuffer = bufferData;
		this.width = width;
		this.height = height;
	}
}

function LocalTexture(width, height, bufferData) {
	const texture = new Texture();
	texture.setCustomBufferData(width, height, bufferData);

	return texture;
}