const testSequence = 56;

function crossBreed(genomeA, genomeB) {

}

class GeneticSequence {

	constructor(sequence) {

		this.sequence = sequence
		this.sequenceLength = 24;
	}

	getFullSequence() {

		return this.sequence.toString(2);
	}

	getAllele(geneName) {

		const geneLength = Genes[geneName].sequenceEnd - Genes[geneName].sequenceStart + 1;
		const offset = Genes[geneName].sequenceStart;

		const geneticCode = (this.sequence & ((2**geneLength) - 1 << offset)) >> offset;

		if (geneName in Genes && geneticCode in Genes[geneName].alleles) {

			return Genes[geneName].alleles[geneticCode];
		}

		return unknownAllele;
	}

	mutate() {

		let validPositions = this.getValidPositions();

		let randomPosition = Math.random() * validPositions.length;

		this.mutateAux(randomPosition);
	}

	mutateAux(position) {

		let isolatedBit = this.sequence & (1 << position); // Isolate bit to change

		let settingMask = ~isolatedBit & (1 << position);

		let clearingMask = ~(1 << position);

		this.sequence = (this.sequence & clearingMask) | settingMask;

	}

	// Enumarated list of positons in the sequence where a bit negation leads to a valid state

	getValidPositions() {

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
	}

	isValidAlleleSequence(geneName) {

		return this.getAllele(geneName) == unknownAllele;

	}
}

// Generates a random valid genetic sequence

function randomGeneticSequence() {

	let alleleMasks = [];

	let sequence = 0;

	for (let geneName in Genes) {

		const geneLength = Genes[geneName].sequenceEnd - Genes[geneName].sequenceStart + 1;
		const offset = Genes[geneName].sequenceStart;

		const alleleList = Object.keys(Genes[geneName].alleles);

		const noAlleles = alleleList.length;

		if (noAlleles > 0) {

			let randomPosition = Math.floor(Math.random() * noAlleles);

			let alleleSequence = alleleList[randomPosition];

			let alleleMask = Genes[geneName].alleles[alleleSequence].geneticCode << offset;

			sequence |= alleleMask;
		}
	}

	return new GeneticSequence(sequence);

}

class Genome {

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
		else {
			leftDominance = 'Partially Dominant';
			rightDominance = 'Partially Dominant';
		}

		return {
				left: {allele: leftAllele, dominance: leftDominance}, 
				right: {allele: rightAllele, dominance: rightDominance}
		};
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

const Gene = (start, end, alleleList={}) => {

	return {
		sequenceStart: start,
		sequenceEnd: end,
		alleles: alleleList
	}
}

const leafColourAlleles = {'0': Allele(0, 0.03, 1.0, 'Midnight Blue'), 
							'1': Allele(1, 0.18, 1.0, 'Murky Green'),
							'2': Allele(2, 0.05, 1.0, 'Fuschia'),
							'3': Allele(3, 0.04, 1.0, 'Orange'),
							'4': Allele(4, 0.08, 1.0, 'Blossom'),
							'5': Allele(5, 0.05, 1.0, 'White'),
							'6': Allele(6, 0.05, 1.0, 'Fiery Red'),
							'7': Allele(7, 0.2, 1.0, 'Verdant Green'),
							'8': Allele(8, 0.05, 1.0, 'Aqua Green'),
							'9': Allele(9, 0.05, 1.0, 'Mustard Brown'),
							'10': Allele(10, 0.015, 0.1, 'Silver'),
							'11': Allele(11, 0.01, 0.05, 'Gold'),
							'12': Allele(12, 0.005, 0.04, 'Rose Gold'),
							'13': Allele(13, 0.03, 1.0, 'Grey'),
							'14': Allele(14, 0.1, 1.0, 'Lime Yellow'),
							'15': Allele(15, 0.005, 0.03, 'Trippy')
						};

const leafPatternAlleles = {'0': Allele(0, 0.4, 1.0, 'Lined'),
								'1': Allele(1, 0.05, 0.6, 'Spotted'),
								'2': Allele(2, 0.25, 0.8, 'Cellular'),
								'3': Allele(3, 0.6, 1.0, 'Normal')
						};

const floweringAlleles = {
	'0': Allele(0, 0.75, 0.1, 'Not Flowering'),
	'1': Allele(1, 0.25, 1.0, 'Flowering')
}

function generateLeafShapeAlleles() {

	const leafShapeAlleles = {}

	for (let i = 0; i <= 16; i++) {

		for (let j = 0; j < i; j++) {

			let mainBodyCode = i;
			let auxBodyCode = j << 4;

			let geneticCode = mainBodyCode | auxBodyCode;

			leafShapeAlleles[geneticCode] = Allele(geneticCode, 1.0, 1.0, "");
		}
	}

	return leafShapeAlleles;
}

const unknownAllele = Allele(0, 0.0, 0.0, 'Unknown');

const Genes = {
	'Leaf Colour': Gene(0, 4, leafColourAlleles),
	'Leaf Pattern': Gene(5, 8, leafPatternAlleles),
	'Leaf Shape': Gene(9, 16, generateLeafShapeAlleles()),
	'Flowering': Gene(17, 17, floweringAlleles),
	'Wood Type': Gene(18, 21),
	'Leaf Arrangement': Gene(22, 23),
	'Flower Colour': Gene(24, 27),
	'Flower Pattern': Gene(28, 30),
	'Leaf Droopiness': Gene(31, 31)
}