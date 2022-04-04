precision mediump float;

attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec3 aMatureStartVertexPosition;
attribute vec2 aTexCoord;
attribute float aBranchIndex;
attribute vec3 aColourId;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;
varying vec3 vColourId;
varying float vBranchAge;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float age;
uniform float branchAges[550];

uniform sampler2D uDataSampler;

void main() {

    float branchAge = branchAges[int(aBranchIndex)];

    vec3 currentPos = aMatureStartVertexPosition + branchAge * (aVertexPosition - aMatureStartVertexPosition);

    gl_Position = perspective * camera * world * vec4(currentPos, 1.0);

    vVertexPosition = vec3(world * vec4(currentPos, 1.0));
    vNormal = aNormal;
    vColourId = aColourId;
    vWorldNormal = vec3(world * vec4(aNormal, 1.0));
    vTexCoord = aTexCoord;
    vBranchAge = branchAge;
}