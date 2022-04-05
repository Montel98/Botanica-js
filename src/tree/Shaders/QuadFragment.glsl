precision mediump float;

varying vec2 vTexCoord;

uniform sampler2D hdrBuffer;

void main() {

    float gamma = 2.2;

    //vec3 finalColour = pow(texture2D(hdrBuffer, vTexCoords).rgb, vec3(1.0 / gamma));
    //vec3 finalColour = texture2D(hdrBuffer, vTexCoords).rgba;
    vec4 finalColour = texture2D(hdrBuffer, vTexCoord);

    float average = 0.2126 * finalColour.r + 0.7152 * finalColour.g + 0.0722 * finalColour.b;
    //gl_FragColor = vec4(average, average, average, 1.0);
    //gl_FragColor = finalColour;
	//gl_FragColor = vec4(0.0, 1.0, 1.0, 1.0);

	float exposure = 0.8;
    vec3 hdrColour = vec3(1.0) - exp(-exposure * finalColour.rgb);

    vec3 gammaColour = pow(hdrColour, vec3(1.0 / gamma));

    gl_FragColor = vec4(gammaColour, finalColour.a);
} 