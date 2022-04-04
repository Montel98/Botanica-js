precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;

uniform vec3 ambientColour;
uniform vec3 eye;

uniform samplerCube uCubeSampler;
uniform sampler2D uTexture;

uniform float age;

struct LightSource {
    float ambient;
    float diffuse;
    float specular;
    float reflectivity; 
};

uniform LightSource lightSource;

void main() {
	vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);
	vec3 worldNorm = (vWorldNormal == vec3(0.0)) ? vec3(0.0) : normalize(vWorldNormal);

	vec3 lightPos = vec3(0.0, -10.0, 10.0);
	vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

	float ambient = lightSource.ambient;
	float diffuse = lightSource.diffuse * clamp(dot(worldNorm, lightDir), 0.0, 1.0);

	vec3 reflected = lightDir - 2.0 * dot(worldNorm, lightDir) * worldNorm;
	vec3 viewDirection = normalize(vVertexPosition - eye);

    float specular = lightSource.specular * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 4.0); //<- power was 16

	float light = ambient + diffuse + specular;
	vec3 reflectedColour = vec3(textureCube(uCubeSampler, reflected));

	vec3 stemColour = (1.0 - age) * ambientColour + age * texture2D(uTexture, vTexCoord).rgb;

    gl_FragColor = vec4(light * ((1.0 - lightSource.reflectivity) * stemColour + (lightSource.reflectivity) * reflectedColour), 1.0); //0.2
}