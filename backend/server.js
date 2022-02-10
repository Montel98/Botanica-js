const express = require('express');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;
const pinataSDK = require('@pinata/sdk');
const Wallet = require('./WalletConnector.js');

const tree = require('./TreeBuilder.js');

const app = express();
const pinata = pinataSDK('e973504b541abcbb8a06', '6b4b48713b6f20863c966bf0c7c47c8b3c4caea78c4a8028e5294d1aa7411f88');

const host = '0.0.0.0';
const port = process.env.PORT || 3000;

console.log(Wallet);

app.use(express.json());
app.use(express.static('dist'));

if (process.env.NODE_ENV === 'production') {

  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https')
      res.redirect(`https://${req.header('host')}${req.url}`)
    else
      next()
  })
}

app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '../dist/index.html'));
});

app.post('/mint/:userAddress', async (req, res) => {

	//const address = Cardano.Address.from_bytes(fromHex(req.params.userAddress));
	//console.log('Address: ', address.to_bech32());

	try {
		//const response = await pinata.testAuthentication();
		//const isConnected = response.authenticated;

		if (req.body) {

			//console.log(await Wallet.getAccessTokenValidator());
			//const transactionSerialized = await Wallet.buildAccessorTransaction(req.params.userAddress, req.body.inputs);
			/*const transactionSerialized = await Wallet.initCounter(req.params.userAddress, 
																	req.body.inputs, 
																	'BOTANICA');

			res.send({transaction: transactionSerialized});*/
			const transactionSerialized = await Wallet.buildAccessorTransaction(
				req.params.userAddress, 
				req.body.inputs, 
				req.body.collateral);

			res.send({transaction: transactionSerialized});

			//isPinned(1);
			//const nftLocalPath = await generateNFT(1);
			//pinNFT(nftLocalPath);
		}
		else {
			res.sendStatus(400);
		}
	}
	catch (e) {
		console.log(e);
		res.sendStatus(500);
	}
});

app.post('/redeem/:userAddress', async (req, res) => {

	console.log(req.params);

	if (req.body) {

		const metadata = tree.generateTreeMetadata([randomInt(1000),randomInt(1000),randomInt(1000),randomInt(1000)]);

		const transactionSerialized = await Wallet.buildMintTransaction(
			req.params.userAddress,
			req.body.selected,
			req.body.inputs,
			req.body.collateral,
			metadata
		);

		res.send({transaction: transactionSerialized});
	}
	else {
		res.sendStatus(400);
	}
});

app.post('/submit/:userAddress', async (req, res) => {

	if (req.body) {

		try {

			const hash = await Wallet.signAndSubmit(req.body.vKeyWitnesses,
													req.body.transaction);

			res.send({txHash: hash});
		}
		catch (e) {
			console.log(e);
		}
	}

	res.sendStatus(400);
});

app.get('/accessorTokens/:userAddress', async (req, res) => {

	const accessorTokens = await Wallet.getAccessorTokensInWallet(req.params.userAddress);

	console.log('tokens: ', accessorTokens);

	res.send({tokens: accessorTokens});
});

app.listen(port, host, () => {
	console.log(`Botanica listening on port http://localhost:${port}`)
});

async function generateNFT(treeNo) {

	const seeds = [randomInt(2**20),randomInt(2**20),randomInt(2**20),randomInt(2**20),[randomInt(2**20),randomInt(2**20),randomInt(2**20),randomInt(2**20)],randomInt(2**20)];

	const seedRegex = [/SPRING_SEED/g, /AUTUMN_SEED/g, /BLOOM_START_SEED/g, /BLOOM_END_SEED/g, /TRAITS_SEED/g, /GROWTH_SEED/g];

	const templateScript = await fsp.readFile(path.join(__dirname, '/NFT_Script/BotanicaTemplate.html'),
									{encoding: 'utf-8'});

	let injectedSeedsScript = templateScript;

	for (let i = 0; i < seeds.length; i++) {

		injectedSeedsScript = injectedSeedsScript.replaceAll(seedRegex[i], seeds[i].toString());
	}

	const relativePath = `/NFT_Script/Botanica#${treeNo.toString()}.html`;

	await fsp.writeFile(path.join(__dirname, relativePath), injectedSeedsScript);

	return relativePath;
}

async function pinNFT(relativePath) {

	const fileStream = await fs.createReadStream(path.join(__dirname, relativePath));

	pinata.pinFileToIPFS(fileStream);
}

/*async function isPinned(treeNo) {

	const pins = await pinata.pinList({status:'pinned', 
											pageLimit: 100,
											{
												keyvalues: {count: {value: treeNo, op: eq}}
											}
										}
									);

	console.log('pins: ', pins.rows.map(pin => pin.metadata));
}*/

function randomInt(intMax) {

	return Math.floor(intMax * Math.random());
}