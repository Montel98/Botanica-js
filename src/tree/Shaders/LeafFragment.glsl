precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec2 vTexCoord;
varying vec3 vVertexObject;

varying float vAge;
varying float vDeathAge;

uniform vec3 colourStart;
uniform vec3 colourEnd;

uniform sampler2D uTexture;
uniform samplerCube uCubeSampler;

uniform vec3 eye;

uniform float time;

struct LightSource {
    float ambient;
    float diffuse;
    float specular;
    float reflectivity; 
};

uniform LightSource lightSource;

float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

float fbm (in vec2 st) {
    // Initial values
    float value = 0.0;
    float amplitude = .5;
    float frequency = 0.;
    //
    // Loop of octaves
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

void main() {
	vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);

	vec3 lightPos = vec3(0.0, -10.0, 10.0);
    vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

	float ambient = lightSource.ambient;
	float diffuse = lightSource.diffuse * clamp(dot(norm, lightDir), 0.0, 1.0);

	vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
	vec3 viewDirection = normalize(vVertexPosition - eye);

	float specular = lightSource.specular * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 2.0); // was 16

	float light = ambient + diffuse + specular;

	float ageTransformed = vAge;
	float deathAgeTransformed = sqrt(vDeathAge);

	float textureColour = texture2D(uTexture, vTexCoord).r;

	vec3 ambientColour = (ageTransformed * colourEnd) + ((1.0 - ageTransformed) * colourStart);

	//EXPERIMENTAL

	vec2 st = vVertexObject.xy;

    vec3 colour = vec3(0.0);
    float d = 100.0 * length(st);
    float n = fbm(st * 80.0);
    
    vec3 green = 0.3 * vec3(0.4, 0.6, 0.0);
    vec3 red = 0.3 * vec3(1.0, 0.5, 0.0); // <- was 0.3
    vec3 orange = 0.3 * vec3(1.0, 1.0, 0.0);
    
    vec3 colourA = mix(orange, red, n);
    vec3 colourB = red * (0.3 + n);
    
    float offset = 0.2;
    float offset2 = 0.4;
	float t = clamp(1.0 - 3.0 * vDeathAge, 0.0, 1.0);
	float b = clamp(1.0 - 3.0 * (vDeathAge - 0.5), 0.0, 1.0);

    float c = smoothstep(t, t + offset, n * sqrt(d));
    float e = smoothstep(b, b + offset, n * sqrt(d));

    colour = mix(ambientColour, colourA, c);
    colour += mix(vec3(0,0,0), colourB - colour, e);

    ambientColour += step(0.01, vDeathAge) * (colour - ambientColour);

    vec3 reflectedColour = vec3(textureCube(uCubeSampler, reflected));

    vec3 leafColour = ((1.0 - lightSource.reflectivity) * ambientColour * textureColour) + (lightSource.reflectivity * reflectedColour);

    float exposure = 0.8;
    vec3 hdrColour = vec3(1.0) - exp(-exposure * light * leafColour);

    float gamma = 2.2;

    vec3 finalColour = pow(hdrColour, vec3(1.0 / gamma));

    gl_FragColor = vec4(finalColour, 1.0);
}