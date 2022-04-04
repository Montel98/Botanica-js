precision mediump float;

attribute vec3 aVertexPosition;
attribute vec3 aColourId;
attribute vec3 aMatureStartVertexPosition;

varying vec3 vVertexPosition;
varying vec3 vColourId;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float age;
uniform float branchAges[220];

void main() {

    vec3 currentPos = aMatureStartVertexPosition + age * (aVertexPosition - aMatureStartVertexPosition);

    gl_Position = perspective * camera * world * vec4(currentPos, 1.0);

    vVertexPosition = vec3(world * vec4(currentPos, 1.0));
    vColourId = aColourId;
}