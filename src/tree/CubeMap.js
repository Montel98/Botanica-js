import Texture from './Texture.js';

import negXSrc from './textures/neg-x.jpg';
import posXSrc from './textures/pos-x.jpg';
import negYSrc from './textures/neg-y.jpg';
import posYSrc from './textures/pos-x.jpg';
import negZSrc from './textures/neg-z.jpg';
import posZSrc from './textures/pos-z.jpg';

export default class CubeMap {
	
	constructor() {

		this.faces = [
			new Texture(negXSrc, "CUBE_MAP_NEGATIVE_X"),
			new Texture(posXSrc, "CUBE_MAP_POSITIVE_X"),
			new Texture(negYSrc, "CUBE_MAP_NEGATIVE_Y"),
			new Texture(posYSrc, "CUBE_MAP_POSITIVE_Y"),
			new Texture(negZSrc, "CUBE_MAP_NEGATIVE_Z"),
			new Texture(posZSrc, "CUBE_MAP_POSITIVE_Z")
		];

		this.textureID = -1;
		this.dimension = 512;

	}

	setTextureID(textureID) {
		this.textureID = textureID;
	}
}