import { projectToStumpAxis, transform } from './Matrix.js';
import Vector from './Vector.js';
import PlaneGeometry from './PrimitiveShapes.js';
import Mesh from './Mesh.js';
import Material from './Material.js';
import ShaderBuilder, { ShaderAttribute } from './ShaderBuilder.js';
import { generateStumpTexture } from './TextureBuilder.js';
import Entity from './Entity.js';

const stumpVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec3 aStartVertexPosition;

attribute vec2 aTexCoord;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec3 vWorldNormal;

varying vec2 vTexCoord;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float age;

void main() {

    vec3 currentPos = aStartVertexPosition + age * (aVertexPosition - aStartVertexPosition);
    //vec3 currentPos = aStartVertexPosition;

    gl_Position = perspective * camera * world * vec4(currentPos, 1.0);

    vVertexPosition = vec3(world * vec4(currentPos, 1.0));
    vNormal = aNormal;
    vWorldNormal = vec3(world * vec4(aNormal, 1.0));
    vTexCoord = aTexCoord;
}
`;

const stumpFragmentShader = 
`
precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;

uniform vec3 ambientColour;
uniform vec3 eye;

uniform sampler2D uTexture;

uniform float age;

void main() {

    vec4 textureColour = texture2D(uTexture, vTexCoord);

    if (textureColour.a == 0.0) {
        discard;
    }

    vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);
    vec3 worldNorm = (vWorldNormal == vec3(0.0)) ? vec3(0.0) : normalize(vWorldNormal);

    vec3 lightPos = vec3(0.0, -10.0, 10.0);
    vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

    float ambient = 0.3;
    float diffuse = 0.6 * clamp(dot(worldNorm, lightDir), 0.0, 1.0);

    vec3 reflected = lightDir - 2.0 * dot(worldNorm, lightDir) * worldNorm;
    vec3 viewDirection = normalize(vVertexPosition - eye);

    float specular = 0.7 * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 4.0); //<- power was 16
    // was 0.5

    float light = ambient + diffuse + specular;

    //gl_FragColor = vec4(light * ambientColour, 1.0);
    gl_FragColor = vec4(light * textureColour);
}
`;

function treeStumpGeometry(axis, position, radius) {

    let plane = PlaneGeometry(true, true);
    let projectionMatrix = projectToStumpAxis(axis, position);

    for (let vertex = 0; vertex < plane.vertices.length; vertex++) {

        plane.vertices[vertex] = plane.vertices[vertex].normalize().scale(Math.sqrt(2) * radius);
        plane.vertices[vertex].addDim(1.0);
        plane.vertices[vertex] = transform(plane.vertices[vertex], projectionMatrix);
        plane.vertices[vertex].squeeze(3);
    }

    for (let normal = 0; normal < plane.normals.length; normal++) {

        plane.normals[normal].addDim(1.0);
        plane.normals[normal] = transform(plane.normals[normal], projectionMatrix).normalize();
        plane.normals[normal].squeeze(3);
    }

    plane.setVertexBuffer(plane.mergeAttributes());

    return plane;
}

const stumpTexture = generateStumpTexture(new Vector([0.8*112, 0.8*97, 0.8*80]), new Vector([196, 164, 132]), 256, 256);

export default class TreeStump extends Entity {

    constructor(parentStem, axis, position, radius) {

        super();

        const geometryEnd = treeStumpGeometry(axis, position, radius);
        const geometryStart = treeStumpGeometry(axis, position, 0.001);

        geometryEnd.addMorphTarget('Start', geometryStart.vertices);

        const material = new Material(stumpTexture);
        material.maps['textureMap'] = stumpTexture;

        this.mesh = new Mesh(material, geometryEnd);

        this.mesh.setShaderProgram('Default', ShaderBuilder.customShader('stump_shader', 
                                                        stumpVertexShader, 
                                                        stumpFragmentShader, 
                                                        {'age': new Vector([0.0])},
                                                        [ShaderAttribute('aVertexPosition', 1),
                                                        ShaderAttribute('aNormal', 1),
                                                        ShaderAttribute('aMorphTarget2', 1),
                                                        ShaderAttribute('aColourId', 1)]
                                                        )
        );

        this.defaultShader = this.mesh.shaderPrograms['Default'];

        this.colour = new Vector([1.0, 1.0, 1.0]);
        this.defaultShader.uniforms['ambientColour'] = this.colour;

        this.parentStem = parentStem;
    }

    act(worldTime) {

        this.defaultShader.uniforms['ambientColour'] = this.colour;
        this.defaultShader.uniforms['age'].components[0] = this.parentStem.stem.branch.age;
    }
}