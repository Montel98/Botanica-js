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
										bufferLength: 16, 
										attributes: {'offset': {meta: 
																	[{attribLength: 4, offset: 0},
																	{attribLength: 4, offset: 4},
																	{attribLength: 4, offset: 8},
																	{attribLength: 4, offset: 12}
																	],
																	bufferData: this.worldMatrices
																}
															}};

		//this.instanceBuffer = new Array(this.instanceBufferAttributes * count);

		this.shaders = shaderBuilder.getShader(material.maps, this.isInstanced);
	}

	addInstance(poseMatrix, instanceData) {
		this.localMatrices.push(poseMatrix);
		this.worldMatrices.push(poseMatrix);

		for (let attribName in instanceData) {

			let attrib = this.instanceBufferAttributes.attributes[attribName];
			attrib.bufferData.push(instanceData[attribName]);
		}

		const oldInstanceCount = this.instanceCount;
		this.instanceCount += 1;

		const index = this.instanceBufferAttributes.bufferLength * oldInstanceCount;

		this.modifiedInstanceEvents.push({instanceBufferIndex: index, bufferDataIndex: this.instanceCount - 1});
	}

	addInstanceBufferAttribute(name, length, attribOffset, data) {
		this.instanceBufferAttributes.attributes[name] = {meta: 
															[{attribLength: length,
															offset: attribOffset}],
															bufferData: data};

		this.instanceBufferAttributes.bufferLength += length;
	}

    mergeAttributes() {

	    let buffer = [];

	    for (let i = 0; i < this.instanceCount; i++) {

	    	for (let attribName in this.instanceBufferAttributes.attributes) {

	    		let attrib = this.instanceBufferAttributes.attributes[attribName].bufferData[i];
	    		let entry = [...attrib.components].flat();
	    		//buffer.push(...attrib.components);
	    		buffer.push(entry);
	    	}

	    }

	    return buffer.flat();
	}

	setPoseMatrix(index, newMatrix) {
		this.localMatrices[i] = newMatrix;
	}

	setInstanceBufferSize(bufferSize) {
		this.instanceBufferAttributes.buffers['instanceBuffer'].size = bufferSize;
	}
}