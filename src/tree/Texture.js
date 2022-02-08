export default class Texture {
	
	constructor(imgSrc="", textureTarget="2D") {
		this.imgSrc = imgSrc;
		this.textureID = -1;
		this.target = textureTarget;
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

export function LocalTexture(width, height, bufferData) {
	const texture = new Texture();
	texture.setCustomBufferData(width, height, bufferData);

	return texture;
}

export function EmptyTexture(width, height) {
	return LocalTexture(width, height, null);
}