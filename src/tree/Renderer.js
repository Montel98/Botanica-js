var gl, ext, oes_vao_ext, oes_tf_ext, oes_tf_linear_ext, oes_thf_ext, oes_thf_linear_ext;

import { PlaneEntity } from './PrimitiveShapes.js';
import ShaderBuilder from './ShaderBuilder.js';
import BufferManager from './BufferManager.js';

import quadVertexShader from './Shaders/QuadVertex.glsl';
import quadFragmentShader from './Shaders/QuadFragment.glsl';

const GL_UNSIGNED_SHORT_SIZE = 2;
const GL_FLOAT_SIZE = 4;

const textureUnitMap = {
	'textureMap' : 0,
	'normalMap' : 1,
	'environmentMap': 2,
	'dataStore': 3
}

export default class Renderer {
	
	constructor(canvas) {
		this.canvas = canvas;

		this.viewportWidth = canvas.width;
		this.viewportHeight = canvas.height;

		this.bufferManager = new BufferManager();

		gl = canvas.getContext("webgl");

    	if (gl == null) {
        	alert('Unable to initialiaze WebGL. Your browser or machine may not support it.');
    	}

		this.initExtensions();

    	// Experimental
    	this.frameBuffer = this.initFrameBuffer(gl.UNSIGNED_BYTE);
    	//this.floatFrameBuffer = this.initFrameBuffer(gl.UNSIGNED_BYTE);

    	//this.HDRFrameBuffer = this.initHDRFrameBuffer();
    	this.drawPassStates = [
    	{frameBuffer: null, shaderName: "Default"},
    	{frameBuffer: this.frameBuffer, shaderName: "Picking"},
    	];

    	//this.quad = this.initQuad();
	}

	// Binds buffer objects and texture objects if they already exist
	// Creates a new buffer for a geometry object requiring a unique buffer
	// Updates existing buffer if geometry is in shared buffer
	setBuffersAndAttributes(entity, scene, shaderProgram) {

		const mesh = entity.mesh;
		const geometry = mesh.geometry;
		const material = mesh.material;

		const camera = scene.camera;

		const programLoc = shaderProgram.programID;

		this.bindTextures(programLoc, material);

		if (scene.background) {
			this.bindCubeMapTexture(programLoc, scene.background);
		}

		let bufferName = geometry.bufferAttributes.bufferName;

		if (!geometry.bufferAttributes.bufferID) {

			if (bufferName != "") {

				if (!this.bufferManager.bufferExists(bufferName)) {

					this.bufferManager.addBufferIdAlias(bufferName, this.initBuffers(geometry, shaderProgram));
					geometry.bufferAttributes.bufferID = this.bufferManager.getBufferIdByName(bufferName);
				}
				else {

					geometry.bufferAttributes.bufferID = this.bufferManager.getBufferIdByName(bufferName);
					geometry.addGeometryEvent(0, 0);
				}
			}
			else {

				geometry.bufferAttributes.bufferID = this.initBuffers(geometry, shaderProgram);
			}

			let buffers = geometry.bufferAttributes.buffers;
			let bufferInfo = this.bufferManager.getBufferInfoById(geometry.bufferAttributes.bufferID);

			buffers.vertexBuffer.index = bufferInfo.vertexBuffer.occupiedIndexes; 
			buffers.indexBuffer.index = bufferInfo.indexBuffer.occupiedIndexes;
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

	// Binds appropriate uniforms and buffers before rendering
	renderEntity(entity, scene, drawPassState) {

		this.resizeViewport(); // Required to draw correctly on window resize

		const mesh = entity.mesh;
		const geometry = mesh.geometry;

		let shaderProgram = mesh.shaderPrograms[drawPassState.shaderName];

		let programLoc = this.bindShaderProgram(mesh, shaderProgram, scene.camera);
		gl.useProgram(programLoc);

		this.updateUniforms(scene.camera, programLoc, entity);

		this.setBuffersAndAttributes(entity, scene, shaderProgram);

		if (drawPassState.shaderName == 'Default') {

			if (geometry.modifiedGeometryEvents.length > 0) {
				this.updateBuffers(geometry);
			}

			if (mesh.isInstanced) {
				this.updateInstanceBuffer(mesh);
			}
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

		gl.bindTexture(gl.TEXTURE_2D, null);
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);
	}

	renderScene(scene, entities) {

		for (let state = 0; state < this.drawPassStates.length; state++) {

			let drawPassState = this.drawPassStates[state];

			gl.bindFramebuffer(gl.FRAMEBUFFER, drawPassState.frameBuffer);

			for (let entityIndex = 0; entityIndex < entities.length; entityIndex++) {

				let entity = entities[entityIndex];

				if (this.entityUsesProgram(entity, drawPassState.shaderName)) {

					this.renderEntity(entity, scene, drawPassState);
				}
			}
		}

		//gl.bindFramebuffer(gl.FRAMEBUFFER, this.floatFrameBuffer);
		//this.renderQuad(scene);
	}

	// Special case, renders scene to quad in a seperate frame buffer
	// Useful for post-processing effects
	renderQuad(scene) {

		gl.activeTexture(gl.TEXTURE4);
		const hdrTexture = gl.getFramebufferAttachmentParameter(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.FRAMEBUFFER_ATTACHMENT_OBJECT_NAME);
		gl.bindTexture(gl.TEXTURE_2D, hdrTexture);
		const shaderProgram = this.bindShaderProgram(this.quad.mesh, this.quad.mesh.shaderPrograms['Default'], scene.camera);
		
		gl.uniform1i(gl.getUniformLocation(shaderProgram, 'hdrBuffer'), 4);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.renderEntity(this.quad, scene, this.drawPassStates[2]);
	}

	entityUsesProgram(entity, programType) {

		return programType in entity.mesh.shaderPrograms;
	}

	// Binds given textures in texture map if they exist, creates new texture for material if they don't
	bindTextures(programLoc, material) {

		for (let mapping in material.maps) {

			let textureLoc = material.maps[mapping].textureID;

			if (textureLoc == -1) {
				material.maps[mapping].textureID = this.initTexture(material.maps[mapping]);
			}

			this.bindTexture(programLoc, material.maps[mapping], mapping);
		}
	}

	bindTexture(programLoc, texture, mapping) {

		let unit = textureUnitMap[mapping];

		// Affect given unit
		gl.activeTexture(gl['TEXTURE' + unit]);

		// Bind entity's texture(s) for drawing
		gl.bindTexture(gl.TEXTURE_2D, texture.textureID);

		// Tell shader we bound texture to unit
		gl.uniform1i(gl.getUniformLocation(programLoc, texture.textureName), unit);
	}

	bindCubeMapTexture(programLoc, cubeMap) {

		let unit = textureUnitMap['environmentMap'];

		gl.activeTexture(gl['TEXTURE' + unit]);

		gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap.textureID);

		let uniformLoc = gl.getUniformLocation(programLoc, 'uCubeSampler');

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
			gl.uniform1f(uniformLoc, lightingTerm);
		}
	}

	updateBuffers(geometry) {

		// Bind mesh's vertex array object
		oes_vao_ext.bindVertexArrayOES(geometry.bufferAttributes.bufferID.VertexArrayLoc);

		let geometryEvent = geometry.modifiedGeometryEvents.pop();
		let buffers = geometry.bufferAttributes.buffers;
		let bufferInfo = this.bufferManager.getBufferInfoById(geometry.bufferAttributes.bufferID);

		gl.bindBuffer(gl.ARRAY_BUFFER, geometry.bufferAttributes.bufferID.vertexBufferLoc);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.bufferAttributes.bufferID.indexBufferLoc);

		let vertexBufferIndex = geometryEvent.vertexBufferIndex;
		let indexBufferIndex = geometryEvent.indexBufferIndex;

		// Perform a rewrite of entire geometry from base indices
		if (geometryEvent.vertexBufferIndex == -9 && geometryEvent.indexBufferIndex == -9) {
			vertexBufferIndex = 0;
			indexBufferIndex = 0;
		}

		let newVertexBufferData = geometry.vertexBuffer.slice(vertexBufferIndex);

		gl.bufferSubData(gl.ARRAY_BUFFER, 
							(buffers.vertexBuffer.index + vertexBufferIndex) * GL_FLOAT_SIZE, 
							new Float32Array(newVertexBufferData)
							);

		let newIndexBufferData = geometry.indexBuffer.slice(indexBufferIndex);

		// Offset index buffer values if entity shares a buffer
		if (geometryEvent.vertexBufferIndex == -9 && geometryEvent.indexBufferIndex == -9) {

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

		gl.bufferSubData(
			gl.ELEMENT_ARRAY_BUFFER,
			(buffers.indexBuffer.index + indexBufferIndex) * GL_UNSIGNED_SHORT_SIZE,
			new Uint16Array(newIndexBufferData)
		);

		if (buffers.vertexBuffer.index != 0) {

			// Assume buffer store is to be appended 
			if (!(geometryEvent.vertexBufferIndex == -9 && geometryEvent.indexBufferIndex == -9)) {
				bufferInfo.indexBuffer.occupiedIndexes += newIndexBufferData.length;
				bufferInfo.vertexBuffer.occupiedIndexes += newVertexBufferData.length;
			}
		}
		// Was a rewrite (of same size), so no new indices are required
		else {
			bufferInfo.indexBuffer.occupiedIndexes = newIndexBufferData.length;
			bufferInfo.vertexBuffer.occupiedIndexes = newVertexBufferData.length;
		}

		oes_vao_ext.bindVertexArrayOES(null);
	}

	// For now, rewrites entire instance buffer (required for tree application)
	updateInstanceBuffer(instancedMesh) {

		oes_vao_ext.bindVertexArrayOES(instancedMesh.geometry.bufferAttributes.bufferID.VertexArrayLoc);

		gl.bindBuffer(gl.ARRAY_BUFFER, instancedMesh.instanceBufferAttributes.bufferID);

		gl.bufferSubData(
			gl.ARRAY_BUFFER,
			0,
			new Float32Array(instancedMesh.mergeAttributes())
		);

		oes_vao_ext.bindVertexArrayOES(null);
	}

	clear() {
		this.clearFrameBuffer();
		this.clearFrameBuffer(this.frameBuffer);
		this.clearFrameBuffer(this.floatFrameBuffer);
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

	// Creates new buffer equal to size of vertex data if no size is specified
	// If size is specified, buffer is initialised with that size
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

	    gl.bufferSubData(
	    	bufferTarget, 
	    	/*buffer.offset*/ 0,
	    	(buffer.isIndexBuffer ? new Uint16Array(newBufferData) : new Float32Array(newBufferData))
	    );

	    return bufferObject;
	}

	// Creates vertex array object, vertex buffer object and element buffer object for geometry
	// Buffers are intialised with vertex data specified in geometry
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

	    this.bufferManager.addBuffer(bufferLocations, geometry.vertexBuffer.length, 
	    		geometry.indexBuffer.length, geometry.vertices.length);

	   	geometry.setBufferLocation(bufferLocations);

	   	oes_vao_ext.bindVertexArrayOES(null);

	    return bufferLocations;
	}

	initInstanceBuffer(instancedMesh, shaderProgram) {

		oes_vao_ext.bindVertexArrayOES(instancedMesh.geometry.bufferAttributes.bufferID.VertexArrayLoc);

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
	    	let baseAttribLocation = attrib.meta[0].index;

	    	for (let i = 0; i < attrib.meta.length; i++) {

	    		const attribLocation = baseAttribLocation + i;

		    	gl.vertexAttribPointer(
		    		attribLocation, 
		    		attrib.meta[i].attribLength, 
		    		gl.FLOAT, 
		    		false, 
		    		bufferAttributes.bufferLength * GL_FLOAT_SIZE, 
		    		attrib.meta[i].offset * GL_FLOAT_SIZE
		    	);

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

		gl.texImage2D(target, level, gl.RGBA, texture.width, texture.height, border, gl.RGBA, getTextureType(texture.type), texture.textureBuffer);

		gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, getInterpolation(texture.interpolation));

		if (texture.imgSrc != "") {

			const image = new Image();
			image.src = texture.imgSrc;
			image.crossOrigin = '';

			image.addEventListener('load', function() {
				gl.bindTexture(target, textureID);
				gl.texImage2D(target, level, internalFormat, srcFormat, gl.UNSIGNED_BYTE, image);
				gl.generateMipmap(target);
				gl.texParameteri(target, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
				gl.texParameteri(target, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			});
		}

		gl.bindTexture(target, null);

		return textureID;
	}

	updateTexture(texture) {

		gl.bindTexture(gl.TEXTURE_2D, texture.textureID);
		gl.texSubImage2D(
			gl.TEXTURE_2D, 
			0, 
			0, 
			0, 
			texture.width, 
			texture.height,
			gl.RGBA,
			getTextureType(texture.type),
			texture.textureBuffer
		);

		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	initEmptyTexture(textureWidth, textureHeight, texelType) {

		const textureID = gl.createTexture();

		gl.bindTexture(gl.TEXTURE_2D, textureID);

		const width = textureWidth;
		const height = textureHeight;
		const internalFormat = gl.RGBA;
		const srcFormat = gl.RGBA;
		const border = 0;
		const level = 0;

		// Create empty texture
		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, texelType, null);

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

	initFrameBuffer(type) {

		const depthBuffer = gl.createRenderbuffer();
		gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
		gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, this.canvas.width, this.canvas.height);

		let textureID = this.initEmptyTexture(this.canvas.width, this.canvas.height, /*gl.UNSIGNED_BYTE*/type);

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

	/*makeFloatFrameBuffer() {

		const textureID = this.initEmptyTexture(this.canvas.width, this.canvas.height, ext.HALF_FLOAT_OES);
		gl.bindTexture(gl.TEXTURE_2D, textureID);

		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAX_FILER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

		const frameBuffer = gl.createFrameBuffer();
		gl.bindFrameBuffer(gl.FRAME_BUFFER, frameBuffer);

		// Use float texture as colour buffer 0
		const attachmentPoint = gl.COLOR_ATTACHMENT0;
		gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentpoint, gl.TEXTURE_2D, textureID, 0);

		gl.bindFrameBuffer(gl.FRAME_BUFFER, null);
		gl.bindFrameBuffer(gl.TEXTURE_2D, null);

		return frameBuffer;
	}*/

	initEnvironmentMap(cubeMap) {

		let textureID = this.initCubeMapTextures(cubeMap.faces, cubeMap.dimension);
		cubeMap.setTextureID(textureID);
	}

	initQuad() {

    	const quadShader = ShaderBuilder.customShader(
    		'default', 
    		quadVertexShader, 
    		quadFragmentShader, {}, []
    	);
    	const quad = new PlaneEntity(quadShader);

    	return quad;
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

	initExtensions() {

		ext = gl.getExtension('ANGLE_instanced_arrays'); // Get extension for instancing

		if (!ext) {
			alert('Your machine or browser does not support ANGLE_instanced_arrays.');
		}
		oes_vao_ext = gl.getExtension('OES_vertex_array_object'); // Get extension for VAOs

		if (!oes_vao_ext) {
			alert('Your machine or browser does not support OES_vertex_array_object.');
		}

		/*oes_thf_ext = gl.getExtension('OES_texture_half_float'); // Get extension for floats in textures

		if (!oes_thf_ext) {
			alert('Your machine or browser does not support OES_texture_half_float.');
		}

		oes_thf_linear_ext = gl.getExtension('OES_texture_half_float_linear');

		if (!oes_thf_linear_ext) {
			alert('Your machine or browser does not support OES_texture_half_float_linear.');
		}

		/*cbf_ext = gl.getExtension('WEBGL_color_buffer_float');

		if (!cbf_ext) {
			alert('Your machine or browser does not support EXT_color_buffer_float. HDR will be disabled.')
		}*/

		/*oes_tf_ext = gl.getExtension('OES_texture_float');

		if (!oes_tf_ext) {
			alert('Your machine or browser does not support OES_texture_float.');
		}

		oes_tf_linear_ext = gl.getExtension('OES_texture_float');

		if (!oes_tf_linear_ext) {
			alert('Your machine or browser does not support OES_texture_float_linear.');
		}*/
	}
}

function getInterpolation(interpolation) {

	if (interpolation == 'Linear') {
		return gl.LINEAR;
	}
	else {
		return gl.NEAREST;
	}
}

function getTextureType(type) {

	if (type == 'Float') {
		return gl.FLOAT;
	}
	else {
		return gl.UNSIGNED_BYTE;
	}
}