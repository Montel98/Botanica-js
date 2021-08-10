class Geometry {
	constructor(invertedNormals, useST) {
		this.vertices = [];

		this.vertexBuffer = [];
		this.indexBuffer = [];

		this.useST = useST;

		this.invertedNormals = invertedNormals;

		this.bufferAttributes = {
			bufferLength: 6,
			attributes: {
				'aVertexPosition': [{attribLength: 3, offset: 0}],
				'aNormal': [{attribLength: 3, offset: 3}]
			}
		};

		this.bufferID = null;

		if (useST) {
			this.addBufferAttribute('aTexCoord', 2, 6);
		}

	}

	invertNormals() {
		this.invertedNormals = true;
	}

	setBufferLocation(location) {
		this.bufferID = location;
	}

	addBufferAttribute(name, length, attribOffset) {
		this.bufferAttributes.attributes[name] = [{attribLength: length,
												offset: attribOffset}];

		this.bufferAttributes.bufferLength += length;
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

	let mergedGeometry = new Geometry(geometries[0].invertedNormals, geometries[0].useST);
	mergedGeometry.vertexBuffer = mergedVertexBuffer;
	mergedGeometry.indexBuffer = mergedIndexBuffer;

	return mergedGeometry;
}