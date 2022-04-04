import Vector from './Vector.js';
import { transform, rotate3X, rotate3Y, rotate3Z } from './Matrix.js';

export default class Geometry {
	
	constructor(invertedNormals, useNormals, useST) {
		this.vertices = [];

		this.normals = [];

		this.STs = [];

		this.vertexBuffer = [];
		this.indexBuffer = [];

		this.useST = useST;

		this.useNormals = useNormals;
		this.invertedNormals = invertedNormals;

		this.modifiedGeometryEvents = [];

		this.morphTargetPositionAttribs = [];

		this.faceCullingEnabled = false;

		this.bufferAttributes = {
			bufferID: null,
			bufferName: "",
			buffers: {'vertexBuffer': {size: -1, /*offset: 0,*/ elementSize: 4, isIndexBuffer: false, index: 0, bufferData: this.vertexBuffer}, 
						'indexBuffer': {size: -1, /*offset: 0,*/ elementSize: 2, isIndexBuffer: true, index: 0, bufferData: this.indexBuffer}},
			bufferLength: 3,
			indexesUsed: 0,
			baseIndexBufferIndex: 0,
			attributes: {
				'aVertexPosition': {meta: [{attribLength: 3, offset: 0, index: 0}], bufferData: this.vertices}
				/*'aNormal': [{attribLength: 3, offset: 3, bufferData: this.normals}]*/
			}
		};

		if (useNormals) {
			this.addBufferAttribute('aNormal', 3, this.bufferAttributes.bufferLength, this.normals);
		}

		if (useST) {
			this.addBufferAttribute('aTexCoord', 2, this.bufferAttributes.bufferLength, this.STs);
		}

	}

	invertNormals() {
		this.invertedNormals = true;
	}

	setBufferLocation(location) {
		this.bufferAttributes.bufferID = location;
	}

	setVertexBufferSize(vertexBufferSize) {
		this.bufferAttributes.buffers['vertexBuffer'].size = vertexBufferSize;
	}

	setIndexBufferSize(indexBufferSize) {
		this.bufferAttributes.buffers['indexBuffer'].size = indexBufferSize;
	}

	useBufferByName(name) {
		this.bufferAttributes.bufferName = name;
	}

	addBufferAttribute(name, length, attribOffset, data) {

		this.bufferAttributes.attributes[name] = {meta: 
													[{attribLength: length,
														offset: attribOffset,
														index: ++this.bufferAttributes.indexesUsed
													}],
													bufferData: data
												};

		this.bufferAttributes.bufferLength += length;

		this.setVertexBuffer(this.mergeAttributes());
	}

	getBufferAttribute(name) {
		return this.bufferAttributes.attributes[name];
	}

	setBufferAttributeData(name, bufferData) {

		this.bufferAttributes.attributes[name].bufferData = bufferData;
		this.setVertexBuffer(this.mergeAttributes());
	}

	removeBufferAttribute(name) {

		this.bufferAttributes.bufferLength -= this.bufferAttributes.attributes[name].meta[0].attribLength;

		delete this.bufferAttributes.attributes[name];

		//this.vertexBuffer = this.mergeAttributes();
		this.setVertexBuffer(this.mergeAttributes());

	}

    mergeAttributes() {

	    let buffer = [];

	    for (let i = 0; i < this.vertices.length; i++) {

	    	for (let attribName in this.bufferAttributes.attributes) {

	    		//console.log('name: ', attribName);

	    		let attrib = this.bufferAttributes.attributes[attribName];

	    		// Add ith attribute to buffer if it is in use
	    		// Fill with 0s otherwise to ensure buffer is aligned correctly
	    		if (attrib.bufferData.length > 0) {

	    			buffer.push(...attrib.bufferData[i].components);
	    		}
	    		else {

	    			for (let component = 0; component < attrib.attribLength; component++) {
	    				buffer.push(0);
	    			}
	    		}
	    	}

	    }

	    return buffer.flat();
	}

	addGeometryEvent(vertexBufferIndex, indexBufferIndex) {

		this.modifiedGeometryEvents.push({
			vertexBufferIndex: vertexBufferIndex,
			indexBufferIndex: indexBufferIndex
		});
	}

	addGeometry(newGeometry) {

		let oldVertexBufferLength = this.vertexBuffer.length;
		let oldIndexBufferLength = this.vertices.length;

		// Experimental (copies index buffer this time)

		let newIndexBuffer = [];

		for (let i = 0; i < newGeometry.indexBuffer.length; i++) {

			let newIndex = newGeometry.indexBuffer[i] + oldIndexBufferLength;

			this.indexBuffer.push(newIndex);
		}

		for (let attribName in this.bufferAttributes.attributes) {

			let newGeometryAttribData = newGeometry.bufferAttributes.attributes[attribName].bufferData;

			//this.bufferAttributes.attributes[attribName].bufferData.push(...newGeometryAttribData);

			for (let i = 0; i < newGeometryAttribData.length; i++) {
				this.bufferAttributes.attributes[attribName].bufferData.push(newGeometryAttribData[i].copy());
			}
		}

		this.vertexBuffer.push(...newGeometry.vertexBuffer);

		this.addGeometryEvent(oldIndexBufferLength, oldIndexBufferLength);
	}

	removeGeometry(indexStart, length) {

		for (let attribName in this.bufferAttributes.attributes) {

			let geometryAttribData = this.bufferAttributes.attributes[attribName].bufferData;
			geometryAttribData.splice(indexStart, length);
		}

		for (let i = indexStart; i < indexStart + length; i++) {
			this.indexBuffer[i] = this.indexBuffer[i] - length;
		}

		this.indexBuffer.splice(indexStart, length);

		this.setVertexBuffer(this.mergeAttributes());
	}

	// Always change geometry via this function, never indirectly

	setGeometry(newGeometry) {
		
		for (let attribName in this.bufferAttributes.attributes) {

			let newGeometryAttribData = newGeometry.bufferAttributes.attributes[attribName].bufferData;
			this.bufferAttributes.attributes[attribName].bufferData.splice(0,
																		this.bufferAttributes.attributes[attribName].bufferData.length,
																		...newGeometryAttribData);
		}

		this.vertexBuffer = newGeometry.vertexBuffer;
		this.indexBuffer = newGeometry.indexBuffer;
		this.addGeometryEvent(0, 0);
	}

	addMorphTarget(targetName, morphVertices, morphNormals=null) {

		//let vertexDims = this.vertices[0].noRows;
		let vertexDims = 3;

		this.addBufferAttribute(`a${targetName}VertexPosition`, 
								vertexDims, 
								this.bufferAttributes.bufferLength, 
								morphVertices);

		if (morphNormals) {
			this.addBufferAttribute(`a${targetName}Normal`, 3, this.bufferAttributes.bufferLength, morphNormals);
		}

		this.morphTargetPositionAttribs.push(`a${targetName}VertexPosition`);
	}

	setVertexBuffer(bufferData) {

		this.vertexBuffer = bufferData;
		this.bufferAttributes.buffers['vertexBuffer'].bufferData = this.vertexBuffer;
	}

	setIndexBuffer(bufferData) {

		this.indexBuffer = bufferData;
		this.bufferAttributes.buffers['indexBuffer'].bufferData = this.indexBuffer;
	}

	setFaceCulling(isEnabled) {

		this.faceCullingEnabled = isEnabled;
	}

	generateBoundingTriangles() {

		let triangles = {'aVertexPosition': []};

		for (let i = 0; i < this.morphTargetPositionAttribs.length; i++) {

			let morphAttribName = this.morphTargetPositionAttribs[i];
			triangles[morphAttribName] = [];
		}

		for (let vertexAttribName in triangles) {

			let vertexData = this.bufferAttributes.attributes[vertexAttribName].bufferData;

			for (let i = 0; i + 2 < this.indexBuffer.length; i+=3) {

				let v1 = vertexData[this.indexBuffer[i]].copy();
				let v2 = vertexData[this.indexBuffer[i + 1]].copy();
				let v3 = vertexData[this.indexBuffer[i + 2]].copy();

				triangles[vertexAttribName].push([v1, v2, v3]);
			}
		}

		//console.log(triangles);

		return triangles;
	}

	destroyGeometry() {
		this.addGeometryEvent(-1, -1);
	}

	translate(dx, dy, dz) {

		let dp = new Vector([dx, dy, dz]);

		for (let vertex = 0; vertex < this.vertices.length; vertex++) {

			this.vertices[vertex].add(dp);
		}

		this.setVertexBuffer(this.mergeAttributes());
	}

	scale(x, y, z) {

		for (let vertex = 0; vertex < this.vertices.length; vertex++) {

			this.vertices[vertex].components[0] *= x;
			this.vertices[vertex].components[1] *= y;
			this.vertices[vertex].components[2] *= z;
		}

		this.setVertexBuffer(this.mergeAttributes());

	}

	rotateX(angle) {

		for (let vertex = 0; vertex < this.vertices.length; vertex++) {

			this.vertices[vertex] = transform(this.vertices[vertex], rotate3X(angle));
		}
	}

	mirrorY() {

		for (let vertex = 0; vertex < this.vertices.length; vertex++) {

			this.vertices[vertex].components[0] *= -1;
		}

		this.setVertexBuffer(this.mergeAttributes());
	}
}

// Combine multiple geometry objects into a single geometry object
// Buffers are combined provided they have the same structure

export function mergeGeometry(geometries) {

	let mergedGeometry = new Geometry(geometries[0].invertedNormals, geometries[0].useNormals, geometries[0].useST);
	let mergedIndexBuffer = [...geometries[0].indexBuffer];

	// Merge index buffers

	for (let meshNo = 1; meshNo < geometries.length; meshNo++) {
		let prevBufferLength = geometries[meshNo - 1].vertices.length;

		let indexBuffer = geometries[meshNo].indexBuffer.map(index => index + (meshNo * prevBufferLength));

		mergedIndexBuffer.push(...indexBuffer);
	}

	// Set up attributes

	for (let attribName in geometries[0].bufferAttributes.attributes) {
		let geometryAttrib = geometries[0].bufferAttributes.attributes[attribName];
		let mergedGeometryAttrib = mergedGeometry.bufferAttributes.attributes[attribName];

		if (!mergedGeometryAttrib) {
				mergedGeometry.addBufferAttribute(attribName, 
													geometryAttrib.meta[0].attribLength, 
													geometryAttrib.meta[0].offset, []);
		}
	}

	// Merge attributes

	for (let meshNo = 0; meshNo < geometries.length; meshNo++) {

		for (let attribName in geometries[meshNo].bufferAttributes.attributes) {
			let geometryAttrib = geometries[meshNo].bufferAttributes.attributes[attribName];

			let geometryAttribDataCopy = [];

			for (let index = 0; index < geometryAttrib.bufferData.length; index++) {
				geometryAttribDataCopy.push(geometryAttrib.bufferData[index].copy());
			}

			mergedGeometry.bufferAttributes.attributes[attribName].bufferData.push(...geometryAttribDataCopy);
		}
	}

	mergedGeometry.setVertexBuffer(mergedGeometry.mergeAttributes());
	mergedGeometry.setIndexBuffer(mergedIndexBuffer);

	return mergedGeometry;
}