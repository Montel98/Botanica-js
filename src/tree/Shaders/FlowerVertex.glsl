precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute mat4 offset;

attribute vec3 aStartVertexPosition;
attribute vec3 aStartNormal;

attribute vec3 aMidVertexPosition;
attribute vec3 aMidNormal;
//attribute vec3 aColour;

attribute vec2 aTexCoord;

attribute float aAge;

//uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

varying vec3 vVertexPosition;
varying vec3 vNormal;
//varying vec3 vColour;

varying vec2 vTexCoord;

//uniform float age;

void main() {

	float threshold = 0.5;
	float factor = 1.0 / threshold;

	vec3 aStartVertexPosScaled = 0.2 * aStartVertexPosition;

	vec3 v1 = ((1.0 - factor * aAge) * aStartVertexPosScaled) + factor * aAge * aMidVertexPosition;

	float x = factor * (aAge - threshold);

	float ageScaled = ( 2.0 / ( 1.0 + exp(-10.0 * x) ) ) - 1.0;
	//vec3 v2 = ((1.0 - factor * (aAge - threshold)) * aMidVertexPosition) + (factor * (aAge - threshold) * aVertexPosition);
	vec3 v2 = ((1.0 - ageScaled) * aMidVertexPosition) + (ageScaled * aVertexPosition); 

	vec3 currentPos = mix(v1, v2, step(threshold, aAge));

	vec3 n1 = ((1.0 - factor * aAge) * aStartNormal) + factor * aAge * aMidNormal;
	//vec3 n2 = ((1.0 - factor * (aAge - threshold)) * aMidNormal) + (factor * (aAge - threshold) * aNormal);
	vec3 n2 = ((1.0 - ageScaled) * aMidNormal) + (ageScaled * aNormal); 

	vec3 currentNormal = mix(n1, n2, step(threshold, aAge));

	gl_Position = perspective * camera * offset * vec4(currentPos, 1.0);

	vVertexPosition = currentPos;
	vNormal = currentNormal;
	//vColour = aColour;
	vTexCoord = aTexCoord;
}