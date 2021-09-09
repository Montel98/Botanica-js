class NewTree extends Entity {
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

		this.terminalStems.push(this.LSystem.generateStems(startIndex, stackFrame));

		for (let i = 0; i < this.terminalStems.length; i++) {
			this.addChild(this.terminalStems[i].stem);
		}

		const textureTest = new Texture('s');
		const geometry = new Geometry(false, true, false);
		geometry.setVertexBufferSize(10800 * 40);
		geometry.setIndexBufferSize(3480 * 40);

		this.mesh = new Mesh(new Material(textureTest), geometry);

		this.colour = new Vector([0.25, 0.18, 0.12]);
		this.mesh.shaders.uniforms['ambientColour'] = this.colour;

	}

	act() {

		this.mesh.shaders.uniforms['ambientColour'] = this.colour;

        //console.log('terminalStems:', this.terminalStems);

        for (let i = 0; i < this.terminalStems.length; i++) {

    		if (this.terminalStems[i].stem.isMaxHeight() && this.terminalStems[i].stackFrame.stringIndex < this.LSystem.LString.length) {

                let currentTerminalStem = this.terminalStems[i];

                this.mergeToGeometry(currentTerminalStem.stem);
                this.removeChild(currentTerminalStem.stem);

                let currentFrame = currentTerminalStem.stackFrame;
    			let currentPos = currentFrame.stringIndex;

                console.log('pos', currentPos);
                console.log('frame', currentFrame);

    			let newStem = this.LSystem.generateStems(currentPos, currentFrame);

                //this.terminalStems.pop();
                this.terminalStems.splice(i, 1);

                if (newStem.stem) {
                    this.terminalStems.push(newStem);
                    this.addChild(newStem.stem);
                }

                for (let i = 0; i < newStem.childStems.length; i++) {

                    let frame = newStem.childStems[i];
                    let newChildStem = this.LSystem.generateStems(frame.stringIndex + 1, frame);
                    
                    this.terminalStems.push(newChildStem);
                    this.addChild(newChildStem.stem);
                }

                //console.log('frame after: ', copyStack(newStem.stackFrame));
    		}
        }
	}

	mergeToGeometry(terminalStem) {
		terminalStem.mesh.geometry.removeBufferAttribute('aMorphTarget');
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
                        newSymbol('*', []),
                        newSymbol('1', []),
                        newSymbol('*', []),
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

const newTree = new NewTree(testString);