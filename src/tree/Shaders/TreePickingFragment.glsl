precision mediump float;

varying vec3 vColourId;

void main() {
    gl_FragColor = vec4(vColourId, 1.0);
}