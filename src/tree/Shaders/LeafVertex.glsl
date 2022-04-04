precision mediump float;

attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

attribute vec3 aStartVertexPosition;
attribute vec3 aStartNormal;

attribute float aAge;
attribute float aDeathAge;
attribute mat4 offset;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;
varying vec3 vVertexObject;

varying float vAge;
varying float vDeathAge;

uniform mat4 camera;
uniform mat4 perspective;

//uniform float age;

void main() {

    vec3 currentPos = (aAge * aStartVertexPosition) + aAge * (aVertexPosition - (aAge * aStartVertexPosition));
    vec3 currentNormal = (aAge * aStartNormal) + aAge * (aNormal - (aAge * aStartNormal));

    gl_Position = perspective * camera * offset * vec4(currentPos, 1.0);

    vVertexPosition = vec3(offset * vec4(currentPos, 1.0));
    vNormal = vec3(offset * vec4(currentNormal, 1.0));
    vAge = aAge;
    vDeathAge = aDeathAge;
    vTexCoord = aTexCoord;
    vVertexObject = aVertexPosition;
}