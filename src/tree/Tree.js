//const MAX_STEMS = 609;
const MAX_STEMS = 550;
const MAX_BRANCHES = 180;

import Genome, * as Gen from './Genome.js';
import Vector, { add, zeroVector, upVector } from './Vector.js';
import { projectToLeafAxis, projectToFlowerAxis, transform } from './Matrix.js';
import Geometry from './Geometry.js';
import ShaderBuilder, { ShaderAttribute } from './ShaderBuilder.js'
import Mesh from './Mesh.js';
import LSystem, { copyStack, radiusProperties, radiusFunc } from './LSystem.js';
import TreeEvent, * as TEvent from './TreeEvent.js'
import TreeStump from './TreeStump.js';
import Branch from './Branch.js';
import Entity from './Entity.js';
import Stem from './Stem.js';
import Leaves from './Leaf.js';
import Flowers from './Flower.js';
import { stemIterator } from './StemIterator.js';
import DataStore from './DataStore.js';

const treeVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec3 aMatureStartVertexPosition;
attribute vec2 aTexCoord;
attribute float aBranchIndex;
attribute vec3 aColourId;

varying vec3 vVertexPosition;
varying vec3 vNormal;
varying vec3 vWorldNormal;
varying vec2 vTexCoord;
varying vec3 vColourId;
varying float vBranchAge;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float age;
uniform float branchAges[${MAX_BRANCHES}];

uniform sampler2D uDataSampler;

void main() {

    float branchAge = branchAges[int(aBranchIndex)];
    //float branchAge = 0.1;
    //vec2 branchAgeCoord = vec2(aBranchIndex / 1024.0, 0.0);
    //vec2 branchAgeCoord = vec2(0.5, 0.0);
    //float branchAge = texture2D(uDataSampler, branchAgeCoord).r;

    vec3 currentPos = aMatureStartVertexPosition + branchAge * (aVertexPosition - aMatureStartVertexPosition);

    gl_Position = perspective * camera * world * vec4(currentPos, 1.0);

    vVertexPosition = vec3(world * vec4(currentPos, 1.0));
    vNormal = aNormal;
    vColourId = aColourId;
    vWorldNormal = vec3(world * vec4(aNormal, 1.0));
    vTexCoord = aTexCoord;
    vBranchAge = branchAge;
}
`;

const treeFragmentShader = 
`
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
    //vec3 lightDir = normalize(lightPos - vVertexPosition);
    vec3 lightDir = normalize(vec3(0.0, -1.0, 1.0));

    float ambient = lightSource.ambient;
    float diffuse = lightSource.diffuse * clamp(dot(worldNorm, lightDir), 0.0, 1.0);

    vec3 reflected = lightDir - 2.0 * dot(worldNorm, lightDir) * worldNorm;
    vec3 viewDirection = normalize(vVertexPosition - eye);

    float specular = lightSource.specular * pow(clamp(dot(reflected, viewDirection), 0.0, 1.0), 4.0); //<- power was 16

    float light = ambient + diffuse + specular;
    vec3 reflectedColour = vec3(textureCube(uCubeSampler, reflected));
    vec3 treeColour = (1.0 - vBranchAge) * ambientColour + vBranchAge * texture2D(uTexture, vTexCoord).rgb;

    gl_FragColor = vec4(light * ((1.0 - lightSource.reflectivity) * treeColour + (lightSource.reflectivity) * reflectedColour), 1.0); //0.2
}
`;

const pickingVertexShader = 
`
precision mediump float;
attribute vec3 aVertexPosition;
attribute vec3 aColourId;
attribute vec3 aMatureStartVertexPosition;

varying vec3 vVertexPosition;
varying vec3 vColourId;

uniform mat4 world;
uniform mat4 camera;
uniform mat4 perspective;

uniform float age;
uniform float branchAges[${MAX_BRANCHES}];

void main() {

    vec3 currentPos = aMatureStartVertexPosition + age * (aVertexPosition - aMatureStartVertexPosition);

    gl_Position = perspective * camera * world * vec4(currentPos, 1.0);

    vVertexPosition = vec3(world * vec4(currentPos, 1.0));
    vColourId = aColourId;
}
`

const pickingFragmentShader =
`
precision mediump float;
varying vec3 vColourId;

void main() {
    gl_FragColor = vec4(vColourId, 1.0);
}
`

const LEAF_GROWTH_LEVEL = 2;
const FLOWER_GROWTH_LEVEL = 4;

function addHours(date, dh) {
    let dateCopy = new Date();
    dateCopy.setTime(date.getTime() + dh * 60 * 60 * 1000);
    return dateCopy;
}



export default class Tree extends Entity {

    static count = 0;

    static maxAge = 1.0;

    constructor(LStringInput) {

        super();

        const leftSequence = Gen.randomGeneticSequence();
        const rightSequence = Gen.randomGeneticSequence();

        this.genome = new Genome(leftSequence, rightSequence);

        this.terminalStems = [];
        this.LSystem = new LSystem(LStringInput, this.genome);

        const stackFrame = this.initStackFrame();

        let newStems = this.LSystem.generateStems(stackFrame, this.LSystem.LString.length);

        this.root = newStems;

        this.stems = getStemList(this.root);

        this.germinationDate = new Date("March 1 2021 00:00:00");
        this.currentDate = new Date("March 1 2021 00:00:00");
        //this.currentDate = new Date("May 12 2021 00:00:00");

        this.branches = new Set();
        this.branchIndices = [];

        setStemStates(this.currentDate, this);

        const stemMaterial = this.terminalStems[0].terminalStem.stem.getMaterial();

        //const stemMaterial = this.root[0].stem.getMaterial();
        const geometry = new Geometry(false, true, true);

        //geometry.setFaceCulling(true);

        geometry.setVertexBufferSize(10800 * 80);
        geometry.setIndexBufferSize(3480 * 80);

        this.girthMorphTargets = [];

        //geometry.addBufferAttribute('aMatureStartMorphTarget', 3, geometry.bufferAttributes.bufferLength, this.girthMorphTargets);
        geometry.addMorphTarget('MatureStart', this.girthMorphTargets);


        this.mesh = new Mesh(/*treeMaterial*/stemMaterial, geometry);

        this.mesh.setShaderProgram('Default', ShaderBuilder.customShader('tree_shader', 
                                                        treeVertexShader, 
                                                        treeFragmentShader, 
                                                        {'age': new Vector([0.0])},
                                                        [ShaderAttribute('aVertexPosition', 1),
                                                        ShaderAttribute('aNormal', 1),
                                                        ShaderAttribute('aMorphTarget2', 1),
                                                        ShaderAttribute('aColourId', 1)]
                                                        )
        );

        this.mesh.setShaderProgram('Picking', ShaderBuilder.customShader('picking_shader',
                                                        pickingVertexShader,
                                                        pickingFragmentShader, 
                                                        this.mesh.shaderPrograms['Default'].uniforms,
                                                        [ShaderAttribute('aVertexPosition', 1), 
                                                        ShaderAttribute('aMorphTarget2', 1),
                                                        ShaderAttribute('aColourId', 1)]
                                                        ) /*this.mesh.shaderPrograms['Default']*/
        );

        this.defaultShader = this.mesh.shaderPrograms['Default'];

        this.colourEnd = new Vector([0.25, 0.18, 0.12]);
        this.colourStart = new Vector([0.3, 0.6, 0.1]);
        this.currentColour = this.colourStart;

        this.defaultShader.uniforms['ambientColour'] = this.currentColour;
        this.defaultShader.uniforms['branchAges'] = [];// new Array(620).fill(new Vector([0]));

        for (let i = 0; i < MAX_BRANCHES; i++) {
            this.defaultShader.uniforms['branchAges'].push(new Vector([0.0]));
        }

        //this.branchAges = new DataStore();
        //this.dataStore = this.branchAges;

        this.age = 0.0;
        this.growthRate = 0.01;
        //this.growthRate = 0.03;

        this.leaves = new Leaves(this.genome);
        this.addChild(this.leaves);

        this.flowers = new Flowers(this.genome);
        this.addChild(this.flowers);

        this.stumps = [];

        this.maturedStems = [];
        this.colourIds = [];
        this.segmentTags = {};

        this.boundingGeometry = [];

        this.initColourPickingProperties();
        this.initBranchIndexProperties();

        this.events = TEvent.initTreeEvents(this.root, this.genome, this.currentDate, this.germinationDate);
        /*console.log('autumn: ', this.events.autumn.event);
        console.log('spring: ', this.events.spring.event);
        console.log('bloom start: ', this.events.bloomStart.event);
        console.log('bloom end: ', this.events.bloomEnd.event);*/

        //setStemStates(this.currentDate, this);

        setLeafStates(this.currentDate, this);
        setFlowerStates(this.currentDate, this);

        // Experimental

        this.leavesToReplace = [];

        // For testing only

        this.colourStartPositions = new Map();
    }

    act(worldTime) {

        this.grow(worldTime);

        this.currentColour = add(this.colourStart.scale(1.0 - this.age**0.2), this.colourEnd.scale(this.age**0.2));
        this.defaultShader.uniforms['ambientColour'] = this.currentColour;
        this.defaultShader.uniforms['age'].components[0] = this.age;

        this.currentDate = addHours(this.currentDate, 1);
        //console.log(this.currentDate);
    }

    grow(worldTime) {

        this.growBranches(worldTime);

        let newAge = this.age + worldTime.dt * this.growthRate;

        if (newAge >= Tree.maxAge) {
            newAge = Tree.maxAge;
        }

        this.age = newAge;

        this.generateNewStems();
        //this.addLeavesToNewStems(this.currentDate);
        this.updateLeaves(this.currentDate);
        this.updateFlowers(this.currentDate);
        this.removeOldStumps();
    }

    growBranches(worldTime) {

        //const newBranchAges = new Float32Array(1024);
        //newBranchAges.fill(0.0);

        for (let branch of this.branches) {

            branch.grow(worldTime);

            this.defaultShader.uniforms['branchAges'][branch.branchId].components[0] = branch.age;
            //newBranchAges[branch.branchId] = branch.age;
        }

        //this.branchAges.update(newBranchAges);
    }

    initStackFrame() {

        const startIndex = 0;

        const startAxis = {
            forward: new Vector([0, 0, 1]),
            up: new Vector([0, -1, 0]),
            left: new Vector([-1, 0, 0])
        };

        const startPos = zeroVector.copy();
        const startDir = upVector.copy();

        let newBranch = new Branch(this.LSystem.getNoSegmentsInRange(startIndex, 
                                this.LSystem.LString.length),
                                0);

        const stackFrame = {
            pos: new Vector(startPos.components),
            axis: startAxis,
            count: 0,
            depth: 0,
            branch: newBranch,
            radius: radiusProperties(/*0.15, 0.005,*/ 0.15, 0.01, /*0.01, 0.01,*/ newBranch.branchLength, 0),
            nextStems: [],
            prevStem: null,
            connectParent: true,
            stringIndex: startIndex
        };

        return stackFrame;
    }

    mergeToGeometry(terminalStem) {

        let stem = terminalStem.stem;

        // start at 1 to avoid clashing with transparent screen
        let l = Object.keys(this.segmentTags).length + 1;

        // EXTENSION

        let b = l % 255;
        let g = Math.floor(l / 255) % 255;
        let r = Math.floor(l / (255 * 255)) % 255;

        let colourId = new Vector([r / 255, g / 255, b / 255]);

        let stemColourIds = [];

        for (let i = 0; i < stem.postStemGeometry.vertices.length; i++) {

            stemColourIds.push(colourId);
        }

        let packedColourId = (r) | 
                            (g << 8) | 
                            (b << 16);

        this.addBoundingGeometry(terminalStem, packedColourId);

        stem.postStemGeometry.addBufferAttribute('aColourId',
                                                        3,
                                                        stem.postStemGeometry.bufferAttributes.bufferLength,
                                                        stemColourIds,
                                                        );

        // Add reference to branch ages

        let branchIndices = [];

        for (let i = 0; i < stem.postStemGeometry.vertices.length; i++) {

            branchIndices.push(new Vector([stem.branch.branchId]));
        }

        stem.postStemGeometry.addBufferAttribute('aBranchIndex', 
                                        1,  
                                        stem.postStemGeometry.bufferAttributes.bufferLength,
                                        branchIndices,
                                        );

        this.mesh.geometry.addGeometry(stem.postStemGeometry);
    }

    addTerminalStem(newStem) {

        this.terminalStems.push({terminalStem: newStem, visited: false});
        this.addChild(newStem.stem);
        newStem.stem.tree = this;
        newStem.stem.isReached = true;

        // Experimental

        newStem.stem.isTerminal = true;

        let branch = newStem.stackFrame.branch;

        if (!this.branches.has(branch)) {

            this.branches.add(branch);
            branch.setBranchId(this.branches.size - 1);

            if (newStem.stackFrame.connectParent && 
                newStem.stackFrame.prevStem &&
                !branch.isShoot) {
                    branch.setAge(newStem.stackFrame.prevStem.stackFrame.branch.age);
            }
        }

        //console.log('Terminal Stems: ', this.terminalStems.length);
    }

    addStumpToStem(currentStem) {

        let axis = currentStem.stackFrame.axis;
        let position = add(currentStem.stackFrame.pos, currentStem.stackFrame.axis.forward.scale(0.03));
        let radius = radiusFunc(currentStem.stackFrame.radius, 1.0);

        let stump = new TreeStump(/*this*/currentStem, axis, position, radius);
        this.stumps.push(stump);
        this.addChild(stump);
    }


    // Currently causes a (small) memory leak, use with caution
    removeStump(stump) {

        for (let i = 0; i < this.stumps.length; i++) {

            let currentStump = this.stumps[i];

            if (currentStump == stump) {

                this.stumps.splice(i, 1);
                this.removeChild(stump);
                break;
            }
        }
    }

    removeOldStumps() {

        let stumpIndicesToRemove = [];
        let stumpsToRemove = [];

        for (let i = 0; i < this.stumps.length; i++) {

            let currentStump = this.stumps[i];
            let shoot = currentStump.parentStem.stackFrame.nextStems[0];

            if (shoot.stackFrame.branch.isMaxAge()) {

                stumpIndicesToRemove.push(i);
                stumpsToRemove.push(currentStump);
            }
        }

        for (let i = 0; i < stumpIndicesToRemove.length; i++) {

            let indexToRemove = stumpIndicesToRemove[i] - i;
            let stumpToRemove = stumpsToRemove[i];
            this.removeStump(stumpToRemove);
        }
    }

    removeTerminalStem() {

    }

    generateNewStems() {

        let newStems = [];
        let removalList = [];
        let additionList = [];

        for (let i = 0; i < this.terminalStems.length; i++) {

            let terminalStem = this.terminalStems[i].terminalStem;
            let visited = this.terminalStems[i].visited;

            if (terminalStem.stem.isMaxHeight() && terminalStem.stackFrame.nextStems.length > 0) {

                if (!visited) {

                    this.terminalStems[i].visited = true;

                    if (!this.isEndStem(terminalStem) || this.isSplittingStem(terminalStem)) {

                        this.mergeToGeometry(terminalStem);
                        this.removeChild(terminalStem.stem);
                        //this.hide(terminalStem.stem);

                        this.terminalStems.splice(i, 1);

                        // Experimental

                        terminalStem.stem.isTerminal = false;
                    }

                    for (let i = 0; i < terminalStem.stackFrame.nextStems.length; i++) {

                        let nextStem = terminalStem.stackFrame.nextStems[i];

                        this.addTerminalStem(nextStem);

                        let position = nextStem.stackFrame.pos;
                        let axis = nextStem.stackFrame.axis;
                    }
                }
            }
        }
    }

    initColourPickingProperties() {
        this.mesh.geometry.addBufferAttribute('aColourId', 3, this.mesh.geometry.bufferAttributes.bufferLength, this.colourIds);
    }

    initBranchIndexProperties() {
        this.mesh.geometry.addBufferAttribute('aBranchIndex', 1, this.mesh.geometry.bufferAttributes.bufferLength, this.branchIndices);
    }

    getGenome() {
        return this.genome;
    }

    getSegmentTag(colour) {

        let packedColourId = colour[0] | 
                            (colour[1] << 8) | 
                            (colour[2] << 16);

        return this.segmentTags[packedColourId];
    }

    updateBoundingGeometry(segment) {

        let treePos = new Vector(this.localMatrix.components[3].slice(0, 3));

        let bounds = segment.bounds;
        let boundingGeometry = segment.boundingGeometry;
        let noTriangles = boundingGeometry.length;

        for (let t = 0; t < noTriangles; t++) {

            for (let p = 0; p < 3; p++) {

                let endPos = bounds['aVertexPosition'][t][p];
                let startPos = bounds['aMatureStartVertexPosition'][t][p];

                boundingGeometry[t][p].components[0] = startPos.components[0] + 
                this.age * (endPos.components[0] - startPos.components[0]);

                boundingGeometry[t][p].components[1] = startPos.components[1] + 
                this.age * (endPos.components[1] - startPos.components[1]);

                boundingGeometry[t][p].components[2] = startPos.components[2] + 
                this.age * (endPos.components[2] - startPos.components[2]);

                boundingGeometry[t][p] = transform(new Vector([...boundingGeometry[t][p].components, 1.0]), 
                                                    this.worldMatrix);
                boundingGeometry[t][p].squeeze(3);

            }
        }
    }

    updateBoundingGeometries() {

        for (let colour in this.segmentTags) {

            this.updateBoundingGeometry(this.segmentTags[colour]);
        }
    }

    addBoundingGeometry(terminalStem, packedColourId) {

        let frame = terminalStem.stackFrame;
        let boundingGeometries = terminalStem.stem.postStemGeometry.generateBoundingTriangles();

        let newBoundingGeometry = [];

        let noTriangles = boundingGeometries['aVertexPosition'].length;

        for (let t = 0; t < noTriangles; t++) {

            newBoundingGeometry.push([new Vector([0, 0, 0]),
                                    new Vector([0, 0, 0]),
                                    new Vector([0, 0, 0])]);
        }

        this.segmentTags[packedColourId] = {stackFrame: frame, 
                                            bounds: boundingGeometries,
                                            boundingGeometry: newBoundingGeometry
                                        };
    }

    removeChildrenFromStem(stem) {

        let children = [stem];

        let retainedStems = [];
        let terminalStemsToRetain = new Set();

        // Depth-first search to get all uncut stems

        let stack = [...this.root];

        while (stack.length > 0) {

            let currentStem = stack.pop();

            if (currentStem.stackFrame != stem && currentStem.stem.isReached) {

                retainedStems.push(currentStem);
                stack.push(...currentStem.stackFrame.nextStems);

                if (currentStem.stackFrame.nextStems.length == 0 || currentStem.stem.isTerminal) {
                    terminalStemsToRetain.add(currentStem);
                }
            }
        }

        // Remove all leaves from cut stems

        this.purgeLeavesFromCutStems(retainedStems);

        // Remove all stumps from cut stems

        this.removeStumpsFromCutStems(retainedStems);


        // Remove all terminal stems

        let removedTerminalStems = this.removeTerminalStemsNotInSet(terminalStemsToRetain);

        let newGeometry = new Geometry(false, true, true);

        let newMorph = [];
        let newColourIds = [];
        //let retainedBranches = new Set();
        let retainedBranches = this.addRetainedBranches([...terminalStemsToRetain]);
        //console.log('retained branches:', retainedBranches);
        let newBranchIndices = [];

        //console.log('retained branches: ', this.getRetainedBranches(retainedStems));

        newGeometry.addMorphTarget('MatureStart', newMorph);
        newGeometry.addBufferAttribute('aColourId', 3, newGeometry.bufferAttributes.bufferLength, newColourIds);
        newGeometry.addBufferAttribute('aBranchIndex', 1, newGeometry.bufferAttributes.bufferLength, newBranchIndices);


        for (let i = 0; i < retainedStems.length; i++) {

            //console.log('r:', retainedStems[i]);

            if (retainedStems[i].stackFrame.nextStems.length > 0 && !retainedStems[i].stem.isTerminal) {

                let branch = retainedStems[i].stem.branch;

                let branchId = branch.branchId;

                if (!retainedBranches.has(branch)) {

                    retainedBranches.add(branch);
                    branch.setBranchId(retainedBranches.size - 1);
                    branchId = branch.branchId;
                }

                let postStemGeometry = retainedStems[i].stem.postStemGeometry;
                let stemBranchIndices = [];

                for (let vertex = 0; vertex < postStemGeometry.vertices.length; vertex++) {
                    stemBranchIndices.push(new Vector([branch.branchId]));
                }

                postStemGeometry.setBufferAttributeData('aBranchIndex', stemBranchIndices);
                
                newGeometry.addGeometry(retainedStems[i].stem.postStemGeometry);
            }
        }

        this.branches = retainedBranches;

        if (stem.prevStem) {

            let previousStem = stem.prevStem;
            let axis = previousStem.stackFrame.axis;
            let position = add(previousStem.stackFrame.pos, previousStem.stackFrame.axis.forward.scale(0.03));
            let radius = radiusFunc(previousStem.stackFrame.radius, 1.0);

            let prevStringIndex = previousStem.stackFrame.stringIndex;

            let branchStartIndex = this.getBranchStartIndex(this.LSystem.LString, /*stringIndex*/prevStringIndex);

            const endIndex = this.LSystem.skipBranch(branchStartIndex);

            let newStackFrame = copyStack(previousStem.stackFrame);

            newStackFrame.stringIndex++;
            newStackFrame.count++;
            newStackFrame.radius.shift = newStackFrame.count;
            newStackFrame.pos = add(newStackFrame.pos, newStackFrame.axis.forward.scale(0.03));
            newStackFrame.depth++;
            newStackFrame.connectParent = true;
            newStackFrame.nextStems = [];
            newStackFrame.prevStem = previousStem;

            let newShootBranch = new Branch(newStackFrame.branch.branchLength,
                                        newStackFrame.branch.level
                                        );

            newShootBranch.setAsShoot();

            newStackFrame.branch = newShootBranch;

            let localRoot = this.LSystem.generateStems(newStackFrame, endIndex);

            let oldBranch = [];

            for (let i = 0; i < previousStem.stackFrame.nextStems.length; i++) {

                let nextStem = previousStem.stackFrame.nextStems[i];

                if (nextStem.stackFrame.stringIndex == stem.stringIndex) {

                    oldBranch.push(nextStem);
                    previousStem.stackFrame.nextStems.splice(i, 1);
                    break;
                }
            }

            let newBranch = [];

            for (let i = 0; i < localRoot.length; i++) {

                let nextStem = localRoot[i];

                if (nextStem.stackFrame.stringIndex == stem.stringIndex) {

                    newBranch.push(nextStem);
                    previousStem.stackFrame.nextStems.push(nextStem);
                    break;
                }
            }

            let stemIt3 = stemIterator(oldBranch);
            let it3 = stemIt3.next();
            let oldStems = [];

            let tCount3 = 0;

            while (!it3.done) {

                tCount3++;
                oldStems.push(it3.value);
                it3 = stemIt3.next();
            }

            let stemIt2 = stemIterator(newBranch);
            let it2 = stemIt2.next();
            let newStems = [];

            let tCount2 = 0;

            while (!it2.done) {

                tCount2++;
                newStems.push(it2.value);
                it2 = stemIt2.next();
            }


            for (let i = 0; i < oldStems.length; i++) {

                oldStems[i].stem.mesh.geometry.setGeometry(newStems[i].stem.mesh.geometry);
                oldStems[i].stem.mesh.geometry.modifiedGeometryEvents.pop();
                oldStems[i].stem.mesh.geometry.addGeometryEvent(-9, -9);
                oldStems[i].stem.stemLength = 0.0;

                newStems[i].stem.mesh.geometry = oldStems[i].stem.mesh.geometry;
            }

            // This should be a function

            for (let i = 0; i < /*localRoot.length*/newBranch.length; i++) {

                let newTerminalStem = newBranch[i];
                this.addTerminalStem(newTerminalStem);
            }

            this.addStumpToStem(previousStem);
        }

        this.mesh.geometry.setGeometry(newGeometry);

        this.stems = getStemList(this.root);

        return;
    }

    // Move somewhere else, just testing:
    // Find where deepest branch starts

    getBranchStartIndex(LString, stringIndex) {

        let index = stringIndex;

        let parenthesisCount = 1;

        while (index < 0 && parenthesisCount != 0) {

            if (LString[index].symbol == '[') {
                parenthesisCount -= 1;
            }
            else if (LString[index].symbol == ']') {
                parenthesisCount += 1;
            }

            index--;
        }

        return index;
    }

    removeTerminalStemsNotInSet(terminalStemsToRetain) {

        let stemIndicesToRemove = [];
        let removedStems = [];

        for (let i = 0; i < this.terminalStems.length; i++) {

            let terminalStem = this.terminalStems[i].terminalStem;

            if (!terminalStemsToRetain.has(terminalStem)) {

                stemIndicesToRemove.push(i);
                removedStems.push(terminalStem);
            }
        }

        for (let i = 0; i < stemIndicesToRemove.length; i++) {

            let index = stemIndicesToRemove[i] - i;
            let terminalStem = this.terminalStems[index].terminalStem;
            terminalStem.stem.purgeLeaves(); // Instantly remove leaves from stem
            this.terminalStems.splice(index, 1);
            this.removeChild(terminalStem.stem);
            //this.hide(terminalStem.stem);
        }

        return removedStems;
    }

    // Maybe refactor? Using iterators a lot

    purgeLeavesFromCutStems(retainedStems) {

        let retainedStemSet = new Set(retainedStems);

        let stemIt = stemIterator(this.root);
        let it = stemIt.next();

        while (!it.done) {

            let currentStem = it.value;
            
            if (!retainedStemSet.has(currentStem)) {

                currentStem.stem.purgeLeaves();
                currentStem.stem.purgeFlowers();
            }

            it = stemIt.next();
        }
    }

    removeStumpsFromCutStems(retainedStems) {

        let stumpsToRemove = [];

        let retainedStemSet = new Set(retainedStems.map(currentStem => currentStem.stem));
        //let retainedStemSet = new Set(retainedStems);

        for (let i = 0; i < this.stumps.length; i++) {

            let currentStump = this.stumps[i];

            if (!retainedStemSet.has(currentStump.parentStem.stem)) {

                stumpsToRemove.push(currentStump);
            }
        }

        for (let i = 0; i < stumpsToRemove.length; i++) {

            let stumpToRemove = stumpsToRemove[i];
            this.removeStump(stumpToRemove);
        }
    }

    addRetainedBranches(retainedStems) {

        let retainedBranches = new Set();

        for (let stemIndex = 0; stemIndex < retainedStems.length; stemIndex++) {

            let stemBranch = retainedStems[stemIndex].stem.branch;
            retainedBranches.add(stemBranch);
            stemBranch.setBranchId(retainedBranches.size - 1);
        }

        return retainedBranches;
    }

    isEndStem(terminalStem) {

        for (let i = 0; i < terminalStem.stackFrame.nextStems.length; i++) {

            let nextStem = terminalStem.stackFrame.nextStems[i];

            if (nextStem.stackFrame.branch == terminalStem.stackFrame.branch) {

                //isEnd = false;
                return false;
            }
        }

        return true;
    }

    isSplittingStem(terminalStem) {

        for (let i = 0; i < terminalStem.stackFrame.nextStems.length; i++) {

            let nextStem = terminalStem.stackFrame.nextStems[i];

            if (nextStem.stackFrame.branch != terminalStem.stackFrame.branch 
                && nextStem.stackFrame.connectParent) {

                return true;
            }
        }

        return false;
    }

    addLeafToStem(currentStem, xAngle) {
        let axis = currentStem.stackFrame.axis;
        let position = currentStem.stackFrame.pos;

        let leafPose = projectToLeafAxis(axis, position);
        let leafCount = 2;
        
        let leafIndices = this.leaves.addLeaves(leafCount, xAngle, leafPose, currentStem);
        currentStem.stem.addLeaves(leafIndices);
    }

    addFlowerToStem(currentStem, zAngle) {
        let axis = currentStem.stackFrame.axis;
        let position = currentStem.stackFrame.pos;

        let flowerPose = projectToFlowerAxis(axis, position);

        let flowerIndices = this.flowers.addFlower(flowerPose, zAngle, currentStem);
        currentStem.stem.addFlowers([flowerIndices]);
    }

    updateLeaves(timeElapsed) {

        for (let leafIndex = 0; leafIndex < this.stems.length; leafIndex++) {

            let currentStem = this.stems[leafIndex];

            let leafFallTick = this.events.autumn.stemStates[leafIndex];
            let leafGrowTick = this.events.spring.stemStates[leafIndex].tick;
            let leafXAngle = this.events.spring.stemStates[leafIndex].xAngle;

            // Not sure about ordering of these statements

            // Account for when stem is first growing
            if (currentStem.stem.isReached &&
                currentStem.stem.stemLength == 0) {

                if (timeElapsed < leafFallTick) {

                    if (!currentStem.stem.hasLeaves()) {

                    this.addLeafToStem(currentStem, leafXAngle);
                    }
                }
            }
            else if (leafFallTick <= timeElapsed && leafFallTick > leafGrowTick) {

                if (currentStem.stem.hasLeaves()) {

                    const leaves = currentStem.stem.leaves;

                    if (!leaves[0].isDying && !leaves[1].isDying) {

                        //currentStem.stem.removeLeaves();
                        currentStem.stem.killLeaves();
                    }
                }
            }
            else {

                if (leafGrowTick <= timeElapsed && 
                    currentStem.stackFrame.branch.level > LEAF_GROWTH_LEVEL) {

                    if (!currentStem.stem.hasLeaves() && currentStem.stem.isReached) {

                        this.addLeafToStem(currentStem, leafXAngle);
                    }
                }
            }
        }

        this.events.spring.updateEventAndState(timeElapsed, this.events.autumn.event.end);
        this.events.autumn.updateEventAndState(timeElapsed, this.events.autumn.event.end);
    }

    updateFlowers(timeElapsed) {

        for (let flowerIndex = 0; flowerIndex < this.stems.length; flowerIndex++) {

            let currentStem = this.stems[flowerIndex];

            let flowerFallTick = this.events.bloomEnd.stemStates[flowerIndex];
            let flowerGrowTick = this.events.bloomStart.stemStates[flowerIndex].tick;
            let flowerZAngle = this.events.bloomStart.stemStates[flowerIndex].zAngle;
            let isStemToFlower = this.events.bloomStart.stemStates[flowerIndex].isChosen;

            if (flowerFallTick <= timeElapsed && flowerFallTick > flowerGrowTick) {

                if (currentStem.stem.hasFlowers()) {

                    currentStem.stem.purgeFlowers();
                }
            }
            else if (flowerGrowTick <= timeElapsed && isStemToFlower) {

                if (!currentStem.stem.hasFlowers() && currentStem.stem.isReached) {

                    this.addFlowerToStem(currentStem, flowerZAngle);
                }
            }
        }

        this.events.bloomStart.updateEventAndState(timeElapsed, this.events.bloomEnd.event.end);
        this.events.bloomEnd.updateEventAndState(timeElapsed, this.events.bloomEnd.event.end);
    }
}

// Will use precalculated states saved on chain once pruning is released

function setStemStates(timeElapsed, tree) {

    //const timeElapsed = Date.now();
    const germinationTick = tree.germinationDate.getTime();

    const growthRate = 1.0 / (2 * 86400000);
    //const timeToGrow = 1.0 / growthRate;
    const timeToGrow = 86400000 * 2;

    let stemIt = stemIterator(tree.root);
    let it = stemIt.next();

    while(!it.done) {

        let currentStem = it.value;
        let currentStackFrame = currentStem.stackFrame;

        let stemCreationTick = germinationTick + (currentStackFrame.depth * timeToGrow);

        if (stemCreationTick <= timeElapsed) {

            let branch = currentStem.stackFrame.branch;

            if (!tree.branches.has(branch)) {

                tree.branches.add(branch);
                branch.setBranchId(tree.branches.size - 1);
            }

            // Will need to be altered once pruning is released
            if (currentStackFrame.count == 0) {

                if (currentStackFrame.connectParent && currentStackFrame.prevStem) {
                    currentStackFrame.branch.setAge(currentStackFrame.prevStem.stackFrame.branch.age);
                }
                else {
                    let branchCreationTick = stemCreationTick;
                    let branchAge = (timeElapsed - branchCreationTick) * Branch.growthRate;
                    currentStackFrame.branch.setAge(branchAge);
                }
            }

            let stemLength = (timeElapsed - stemCreationTick) * growthRate;

            currentStem.stem.isReached = true;
            currentStem.stem.setStemLength(stemLength);
            currentStem.stem.tree = tree;

            if (stemLength >= Stem.terminalLength 
                && currentStackFrame.nextStems.length > 0) {

                tree.mergeToGeometry(currentStem);
            }
            else {

                tree.addTerminalStem(currentStem);
            }
        }

        it = stemIt.next();
    }
}

function setLeafStates(timeElapsed, tree) {

    //const timeElapsed = Date.now();
    //const timeElapsed = new Date('July 30 2021 00:00:00').getTime();
    const germinationTick = tree.germinationDate.getTime();

    const growthRate = 1.0 / (2 * 86400000);
    const timeToGrow = 2 * 86400000;

    const autumnDeathRate = 1.0 / (86400000);
    const deathRate = 1.0 / (86400000);

    const timeToDieFirst = 43200000;

    let stemIt = stemIterator(tree.root);
    let it = stemIt.next();

    let index = 0;

    while (!it.done) {

        let currentStem = it.value;
        let currentStackFrame = currentStem.stackFrame;

        if (currentStem.stem.isReached) {

            let leafGrowTick = tree.events.spring.stemStates[index].tick;
            let leafXAngle = tree.events.spring.stemStates[index].xAngle;
            let leafFallTick = tree.events.autumn.stemStates[index];

            // SPECIAL CASE FOR FIRST TIME LEAF GROWS
            // Needs slight modification when pruning is released

            let firstLeafGrowTick = germinationTick + (currentStackFrame.depth * timeToGrow);

            if (currentStem.stackFrame.branch.level < LEAF_GROWTH_LEVEL && 
                timeElapsed - firstLeafGrowTick < timeToGrow + timeToDieFirst && 
                timeElapsed >= leafGrowTick) {

                tree.addLeafToStem(currentStem, leafXAngle);

                let leaves = currentStem.stem.leaves;
                let firstLeafAge = (timeElapsed - firstLeafGrowTick) * growthRate;

                leaves[0].setAge(firstLeafAge);
                leaves[1].setAge(firstLeafAge);

                if (leaves[0].isMaxAge() || leaves[1].isMaxAge()) {

                    let firstLeafFallTick = firstLeafGrowTick + timeToGrow;
                    let firstLeafDeathAge = (timeElapsed - firstLeafFallTick) * deathRate;
                    //currentStem.stem.removeLeaves(/*deathRate*/0.5);
                    currentStem.stem.killLeaves(0.5);

                    leaves[0].setDeathAge(firstLeafDeathAge);
                    leaves[1].setDeathAge(firstLeafDeathAge);
                }
            }
            else if (timeElapsed >= leafGrowTick && 
                    currentStem.stackFrame.branch.level > LEAF_GROWTH_LEVEL) {

                tree.addLeafToStem(currentStem, leafXAngle);
                
                let leaves = currentStem.stem.leaves;
                let leafAge = (timeElapsed - leafGrowTick) * growthRate;

                leaves[0].setAge(leafAge);
                leaves[1].setAge(leafAge);
            }

            if (currentStem.stem.hasLeaves()) {

                if (timeElapsed <= tree.events.autumn.event.end && 
                    timeElapsed >= leafFallTick) {

                    let deathAge = (timeElapsed - leafFallTick) * autumnDeathRate;

                    let leaves = currentStem.stem.leaves;
                    //currentStem.stem.removeLeaves(/*autumnDeathRate*/0.01);
                    currentStem.stem.killLeaves(0.01);
                    //currentStem.stem.purgeLeaves();

                    leaves[0].setDeathAge(deathAge);
                    leaves[1].setDeathAge(deathAge);
                }
            }
        }

        index++;
        it = stemIt.next();
    }
}

function setFlowerStates(timeElapsed, tree) {

    const germinationTick = tree.germinationDate.getTime();

    const growthRate = 1.0 / (2 * 86400000);

    let stemIt = stemIterator(tree.root);
    let it = stemIt.next();

    let index = 0;

    while (!it.done) {

        let currentStem = it.value;
        let currentStackFrame  = currentStem.stackFrame;

        if (currentStem.stem.isReached) {

            let bloomStartTick = tree.events.bloomStart.stemStates[index].tick;
            let bloomEndTick = tree.events.bloomEnd.stemStates[index];
            let bloomZAngle = tree.events.bloomStart.stemStates[index].zAngle;
            let isStemToFlower = tree.events.bloomStart.stemStates[index].isChosen;

            if (timeElapsed >= bloomStartTick && isStemToFlower) {

                tree.addFlowerToStem(currentStem, bloomZAngle);

                let flowers = currentStem.stem.flowers;
                let flowerAge = (timeElapsed - bloomStartTick) * growthRate;
                flowers[0].setAge(flowerAge);
            }
        }

        if (currentStem.stem.hasFlowers()) {

            if (timeElapsed <= tree.events.bloomEnd.end && timeElapsed >= bloomEndTick) {

                currentStem.stem.purgeFlowers();
            }
        }

        index++;
        it = stemIt.next();
    }
}

function getStemList(root) {

    let stemIt = stemIterator(root);
    let it = stemIt.next();

    const stems = [];

    while (!it.done) {

        stems.push(it.value);

        it = stemIt.next();

    }

    return stems;
}