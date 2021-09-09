class InstancedMesh extends Mesh {
	constructor(material, geometry) {

		super(material, geometry);

		this.instanceCount = 0;
		this.localMatrices = [];
		this.worldMatrices = [];
		this.isInstanced = true;
		//this.instanceBufferID = -1;
		this.instanceBufferAttributes = {bufferID: -1, 
										bufferLength: 16, attributes: {'offset': [{attribLength: 4, offset: 0},
																					{attribLength: 4, offset: 4},
																					{attribLength: 4, offset: 8},
																					{attribLength: 4, offset: 12}
																					]}};

		this.shaders = shaderBuilder.getShader(material.maps, this.isInstanced);
	}

	addInstance(poseMatrix) {
		this.localMatrices.push(poseMatrix);
		this.worldMatrices.push(poseMatrix);
		this.instanceCount += 1;
	}

	addInstanceBufferAttribute(name, length, attribOffset) {
		this.instanceBufferAttributes.attributes[name] = [{attribLength: length,
												offset: attribOffset}];

		this.instanceBufferAttributes.bufferLength += length;
	}

	setPoseMatrix(index, newMatrix) {
		this.localMatrices[i] = newMatrix;
	}
}