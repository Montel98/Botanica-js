const alleleColours = [new Vector([25, 50, 100]), new Vector([50, 100, 100])];

function createChromomes(genome) {
	let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
	svg.setAttribute('id', 'chromosome')

	svg.setAttribute("width", "100%");
	svg.setAttribute("height", "100%");

	svg.appendChild(chromosomeBody(50, 130)); // Left Chromosome
	svg.appendChild(chromosomeBody(190, 130)); // Right Chromosome

	let geneSections = getGeneSections(genome);
	
	for (let gene = 0; gene < geneSections.length; gene++) {

		svg.appendChild(geneSections[gene]);
	}

	return svg;
}

function getGeneSections(genome) {

	const geneSections = [];

	const chromosomeLength = genome.getGenomeLength();
	const chromosomePixelLength = 400;

	const genes = genome.getGenes();

	for (let geneName in genes) {

		let pixelStartY = 130 + (genes[geneName].sequenceStart / chromosomeLength) * chromosomePixelLength;
		let genePixelLength = ((genes[geneName].sequenceEnd - genes[geneName].sequenceStart + 1) / chromosomeLength) * chromosomePixelLength;

		const leftAllele = genome.getGenotype(geneName).left.allele;
		const rightAllele = genome.getGenotype(geneName).right.allele;

		let randomColourIndex = Math.floor(2.0 * Math.random());

		let leftColour = alleleColours[randomColourIndex];
		let rightColour = alleleColours[(1 - randomColourIndex)];

		if (rightAllele == leftAllele) {
			leftColour = rightColour;
		}

		let leftX = 50;
		let rightX = 190;

		geneSections.push(geneSection(leftX, pixelStartY, genePixelLength, leftColour));
		geneSections.push(geneSection(rightX, pixelStartY, genePixelLength, rightColour));
	}

	return geneSections;
}

function geneSection(startX, startY, length, colourVector) {
	let newRectangle = document.createElementNS("http://www.w3.org/2000/svg", "rect");

	let rgb = colourVector.components;

	newRectangle.setAttribute("x", `${startX}`);
	newRectangle.setAttribute("y", `${startY}`);
	newRectangle.setAttribute("width", "100");
	newRectangle.setAttribute("height", `${length}`);
	newRectangle.setAttribute("stroke", "rgb(25, 50, 50)");
	newRectangle.setAttribute("fill", `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);
	newRectangle.setAttribute("stroke-width", "5");

	return newRectangle;
}

function chromosomeBody(x, y) {
	let newPath = document.createElementNS("http://www.w3.org/2000/svg", "path");

	newPath.setAttribute("d", `M ${x} ${y}
                   l 0 220
                   a 30 30 0 0 0 8.79 21.21
                   l 10 10
                   a 30 30 0 0 1 8.79 21.21
                   a 30 30 0 0 1 -8.79 21.21
                   l -10 10
                   a 30 30 0 0 0 -8.79 21.21
                   l 0 220
                   a 50 50 0 0 0 100 0
                   l 0 -220
                   a 30 30 0 0 0 -8.79 -21.21
                   l -10 -10
                   a 30 30 0 0 1 -8.79 -21.21
                   a 30 30 0 0 1 8.79 -21.21
                   l 10 -10
                   a 30 30 0 0 0 8.79 -21.21
                   l 0 -220
                   a 50 50 0 0 0 -100 0`);

	newPath.setAttribute("stroke", "rgb(25, 50, 50");
	newPath.setAttribute("fill", "rgb(50, 100, 100");
	newPath.setAttribute("stroke-width", "5");
	newPath.setAttribute("fill-opacity", "1.0");

	return newPath;
}

var overlay = document.getElementById('test');
var overlayDims = overlay.getBoundingClientRect();

var svgChromosome = createChromomes(newTree.getGenome());

console.log('mm: ', overlay.getBoundingClientRect());
overlay.appendChild(svgChromosome);

//svgChromosome.width = overlayDims.width;
//svgChromosome.height = overlayDims.height;