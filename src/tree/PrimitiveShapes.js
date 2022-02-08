const planeVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTexCoord;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec2 vTexCoord;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

void main() {

    gl_Position = perspective * camera * world * vec4(aVertexPosition, 1.0);

    vVertexPosition = vec3(world * vec4(aVertexPosition, 1.0));
    vNormal = aNormal;
    vTexCoord = aTexCoord;
}
`;

const planeFragmentShader = 
`
precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec2 vTexCoord;

uniform vec3 ambientColour;
uniform vec3 eye;

uniform sampler2D uTexture;

void main() {
    //vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);
    vec3 norm = texture2D(uTexture, vTexCoord).rgb;
    //vec3 lightDir = normalize(vec3(-0.5, -10.0, 10.0) - vVertexPosition);

                            /*float ambient = 0.2;
                            float diffuse = 0.8 * clamp(dot(norm, lightDir), 0.0, 1.0);

                            //float light = texture2D(uTexture, vTexCoord).r * (ambient + diffuse);
                            float light = ambient + diffuse;

                            gl_FragColor = vec4(light * ambientColour, 1.0);*/

                            vec3 lightPos = vec3(0.0, -10.0, 10.0);
    						vec3 lightDir = normalize(lightPos - vVertexPosition);

						    float ambient = 0.2;
						    float diffuse = 0.5 * clamp(dot(norm, lightDir), 0.0, 1.0);

						    vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
						    vec3 viewDirection = normalize(vVertexPosition - eye);

						    float specular = 0.5 * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 16.0);

						    float light = (ambient + diffuse + specular) * (1.0 - step(0.495, length(vTexCoord - vec2(0.5, 0.5))));

						    if (light <= 0.1) {
    							discard;
    						}

						    gl_FragColor = vec4(light * ambientColour, 1.0); //0.2
}

`;

function PlaneGeometry() {
	const planeGeometry = new Geometry(false, true, true);

	planeGeometry.vertices.push(...[new Vector([-1, -1, 0]),
								new Vector([1, -1, 0]),
								new Vector([1, 1, 0]),
								new Vector([-1, 1, 0])
								]);

	const normal = new Vector([0, 0, 1]);
	planeGeometry.normals.push(...[normal, normal, normal, normal]);

	const indices = [0, 1, 2, 2, 3, 0];
	planeGeometry.indexBuffer.push(...indices);

	planeGeometry.STs.push(...[new Vector([0, 0]),
							new Vector([1, 0]),
							new Vector([1, 1]),
							new Vector([0, 1])
							]);

	planeGeometry.vertexBuffer.push(...planeGeometry.mergeAttributes());

	return planeGeometry;
}

class PlaneEntity extends Entity {
	constructor() {
		super();

		const geometry = PlaneGeometry();
		//const texture = generateSoilTexture(512, 512, 4);
		const texture = new Texture('data:image/jpeg;base64,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');

		const material = new Material(texture);
		material.maps['textureMap'] = texture;

		this.mesh = new Mesh(material, geometry);

		this.mesh.shaders = shaderBuilder.customShader('plane_shader',
														planeVertexShader,
														planeFragmentShader, {}
														);

		this.colour = new Vector([0.25, 0.15, 0.1]);

	}

	act() {
		this.mesh.shaders.uniforms['ambientColour'] = this.colour;
	}
}