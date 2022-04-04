precision mediump float;

varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;
varying float vBranchAge;

varying vec3 vColourId;

uniform vec3 ambientColour;
uniform vec3 eye;

uniform float age;

uniform samplerCube uCubeSampler;
uniform sampler2D uTexture;

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
    vec3 treeColour = (1.0 - vBranchAge) * ambientColour + vBranchAge * texture2D(uTexture, vTexCoord).rgb;

    float gamma = 2.2;

    vec3 finalColour = light * ((1.0 - lightSource.reflectivity) * treeColour + (lightSource.reflectivity) * reflectedColour);
    vec3 finalColourCorrected = pow(finalColour, vec3(1.0 / gamma));

    gl_FragColor = vec4(finalColour, 1.0);
}