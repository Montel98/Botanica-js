precision mediump float;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec3 vColour;

varying vec2 vTexCoord;

uniform float age;
uniform vec3 ambientColour;
uniform vec3 eye;

uniform sampler2D uTexture;

void main() {

	vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);
	vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

	float ambient = 0.2;
	float diffuse = 0.6 * clamp(dot(norm, lightDir), 0.0, 1.0);

	vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
	vec3 viewDirection = normalize(vVertexPosition - eye);

	float specular = 0.6 * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 4.0);
	float light = ambient + diffuse + specular;

	vec3 textureColour = texture2D(uTexture, vTexCoord).rgb;

    float gamma = 2.2;
    
    vec3 hdrColour = vec3(1.0) - exp(-0.8 * 0.5 * light * textureColour);

    vec3 finalColour = pow(hdrColour, vec3(1.0 / gamma));

    gl_FragColor = vec4(finalColour, 1.0);
}