import TreeSeed from './Seed.js';

const testSequence = 56;

function crossBreed(genomeA, genomeB) {

}

export class GeneticSequence {

	constructor(chromosomes) {

		this.chromosomes = chromosomes;
		this.chromosomeLength = 32;
	}

	/*getFullSequence() {

		return this.sequence.toString(2);
	}*/

	getAllele(geneName) {

		const chromosomeNo = Genes[geneName].chromosome;

		const geneLength = Genes[geneName].sequenceEnd - Genes[geneName].sequenceStart + 1;
		const offset = Genes[geneName].sequenceStart;

		const geneticCode = (this.chromosomes[chromosomeNo] & ((2**geneLength) - 1 << offset)) >> offset;

		if (geneName in Genes && geneticCode in Genes[geneName].alleles) {

			return Genes[geneName].alleles[geneticCode];
		}

		return unknownAllele;
	}

	/*mutate() {

		let validPositions = this.getValidPositions();

		let randomPosition = Math.random() * validPositions.length;

		this.mutateAux(randomPosition);
	}

	mutateAux(position) {

		let isolatedBit = this.sequence & (1 << position); // Isolate bit to change

		let settingMask = ~isolatedBit & (1 << position);

		let clearingMask = ~(1 << position);

		this.sequence = (this.sequence & clearingMask) | settingMask;

	}*/

	// Enumarated list of positions in the sequence where a bit negation leads to a valid state

	/*getValidPositions() {

		const oldSequence = this.sequence;

		let validPositions = [];

		for (let gene in Genes) {

			for (let pos = Genes[gene].sequenceStart; pos <= Genes[gene].sequenceEnd; pos++) {

				this.mutateAux(pos);

				if (this.isValidAlleleSequence(gene)) {

					validPositions.push(pos);
				}
			}
		}

		this.sequence = oldSequence;

		return validPositions;
	}*/

	isValidAlleleSequence(geneName) {

		return this.getAllele(geneName) == unknownAllele;

	}
}

// Generates a random valid genetic sequence

export function randomGeneticSequence1() {

	let alleleMasks = [];

	let sequence = 0;

	for (let geneName in Genes) {

		//console.log(geneName);

		const geneLength = Genes[geneName].sequenceEnd - Genes[geneName].sequenceStart + 1;
		const offset = Genes[geneName].sequenceStart;

		const alleleList = Object.keys(Genes[geneName].alleles);

		const noAlleles = alleleList.length;

		if (noAlleles > 0) {

			let randomAllele = getRandomAlleleFromGene(geneName);

			//console.log('random: ', randomAllele);

			let alleleMask = randomAllele.geneticCode << offset;

			sequence |= alleleMask;
		}
	}

	return new GeneticSequence(sequence);
}

export function randomGeneticSequence() {

	let alleleMasks = [];

	let chromosomes = [0, 0];

	for (let geneName in Genes) {

		//console.log(geneName);

		const chromosomeNo = Genes[geneName].chromosome;

		const geneLength = Genes[geneName].sequenceEnd - Genes[geneName].sequenceStart + 1;
		const offset = Genes[geneName].sequenceStart;

		const alleleList = Object.keys(Genes[geneName].alleles);

		const noAlleles = alleleList.length;

		if (noAlleles > 0) {

			let randomAllele = getRandomAlleleFromGene(geneName);

			//console.log('random: ', randomAllele);

			let alleleMask = randomAllele.geneticCode << offset;

			chromosomes[chromosomeNo] |= alleleMask;
		}
	}

	return new GeneticSequence(chromosomes);
}

export default class Genome {

	constructor(leftSequence, rightSequence) {

		this.leftSequence = leftSequence;
		this.rightSequence = rightSequence;

		this.sequenceLength = this.leftSequence.sequenceLength;
	}

	getFullSequence() {

		return {
				left: this.leftSequence.getFullSequence(), 
				right: this.rightSequence.getFullSequence()
			};
	}

	getGenes() {

		return Genes;
	}

	getGene(geneName) {

		return Genes[geneName];
	}

	getGenotype(geneName) {

		let leftAllele = this.leftSequence.getAllele(geneName);
		let rightAllele = this.rightSequence.getAllele(geneName);

		var leftDominance, rightDominance;

		if (leftAllele.dominance > rightAllele.dominance) {
			leftDominance = 'Dominant';
			rightDominance = 'Recessive';
		}
		else if (leftAllele.dominance < rightAllele.dominance) {
			leftDominance = 'Recessive';
			rightDominance = 'Dominant';
		}
		else if (leftAllele.allele == rightAllele.allele) {
			leftDominance = 'Dominant';
			rightDominance = 'Dominant';
		}
		else {
			leftDominance = 'Partially Dominant';
			rightDominance = 'Partially Dominant';
		}

		return {
				left: {allele: leftAllele, dominance: leftDominance}, 
				right: {allele: rightAllele, dominance: rightDominance}
		};
	}

	getGenotypes() {

		let genotypes = {};

		for (let geneName in Genes) {
			genotypes[geneName] = this.getGenotype(geneName);
		}

		return genotypes;

	}

	getGenomeLength() {

		return this.sequenceLength;
	}

	mutate() {

		let randomSide = Math.random();

		if (randomSide >= 0.5) {
			this.leftSequence.mutate();
		}
		else {
			this.rightSequence.mutate();
		}
	}
}

const Allele = (sequence, rarity, dominance, alleleName="") => {

	return {
		name: alleleName,
		geneticCode: sequence,
		frequency: rarity,
		dominance: dominance
	}
}

const Gene = (Id, chromosomeNo, start, end, alleleList={}) => {

	return {
		ID: Id,
		chromosome: chromosomeNo,
		sequenceStart: start,
		sequenceEnd: end,
		alleles: alleleList
	}
}

const leafColourAlleles = {'0': Allele(0, 0.03, 1.0, 'Midnight Blue'), 
							'1': Allele(1, 0.18, 1.0, 'Murky Green'),
							'2': Allele(2, 0.05, 1.0, 'Fuschia'),
							'3': Allele(3, 0.04, 1.0, 'Sunset Orange'),
							'4': Allele(4, 0.08, 1.0, 'Blossom'),
							'5': Allele(5, 0.05, 1.0, 'White'),
							'6': Allele(6, 0.05, 1.0, 'Fiery Red'),
							'7': Allele(7, 0.2, 1.0, 'Verdant Green'),
							'8': Allele(8, 0.05, 1.0, 'Aqua Green'),
							'9': Allele(9, 0.05, 1.0, 'Mustard Brown'),
							'10': Allele(10, 0.015, 1.0, 'Silver'),
							'11': Allele(11, 0.01, 1.0, 'Gold'),
							'12': Allele(12, 0.047, 1.0, 'Peach'),
							'13': Allele(13, 0.03, 1.0, 'Charcoal Grey'),
							'14': Allele(14, 0.1, 1.0, 'Lime Yellow'),
							'15': Allele(15, 0.003, 1.0, 'Trippy'),
							'16': Allele(16, 0.005, 1.0, 'Hypnosis'),
							'17': Allele(17, 0.01, 1.0, 'Rose Gold')
						};

const leafPatternAlleles = {'0': Allele(0, 0.3, 1.0, 'Radial'),
								'1': Allele(1, 0.08, 1.0, 'Spotted'),
								'2': Allele(2, 0.22, 1.0, 'Cellular'),
								'3': Allele(3, 0.4, 1.0, 'Normal')
						};

const floweringAlleles = {
	'0': Allele(0, 0.75, 0.1, 'Not Flowering'),
	'1': Allele(1, 0.25, 1.0, 'Flowering')
};

const woodTypeAlleles = {
	'0': Allele(0, 0.38, 1.0, 'Light Wood'),
	'1': Allele(1, 0.35, 1.0, 'Dark Wood'),
	'2': Allele(2, 0.21, 1.0, 'Birch'),
	'3': Allele(3, 0.03, 1.0, 'Silver'),
	'4': Allele(4, 0.02, 1.0, 'Gold'),
	'5': Allele(5, 0.01, 1.0, 'Rose Gold')
};

const floweringSeasonAlleles = {
	'0': Allele(0, 0.04, 1.0, 'January-February'),
	'1': Allele(1, 0.28, 1.0, 'March-April'),
	'2': Allele(2, 0.32, 1.0, 'May-June'),
	'3': Allele(3, 0.2, 1.0, 'July-August'),
	'4': Allele(4, 0.1, 1.0, 'September-October'),
	'5': Allele(5, 0.06, 1.0, 'November-December'),
};

/*function generateLeafShapeAlleles() {

	const leafShapeAlleles = {};

	for (let i = 0; i <= 16; i++) {

		for (let j = 0; j < i; j++) {

			let mainBodyCode = i;
			let auxBodyCode = j << 4;

			let geneticCode = mainBodyCode | auxBodyCode;

			leafShapeAlleles[geneticCode] = Allele(geneticCode, 1.0, 1.0, "");
		}
	}

	return leafShapeAlleles;
}*/

/*function generateLeafShapes() {

	const leafShapes = {};

	for (let i = 1; i <= 12; i++) {

		leafShapes[i] = [];

		for (let j = i + 1; j <= 12; j++) {

			//let mainBodyCode = i;
			//let auxBodyCode = j << 4;

			//let geneticCode = mainBodyCode | auxBodyCode;

			//leafShapeAlleles[geneticCode] = Allele(geneticCode, 1.0, 1.0, "");

			leafShapes[i].push(j);
		}
	}

	return leafShapes;
}*/

function generateLeafShapes() {

	const leafShapes = {};

	for (let i = 1; i <= 12; i++) {

		//leafShapes[i] = [];

		const outerShapes = [];

		for (let j = i + 1; j <= 12; j++) {

			outerShapes.push(j);

			//leafShapes[i].push(j);
		}

		if (outerShapes.length > 0) {
			leafShapes[i] = outerShapes;
		}
	}

	return leafShapes;
}

const flowerMassFunc = (x) => { return 0.8 + Math.exp(-0.2 * (x - 18)) };
const leafMassFunc = (x) => { return 10 * (x + 1) * Math.exp(-0.5 * (x + 1)) };


function flowerLeafProbabilities(outcomes, probabilityMassFunc) {

	//const probabilityMassFunc = (x) => { return 0.8 + Math.exp(-0.2 * (x - 18)) };

	let totalWeight = 0;
	let probabilities = {};

	for (let outcome of outcomes) {

		totalWeight += probabilityMassFunc(parseInt(outcome));
	}

	for (let outcome of outcomes) {
		probabilities[outcome] = (probabilityMassFunc(parseInt(outcome)) / totalWeight);
	}

	return probabilities;
}

const flowerProbabilities = (outcomes) => { return flowerLeafProbabilities(outcomes, flowerMassFunc) };
const leafProbabilities = (outcomes) => { return flowerLeafProbabilities(outcomes, leafMassFunc) };

function generateFlowerShapes() {

	const flowerShapes = {};

	for (let i = 3; i < 16; i++) {

		flowerShapes[i] = [];

		for (let j = i; j < 16; j++) {

			let mainBody = i;
			let outerBody = j;

			//let probability = pMainBody[i - 3] * pOuterBody[j - i];

			if (i % 2 == 1) {

				if (j % i == 0) {
					flowerShapes[i].push(j);
				}
			}
			else {

				if (j % 2 == 0) {
					flowerShapes[i].push(j);
				}
			}
		}
	}

	return flowerShapes;
}

function flowerLeafDistribution(validShapeFunc, probabilityFunc) {

	let alleles = {};

	let validShapes = validShapeFunc();

	const mainBodyOutcomes = Object.keys(validShapes);
	const mainBodyProbabilities = probabilityFunc(mainBodyOutcomes);

	//let probs = [];

	for (let mainOutcome in validShapes) {

		let outerBodyOutcomes = validShapes[mainOutcome];
		let outerBodyProbabilities = probabilityFunc(outerBodyOutcomes);

		for (let outcome = 0; outcome < outerBodyOutcomes.length; outcome++) {

			let outerOutcome = outerBodyOutcomes[outcome];
			let probability = outerBodyProbabilities[outerOutcome] * mainBodyProbabilities[mainOutcome];

			const mainBodyCode = parseInt(mainOutcome);
			const outerBodyCode = parseInt(outerOutcome) << 4;

			const geneticCode = mainBodyCode | outerBodyCode;

			alleles[geneticCode] = Allele(geneticCode, probability, 1.0, "");
		}
	}
	//console.log('sum: ', probabilities);

	return alleles;
}

/*function leafDistrubution() {

	let validShapes = generateLeafShapes();

	const mainBodyOutcomes = [0,1,2,3,4,5,6,7,8,9,10,11,12];
	const mainBodyProbabilities = leafProbabilities(mainBodyOutcomes);

	let probs = [];

	for (let mainOutcome in validShapes) {

		let outerBodyOutcomes = validShapes[mainOutcome];
		let outerBodyProbabilities = leafProbabilities(outerBodyOutcomes);

		let prob = 0;

		for (let outcome = 0; outcome < outerBodyOutcomes.length; outcome++) {

			let outerOutcome = outerBodyOutcomes[outcome];
			let probability = outerBodyProbabilities[outerOutcome] * mainBodyProbabilities[mainOutcome];

			prob+=probability;
			probs.push(probability);
		}
	}

	return probs
}*/

//console.log('valid outcomes: ', generateFlowerShapes());
//console.log('expected:', flowerLeafDistribution());
//console.log('actual:', getRandomFlower());
//console.log('valid positions: ', Object.keys(generateLeafShapeAlleles2()).length);
//console.log('Flower Alleles: ', flowerLeafDistribution(generateFlowerShapes, flowerLeafProbabilities));

const unknownAllele = Allele(0, 0.0, 0.0, 'Unknown');

function getRandomAlleleFromGene(geneName) {

	let gene = Genes[geneName];
	//let alleles = flowerLeafDistribution(generateFlowerShapes, flowerLeafProbabilities);
	let alleles = gene.alleles;

	//console.log('allelessss', alleles);

	let sum = 0;

	//let randomVal = Math.random();
	const randomVal = TreeSeed.traits();

	//console.log('randomVal: ', randomVal);

	for (let geneticCode in alleles) {

		let probability = alleles[geneticCode].frequency;
		sum += probability;

		if (randomVal < sum) {
			//fconsole.log('chosen allele: ', alleles[geneticCode]);
			return alleles[geneticCode];
		}
	}

	return unknownAllele;
}

/*const Genes = {
	'Leaf Colour': Gene(0, 0, 4, leafColourAlleles),
	'Leaf Pattern': Gene(1, 5, 8, leafPatternAlleles),
	'Leaf Shape': Gene(2, 9, 16, generateLeafShapeAlleles()),
	'Flowering': Gene(3, 17, 17, floweringAlleles),
	'Wood Type': Gene(4, 18, 21, woodTypeAlleles),
	'Leaf Arrangement': Gene(5, 22, 23),
	'Flower Colour': Gene(5, 24, 27),
	'Flower Pattern': Gene(6, 28, 29),
	'Flower Shape': Gene(7, 30, 30, flowerLeafDistribution(generateFlowerShapes, flowerLeafProbabilities)),
	'Leaf Droopiness': Gene(8, 31, 31)
}*/

const Genes = {
	'Leaf Colour': Gene(0, 0, 0, 4, leafColourAlleles),
	'Leaf Pattern': Gene(1, 0, 5, 7, leafPatternAlleles),
	'Leaf Shape': Gene(2, 0,  8, 15, flowerLeafDistribution(generateLeafShapes, leafProbabilities)),
	'Wood Type': Gene(3, 0,  16, 18, woodTypeAlleles),
	'Flower Shape': Gene(4, 0,  19, 26, flowerLeafDistribution(generateFlowerShapes, flowerProbabilities)),
	'Flower Colour': Gene(5, 0,  27, 29),
	'Flowering Season': Gene(6, 1, 0, 2, floweringSeasonAlleles)
}

//console.log(getRandomAlleleFromGene(Genes['Leaf Colour']));
//console.log('Leaves: ', Object.keys(flowerLeafDistribution(generateLeafShapes, flowerLeafProbabilities)).length);

function bla() {
	let total = 0;
	let leafDist = flowerLeafDistribution(generateLeafShapes, leafProbabilities);
	//console.log(leafDist);
	for (let i in leafDist) {
		total += leafDist[i].frequency;
	}

	//console.log('probabilities: ', leafDist);
}

//bla();
//console.log('leaf shapes: ', Object.keys(generateLeafShapes()));
//console.log('probabilities: ', flowerLeafProbabilities(Object.keys(generateLeafShapes()), leafMassFunc));

bla();
