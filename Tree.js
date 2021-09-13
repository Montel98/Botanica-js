const treeVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec3 aMorphTarget2;

varying vec3 vVertexPosition;
varying vec3 vNormal;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float age;

//uniform vec3 direction;

void main() {

    vec3 currentPos = aMorphTarget2 + age * (aVertexPosition - aMorphTarget2);

    gl_Position = perspective * camera * world * vec4(currentPos, 1.0);

    vVertexPosition = vec3(world * vec4(currentPos, 1.0));
    vNormal = aNormal;
}
`;

const treeFragmentShader = 
`
precision mediump float;
varying vec3 vNormal;
varying vec3 vVertexPosition;

uniform vec3 ambientColour;

void main() {
    vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);
    vec3 lightPos = normalize(vec3(1.0, 1.0, 1.0) - vVertexPosition);

                            float ambient = 0.2;
                            float diffuse = clamp(dot(norm, lightPos), 0.0, 1.0);
                            float light = ambient + diffuse;

                            gl_FragColor = vec4(light * ambientColour, 1.0); //0.2  
}

`;

class Tree extends Entity {

    static maxAge = 1.0;

	constructor(LString) {

		super();

		const startAxis = {
			forward: new Vector([0, 0, 1]),
			up: new Vector([0, -1, 0]),
			left: new Vector([-1, 0, 0])
		}

		const startPos = zeroVector.copy();
		const startDir = upVector.copy();

		const startIndex = 0;

		const stackFrame = {
			pos: new Vector(startPos.components),
			axis: startAxis,
			count: 0,
			radius: radiusProperties(0.1, 0.03, 0),
			level: 0,
			previousStem: null,
			stringIndex: startIndex
		};

		this.terminalStems = [];
		this.LSystem = new LSystem(LString);

        let newStem = this.LSystem.generateStems(startIndex, stackFrame);
        newStem.stem.tree = this;

		this.terminalStems.push(newStem);

		for (let i = 0; i < this.terminalStems.length; i++) {
			this.addChild(this.terminalStems[i].stem);
		}

		const textureTest = new Texture('s');
		const geometry = new Geometry(false, true, false);
		geometry.setVertexBufferSize(10800 * 40);
		geometry.setIndexBufferSize(3480 * 40);

        this.girthMorphTargets = [];

        geometry.addBufferAttribute('aMorphTarget2', 3, geometry.bufferAttributes.bufferLength, this.girthMorphTargets);



		this.mesh = new Mesh(new Material(textureTest), geometry);

        this.mesh.shaders = shaderBuilder.customShader('tree_shader', 
                                                        treeVertexShader, 
                                                        treeFragmentShader, {'age': new Vector([0.0])}
                                                        );

		this.colourEnd = new Vector([0.25, 0.18, 0.12]);
        this.colourStart = new Vector([0.3, 0.6, 0.1]);
        this.currentColour = this.colourStart;
        this.mesh.shaders.uniforms['ambientColour'] = this.currentColour;

        this.age = 0.0;
        this.growthRate = 0.003;

        this.leaves = new Leaves();
        this.addChild(this.leaves);

	}

	act(WorldTime) {

        this.grow(worldTime);

        this.currentColour = add(this.colourStart.scale(1.0 - this.age**0.2), this.colourEnd.scale(this.age**0.2));
        this.mesh.shaders.uniforms['ambientColour'] = this.currentColour;
        this.mesh.shaders.uniforms['age'].components[0] = this.age;
	}

    grow(worldTime) {

        let newAge = this.age + worldTime.dt * this.growthRate;

        if (newAge >= Tree.maxAge) {
            newAge = Tree.maxAge;
        }

        this.age = newAge;

        for (let i = 0; i < this.terminalStems.length; i++) {

            if (this.terminalStems[i].stem.isMaxHeight() && this.terminalStems[i].stackFrame.stringIndex < this.LSystem.LString.length) {

                let currentTerminalStem = this.terminalStems[i];

                this.mergeToGeometry(currentTerminalStem.stem);
                this.removeChild(currentTerminalStem.stem);

                let currentFrame = currentTerminalStem.stackFrame;
                let currentPos = currentFrame.stringIndex;

                let newStem = this.LSystem.generateStems(currentPos, currentFrame);

                this.terminalStems.splice(i, 1);

                if (newStem.stem) {
                    newStem.stem.tree = this;
                    this.terminalStems.push(newStem);
                    this.addChild(newStem.stem);

                    let leafPosition = add(newStem.stackFrame.pos, newStem.stackFrame.axis.forward.scale(-0.03));

                    let leafPose = projectToNewAxis(newStem.stackFrame.axis, /*newStem.stackFrame.pos*/leafPosition);
                    this.leaves.addLeaves(2, leafPose, newStem.stem);
                }

                for (let i = 0; i < newStem.childStems.length; i++) {

                    let frame = newStem.childStems[i];
                    let newChildStem = this.LSystem.generateStems(frame.stringIndex + 1, frame);
                    newChildStem.stem.tree = this;
                    
                    this.terminalStems.push(newChildStem);
                    this.addChild(newChildStem.stem);

                    /*let leafPosition = add(newChildStem.stackFrame.pos, newChildStem.stackFrame.axis.forward.scale(-0.03))

                    let leafPose = projectToNewAxis(newChildStem.stackFrame.axis, leafPosition);
                    this.leaves.addLeaves(2, leafPose, newChildStem.stem);*/
                }
            }
        }
    }

	mergeToGeometry(terminalStem) {
        
		terminalStem.mesh.geometry.removeBufferAttribute('aMorphTarget');
        //terminalStem.mesh.geometry.removeBufferAttribute('aMorphTarget2');
        terminalStem.mesh.geometry.removeBufferAttribute('aMorphTarget3');
        this.mesh.geometry.addGeometry(terminalStem.mesh.geometry);
	}

}

/*const testString = buildString([ newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('[', []),
                        newSymbol('+', [Math.PI / 2, -Math.PI / 2]),
                        newSymbol('1', []),
                        newSymbol('+', [0, -Math.PI / 8]),
                        newSymbol('1', []),
                        newSymbol('+', [0, -Math.PI / 8]),
                        newSymbol('1', []),
                        newSymbol('+', [0, Math.PI / 8]),
                        newSymbol('1', []),
                        newSymbol('+', [0, Math.PI / 8]),
                        newSymbol('1', []),
                        newSymbol(']', []),
                        newSymbol('[', []),
                        newSymbol('+', [-Math.PI / 2, -Math.PI / 2]),
                        newSymbol('1', []),
                        newSymbol('+', [0, -Math.PI / 8]),
                        newSymbol('1', []),
                        newSymbol('+', [0, -Math.PI / 8]),
                        newSymbol('1', []),
                        newSymbol('+', [0, Math.PI / 8]),
                        newSymbol('1', []),
                        newSymbol('+', [0, Math.PI / 8]),
                        newSymbol('1', []),
                        newSymbol(']', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', [])], 0);*/

const testString = buildString([ newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),  
                        newSymbol('[', []),
                        newSymbol('+', [Math.random() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('[', []),
                        newSymbol('+', [Math.random() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []), 
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('1', []),
                        newSymbol('[', []),
                        newSymbol('+', [Math.random() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []), 
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []) ], 4);

const newTree = new Tree(testString);