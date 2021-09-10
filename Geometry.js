class Geometry {
	constructor(invertedNormals, useNormals, useST) {
		this.vertices = [];

		this.normals = [];
		this.binormals = [];
		this.tangents = [];

		this.vertexBuffer = [];
		this.indexBuffer = [];

		this.useST = useST;

		this.useNormals = useNormals;
		this.invertedNormals = invertedNormals;

		this.modifiedGeometryEvents = []

		this.bufferAttributes = {
			bufferID: null,
			bufferName: "",
			vertexBufferSize: -1,
			indexBufferSize: -1,
			vertexBufferOffet: 0,
			indexBufferOffset: 0,
			bufferLength: 3,
			attributes: {
				'aVertexPosition': [{attribLength: 3, offset: 0, bufferData: this.vertices}]
				/*'aNormal': [{attribLength: 3, offset: 3, bufferData: this.normals}]*/
			}
		};

		if (useNormals) {
			this.addBufferAttribute('aNormal', 3, this.bufferAttributes.bufferLength, this.normals);
		}

		if (useST) {
			this.addBufferAttribute('aTexCoord', 2, this.bufferAttributes.bufferLength);
		}

	}

	invertNormals() {
		this.invertedNormals = true;
	}

	setBufferLocation(location) {
		this.bufferAttributes.bufferID = location;
	}

	setVertexBufferSize(vertexBufferSize) {
		this.bufferAttributes.vertexBufferSize = vertexBufferSize;
	}

	setIndexBufferSize(indexBufferSize) {
		this.bufferAttributes.indexBufferSize = indexBufferSize;
	}

	addBufferAttribute(name, length, attribOffset, data) {
		this.bufferAttributes.attributes[name] = [{attribLength: length,
												offset: attribOffset,
												bufferData: data}];

		this.bufferAttributes.bufferLength += length;

		this.vertexBuffer = this.mergeAttributes();
	}

	removeBufferAttribute(name) {

		this.bufferAttributes.bufferLength -= this.bufferAttributes.attributes[name][0].attribLength;

		delete this.bufferAttributes.attributes[name];

		this.vertexBuffer = this.mergeAttributes();

	}

    mergeAttributes() {

	    let buffer = [];

	    for (let i = 0; i < this.vertices.length; i++) {

	    	for (let attribName in this.bufferAttributes.attributes) {

	    		let attrib = this.bufferAttributes.attributes[attribName][0].bufferData[i];
	    		buffer.push(...attrib.components);
	    	}

	    }

	    return buffer.flat();
	}

	addGeometry(newGeometry) {

		let oldVertexBufferLength = this.vertexBuffer.length;
		let oldIndexBufferLength = this.vertices.length;

		for (let i = 0; i < newGeometry.indexBuffer.length; i++) {
			newGeometry.indexBuffer[i] += oldIndexBufferLength;
		}

		// ONLY COPIED THE REFERENCES SO FAR!!! MIGHT CAUSE PROBLEMS IN THE FUTURE

		for (let attribName in this.bufferAttributes.attributes) {
			let newGeometryAttribData = newGeometry.bufferAttributes.attributes[attribName][0].bufferData;
			this.bufferAttributes.attributes[attribName][0].bufferData.push(...newGeometryAttribData);
		}

		//this.vertices.push(...newGeometry.vertices);
		this.vertexBuffer.push(...newGeometry.vertexBuffer);
		this.indexBuffer.push(...newGeometry.indexBuffer);

		this.modifiedGeometryEvents.push({vertexBufferIndex: oldVertexBufferLength, 
											indexBufferIndex: oldIndexBufferLength});
	}
}

// Combine multiple geometry objects into a single geometry object
// Buffers are combined provided they have the same structure

function mergeGeometry(geometries) {
	let mergedVertexBuffer = [...geometries[0].vertexBuffer];
	let mergedIndexBuffer = [...geometries[0].indexBuffer];

	for (let meshNo = 1; meshNo < geometries.length; meshNo++) {
		let prevBufferLength = geometries[meshNo - 1].vertices.length;

		let vertexBuffer = [...geometries[meshNo].vertexBuffer];
		let indexBuffer = geometries[meshNo].indexBuffer.map(index => index + (meshNo * prevBufferLength));

		mergedIndexBuffer.push(...indexBuffer);
		mergedVertexBuffer.push(...vertexBuffer);
	}

	let mergedGeometry = new Geometry(geometries[0].invertedNormals, geometries[0].useNormals, geometries[0].useST);
	mergedGeometry.vertexBuffer = mergedVertexBuffer;
	mergedGeometry.indexBuffer = mergedIndexBuffer;

	return mergedGeometry;
}

