import Geometry from './Geometry.js';
import ParametricSurface  from './ParametricSurface.js';
import ParametricGeometry from './ParametricGeometry.js';
import Mesh from './Mesh.js';
import { identityMatrix } from './Matrix.js';
import Material from './Material.js';
import ShaderBuilder, { ShaderAttribute } from './ShaderBuilder.js';
import Vector, { add } from './Vector.js';
import { radiusProperties, radiusFunc } from './LSystem.js';
import Entity from './Entity.js';
import BezierCubic from './BezierCubic.js';
import { stemFunc, crossSection, trunkCrossSection } from './Stem.js';

const selectorVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aMatureStartVertexPosition;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float age;

void main() {

    vec3 currentPos = aMatureStartVertexPosition + age * (aVertexPosition - aMatureStartVertexPosition);

    gl_Position = perspective * camera * world * vec4(currentPos, 1.0);
}

`

const selectorFragmentShader = 
`
precision mediump float;

void main() {
	gl_FragColor = vec4(1.0);
}

`

export default class SegmentSelector extends Entity {

	constructor(tree) {

		super();

		this.worldMatrix = identityMatrix;
		this.width = 0.2; // width as a percentage of segment length;
		this.tree = tree;

		const material = new Material();
		const geometry = new Geometry(false, false, false);
		geometry.addMorphTarget('MatureStart', []);

		geometry.setVertexBufferSize(384 * 4);
		geometry.setIndexBufferSize(186 * 4);

		//geometry.setVertexBufferSize(1000);
		//geometry.setIndexBufferSize(1000);

		this.mesh = new Mesh(material, geometry);
		this.mesh.setShaderProgram('Default', ShaderBuilder.customShader('segment_shader',
												selectorVertexShader,
												selectorFragmentShader,
												{'age': new Vector([0.0])},
												[ShaderAttribute('aVertexPosition', 1)]
												)
		);

		this.defaultShader = this.mesh.shaderPrograms['Default'];

		this.currentSegment = null;

	}

	changeToSegment(segment, height) {

		this.mesh.geometry.setGeometry(this.generateGeometry(segment.stackFrame, height));
		this.currentSegment = segment;
	}

	generateGeometry(stackFrame, height) {

		const offset = 0.001;

		let normDir = stackFrame.axis.forward.normalize();

		let pos = stackFrame.pos;

		let p0 = pos;
		let p1 = add(pos, normDir.scale(0.33 * 0.03));
		let p2 = add(pos, normDir.scale(0.66 * 0.03));
		let p3 = add(pos, normDir.scale(0.03));

		let path = new BezierCubic(p0, p1, p2, p3);

		let radiusStart = radiusProperties(0.001 + offset,
											0.001 + offset, 
											stackFrame.branch.branchLength, 0);

		let radiusEnd = radiusProperties(stackFrame.radius.radiusStart + offset, 
										stackFrame.radius.radiusEnd + offset,
										stackFrame.branch.branchLength,
										stackFrame.radius.shift /*- 1*/);

		var crossSectionFunc;

		if (stackFrame.branch.level > 0) {
			crossSectionFunc = crossSection;
		}
		else {
			crossSectionFunc = trunkCrossSection;
		}

		let startSurface = new ParametricSurface(stemFunc(stackFrame.axis, path, radiusFunc, crossSectionFunc, radiusStart),
											height - 0.5 * this.width,
											height + 0.5 * this.width,
											0.0, 2.0 * Math.PI);

		let endSurface = new ParametricSurface(stemFunc(stackFrame.axis, path, radiusFunc, crossSectionFunc, radiusEnd),
											height - 0.5 * this.width,
											height + 0.5 * this.width,
											0.0, 2.0 * Math.PI);

		let geometryStart = new ParametricGeometry(startSurface, 2, 16, false, false, false);
		let geometryEnd = new ParametricGeometry(endSurface, 2, 16, false, false, false);

		geometryEnd.addMorphTarget('MatureStart', geometryStart.vertices);

		return geometryEnd;
	}

	setWidth(width) {

		this.width = width;
	}

	act(worldTime) {

		//this.defaultShader.uniforms['age'].components[0] = this.tree.age;

		if (this.currentSegment) {

			this.defaultShader.uniforms['age'].components[0] = this.currentSegment.stackFrame.branch.age;
		}
	}
}