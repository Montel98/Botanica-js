var gl, ext, oes_vao_ext;

const GL_UNSIGNED_SHORT_SIZE = 2;
const GL_FLOAT_SIZE = 4;

const textureUnitMap = {
	'textureMap' : 0,
	'normalMap' : 1
}

class Renderer {
	constructor(canvas) {
		this.canvas = canvas;

		gl = canvas.getContext("webgl");

		ext = gl.getExtension('ANGLE_instanced_arrays'); // Get extension for instancing
		oes_vao_ext = gl.getExtension('OES_vertex_array_object'); // Get extension for VAOs

    	if (gl == null) {

        	alert('Unable to initialiaze WebGL. Your browser or machine may not support it.');
    	}
	}

	//camera instead of scene
	render(entity, camera) {
		const mesh = entity.mesh;
		const geometry = mesh.geometry;
		const material = mesh.material;

		let programLoc = this.bindShaderProgram(mesh);

		gl.useProgram(programLoc);

		this.updateUniforms(camera, programLoc, entity);
		this.bindTextures(material);

		//let bufferLoc = geometry.bufferAttributes.bufferID;

		if (!geometry.bufferAttributes.bufferID) {
			geometry.bufferAttributes.bufferID = this.initBuffer(geometry, programLoc);
		}

		// Bind mesh's vertex array object
		oes_vao_ext.bindVertexArrayOES(geometry.bufferAttributes.bufferID.VertexArrayLoc);

		if (geometry.modifiedGeometryEvents.length > 0) {
			this.updateBuffers(geometry);
		}

		//const bufferSize = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE) / GL_UNSIGNED_SHORT_SIZE;
		const bufferSize = geometry.indexBuffer.length;

		if (mesh.isInstanced) {

			if (mesh.instanceBufferAttributes.bufferID == -1) {

				mesh.instanceBufferAttributes.bufferID = this.initInstanceBuffer(mesh, programLoc);
			}

			ext.drawElementsInstancedANGLE(gl.TRIANGLES, bufferSize, gl.UNSIGNED_SHORT, 0, mesh.instanceCount);
		}
		else {

			gl.drawElements(gl.TRIANGLES, bufferSize, gl.UNSIGNED_SHORT, 0);
		}
	}

	bindTextures(material) {

		for (let mapping in material.maps) {

			if (material[mapping]) {

				let textureLoc = material.maps[mapping].textureID;

				if (textureLoc == -1) {
					textureLoc = this.initTexture(material.maps[mapping]);
				}

				// Bind entity's texture(s) for drawing
				gl.bindTexture(gl.TEXTURE_2D, textureLoc);

				let unit = textureUnitMap[mapping];

				// Affect given unit
				gl.activeTexture(gl['TEXTURE' + unit]);

				// Tell shader we bound texture to unit
				gl.uniform1i(gl.getUniformLocation(programLoc, 'uSampler'), unit);
			}
		}
	}

	bindShaderProgram(mesh) {
		let shaders = mesh.shaders;
		let programLoc = shaders.programID;

		if (programLoc == -1) {

			//console.log(shaders.shaderSource.vertexShaderSrc);
			programLoc = this.initShaderProgram(shaders.shaderSource.vertexShaderSrc, shaders.shaderSource.fragmentShaderSrc);

			shaders.programID = programLoc;
		}

		return programLoc;
	}	

	updateUniforms(camera, program, entity) {

		const mesh = entity.mesh;

		if (!mesh.isInstanced) {

			const worldMatrix = entity.worldMatrix;
			
			const worldLoc = gl.getUniformLocation(program, 'world');

			gl.uniformMatrix4fv(worldLoc, false, worldMatrix.components.flat());
		}



		// Update camera matrix
		const cameraLoc = gl.getUniformLocation(program, 'camera');

		// Update perspective matrix
		const perspectiveLoc = gl.getUniformLocation(program, 'perspective');

		const cameraMatrices = camera.getCameraMatrices(this.canvas);

		const perspectiveMatrix = cameraMatrices.perspective;
		const cameraMatrix = cameraMatrices.camera;

		gl.uniformMatrix4fv(cameraLoc, false, cameraMatrix.components.flat());
		gl.uniformMatrix4fv(perspectiveLoc, false, perspectiveMatrix.components.flat());

		const meshShaderUniforms = mesh.shaders.uniforms;

		for (let uniformName in meshShaderUniforms) {

			const uniformLoc = gl.getUniformLocation(program, uniformName);
			const uniformData = meshShaderUniforms[uniformName];

			const uniformSize = uniformData.noRows;

			gl['uniform' + uniformSize + 'f'](uniformLoc, ...uniformData.components);
		}
	}

	updateBuffers(geometry) {

		let geometryEvent = geometry.modifiedGeometryEvents.pop();

		gl.bindBuffer(gl.ARRAY_BUFFER, geometry.bufferAttributes.bufferID.vertexBufferLoc);

		gl.bufferSubData(gl.ARRAY_BUFFER, 
							geometryEvent.vertexBufferIndex * GL_FLOAT_SIZE, 
							new Float32Array(geometry.vertexBuffer.slice(geometryEvent.vertexBufferIndex))
							);

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, geometry.bufferAttributes.bufferID.indexBufferLoc);

		gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER,
							geometryEvent.indexBufferIndex * GL_UNSIGNED_SHORT_SIZE,
							new Uint16Array(geometry.indexBuffer.slice(geometryEvent.indexBufferIndex))
							);
	}

	clear() {
		gl.clearColor(0.0, 0.0, 0.0, 1.0); // Set clear colour to black, fully opaque
        gl.clearDepth(1.0); // Clear all depth
        gl.enable(gl.DEPTH_TEST); // Enable depth testing
        gl.depthFunc(gl.LEQUAL); // Objects closer obscure those further away

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        //gl.enable(gl.CULL_FACE); // Discard back facing triangles
	}

	initBuffer(geometry, program) {

		let bufferOffset = 0;

		// Create handle to vertex array object
		const VAO = oes_vao_ext.createVertexArrayOES();
		oes_vao_ext.bindVertexArrayOES(VAO);

	    // Create handle to buffer object
	    const VBO = gl.createBuffer();

	    if (!VBO) {

	        alert('Failed to create vertex buffer');
	    }

	    gl.bindBuffer(gl.ARRAY_BUFFER, VBO);

	    //let vertexBuffer = geometry.vertexBuffer;

	    // Pass positions to WebGL to create buffer object's data store

	    var vertexBuffer, vertexBufferSize;

	    if (geometry.bufferAttributes.vertexBufferSize <= 0) {
	    	vertexBufferSize = geometry.vertexBuffer.length * GL_FLOAT_SIZE;
	    	vertexBuffer = geometry.vertexBuffer;
	    }
	    else {
	    	vertexBufferSize = geometry.bufferAttributes.vertexBufferSize * GL_FLOAT_SIZE;
	    	vertexBuffer = geometry.vertexBuffer.slice(0, geometry.bufferAttributes.vertexBufferSize);
	    }

	    gl.bufferData(gl.ARRAY_BUFFER, vertexBufferSize, gl.STATIC_DRAW);

	    gl.bufferSubData(gl.ARRAY_BUFFER, bufferOffset, new Float32Array(vertexBuffer));

	    this.initBufferAttributes(program, geometry.bufferAttributes, false);

	    // Index Buffer
	    const IBO = gl.createBuffer();

	    if (!IBO) {

	        alert('Failed to create index buffer');
	    }

	    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, IBO);

	    //let indexBuffer = geometry.indexBuffer;
	    var indexBuffer, indexBufferSize;


	    if (geometry.bufferAttributes.indexBufferSize <= 0) {
	    	indexBufferSize = geometry.indexBuffer.length * GL_UNSIGNED_SHORT_SIZE;
	    	indexBuffer = geometry.indexBuffer;
	    }
	    else {
	    	indexBufferSize = geometry.bufferAttributes.indexBufferSize * GL_UNSIGNED_SHORT_SIZE;
	    	indexBuffer = geometry.indexBuffer.slice(0, geometry.bufferAttributes.indexBufferSize);
	    }

	    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indexBufferSize, gl.STATIC_DRAW);

	    gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER, bufferOffset, new Uint16Array(indexBuffer));

	    const bufferLocations = {
	    	VertexArrayLoc: VAO,
	        vertexBufferLoc: VBO,
	        indexBufferLoc: IBO
	    };

	   	geometry.setBufferLocation(bufferLocations);

	    return bufferLocations;
	}

	initInstanceBuffer(instancedMesh, program) {
		const instanceVBO = gl.createBuffer();

		if (!instanceVBO) {

			alert('Failed to create instanced vertex buffer');
		}

		instancedMesh.instanceBufferAttributes.bufferID = instanceVBO;

		gl.bindBuffer(gl.ARRAY_BUFFER, instanceVBO);

		let matrixBuffer = instancedMesh.worldMatrices.map(matrices => matrices.components.flat())
							.flat();

		gl.bufferData(gl.ARRAY_BUFFER,
						new Float32Array(matrixBuffer),
						gl.DYNAMIC_DRAW);

		this.initBufferAttributes(program, instancedMesh.instanceBufferAttributes, true);

		return instanceVBO;
	}

	initBufferAttributes(program, bufferAttributes, isInstanceBuffer) {
	    for (let attribName in bufferAttributes.attributes) {

	    	let attrib = bufferAttributes.attributes[attribName];
	    	//console.log(attribName);
	    	let baseAttribLocation = gl.getAttribLocation(program, attribName);
	    	//console.log(baseAttribLocation);

	    	for (let i = 0; i < attrib.length; i++) {

	    		const attribLocation = baseAttribLocation + i;

	    		//console.log(attribLocation, attrib[i].attribLength, bufferAttributes.bufferLength * GL_FLOAT_SIZE, attrib[i].offset * GL_FLOAT_SIZE);

		    	gl.vertexAttribPointer(attribLocation, 
		    							attrib[i].attribLength, 
		    							gl.FLOAT, 
		    							false, 
		    							bufferAttributes.bufferLength * GL_FLOAT_SIZE, 
		    							attrib[i].offset * GL_FLOAT_SIZE);

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

		gl.bindTexture(gl.TEXTURE_2D, textureID);


		// Create temporary texture while real texture is loading
		const tempTexture = new Uint8Array([0, 255, 255, 255]);
		const width = 1;
		const height = 1;
		const border = 0;
		const level = 0;
		const srcFormat = gl.RGBA;
		const internalFormat = gl.RGBA;

		gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, width, height, border, srcFormat, gl.UNSIGNED_BYTE, tempTexture);

		const image = new Image();
		image.src = texture.imgSrc;
		image.crossOrigin = '';

		image.addEventListener('load', function() {
			console.log('Done!');
			gl.bindTexture(gl.TEXTURE_2D, textureID);
			gl.texImage2D(gl.TEXTURE_2D, level, internalFormat, srcFormat, gl.UNSIGNED_BYTE, image);
			gl.generateMipmap(gl.TEXTURE_2D);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
		});

		return textureID;
	}

	initShaderProgram(vsSource, fsSource) {

	    // Create handles to shader objects
	    const vertexShader = this.loadShader(gl.VERTEX_SHADER, vsSource);
	    const fragmentShader = this.loadShader(gl.FRAGMENT_SHADER, fsSource);

	    console.log(vsSource);

	    // Create program and attach shaders
	    const shaderProgram = gl.createProgram();
	    gl.attachShader(shaderProgram, vertexShader);
	    gl.attachShader(shaderProgram, fragmentShader);
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
}