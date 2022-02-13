import sfc32, { LCG } from './sfc32.js';

// Seeds for generating all tree features

function newSeed(springSeed, autumnSeed, bloomStartSeed, bloomEndSeed, traitsSeed, growthSeed) {

	const traitGen = sfc32(...traitsSeed);

	// Skip 1st 2 values
	traitGen();
	traitGen();
	
	return {
		spring: new LCG(springSeed), // 24 bit LCG seed
		autumn: new LCG(autumnSeed), // 24 bit LCG seed
		bloomStart: new LCG(bloomStartSeed), // 24 bit LCG seed
		bloomEnd: new LCG(bloomEndSeed), // 24 bit LCG seed
		traits: traitGen, // [32, 32, 32, 32] 4x32 bit sfc32 seed
		growth: new LCG(growthSeed), // 24 bit LCG seed
		//pot: traitGen(),
		//hemisphere: traitGen(),
		//background: traitGen()
		// Probably use seperate seed for textures
	}
}

//export default newSeed(768585, 53025, 59402, 239025, [520968835,66333965,19577405,2052699], 1279000);
export default newSeed(76858, 5302, 5940, 23902, [5237463,66386,137943,264645], 1587); //<- use this one

//export default newSeed(76858, 5302, 5940, 23902, [523463,63886,137943,26845], 158487);

//export default newSeed(76858, 5302, 5940, 23902, [732621,68734,19433,26346], 17946);
//export default newSeed(SPRING_SEED, AUTUMN_SEED, BLOOM_START_SEED, BLOOM_END_SEED, [TRAITS_SEED], GROWTH_SEED);

//export default newSeed(76858, 5302, 5940, 23902, [5243,668,1393,2495], 14);

//export default newSeed(76858, 5302, 5940, 23902, [58080243,6680808,1398003,24958080], 180804);

//export default newSeed(76858, 5302, 5940, 23902, [Math.floor(10000*Math.random()),Math.floor(10000*Math.random()),Math.floor(10000*Math.random()),Math.floor(10000*Math.random())], Math.floor(10000*Math.random()));

//export default newSeed(76858, 5302, 5940, 23902, [5237463,66386,137943,264645], 1588); //<- use this one