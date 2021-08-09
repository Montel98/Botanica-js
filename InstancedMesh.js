class InstancedMesh extends Mesh {
	constructor(material, geometry) {

		super(material, geometry);

		this.instanceCount = 0;
		this.poseMatrices = [];
		this.isInstanced = true;
		this.instanceBufferID = -1;
		this.instanceBufferAttributes = {bufferLength: 3, attributes: {'offset': {attribLength: 3, offset: 0}}};

		this.shaders = shaderBuilder.getShader(material.maps, this.isInstanced);
	}

	addInstance(poseMatrix) {
		this.poseMatrices.push(poseMatrix);
		this.instanceCount += 1;
	}

	addInstanceBufferAttribute(name, length, attribOffset) {
		this.bufferAttributes.attributes[name] = {attribLength: length,
												offset: attribOffset};

		this.bufferAttributes.bufferLength += length;
	}
}