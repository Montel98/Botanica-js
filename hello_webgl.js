const canvas = document.querySelector('#glCanvas');

canvas.setAttribute('width', window.innerWidth);
canvas.setAttribute('height', window.innerHeight);

const keys = {};

const camera = new Camera(new Vector([0.0, -2.0, 1.0]), new Vector([0.0, 1.0, 1.0]), new Vector([0.0, 0.0, 1.0]));
const renderer = new Renderer(canvas);
const scene = new Scene(camera);
const controller = new Controller(scene, renderer);

//const surface = new ParametricSurface(flowerFunc, 0.0, 2.0 * Math.PI, 0.0, 0.2);
//const flower = new Flower(surface);

//const stem = new Stem(stemSurface);

const s = buildString([ newSymbol('1', []),
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
                        newSymbol('1', []) ], 0);

/*
let items = l.generateStems(s);
let g = generateMesh(items);
const textureTest = new Texture('s');*/

/*const testEntity = new Entity();
testEntity.mesh = new Mesh(new Material(textureTest), g);
//testEntity.setPosition(4, 4, 4);

scene.addEntity(testEntity);*/

//const leaves = new Leaves();
//scene.addEntity(leaves);
//testEntity.addChild(leaves);

//const flowers = new Flowers();
//scene.addEntity(stem);
//scene.addEntity(flowers);
//stem.addChild(leaves);

/*const treeTest = generateTree(s);
treeTest.setPosition(-0.5, 0.0, 0.7);
scene.addEntity(treeTest);*/

const potTest = new Pot();
potTest.setPosition(-0.5, 0.0, 0.35);
scene.addEntity(potTest);

newTree.setPosition(-0.5, 0.0, 0.7);
scene.addEntity(newTree);

let prevX = canvas.scrollWidth / 2.0;
let prevY = canvas.scrollHeight / 2.0;
const sensitivity = 0.005;

// Input

canvas.addEventListener('mousemove', e => {
    let dx =  e.offsetX - prevX;
    let dy = e.offsetY - prevY;

    prevX = e.offsetX;
    prevY = e.offsetY;

    camera.rotateHorizontal(-sensitivity * dx);
    camera.rotateVertical(sensitivity * dy);
});

window.addEventListener('keydown', e => {
    let key = e.which || e.keyCode;

    keys[key] = true;
});

window.addEventListener('keyup', e => {
    let key = e.which || e.keyCode;

    keys[key] = false;
});

window.addEventListener('resize', e => {
    canvas.setAttribute('width', window.innerWidth);
    canvas.setAttribute('height', window.innerHeight);
})

mainLoop();

function mainLoop() {
    window.requestAnimationFrame(mainLoop);
    handleInput();

    drawScene();
}

function handleInput() {
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

function drawScene() {
    controller.updateStates();
}