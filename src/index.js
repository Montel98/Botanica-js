import './style.css';
import initGame from './NFT/hello_webgl.js';

function component() {
	const element = document.createElement('div');
	//element.id = 'gridContainer';
	
	const canvas = document.createElement('canvas');
	canvas.id = 'glCanvas';
	canvas.setAttribute('height', window.innerHeight);
	canvas.setAttribute('width', window.innerWidth);
	//const btn = document.createElement('button');

	//element.innerHTML = _.join(['Hello', 'webpack'], ' ');
	//element.classList.add('hello');

	//btn.innerHTML = 'Click me and check the console!';
	//btn.onclick = printMe;

	//element.appendChild(btn);

	element.appendChild(canvas);

	return element;
}

window.onload = function() {
	//document.body.appendChild(component());
	//document.body.appendChild(makeLoader(window.innerWidth / 2, window.innerHeight / 2, 100));
	document.body.appendChild(component());
	initGame();
}

/*function makeWheel(cx, cy, outerRadius) {
    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    let animate = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");

    animate.setAttribute("attributeName", "transform");
    animate.setAttribute("attributeType","XML");
    animate.setAttribute("type", "rotate");
    animate.setAttribute("from", `0 ${cx} ${cy}`);
    animate.setAttribute("to", `360 ${cx} ${cy}`);
    animate.setAttribute("dur", "1s");
    animate.setAttribute("repeatCount", "indefinite");

    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    g.appendChild(animate);

    svg.appendChild(g);

    for (let i = 0; i < 8; i++) {

        let angle = (i / 8) * (2.0 * Math.PI);
        let x = cx + outerRadius * Math.cos(angle);
        let y = cy + outerRadius * Math.sin(angle);
        g.appendChild(newDot(x, y));
    }

    return svg;
}

function newDot(x, y) {

    let newDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    newDot.setAttribute("cx", `${x}`);
    newDot.setAttribute("cy", `${y}`);
    newDot.setAttribute("r", "20");

    let animate = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
    return newDot;
}

function makeLoader(cx, cy, outerRadius) {
    const wheel = makeWheel(cx, cy, outerRadius);
    wheel.id = "loadingWheel";
    //document.getElementById("gridContainer").appendChild(wheel);
    //document.body.appendChild(wheel);
    return wheel;
}*/
