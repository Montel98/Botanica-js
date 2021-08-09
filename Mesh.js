class Mesh {
	constructor(material, geometry) {

		this.material = material;
		this.geometry = geometry;
		this.isInstanced = false;

		this.shaders = shaderBuilder.getShader(material.maps, this.isInstanced);
		//this.shaders = null;
	}
}