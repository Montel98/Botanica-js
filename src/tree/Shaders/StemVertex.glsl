precision mediump float;

attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec3 aEndVertexPosition;
attribute vec3 aMatureStartVertexPosition;
attribute vec3 aStartVertexPosition;
attribute vec2 aTexCoord;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float du;
uniform float age;

void main() {

	vec3 currentGirthPos = aMatureStartVertexPosition + age * (aVertexPosition - aMatureStartVertexPosition);
	vec3 currentGirthPos2 = aStartVertexPosition + age * (aEndVertexPosition - aStartVertexPosition);

	vec3 currentPos = currentGirthPos2 + du * (currentGirthPos - currentGirthPos2);

	gl_Position = perspective * camera * world * vec4(currentPos, 1.0);

	vVertexPosition = vec3(world * vec4(currentPos, 1.0));
	vNormal = aNormal;
	vWorldNormal = vec3(world * vec4(aNormal, 1.0));
	vTexCoord = aTexCoord;
}