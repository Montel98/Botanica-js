
// Keeps track of buffers created and the number of indices utilised
// Allows buffers to have an alias (for geometries sharing buffers)
export default class BufferManager {

	constructor() {
		this.buffers = new WeakMap();
		this.namedBuffers = {};
	}

	addBuffer(bufferId, vertexBufferLength, indexBufferLength, indexCount) {
		let newBuffer = {
			vao: null,
			vertexBuffer: {vbo: null, occupiedIndexes: 0, elementSize: 4, size: vertexBufferLength},
			indexBuffer: {ibo: null, occupiedIndexes: 0, elementSize: 2, size: indexBufferLength},
			indexCount: indexCount,
			entities: new Map(),
			newEntities: []
		};

		this.buffers.set(bufferId, newBuffer);

		return newBuffer;
	}

	getBufferInfoById(bufferId) {
		return this.buffers.get(bufferId);
	}

	bufferExists(name) {
		return name in this.namedBuffers;
	}

	getBufferIdByName(name) {
		return this.namedBuffers[name];
	}

	addBufferIdAlias(name, bufferId) {
		this.namedBuffers[name] = bufferId;
	}

	mapEntityToBuffer(buffer, entity) {
		let geometry = entity.mesh.geometry;

		let vertexBufferLength = bufferInfo.vertexBuffer.occupiedIndexes;
		let indexBufferLength = bufferInfo.indexBuffer.occupiedIndexes;

		bufferInfo.entities.set(
			entity, {
				indexBufferStart: indexBufferLength,
				vertexBufferStart: vertexBufferLength
			}
		);
	}
}