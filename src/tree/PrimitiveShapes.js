import Vector from './Vector.js';
import Geometry from './Geometry.js';
import Mesh from './Mesh.js';
import Material from './Material.js';
import ShaderBuilder from './ShaderBuilder.js';
import Entity from './Entity.js';
import Texture from './Texture.js';

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
    						//vec3 lightDir = normalize(lightPos - vVertexPosition);
    						vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

						    float ambient = 0.2;
						    float diffuse = 0.5 * clamp(dot(norm, lightDir), 0.0, 1.0);

						    vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
						    vec3 viewDirection = normalize(vVertexPosition - eye);

						    float specular = 0.5 * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 16.0);

						    float light = (ambient + diffuse + specular) * (1.0 - step(0.495, length(vTexCoord - vec2(0.5, 0.5))));

						    if (light <= 0.1) {
    							discard;
    						}

    						//gl_FragColor = texture2D(uTexture, vTexCoord);

						    gl_FragColor = vec4(light * ambientColour, 1.0); //0.2
}

`;

export default function PlaneGeometry(useNormals, useST) {
	const planeGeometry = new Geometry(false, useNormals, useST);

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

export class PlaneEntity extends Entity {

	constructor(shader) {
		
		super();

		const geometry = PlaneGeometry(false, true);
		const texture = new Texture();

		const material = new Material(texture);
		//material.maps['textureMap'] = texture;

		this.mesh = new Mesh(material, geometry);

		/*this.mesh.setShaderProgram('Default', ShaderBuilder.customShader('plane_shader',
														planeVertexShader,
														planeFragmentShader, 
														{},
														[ShaderAttribute('aVertexPosition', 1), 
														ShaderAttribute('aNormal', 1), 
														ShaderAttribute('aTexCoord', 1)]
														)
		);*/

		this.mesh.setShaderProgram('Default', shader);

		this.defaultShader = this.mesh.shaderPrograms['Default'];

		this.colour = new Vector([0.25, 0.15, 0.1]);

	}

	act() {
		this.defaultShader.uniforms['ambientColour'] = this.colour;
	}
}