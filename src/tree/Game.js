import Vector, {cross, subtract, upVector } from './Vector.js';
import { multiply, rotate4Z } from './Matrix.js';
import CubeMap from './CubeMap.js';
import Camera from './Camera.js';
import Renderer from './Renderer.js';
import Scene from './Scene.js';
import Pot from './Pot.js';
import Controller from './Controller.js';
import WorldTime from './WorldTime.js';
import Tree from './Tree.js';
import { newSymbol } from './LSystem.js';
import TreeSeed from './Seed.js';

var canvas;

const keys = {};

const defaultVelocity = 0.002;

const PAN_MODE = 0;
const PRUNE_MODE = 1;

export default function initGame() {
    canvas = document.querySelector('#glCanvas');

    const game = canvas.parentNode.getBoundingClientRect();

    canvas.width = game.width;
    canvas.height = game.height;

    const cameraEye = new Vector([-0.45, -1.7, 0.6]);
    const cameraFacing = new Vector([-0.45, 1.15, 0.6]);

    const cameraDir = subtract(cameraEye, cameraFacing);

    const cameraLeft = cross(upVector, cameraDir);
    const cameraUp = cross(cameraDir, cameraLeft);

    const camera = new Camera(cameraEye, cameraFacing, cameraUp);
    const renderer = new Renderer(canvas);
    const scene = new Scene(camera);

    const cubeMap = new CubeMap();
    scene.setBackground(cubeMap);

    const controller = new Controller(scene, renderer);

    const worldTime = new WorldTime();

    const potTest = new Pot();
    potTest.setPosition(0.0, 0.0, 0.15);
    scene.addEntity(potTest);

    //const newTree = await new Tree(getLString());
    const newTree = makeTree();
    newTree.setPosition(0.0, 0.0, 0.28);
    scene.addEntity(newTree);

    controller.initSegmentSelector(newTree);

    //resizeCanvas(renderer);

    initInput(controller, renderer, camera, newTree, worldTime);
    mainLoop(controller, worldTime);
}

let mouseDown = false;
let startX = null
let startY = null;

let prevX = null;
let prevY = null;

let velocity = defaultVelocity;

let mode = PAN_MODE;
//let mode = PRUNE_MODE;

let messageDiv = null;

// Input

function initInput(controller, renderer, camera, tree, worldTime) {

    window.addEventListener('resize', () => /*{resizeCanvas(renderer)}*/{

        const game = canvas.parentNode.getBoundingClientRect();

        //console.log(game.width, game.height);

        if (isFirefox() || isSafari()) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
        else {
            canvas.width = game.width;
            canvas.height = game.height;
        }

        canvas.setAttribute('width', canvas.width);
        canvas.setAttribute('height', canvas.height);

        renderer.setViewportDimensions(canvas.width, canvas.height);
    });

    canvas.addEventListener('mousemove', e => {

        const canvasDims = canvas.getBoundingClientRect();

        controller.mouseX = e.offsetX;
        controller.mouseY = canvas.height - e.offsetY;

        if (mode == PRUNE_MODE) {

            controller.sendRay(tree);
        }
        else if (mouseDown) {

            let dx = e.offsetX - prevX;
            let dy = e.offsetY - prevY;

            prevX = e.offsetX;
            prevY = e.offsetY;

            if (0.02*canvas.width < e.offsetX && e.offsetX < 0.98*canvas.width && 
                0.02*canvas.width < e.offsetY && e.offsetY < 0.98*canvas.height) {

                velocity = dx * worldTime.dt * 0.4;

            }
            else {
                mouseDown = false;
                velocity = defaultVelocity;
            }
        }
    });

    canvas.addEventListener('mousedown', e => {

        prevX = e.offsetX;
        prevY = e.offsetY;

        if (mode == PAN_MODE) {

            if (0 < e.offsetX && e.offsetX < canvas.width && 
                0 < e.offsetY && e.offsetY < canvas.height) {
                mouseDown = true;
            }
        }
        else {

            let stemToCut = controller.segment.stackFrame;

            if (tree.terminalStems.length != 118) {
                messageBox("You cannot prune until the tree has fully grown!");
            }
            else if (!stemToCut.prevStem) {
                messageBox("You cannot cut the base of the tree!");
            }
            else {

                if (stemToCut.prevStem.stackFrame.nextStems.length > 1) {

                    stemToCut = stemToCut.prevStem.stackFrame;
                    //let g = tree.removeChildrenFromStem(controller.segment.stackFrame);
                }

                tree.removeChildrenFromStem(stemToCut);
            }
        }
    });

    canvas.addEventListener('mouseup', e => {

        if (mode == PAN_MODE) {
            mouseDown = false;
            velocity = defaultVelocity;
        }
    });

    const panButton = document.getElementById('pan');
    const pruneButton = document.getElementById('prune');

    panButton.addEventListener('click', e => { 
        mode = PAN_MODE;
        velocity = defaultVelocity;

        document.body.classList.remove('pruningCursor');

        if (controller.segmentSelector) {
            controller.segmentSelector.hide();
        }
    });

    pruneButton.addEventListener('click', e => { 
        mode = PRUNE_MODE;
        velocity = 0;

        document.body.classList.add('pruningCursor');

        if (controller.segmentSelector) {
            controller.segmentSelector.show();
        }
    });

    const widthMediaQuery = window.matchMedia("(max-width: 1100px)");
    setTreePositionAndMode(widthMediaQuery, camera);
    widthMediaQuery.addListener(e => {setTreePositionAndMode(e, camera)});
}

function setTreePositionAndMode(e, camera) {

    // If media query matches
    if (e.matches) {
        camera.setOrigin(0, -1.7, 0.6);
        camera.setCentre(0, 1.15, 0.6);
    }
    else {
        camera.setOrigin(-0.45, -1.7, 0.6);
        camera.setCentre(-0.45, 1.15, 0.6);

        //camera.setOrigin(0.0, -1.7, 0.6);
        //camera.setCentre(0.0, 1.15, 0.6);

        //camera.setOrigin(0.0, -1.2, 0.5);
        //camera.setOrigin(0.0, -1.2, 0.5)
    }
}

function mainLoop(controller, worldTime) {
    window.requestAnimationFrame(function() {mainLoop(controller, worldTime) });
    //handleInput(controller.scene.camera);

    pan(controller, worldTime);
    drawScene(controller, worldTime);
}

function handleInput(camera) {
    let s = 0.1;

    if (keys[87]) {
        camera.movePosition(0, 0, s);
    }
    if(keys[83]) {
        camera.movePosition(0, 0, -s);
    }
    if (keys[65]) {
        camera.movePosition(-s, 0, 0);
    }
    if (keys[68]) {
        camera.movePosition(s, 0, 0);
    }
}

function drawScene(controller, worldTime) {
    
    controller.updateStates(worldTime);
}

function getLString() {

    const testString = [ newSymbol('1', []),
                        newSymbol('*', [Math.PI / 32]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 32]), 
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]), 
                        newSymbol('1', []),  
                        newSymbol('[', []),
                        newSymbol('+', [TreeSeed.growth.randomFloat() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('[', []),
                        newSymbol('+', [TreeSeed.growth.randomFloat() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]), 
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]), 
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('[', []),
                        newSymbol('+', [TreeSeed.growth.randomFloat() * 2.0 * Math.PI, -Math.PI / 2]),
                        newSymbol('0', []), 
                        newSymbol(']', []),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('1', []),
                        newSymbol('*', [Math.PI / 16]),
                        newSymbol('4', [])];

    return testString;
}

function makeTree() {

    return new Tree(getLString());
}

function pan(controller, worldTime) {

    //velocity = 0;
    let scene = controller.scene;
    let transformation = rotate4Z(velocity);

    if (Math.abs(velocity) >= defaultVelocity) {

        for (let i = 0; i < scene.entities.length; i++) {

            scene.entities[i].worldMatrix = multiply(scene.entities[i].worldMatrix, transformation);
        }
    }
}

function resizeCanvas(renderer) {

    const game = canvas.parentNode.getBoundingClientRect();

    canvas.width = game.width;
    canvas.height = game.height;

    //canvas.setAttribute('width', canvas.width);
    //canvas.setAttribute('height', canvas.height);

    renderer.setViewportDimensions(canvas.width, canvas.height);
}

function messageBox(text) {

    const game = canvas.parentNode;

    if (messageDiv) {
        game.removeChild(messageDiv);
    }

    messageDiv = document.createElement("div");
    messageDiv.innerHTML = text;
    messageDiv.classList.toggle("treeMessage");
    game.appendChild(messageDiv);
}

/*function isFirefox() {

    return typeof InstallTrigger !== 'undefined';
}*/

function isFirefox() {

    const userAgent = navigator.userAgent;

    if (userAgent.match(/firefox|fxios/i)) {
        return true;
    }
    else {
        return false;
    }
}

function isSafari() {

    const userAgent = navigator.userAgent;

    const chromeAgent = userAgent.indexOf("Chrome") > -1;
    const safariAgent = userAgent.indexOf("Safari") > -1;

    return !(chromeAgent && safariAgent);
}