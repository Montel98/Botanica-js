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
    vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);
    vec3 lightDir = normalize(vec3(-0.5, -10.0, 10.0) - vVertexPosition);

    						if (texture2D(uTexture, vTexCoord).a <= 0.1) {
    							discard;
    						}

                            float ambient = 0.2;
                            float diffuse = 0.8 * clamp(dot(norm, lightDir), 0.0, 1.0);

                            float light = texture2D(uTexture, vTexCoord).r * (ambient + diffuse);

                            gl_FragColor = vec4(light * ambientColour, 1.0);
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
		const texture = generateSoilTexture(512, 512, 4);

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