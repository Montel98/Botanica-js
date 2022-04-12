precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
//attribute vec2 aTexCoord;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec3 vWorldNormal;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

void main() {

    gl_Position = perspective * camera * world * vec4(aVertexPosition, 1.0);

    vVertexPosition = vec3(world * vec4(aVertexPosition, 1.0));
    vNormal = aNormal;
    vWorldNormal = vec3(world * vec4(aNormal, 1.0));
}