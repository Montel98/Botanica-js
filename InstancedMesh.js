class InstancedMesh extends Mesh {
	constructor(material, geometry, count) {

		super(material, geometry);

		this.instanceCount = count;

		this.localMatrices = [];
		this.worldMatrices = [];

		for (let i = 0; i < count; i++) {
			this.localMatrices.push(identityMatrix.copy());
		}

		for (let i = 0; i < count; i++) {
			this.worldMatrices.push(identityMatrix.copy());
		}

		this.isInstanced = true;
		this.modifiedInstanceEvents = [];

		this.instanceBufferAttributes = {bufferID: -1,
										buffers: {'instanceBuffer': {size: -1, offset: 0, elementSize: 4, isIndexBuffer: false}},
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

		const oldInstanceCount = this.instanceCount;
		this.instanceCount += 1;

		const index = this.instanceBufferAttributes.bufferLength * oldInstanceCount;
		//const flatMatrix = poseMatrix.components.flat();

		this.modifiedInstanceEvents.push({instanceBufferIndex: index, bufferDataIndex: this.instanceCount - 1});
	}

	addInstanceBufferAttribute(name, length, attribOffset) {
		this.instanceBufferAttributes.attributes[name] = [{attribLength: length,
												offset: attribOffset}];

		this.instanceBufferAttributes.bufferLength += length;
	}

	setPoseMatrix(index, newMatrix) {
		this.localMatrices[i] = newMatrix;
	}

	setInstanceBufferSize(bufferSize) {
		this.instanceBufferAttributes.buffers['instanceBuffer'].size = bufferSize;
	}
}