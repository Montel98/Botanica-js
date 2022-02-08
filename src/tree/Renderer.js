var gl, ext, oes_vao_ext;

const GL_UNSIGNED_SHORT_SIZE = 2;
const GL_FLOAT_SIZE = 4;

const textureUnitMap = {
	'textureMap' : 0,
	'normalMap' : 1,
	'environmentMap': 2
}

var namedBuffers = {};

var buffers = new WeakMap();

export default class Renderer {
	
	constructor(canvas) {
		this.canvas = canvas;

		this.viewportWidth = canvas.width;
		this.viewportHeight = canvas.height;

		this.batchedBuffers = [];

		gl = canvas.getContext("webgl");

		ext = gl.getExtension('ANGLE_instanced_arrays'); // Get extension for instancing
		oes_vao_ext = gl.getExtension('OES_vertex_array_object'); // Get extension for VAOs

    	if (gl == null) {



        	//alert('Unable to initialiaze WebGL. Your browser or machine may not support it.');
    	}

    	// Experimental
    	this.frameBuffer = this.initFrameBuffer();
	}

	/* (for each frame buffer)
	batchedRendering()
		bindShaders()
		updateUniforms()
		render()

	normalRendering()
	*/

	renderScene(scene, program) {

		for (let i = 0; i < this.batchedBuffers.length; i++) {

			let batchedBuffer = this.batchedBuffers[i];
			this.renderBatch(batchedBuffer, scene, program);
		}

		let stack = [...scene.entities];

		while (stack.length != 0) {

			let entity = stack.pop();
			stack.push(...entity.getChildren());

			let geometry = entity.mesh.geometry;

			if (geometry.bufferAttributes.bufferName == "") {

				this.renderEntity(entity, scene, program);
			}
		}
	}

	reWriteBuffer(/*buffer*/ entity) {

		//let newIndexBuffer = new Uint16Array(buffer.indexBuffer.size);
		//let newVertexBuffer = new Float32Array(buffer.vertexBuffer.size);

		let geometry = entity.mesh.geometry;

		let newIndexBuffer = new Uint16Array(geometry.indexBuffer);
		let newVertexBuffer = new Float32Array(geometry.vertexBuffer);

		let indexBufferIndex = 0;
		let vertexBufferIndex = 0;

		/*for (let entity of buffer.entities) {

			for (let i = 0; i < entity.indexBuffer.length; i++) {
				newIndexBuffer[indexBufferIndex] = entity.indexBuffer[i];
				indexBufferIndex++;
			}

			for (let i = 0; i < entity.vertexBuffer.length; i++) {
				newVertexBuffer[vertexBufferIndex] = entity.vertexBuffer[i];
				vertexBufferIndex++;
			}
		}*/

		//oes_vao_ext.bindVertexArrayOES(buffer.vao);
		oes_vao_ext.bindVertexArrayOES(geometry.bufferAttributes.bufferID.VertexArrayLoc);

		gl.bufferData(gl.ARRAY_BUFFER, newVertexBuffer, gl.STATIC_DRAW);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, newIndexBuffer, gl.STATIC_DRAW);

		oes_vao_ext.bindVertexArrayOES(null);
	}

	setBuffers() {

		const mesh = entity.mesh;
		const geometry = mesh.geometry;
		const material = mesh.material;

		const camera = scene.camera;

		const programLoc = shaderProgram.programID;

		let bufferName = geometry.bufferAttributes.bufferName;

		if (!geometry.bufferAttributes.bufferID) {

			if (bufferName != "") {

				if (!(bufferName in namedBuffers)) {

					namedBuffers[bufferName] = this.initBuffers(geometry, shaderProgram);
					geometry.bufferAttributes.bufferID = namedBuffers[bufferName];
				}
				else {
					geometry.bufferAttributes.bufferID = namedBuffers[bufferName];
				}
			}
			else {

				geometry.bufferAttributes.bufferID = this.initBuffers(geometry, shaderProgram);
			}

			mapEntityToBuffer(entity, geometry.bufferAttributes.bufferID);

			let buffers = geometry.bufferAttributes.buffers;
			let bufferInfo = getBufferInfoById(geometry.bufferAttributes.bufferID);
		}

        if (mesh.isInstanced) {

			if (!mesh.instanceBufferAttributes.bufferID) {

				mesh.instanceBufferAttributes.bufferID = this.initInstanceBuffer(mesh, shaderProgram);
			}
		}
	}

	setBuffersAndAttributes(entity, scene, shaderProgram) {

		const mesh = entity.mesh;
		const geometry = mesh.geometry;
		const material = mesh.material;

		const camera = scene.camera;

		const programLoc = shaderProgram.programID;

		//this.updateUniforms(camera, programLoc, entity);
		this.bindTextures(programLoc, material);

		if (scene.background) {
			this.bindCubeMapTexture(programLoc, scene.background);
		}

		let bufferName = geometry.bufferAttributes.bufferName;

		if (!geometry.bufferAttributes.bufferID) {

			if (bufferName != "") {

				if (!(bufferName in namedBuffers)) {

					namedBuffers[bufferName] = this.initBuffers(geometry, shaderProgram);
					geometry.bufferAttributes.bufferID = namedBuffers[bufferName];
				}
				else {

					geometry.bufferAttributes.bufferID = namedBuffers[bufferName];
					geometry.addGeometryEvent(0, 0);
				}
			}
			else {

				geometry.bufferAttributes.bufferID = this.initBuffers(geometry, shaderProgram);
			}

			let buffers = geometry.bufferAttributes.buffers;
			let bufferInfo = getBufferInfoById(geometry.bufferAttributes.bufferID);

			buffers.vertexBuffer.index = bufferInfo.vertexBuffer.occupiedIndexes; 
			buffers.indexBuffer.index = bufferInfo.indexBuffer.occupiedIndexes;

			//bufferInfo.entities.add(geometry);
			//console.log(bufferInfo);
		}

		gl.disable(gl.CULL_FACE);

		/*if (geometry.faceCullingEnabled) {
			gl.enable(gl.CULL_FACE); // Discard back facing triangles
        	gl.cullFace(gl.FRONT);
        }*/

        if (mesh.isInstanced) {

			if (!mesh.instanceBufferAttributes.bufferID) {

				mesh.instanceBufferAttributes.bufferID = this.initInstanceBuffer(mesh, shaderProgram);
			}
		}
	}

	render(entity, scene) {

		this.resizeViewport();

		const mesh = entity.mesh;
		const geometry = mesh.geometry;

		for (let programName in mesh.shaderPrograms) {

			let shaderProgram = mesh.shaderPrograms[programName];

			let programLoc = this.bindShaderProgram(mesh, shaderProgram, scene.camera);
			gl.useProgram(programLoc);

			this.updateUniforms(scene.camera, programLoc, entity);

			this.setBuffersAndAttributes(entity, scene, shaderProgram);

			if (programName == 'Default') {

				if (geometry.modifiedGeometryEvents.length > 0) {
					this.updateBuffers(geometry);
				}

				if (mesh.isInstanced) {
					this.updateInstanceBuffer(mesh);
				}

				gl.bindFramebuffer(gl.FRAMEBUFFER, null);
			}
			else {
				gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);
			}

			oes_vao_ext.bindVertexArrayOES(geometry.bufferAttributes.bufferID.VertexArrayLoc);

			const bufferSize = geometry.indexBuffer.length;
			const offset = geometry.bufferAttributes.buffers['indexBuffer'].index;

			if (mesh.isInstanced) {
				ext.drawElementsInstancedANGLE(gl.TRIANGLES, bufferSize, gl.UNSIGNED_SHORT, 0, mesh.instanceCount);
			}
			else {
				gl.drawElements(gl.TRIANGLES, bufferSize, gl.UNSIGNED_SHORT, offset * GL_UNSIGNED_SHORT_SIZE);
			}
		}

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	}

	renderScene(scene) {

		for (let frameBufferName in this.frameBuffers) {

			let stack = [...scene.entities];

			gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffers[frameBufferName]);

			let programType = frameBufferName;

			while (stack.length != 0) {
				
				let entity = stack.pop();
				stack.push(...entity.getChildren());

				let shaderProgram = entity.mesh.shaderPrograms[frameBufferName];

				if (this.entityUsesProgram(entity, programType)) {

					this.render(buffer, entity, shaderProgram.programID);
				}
			}
		}
	}

	entityUsesProgram(entity, programType) {

		return programType in entity.mesh.shaderPrograms;
	}

	bindTextures(programLoc, material) {

		for (let mapping in material.maps) {

			let textureLoc = material.maps[mapping].textureID;

			if (textureLoc == -1) {
				material.maps[mapping].textureID = this.initTexture(material.maps[mapping]);
			}

			this.bindTexture(programLoc, material.maps[mapping].textureID, mapping);
		}
	}

	bindTexture(programLoc, textureID, mapping) {

		let unit = textureUnitMap[mapping];

		// Affect given unit
		gl.activeTexture(gl['TEXTURE' + unit]);

		// Bind entity's texture(s) for drawing
		gl.bindTexture(gl.TEXTURE_2D, textureID);

		// Tell shader we bound texture to unit
		gl.uniform1i(gl.getUniformLocation(programLoc, 'uSampler'), unit);
	}

	bindCubeMapTexture(programLoc, cubeMap) {

		let unit = textureUnitMap['environmentMap'];

		gl.activeTexture(gl['TEXTURE' + unit]);

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap.textureID);

		let uniformLoc = gl.getUniformLocation(programLoc, 'uCubeSampler');

		/*if (uniformLoc) {
			gl.uniform1i(gl.getUniformLocation(programLoc, 'uCubeSampler'), unit);
		}*/

		gl.uniform1i(gl.getUniformLocation(programLoc, 'uCubeSampler'), unit);
	}

	bindShaderProgram(mesh, shaderProgram, camera) {

		//let shaders = mesh.shaders;
		let programLoc = shaderProgram.programID;

		if (programLoc == -1) {

			programLoc = this.initShaderProgram(mesh, shaderProgram.shaderSource.vertexShaderSrc, shaderProgram.shaderSource.fragmentShaderSrc);
			shaderProgram.uniforms['eye'] = camera.getCameraPosition();

			shaderProgram.programID = programLoc;
		}

		return programLoc;
	}

	updateUniforms(camera, program, entity) {

		const mesh = entity.mesh;

		this.updateLightUniforms(program, mesh.material.lighting);

		const worldMatrix = entity.worldMatrix;
			
		const worldLoc = gl.getUniformLocation(program, 'world');

		gl.uniformMatrix4fv(worldLoc, false, worldMatrix.components.flat());

		// Update camera matrix
		const cameraLoc = gl.getUniformLocation(program, 'camera');

		// Update perspective matrix
		const perspectiveLoc = gl.getUniformLocation(program, 'perspective');

		const cameraMatrices = camera.getCameraMatrices(this.canvas);

		const perspectiveMatrix = cameraMatrices.perspective;
		const cameraMatrix = cameraMatrices.camera;

		gl.uniformMatrix4fv(cameraLoc, false, cameraMatrix.components.flat());
		gl.uniformMatrix4fv(perspectiveLoc, false, perspectiveMatrix.components.flat());

		const meshShaderUniforms = mesh.shaderPrograms['Default'].uniforms;

		for (let uniformName in meshShaderUniforms) {

			const uniformLoc = gl.getUniformLocation(program, uniformName);
			const uniformData = meshShaderUniforms[uniformName];

			let uniformSize = 0;

			if (!Array.isArray(uniformData)) {

				uniformSize = uniformData.noRows;

				gl['uniform' + uniformSize + 'f'](uniformLoc, ...uniformData.components);
			}
			else {

				//console.log('uniform Data:', uniformData);

				uniformSize = uniformData[0].noRows;

				const arrayUniformData = [];

				for (let i = 0; i < uniformData.length; i++) {
					arrayUniformData.push(...uniformData[i].components);
				}

				gl['uniform' + uniformSize + 'fv'](uniformLoc, new Float32Array(arrayUniformData));
			}
		}
	}

	updateLightUniforms(program, lightingUniforms) {

		for (let name in lightingUniforms) {

			const lightingTerm = lightingUniforms[name];
			const uniformLoc = gl.getUniformLocation(program, `lightSource.${name}`);
			//console.log(uniformLoc);
			gl.uniform1f(uniformLoc, lightingTerm);
		}
	}

	updateBuffers(geometry) {

		//console.log(geometry, [...geometry.modifiedGeometryEvents]);

		// Bind mesh's vertex array object
		oes_vao_ext.bindVertexArrayOES(geometry.bufferAttributes.bufferID.VertexArrayLoc);

		let geometryEvent = geometry.modifiedGeometryEvents.pop();
		let buffers = geometry.bufferAttributes.buffers;
		let bufferInfo = getBufferInfoById(geometry.bufferAttributes.bufferID);

		gl.bindBuffer(gl.ARRAY_BUFFER, geometry.bufferAttributes.bufferID.vertexBufferLoc);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.bufferAttributes.bufferID.indexBufferLoc);

		let vertexBufferIndex = geometryEvent.vertexBufferIndex;
		let indexBufferIndex = geometryEvent.indexBufferIndex;

		if (geometryEvent.vertexBufferIndex == -9 && geometryEvent.indexBufferIndex == -9) {
			//console.log('heck yeah2');
			vertexBufferIndex = 0;
			indexBufferIndex = 0;
		}

		let newVertexBufferData = geometry.vertexBuffer.slice(/*geometryEvent.vertexBufferIndex*/vertexBufferIndex);

		//console.log('vb Index!!!: ', /*geometryEvent.vertexBufferIndex*/vertexBufferIndex);

		gl.bufferSubData(gl.ARRAY_BUFFER, 
							(buffers.vertexBuffer.index + /*geometryEvent.vertexBufferIndex*/vertexBufferIndex) * GL_FLOAT_SIZE, 
							new Float32Array(newVertexBufferData)
							);

		let newIndexBufferData = geometry.indexBuffer.slice(/*geometryEvent.indexBufferIndex*/indexBufferIndex);

		// Offset index buffer values if entity shares a buffer

		if (geometryEvent.vertexBufferIndex == -9 && geometryEvent.indexBufferIndex == -9) {
			//console.log('don\'t need this!');

			for (let index = 0; index < newIndexBufferData.length; index++) {

				newIndexBufferData[index] += geometry.bufferAttributes.baseIndexBufferIndex;
			}
		}
		else if (buffers.vertexBuffer.index != 0) {

			geometry.bufferAttributes.baseIndexBufferIndex = bufferInfo.indexCount;

			for (let index = 0; index < newIndexBufferData.length; index++) {

				newIndexBufferData[index] += bufferInfo.indexCount;
			}

			bufferInfo.indexCount += geometry.vertices.length;
		}

		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER,
							(buffers.indexBuffer.index + /*geometryEvent.indexBufferIndex*/indexBufferIndex) * GL_UNSIGNED_SHORT_SIZE,
							new Uint16Array(newIndexBufferData)
							);

		if (buffers.vertexBuffer.index != 0) {

			//console.log(geometryEvent);

			if (geometryEvent.vertexBufferIndex == -9 && geometryEvent.indexBufferIndex == -9) {
				//console.log('heck yeah');
			}
			else {
				bufferInfo.indexBuffer.occupiedIndexes += newIndexBufferData.length;
				bufferInfo.vertexBuffer.occupiedIndexes += newVertexBufferData.length;
			}
		}
		else {
			//console.log('hello...');
			bufferInfo.indexBuffer.occupiedIndexes = newIndexBufferData.length;
			bufferInfo.vertexBuffer.occupiedIndexes = newVertexBufferData.length;

			// TEST, MIGHT BE WRONG

			//bufferInfo.indexCount = geometry.vertices.length;
		}

				//console.log('base: ', geometry.bufferAttributes.baseIndexBufferIndex);

		oes_vao_ext.bindVertexArrayOES(null);
	}

	updateInstanceBuffer(instancedMesh) {

		oes_vao_ext.bindVertexArrayOES(instancedMesh.geometry.bufferAttributes.bufferID.VertexArrayLoc);

		//let instanceEvent = instancedMesh.modifiedInstanceEvents.pop();

		gl.bindBuffer(gl.ARRAY_BUFFER, instancedMesh.instanceBufferAttributes.bufferID);

		/*gl.bufferSubData(gl.ARRAY_BUFFER,
						instanceEvent.instanceBufferIndex * GL_FLOAT_SIZE,
						new Float32Array(instancedMesh.worldMatrices[instanceEvent.bufferDataIndex].components.flat())
						);*/
		gl.bufferSubData(gl.ARRAY_BUFFER,
						0,
						new Float32Array(instancedMesh.mergeAttributes())
						);

		oes_vao_ext.bindVertexArrayOES(null);
	}

	clear() {
		this.clearFrameBuffer();
		this.clearFrameBuffer(this.frameBuffer);
	}

	clearFrameBuffer(frameBufferTarget=null) {

		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBufferTarget);

		gl.clearColor(0.0, 0.0, 0.0, 0.0); // Set colour to be fully transparent
        gl.clearDepth(1.0); // Clear all depth to 1.0
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Objects closer obscure those further away

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	calcBufferSize(buffer, initialbufferData) {

		var bufferSize;

		if (buffer.size <= 0) {
			bufferSize = initialbufferData.length;
		}
		else {
			bufferSize = buffer.size;
		}

		return bufferSize;
	}

	initBuffer(buffer, bufferData) {

		// Create handle to buffer object
	    const bufferObject = gl.createBuffer();

	    if (!bufferObject) {

	        alert('Failed to create buffer');
	    }

	    let bufferTarget = gl.ARRAY_BUFFER;

	    if (buffer.isIndexBuffer) {
	    	bufferTarget = gl.ELEMENT_ARRAY_BUFFER;
	    }

	    gl.bindBuffer(bufferTarget, bufferObject);

	    // Pass positions to WebGL to create buffer object's data store

	    var newBufferData, bufferSize;

	    if (buffer.size <= 0) {
	    	bufferSize = bufferData.length * buffer.elementSize;
	    	newBufferData = bufferData;
	    }
	    else {
	    	bufferSize = buffer.size * buffer.elementSize;
	    	newBufferData = bufferData.slice(0, buffer.size);
	    }

	    gl.bufferData(bufferTarget, bufferSize, gl.STATIC_DRAW);

	    gl.bufferSubData(bufferTarget, 
	    				/*buffer.offset*/ 0,
	    				(buffer.isIndexBuffer ? new Uint16Array(newBufferData) : new Float32Array(newBufferData))
	    				);

	    return bufferObject;
	}

	/*initBuffers(geometry, program) {

		// Create handle to vertex array object
		const VAO = oes_vao_ext.createVertexArrayOES();
		oes_vao_ext.bindVertexArrayOES(VAO);

		let vertexBufferInfo = geometry.bufferAttributes.buffers['vertexBuffer'];
		let indexBufferInfo = geometry.bufferAttributes.buffers['indexBuffer'];

		//vertexBufferSize = this.calcBufferSize(vertexBufferInfo, geometry.vertexBuffer);
		//indexBufferSize = this.calcBufferSize(indexBufferInfo, geometry.indexBuffer);

		let bufferStoreInfo = addBuffer(VAO, vertexBufferSize, 
	    		indexBufferSize, geometry.vertices.length);

	    const VBO = this.initBuffer(vertexBufferInfo, geometry.vertexBuffer);
	    const IBO = this.initBuffer(indexBufferInfo, geometry.indexBuffer);

	    this.initBufferAttributes(program, geometry.bufferAttributes, false);

	    const bufferLocations = {
	    	VertexArrayLoc: VAO,
	        vertexBufferLoc: VBO,
	        indexBufferLoc: IBO
	    };

	   	geometry.setBufferLocation(bufferLocations);

	   	oes_vao_ext.bindVertexArrayOES(null);

	    return bufferLocations;
	}*/

	initBuffers(geometry, program) {

		// Create handle to vertex array object
		const VAO = oes_vao_ext.createVertexArrayOES();
		oes_vao_ext.bindVertexArrayOES(VAO);

	    const VBO = this.initBuffer(geometry.bufferAttributes.buffers['vertexBuffer'], geometry.vertexBuffer);

	    this.initBufferAttributes(program, geometry.bufferAttributes, false);

	    const IBO = this.initBuffer(geometry.bufferAttributes.buffers['indexBuffer'], geometry.indexBuffer);

	    const bufferLocations = {
	    	VertexArrayLoc: VAO,
	        vertexBufferLoc: VBO,
	        indexBufferLoc: IBO
	    };

	    addBuffer(bufferLocations, geometry.vertexBuffer.length, 
	    		geometry.indexBuffer.length, geometry.vertices.length);

	   	geometry.setBufferLocation(bufferLocations);

	   	oes_vao_ext.bindVertexArrayOES(null);

	    return bufferLocations;
	}

	initInstanceBuffer(instancedMesh, shaderProgram) {

		oes_vao_ext.bindVertexArrayOES(instancedMesh.geometry.bufferAttributes.bufferID.VertexArrayLoc);

		/*let matrixBuffer = instancedMesh.worldMatrices.map(matrices => matrices.components.flat())
							.flat();*/

		let instanceBuffer = instancedMesh.mergeAttributes();

		let bufferInfo = instancedMesh.instanceBufferAttributes.buffers['instanceBuffer'];

		const instanceVBO = this.initBuffer(bufferInfo, instanceBuffer);

		this.initBufferAttributes(shaderProgram, instancedMesh.instanceBufferAttributes, true);

		oes_vao_ext.bindVertexArrayOES(null);

		return instanceVBO;
	}

	bindAttributeLocations(bufferAttributes, programLoc) {

		for (let attribName in bufferAttributes.attributes) {

			let location = bufferAttributes.attributes[attribName].meta[0].index;

			gl.bindAttribLocation(programLoc, location, attribName);
		}
	}

	initBufferAttributes(shaderProgram, bufferAttributes, isInstanceBuffer) {

		const programLoc = shaderProgram.programID;

	    for (let attribName in bufferAttributes.attributes) {

	    	let attrib = bufferAttributes.attributes[attribName];
	    	//console.log(attribName);
	    	//let baseAttribLocation = gl.getAttribLocation(program, attribName);
	    	let baseAttribLocation = attrib.meta[0].index;
	    	//console.log(baseAttribLocation);

	    	for (let i = 0; i < attrib.meta.length; i++) {

	    		const attribLocation = baseAttribLocation + i;

		    	gl.vertexAttribPointer(attribLocation, 
		    							attrib.meta[i].attribLength, 
		    							gl.FLOAT, 
		    							false, 
		    							bufferAttributes.bufferLength * GL_FLOAT_SIZE, 
		    							attrib.meta[i].offset * GL_FLOAT_SIZE);

		    	gl.enableVertexAttribArray(attribLocation);

		    	if (isInstanceBuffer) {
		    		ext.vertexAttribDivisorANGLE(attribLocation, 1);
		    	}
		    }
	    }
	}

	initTexture(texture) {

		const textureID = gl.createTexture();
		texture.setTextureID(textureID);

		const target = gl[`TEXTURE_${texture.target}`];

		gl.bindTexture(target, textureID);

		// Create temporary texture while real texture is loading
		const tempTexture = new Uint8Array([0, 255, 255, 255, 0, 255, 255, 255, 0, 255, 255, 255,0, 255, 255, 255]);
		const width = 1;
		const height = 1;
		const border = 0;
		const level = 0;
		const srcFormat = gl.RGBA;
		const internalFormat = gl.RGBA;

		console.log(texture);

		gl.texImage2D(target, level, gl.RGBA, texture.width, texture.height, border, gl.RGBA, gl.UNSIGNED_BYTE, texture.textureBuffer);

		gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		if (texture.imgSrc != "") {

			const image = new Image();
			image.src = texture.imgSrc;
			image.crossOrigin = '';

			image.addEventListener('load', function() {
				console.log('Done!');
				gl.bindTexture(target, textureID);
				gl.texImage2D(target, level, internalFormat, srcFormat, gl.UNSIGNED_BYTE, image);
				gl.generateMipmap(target);
				gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			});
		}
		/*else {
				gl.bindTexture(gl.TEXTURE_2D, textureID);
				gl.texImage2D(gl.TEXTURE_2D, level, gl.RGBA, texture.width, texture.height, border, gl.RGBA, gl.UNSIGNED_BYTE, texture.bufferData);
				gl.generateMipmap(gl.TEXTURE_2D);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		}*/

		gl.bindTexture(target, null);

		return textureID;
	}

	initEmptyTexture(textureWidth, textureHeight) {

		const textureID = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, textureID);

		const width = textureWidth;
		const height = textureHeight;
		const internalFormat = gl.RGBA;
		const srcFormat = gl.RGBA;
		const border = 0;
		const type = gl.UNSIGNED_BYTE;
		const level = 0;

		// Create empty texture
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, type, null);

		gl.bindTexture(gl.TEXTURE_2D, null);

		return textureID;
	}

	initCubeMapTextures(textures, defaultDim) {

		const textureID = gl.createTexture();

		const mainTarget = gl.TEXTURE_CUBE_MAP;

		gl.bindTexture(mainTarget, textureID);

		const level = 0; // Mipmap level
		const width = defaultDim;
		const height = defaultDim;
		const border = 0; // No texture border
		const srcFormat = gl.RGBA; // Format to be stored internally by webgl
		const internalFormat = gl.RGBA; // Format of texture data passed to texImage2D
		const type = gl.UNSIGNED_BYTE;

		for (let face in textures) {

			let texture = textures[face];
			texture.setTextureID(textureID);

			const target = gl[`TEXTURE_${texture.target}`];

			gl.texImage2D(target, level, internalFormat, 1, 1, border, srcFormat, type, null);

			const image = new Image();
			image.src = texture.imgSrc;
			image.addEventListener('load', function() {
				gl.bindTexture(mainTarget, textureID);
				gl.texImage2D(target, level, internalFormat, srcFormat, type, image);
				gl.generateMipmap(mainTarget);
			});
		}

		gl.generateMipmap(mainTarget); // In case textures haven't loaded yet
		gl.texParameteri(mainTarget, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

		gl.bindTexture(mainTarget, null);

		return textureID;
	}

	initShaderProgram(mesh, vsSource, fsSource) {

	    // Create handles to shader objects

	    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
	    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

	    //console.log(vsSource);

	    // Create program and attach shaders
	    const shaderProgram = gl.createProgram();
	    gl.attachShader(shaderProgram, vertexShader);
	    gl.attachShader(shaderProgram, fragmentShader);

	    this.bindAttributeLocations(mesh.geometry.bufferAttributes, shaderProgram);

		if (mesh.isInstanced) {
			this.bindAttributeLocations(mesh.instanceBufferAttributes, shaderProgram);
		}

	    gl.linkProgram(shaderProgram);
	    gl.useProgram(shaderProgram);

	    // Alert if shader program failed
	    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {

	        alert('Unable to initialise shader program:' + gl.getProgramInfoLog(shaderProgram));
	        return null;
	    }

	    return shaderProgram;
	}

	loadShader(type, source) {

	    const shader = gl.createShader(type);

	    // Send the source code to shader object
	    gl.shaderSource(shader, source)

	    // Compile the shader
	    gl.compileShader(shader);

	    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

	        alert('An error occured compiling the shaders:' + gl.getShaderInfoLog(shader));
	        gl.deleteShader(shader);
	        return null;
	    }

	    return shader;
	}

	initFrameBuffer() {

		const depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.canvas.width, this.canvas.height);

		let textureID = this.initEmptyTexture(this.canvas.width, this.canvas.height);

		gl.bindTexture(gl.TEXTURE_2D, textureID);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		const frameBuffer = gl.createFramebuffer();
		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);

		// Use this texture as colour buffer 0
		const attachmentPoint1 = gl.COLOR_ATTACHMENT0;
		gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint1, gl.TEXTURE_2D, textureID, 0);

		const attachmentPoint2 = gl.DEPTH_ATTACHMENT;
		gl.framebufferRenderbuffer(gl.FRAMEBUFFER, attachmentPoint2, gl.RENDERBUFFER, depthBuffer);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindRenderbuffer(gl.RENDERBUFFER, null);

		return frameBuffer;

	}

	initEnvironmentMap(cubeMap) {

		let textureID = this.initCubeMapTextures(cubeMap.faces, cubeMap.dimension);
		cubeMap.setTextureID(textureID);
	}

	getPixelColour(pixelArray, x, y) {

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.frameBuffer);

		gl.readPixels(x, y, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixelArray);

		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	}

	bindFrameBufferUpdateViewport(frameBuffer, width, height) {

		gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
	}

	resizeViewport() {

		gl.viewport(0, 0, this.viewportWidth, this.viewportHeight);
	}

	setViewportDimensions(width, height) {
		this.viewportWidth = width;
		this.viewportHeight = height;
	}
}

function addBuffer(bufferId, vertexBufferLength, indexBufferLength, indexCount) {

	let newBuffer = {
		vao: null,
		vertexBuffer: {vbo: null, occupiedIndexes: 0, elementSize: 4, size: vertexBufferLength},
		indexBuffer: {ibo: null, occupiedIndexes: 0, elementSize: 2, size: indexBufferLength},
		indexCount: indexCount,
		entities: new Map(),
		newEntities: []
	};

	buffers.set(bufferId, newBuffer);

	return newBuffer;
}

function getBufferInfoById(bufferId) {

	return buffers.get(bufferId);
}

function mapEntityToBuffer(buffer, entity) {

	let geometry = entity.mesh.geometry;

	let vertexBufferLength = bufferInfo.vertexBuffer.occupiedIndexes;
	let indexBufferLength = bufferInfo.indexBuffer.occupiedIndexes;

	bufferInfo.entities.set(entity, {indexBufferStart: indexBufferLength,
							vertexBufferStart: vertexBufferLength
						});
}