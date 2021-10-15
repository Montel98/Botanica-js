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
uniform vec3 eye;

void main() {
    vec3 norm = (vNormal == vec3(0.0)) ? vec3(0.0) : normalize(vNormal);

    vec3 lightPos = vec3(0.0, -10.0, 10.0);
    vec3 lightDir = normalize(lightPos - vVertexPosition);

    float ambient = 0.2;
    float diffuse = 0.5 * clamp(dot(norm, lightDir), 0.0, 1.0);

    vec3 reflected = lightDir - 2.0 * dot(norm, lightDir) * norm;
    vec3 viewDirection = normalize(vVertexPosition - eye);

    float specular = 0.5 * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 16.0);

    float light = ambient + diffuse + specular;

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
			radius: radiusProperties(0.15, 0.03, 0),
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
        //this.colourEnd = new Vector([1.0, 0.8, 0.8])
        this.colourStart = new Vector([0.3, 0.6, 0.1]);
        this.currentColour = this.colourStart;
        this.mesh.shaders.uniforms['ambientColour'] = this.currentColour;

        this.age = 0.0;
        this.growthRate = 0.003;

        this.germinationDate = (new Date()).toLocaleDateString();

        // Leaves
        const leftSequence = randomGeneticSequence();
        const rightSequence = randomGeneticSequence();

        this.genome = new Genome(leftSequence, rightSequence);

        for (let gene in Genes) {
            console.log(gene);
            console.log(this.genome.getGenotype(gene));
        }

        this.leaves = new Leaves(this.genome);
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

        this.generateNewStems();
    }

	mergeToGeometry(terminalStem) {
        
		terminalStem.mesh.geometry.removeBufferAttribute('aMorphTarget');
        terminalStem.mesh.geometry.removeBufferAttribute('aMorphTarget3');
        this.mesh.geometry.addGeometry(terminalStem.mesh.geometry);
	}

    generateNewStems() {

        let newStems = [];

        for (let i = 0; i < this.terminalStems.length; i++) {

            if (this.terminalStems[i].stem.isMaxHeight() && this.terminalStems[i].stackFrame.stringIndex < this.LSystem.LString.length) {

                let currentTerminalStem = this.terminalStems[i];

                this.mergeToGeometry(currentTerminalStem.stem);
                this.removeChild(currentTerminalStem.stem);

                let newStem = this.generateNewStem(currentTerminalStem.stackFrame);
                newStems.push(newStem);

                this.terminalStems.splice(i, 1);

                for (let i = 0; i < newStem.childStems.length; i++) {

                    let frame = newStem.childStems[i];
                    let newChildStem = this.generateNewStem(frame);
                    newStems.push(newChildStem);
                    
                }
            }
        }

        for (let i = 0; i < newStems.length; i++) {

            if (newStems[i].stem) {
                this.terminalStems.push(newStems[i]);
                this.addChild(newStems[i].stem);
            }
        }

        return newStems;
    }

    generateNewStem(currentFrame) {

        let currentPos = currentFrame.stringIndex;

        let newStem = this.LSystem.generateStems(currentPos, currentFrame);

        if (newStem.stem) {

            newStem.stem.tree = this;

            let leafPosition = add(newStem.stackFrame.pos, newStem.stackFrame.axis.forward.scale(-0.03));

            let leafAxis = newStem.stackFrame.axis;

            /*if (newStem.stackFrame.count % 2 == 0) {
                leafAxis = copyAxis(newStem.stackFrame.axis);
                leafAxis.left = leafAxis.left.scale(-1.0);
            }*/

            let leafPose = projectToNewAxis(/*newStem.stackFrame.axis*/leafAxis, leafPosition);
            let leafCount = 2;

            this.leaves.addLeaves(leafCount, leafPose, newStem);
        }

        return newStem;
    }

    getGenome() {
        return this.genome;
    }

}

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
                        newSymbol('[', []),
                        newSymbol('+', [Math.random() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []), 
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []),
                        newSymbol('1', [])], 4);

const newTree = new Tree(testString);