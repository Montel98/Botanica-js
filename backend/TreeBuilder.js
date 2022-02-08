const sfc32 = require('./sfc32-node.js');
const genome = require('./genome-node.js');

const traitsGen = sfc32.sfc32(1000, 2000, 3000, 4000);

function generateTreeMetadata(seed) {

	const traitsGen = sfc32.sfc32(...seed);

	// Skip first 2 values, required for consistency
	traitsGen();
	traitsGen();

	const sequence = genome.randomGeneticSequence(traitsGen);
	const traits = Object.keys(genome.Genes).map(geneName => {return {gene: geneName, 
															allele: sequence.getAllele(geneName).name}});

	//console.log(traits);

	return traits;
}

module.exports = {
	generateTreeMetadata
}