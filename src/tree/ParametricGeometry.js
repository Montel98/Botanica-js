import Geometry from './Geometry.js';
import Vector, { zeroVector, cross, subtract } from './Vector.js';

export default class ParametricGeometry extends Geometry {
	
	constructor(surface/*, mapping*/, uSteps, vSteps, invertedNormals, useST, useNormals, mappingFunc=null, mapping=null) {

		super(invertedNormals, useNormals, useST);

		this.surface = surface;
		this.uSteps = uSteps;
		this.vSteps = vSteps;

		//this.stBuffer = [];

		this.stMapping = mapping;

		this.mappingFunc = mappingFunc;

		//this.vertexBuffer = this.generateBuffers();
		this.setVertexBuffer(this.generateBuffers());
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

		if (this.mappingFunc) {
			let stMap = this.mappingFunc(this);

			for (let i = 0; i < this.vertices.length; i++) {
				this.STs.push(stMap[i]);
			}
		}
		else {

			var sMin, sMax, tMin, tMax;

			if (this.stMapping) {

				sMin = this.stMapping.sMin;
				sMax = this.stMapping.sMax;
				tMin = this.stMapping.tMin;
				tMax = this.stMapping.tMax;
			}
			else {

				sMin = 0.0;
				sMax = 1.0;

				tMin = 0.0;
				tMax = 1.0;
			}

		    for (let i = 0; i < this.vertices.length; i++) {

		        let u = i % this.uSteps;
		        let v = Math.floor(i / this.uSteps);

		        //geometry.STs[i] = (new Vector([v / (vMax - 1), u / (uMax - 1)]));
		        //this.STs.push(new Vector([0.2 * u / (this.uSteps - 1), v / (this.vSteps - 1)])); <- for trunk I think, 0.2 squished it


		        let s = sMin + ((sMax - sMin) * (u / (this.uSteps - 1)));
		        let t = tMin + ((tMax - tMin) * (v / (this.vSteps - 1)));

		        //this.STs.push(new Vector([u / (this.uSteps - 1), v / (this.vSteps - 1)]));
		        this.STs.push(new Vector([s, t]));
		    }
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

	        		this.normals.push(normal);
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
    	
    	return this.mergeAttributes();
    }
}