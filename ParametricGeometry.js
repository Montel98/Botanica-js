// Rename to parametric geometry

class ParametricGeometry extends Geometry {
	
	constructor(surface, mapping, uStep, vStep, invertedNormals, useST, useNormals) {

		super(invertedNormals, useST);

		this.surface = surface;
		this.uSteps = uStep;
		this.vSteps = vStep;
		this.useNormals = useNormals;

		this.normalTable = [];
		this.binormalTable = [];
		this.tangentTable = [];

		this.stBuffer = [];

		this.stMapping = mapping;

		this.vertexBuffer = this.generateBuffers();
	}

	isValidTriangle(indices) {

		let vertices = indices.map(index => this.vertices[index]);

		return !vertices[0].equals(vertices[1]) &&
		!vertices[0].equals(vertices[2]) && 
		!vertices[1].equals(vertices[2]);
	}

	generateIndices() {

	    const offsets = [ [[0, 0], [0, 1], [1, 1]], 
	                		[[1, 1], [1, 0], [0, 0]] ];

		for (let vStep = 0; vStep < this.vSteps - 1; vStep++) {

	        for (let uStep = 0; uStep < this.uSteps - 1; uStep++) {

	       		for (let i = 0; i < offsets.length; i++) {

	        		var indices = offsets[i].map(offset =>
						{return ((vStep + offset[0]) * (this.uSteps)) + (uStep + offset[1]);}
					);


	        		if (this.isValidTriangle(indices)) {
	        			this.indexBuffer.push(...indices);
	        		}
	        	}
	        }
	    }
	}

	generateSTs() {

		for (let i = 0; i < this.vertices.length; i++) {

			let u = Math.floor(i / this.vSteps);
			let v = i % this.vSteps;

			let s = v / (this.vSteps - 1);
			let t = u / (this.uSteps - 1);

			//console.log('s:' + s + 't:', t);

			this.stBuffer.push(t, -s);
		}

	}

	generateMeshVertices() {

        let deltaU = (this.surface.uMax - this.surface.uMin) / (this.uSteps - 1.0);
        let deltaV = (this.surface.vMax - this.surface.vMin) / (this.vSteps - 1.0);

        let eps = 0.0001;
        var u, v;
        
        for (let vStep = 0; vStep < this.vSteps; vStep++) {

        	for (let uStep = 0; uStep < this.uSteps; uStep++) {

        		u = this.surface.uMin + (uStep * deltaU);
        		v = this.surface.vMin + (vStep * deltaV);

        		let vertex = this.surface.eval(u, v);

        		this.vertices.push(vertex);

        		let du = subtract(this.surface.eval((u + eps), v), vertex);
        		let dv = subtract(this.surface.eval(u, (v + eps)), vertex);

        		if (this.useNormals) {

	        		var normal;

	        		if (this.invertedNormals) {
	        			normal = cross(du, dv);
	        		}
	        		else {
	        			normal = cross(dv, du);
	        		}

	        		if (!(normal.equals(zeroVector))) {
	        			normal = normal.normalize();
	        		}

	        		this.normalTable.push(normal);
	        		//this.binormalTable.push(du.normalize());
	        		//this.tangentTable.push(dv.normalize());
	        	}
        	}
        }

        this.generateIndices();

        if (this.useST) {
        	this.generateSTs();
    	}
    }

    generateBuffers() {

    	this.generateMeshVertices();

    	let buffer = this.vertices.map((vertex, i) => 
    	{	
    		// Vertices
    		let vComponents = vertex.components;
    		let entry = [vComponents[0], vComponents[1], vComponents[2]];
    		
    		// Normals
    		if (this.useNormals) {
	    		let normal = this.normalTable[i];
	    		let nComponents = normal.components;
	    		entry.push(nComponents[0], nComponents[1], nComponents[2]);
	    	}

    		// Texture Maps
    		if(this.useST) {
    			entry.push(this.stBuffer[2 * i], this.stBuffer[(2 * i) + 1]);
    		}

    		return entry;
    	});

    	return buffer.flat();
    }
}