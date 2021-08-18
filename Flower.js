const flowerVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute mat4 offset;

uniform mat4 camera;
uniform mat4 perspective;

varying vec3 vVertexPosition;

uniform float t;

void main() {

	float r = length(aVertexPosition.xy);

	/*vec2 p4 = vec2(0.0, 0.0);
	vec2 p5 = vec2(1.0, 1.0);
	vec2 p6 = vec2(1.0, 0.0);
	vec2 p7 = vec2(2.0, 0.0);*/

	/*vec2 p0 = vec2(0.0, 0.0);
	vec2 p1 = vec2(1.0, 1.0);
	vec2 p2 = vec2(1.0, 1.0);
	vec2 p3 = vec2(0.0, 2.0);*/

	vec2 p0 = vec2(0.0, 0.0);
	vec2 p1 = vec2(0.0, 1.0);
	vec2 p2 = vec2(0.5, 1.5);
	vec2 p3 = vec2(1.0, 2.0);

	vec2 p4 = vec2(0.0, 0.0);
	vec2 p5 = vec2(0.5, 0.5);
	vec2 p6 = vec2(1.5, 0.0);
	vec2 p7 = vec2(2.0, -0.5);

	vec2 startPos = (1.0-r)*(1.0-r)*(1.0-r)*p0 + 3.0*(1.0-r)*(1.0-r)*r*p1 + 3.0*(1.0-r)*r*r*p2 + r*r*r*p3;
	vec2 endPos = (1.0-r)*(1.0-r)*(1.0-r)*p4 + 3.0*(1.0-r)*(1.0-r)*r*p5 + 3.0*(1.0-r)*r*r*p6 + r*r*r*p7;

	vec2 currentPos = startPos + (sin(t) * sin(t) * (endPos - startPos));

	vec2 normPos = (r == 0.0) ? vec2(0.0) : normalize(aVertexPosition.xy);
	vec3 newPos = vec3(normPos * currentPos.x, currentPos.y);

	gl_Position = perspective * camera * offset * vec4((abs(sin(t))+0.1) * newPos, 1.0);

	vVertexPosition = vec3(offset * vec4(newPos, 1.0));
}
`

const flowerFragmentShader = 
`
precision mediump float;
varying vec3 vVertexPosition;
//varying vec3 vOffset;

uniform float t;

void main() {

	vec2 p4 = vec2(0.0, 0.0);
	vec2 p5 = vec2(1.0, 1.0);
	vec2 p6 = vec2(1.0, 0.0);
	vec2 p7 = vec2(2.0, 0.0);

	vec2 p0 = vec2(0.0, 0.0);
	vec2 p1 = vec2(1.0, 1.0);
	vec2 p2 = vec2(1.0, 1.0);
	vec2 p3 = vec2(0.0, 2.0);

	float r = length(vVertexPosition.xy);

	vec2 dStartPos = 3.0*(1.0-r)*(1.0-r)*(p1-p0) + 6.0*(1.0-r)*r*(p2-p1) + 3.0*r*r*(p3-p2);
	vec2 dEndPos = 3.0*(1.0-r)*(1.0-r)*(p5-p4) + 6.0*(1.0-r)*r*(p6-p5) + 3.0*r*r*(p7-p6);

	vec2 dCurrentPos = dStartPos + (sin(t) * sin(t) * (dEndPos - dStartPos));
	vec2 normPos = (r == 0.0) ? vec2(0.0) : normalize(vVertexPosition.xy);
	vec3 dNewPos = vec3(normPos * dCurrentPos.x, dCurrentPos.y);
	vec3 dTheta = vec3(-vVertexPosition.y, vVertexPosition.x, 0.0);

	vec3 normal = normalize(cross(dNewPos, dTheta));
	vec3 lightDir = normalize(vec3(0.0, 0.0, 1.0) - vVertexPosition);

	float ambient = 0.2;
	float diffuse = clamp(dot(normal, lightDir), 0.0, 1.0);
	float light = ambient + diffuse;

	gl_FragColor = vec4(light * vec3(0.5, 0.0, 0.5), 1.0);
}
`

//var termA = new FourierTerm(0.0, 2.0, 2.5, 2.0);
//var termB = new FourierTerm(0.0, 1.0, 4.5, 2.0);

var termA = new FourierTerm(0.0, 0.8, 2.5, 2.0);
//var termB = new FourierTerm(0.0, 0.4, 5.0, 2.0);

var f = new FourierSeries(0.2, [termA]);

const flowerFunc = {
	aux(u, v) {
		this.r = v * f.sum(u);
	},

	x(u, v) {
		return this.r * Math.cos(u);
	},

	y(u, v) {
		return this.r * Math.sin(u);
	},

	z(u, v) {
		return 1.0;
	}
}

const flowerSurface = new ParametricSurface(flowerFunc, 0.0, 2.0 * Math.PI, 0.0, 1.0);

const flowerMapping = {
					vMin: flowerSurface.vMin, 
					vMax: flowerSurface.vMax,
					uMin: flowerSurface.uMin, 
					uMax: flowerSurface.uMax
				};

const flowerGeometry = new ParametricGeometry(flowerSurface, flowerMapping, 256, 8, false, false, false);
const flowerTexture = new Texture('flower_stem1.png');

class Flower {
	constructor(surface) {
		const textureTest = new Texture('https://www.filterforge.com/filters/2674-normal.jpg');

		const geometry = new ParametricGeometry(surface, flowerMapping, 64, 12, false, false, true);

		this.mesh = new Mesh(textureTest, geometry);
	}
}

// Experimental

class Flowers extends Entity {
	constructor() {

		super();

		const geometry = flowerGeometry;
		const material = new Material(flowerTexture);

		geometry.bufferAttributes.bufferLength = 3;
		geometry.bufferAttributes.attributes = {'aVertexPosition': [{attribLength: 3, offset: 0}]};

		//this.mesh = new Mesh(material, geometry);
		this.mesh = new InstancedMesh(material, geometry);
		this.mesh.shaders = shaderBuilder.customShader(flowerVertexShader, flowerFragmentShader, {'t': 0.0});

		this.d = new Date();
		this.start = this.d.getTime() / 1000;

		this.shaderUniforms = this.mesh.shaders.uniforms;
		//this.t = this.start
		this.shaderUniforms['t'] = this.start;
		//this.mesh.addInstanceBufferAttribute('age', 1, 16);

		const factor = 0.1;
		this.mesh.addInstance(multiply(translate(0.6, 0.6, 0.6), scale(factor, factor, factor)));
		this.mesh.addInstance(multiply(translate(0.4, 0.4, 0.4), scale(factor, factor, factor)));
		this.mesh.addInstance(multiply(translate(0.2, 0.2, 0.2), scale(factor, factor, factor)));
	}

	act() {
		//this.t = (this.d.getTime()) - this.start;
		this.shaderUniforms['t'] = 0.1 * ((Date.now() / 1000) - this.start);
	}
}