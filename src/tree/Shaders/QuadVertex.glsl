precision mediump float;

attribute vec3 aVertexPosition;
attribute vec2 aTexCoord;

varying vec2 vTexCoord;

void main() {

	gl_Position = vec4(aVertexPosition, 1.0);

	vTexCoord = aTexCoord;
}