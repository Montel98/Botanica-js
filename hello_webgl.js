const canvas = document.querySelector('#glCanvas');

canvas.setAttribute('width', window.innerWidth);
canvas.setAttribute('height', window.innerHeight);

const keys = {};

const cameraEye = new Vector([0.0, -1.25, 0.9]);
const cameraFacing = new Vector([0.0, 1.15, 0.6]);

const cameraDir = subtract(cameraEye, cameraFacing);

const cameraLeft = cross(upVector, cameraDir);
const cameraUp = cross(cameraDir, cameraLeft);

const camera = new Camera(cameraEye, cameraFacing, cameraUp);
const renderer = new Renderer(canvas);
const scene = new Scene(camera);
const controller = new Controller(scene, renderer);

const worldTime = new WorldTime();

const potTest = new Pot();
potTest.setPosition(0.0, 0.0, 0.35);
scene.addEntity(potTest);

newTree.setPosition(0.0, 0.0, 0.7);
scene.addEntity(newTree);

//console.log(planeTexture);

const planeTest = new PlaneEntity(camera);
planeTest.setPosition(-0.5, 0.0, 0.35);
planeTest.worldMatrix = multiply(translate(0.0, 0.0, 0.7), scale(0.18, 0.18, 0.18));
scene.addEntity(planeTest);

/*const flowerTest = new Flower();
flowerTest.setPosition(0.0, 0.2, -0.4);
scene.addEntity(flowerTest);*/

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
    controller.updateStates(worldTime);
}