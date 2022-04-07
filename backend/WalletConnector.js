const Cardano = require('./emurgo_custom/cardano-serialization-lib-nodejs/cardano_serialization_lib');
const CS = require('./coinSelection.js');
const path = require('path');
const axios = require('axios');
const cbor = require('cbor');
const fs = require('fs');
const fsp = fs.promises;

const appAddress = Cardano.Address.from_bech32("addr_test1qqf09ulyfehrzz4u0zqz6urcas0ap73zpl6845daksee0c4m4p6pfg4xyr00cse3fzjldkae8szrhcsvymqk4ylg70ksrh65vs");
const counterAddress = Cardano.Address.from_bech32("addr_test1wr7mjngtp6ph26jhrgquz8nx68sj4yvmks6aka08wj369dsmp44a0");
const burnAddress = Cardano.Address.from_bech32("addr_test1wr7mjngtp6ph26jhrgquz8nx68sj4yvmks6aka08wj369dsmp44a0");
const counterSymbol = "64a90406aee721e69324cdf8750b0bbc901ee3795566330946ae07bd";
const accessorSymbol = "125c0aa0d0990f3e03353da5e767549b40471725b2e383f5a7491da9"
const NFTSymbol = "12f7d58909d223cde4f706dc5344962f20c050d976362cd7ee1a015c";

const baseURI = "https://cardano-testnet.blockfrost.io/api/v0";
const key = "";

const ASSET_SYMBOL_LENGTH = 56;

const protocolParameters = {
	linearFee: {
		minFeeA: "44",
		minFeeB: "155381",
	},
	minUtxo: "1000000",
	poolDeposit: "500000000",
	keyDeposit: "2000000",
	maxValSize: "5000",
	maxTxSize: 16384,
	priceMem: 5.77e-2,
	priceStep: 7.21e-5,
};

CS.CoinSelection.setProtocolParameters(
	protocolParameters.minUtxo,
	protocolParameters.linearFee.minFeeA,
	protocolParameters.linearFee.minFeeB,
	protocolParameters.maxTxSize.toString()
	);

console.log(CS);

class Minter {

	constructor(protocolParameters) {

		const languageViews = "a141005901d59f1a000302590001011a00060bc719026d00011a000249f01903e800011a000249f018201a0025cea81971f70419744d186419744d186419744d186419744d186419744d186419744d18641864186419744d18641a000249f018201a000249f018201a000249f018201a000249f01903e800011a000249f018201a000249f01903e800081a000242201a00067e2318760001011a000249f01903e800081a000249f01a0001b79818f7011a000249f0192710011a0002155e19052e011903e81a000249f01903e8011a000249f018201a000249f018201a000249f0182001011a000249f0011a000249f0041a000194af18f8011a000194af18f8011a0002377c190556011a0002bdea1901f1011a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a000242201a00067e23187600010119f04c192bd200011a000249f018201a000242201a00067e2318760001011a000242201a00067e2318760001011a0025cea81971f704001a000141bb041a000249f019138800011a000249f018201a000302590001011a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a000249f018201a00330da70101ff";

		this.plutusData = Cardano.PlutusList.new();
		this.redeemers = Cardano.Redeemers.new();
		this.outputs = Cardano.TransactionOutputs.new();
		this.inputs = Cardano.TransactionInputs.new();
		this.witnessSet = Cardano.TransactionWitnessSet.new();
		this.scripts = Cardano.PlutusScripts.new();
		this.auxData = Cardano.AuxiliaryData.new();

		this.builder = Cardano.TransactionBuilder.new(
			Cardano.LinearFee.new(
				Cardano.BigNum.from_str(protocolParameters.linearFee.minFeeA), 
				Cardano.BigNum.from_str(protocolParameters.linearFee.minFeeB),
				),
			Cardano.BigNum.from_str(protocolParameters.minUtxo),
			Cardano.BigNum.from_str(protocolParameters.poolDeposit),
			Cardano.BigNum.from_str(protocolParameters.keyDeposit),
			protocolParameters.maxValSize,
			protocolParameters.maxTxSize,
			protocolParameters.priceMem,
			protocolParameters.priceStep,
			Cardano.LanguageViews.new(Buffer.from(languageViews, "hex"))
			);
	}

	addInput(utxo) {

		this.builder.add_input(
			utxo.output().address(),
			utxo.input(),
			utxo.output().amount()
			);
	}

	addOutput(output) {
		this.outputs.add(output);
		this.builder.add_output(output);
	}

	addRedeemer(redeemer) {
		this.redeemers.add(redeemer);
	}

	addDatum(datum) {
		this.plutusData.add(datum);
	}

	setFee(fee) {
		this.builder.set_fee(Cardano.BigNum.from_str(fee.toString()));
	}

	addScript(script) {
		this.scripts.add(script);
	}

	/*addRequiredSigner(address) {
		const requiredSigners = 
	}*/

	setCollateral(utxos) {


		const ins = Cardano.TransactionInputs.new();

		for (let i = 0; i < utxos.length; i++) {
			ins.add(utxos[i].input());
		}

		/*utxos.forEach((utxo) =>{
			ins.add(utxo.input());
		});*/

		this.builder.set_collateral(ins);
	}

	buildWitnessSet() {
		//this.witnessSet.set_plutus_scripts(this.scripts);
		//this.witnessSet.set_redeemers(this.redeemers);
	}

	finalize() {

		if (this.redeemers.len() > 0) {
			console.log('yess redeemer');
			this.builder.set_redeemers(Cardano.Redeemers.from_bytes(this.redeemers.to_bytes()));
			this.witnessSet.set_redeemers(this.redeemers);
		}

		if (this.plutusData.len() > 0) {
			console.log('yess data');
			this.builder.set_plutus_data(Cardano.PlutusList.from_bytes(this.plutusData.to_bytes()));
			this.witnessSet.set_plutus_data(this.plutusData);
		}

		console.log('witnessSet:::', toHex(this.witnessSet.to_bytes()));

		if (this.scripts.len() > 0) {
			console.log(this.scripts.len());
			this.builder.set_plutus_scripts(this.scripts);
			this.witnessSet.set_plutus_scripts(this.scripts);
		}

		const requiredSigners = Cardano.Ed25519KeyHashes.new();
    	requiredSigners.add(Cardano.Ed25519KeyHash.from_bytes(fromHex("12f2f3e44e6e310abc78802d7078ec1fd0fa220ff47ad1bdb43397e2")));
    	this.builder.set_required_signers(requiredSigners);

		return this.builder.build();
	}
}

function newUTxO(hash, index, address, value) {

	const hashIndex = Cardano.TransactionInput.new(
		Cardano.TransactionHash.from_bytes(fromHex(hash)),
		index
		);
	const addressValue = Cardano.TransactionOutput.new(address, value);

	return Cardano.TransactionUnspentOutput.new(hashIndex, addressValue);
}

function newOutput(address, value, datum=null) {

	const output = Cardano.TransactionOutput.new(address, value);

	if (datum) {
		output.set_data_hash(Cardano.hash_plutus_data(datum));
	}

	return output;
}

function valueWithAsset(symbol, name, quantity) {

	const assets = Cardano.Assets.new();
	assets.insert(
		Cardano.AssetName.new(fromHex(name)), // Name
		Cardano.BigNum.from_str(quantity.toString()) // Quantity
		);

	const multiAsset = Cardano.MultiAsset.new();
	multiAsset.insert(
		Cardano.ScriptHash.from_bytes(fromHex(symbol)),
		assets
		);

	let value = Cardano.Value.new(
		Cardano.BigNum.from_str("0")
		);

	value.set_multiasset(multiAsset);

	return value;
}

function mintValueWithAsset(symbol, name, quantity) {

	const mint = Cardano.Mint.new();
	const mintAssets = Cardano.MintAssets.new();
	mintAssets.insert(
		Cardano.AssetName.new(fromHex(name)), // Name
		Cardano.Int.new(Cardano.BigNum.from_str(quantity.toString())) // Quantity
		);

	mint.insert(
		Cardano.ScriptHash.from_bytes(fromHex(symbol)),
		mintAssets
		);

	return mint;
}

async function getContract(fileName) {
	const contractHexJSON = await fsp.readFile(path.join(__dirname, `/plutus_scripts/${fileName}.plutus`), {encoding: 'utf8'});
	const contractHexCBOR = JSON.parse(contractHexJSON).cborHex;
	return Cardano.PlutusScript.new(fromHex(contractHexCBOR).slice(3));
}

async function getAccessTokenValidator() {
	const contract = await getContract('accessor_validator');
	return contract;
}

async function getAccessTokenPolicy() {
	const contract = await getContract('accessor_policy');
	return contract;
}

async function getNFTPolicy() {
	const contract = await getContract('nft_policy');
	return contract;
}

async function getAppKey() {

	const signingKeyJSON = await fsp.readFile(path.join(__dirname, `/keys/payment.skey`), {encoding: 'utf-8'});
	const signingKeyHexCBOR = JSON.parse(signingKeyJSON).cborHex;
	const signingKey = Cardano.PrivateKey.from_normal_bytes(cbor.decodeFirstSync(signingKeyHexCBOR));
	//const signingKey = Cardano.PrivateKey.from_normal_bytes(fromHex(signingKeyHexCBOR).slice(2));
	return signingKey;
}

function fromHex(hex) {
	return Buffer.from(hex, "hex");
}

function toHex(bytes) {
	return Buffer.from(bytes).toString("hex");
}

function dummySpendRedeemer(index) {

	const redeemerData = Cardano.PlutusData.new_constr_plutus_data(
		Cardano.ConstrPlutusData.new(
			Cardano.Int.new_i32(0),
			Cardano.PlutusList.new()
			)
		);

	const redeemer = Cardano.Redeemer.new(
		Cardano.RedeemerTag.new_spend(),
		Cardano.BigNum.from_str(index.toString()),
		redeemerData,
		Cardano.ExUnits.new(
			Cardano.BigNum.from_str("3000000"),
			Cardano.BigNum.from_str("1050000000")
			)
		);

	return redeemer;
}

function dummyMintRedeemer(index) {

	const redeemerData = Cardano.PlutusData.new_constr_plutus_data(
		Cardano.ConstrPlutusData.new(
			Cardano.Int.new_i32(0),
			Cardano.PlutusList.new()
			)
		);

	const redeemer = Cardano.Redeemer.new(
		Cardano.RedeemerTag.new_mint(),
		Cardano.BigNum.from_str(index.toString()),
		redeemerData,
		Cardano.ExUnits.new(
			Cardano.BigNum.from_str("3000000"),
			Cardano.BigNum.from_str("1000000000")
			)
		);

	return redeemer;
}

function NFTMintRedeemer(datum) {

	const redeemerData = Cardano.PlutusData.new_integer(
			Cardano.BigInt.from_str(datum.toString())
	);

	const redeemer = Cardano.Redeemer.new(
		Cardano.RedeemerTag.new_mint(),
		Cardano.BigNum.from_str("0"),
		redeemerData,
		Cardano.ExUnits.new(
			Cardano.BigNum.from_str("2800000"),
			Cardano.BigNum.from_str("980000000")
			)
		);

	return redeemer;
}

async function getAccessorTokensInWallet(walletAddressHex) {

	const walletAddress = Cardano.Address.from_bytes(fromHex(walletAddressHex));
	const walletAddressBech32 = walletAddress.to_bech32();

	const accessorUTXOs = await selectUTxOsWithPolicy(walletAddressBech32, accessorSymbol);

	const utxoJSON = {};

	for (let i = 0; i < accessorUTXOs.length; i++) {

		const utxo = accessorUTXOs[i];

		for (let i = 0; i < utxo.amount.length; i++) {

			const unit = utxo.amount[i].unit;

			console.log(getSymbolFromSerializedAsset(unit), accessorSymbol);

			if (getSymbolFromSerializedAsset(unit) === accessorSymbol) {

				const name = fromHex(getNameFromSerializedAsset(unit)).toString();
				utxoJSON[name] = utxo;
			}
		}
	}

	console.log('names: ', utxoJSON);

	return utxoJSON;
}

async function buildAccessorTransaction(walletAddressHex, walletUTxOs, collateral) {

	const walletAddress = Cardano.Address.from_bytes(fromHex(walletAddressHex));
	const walletAddressBech32 = walletAddress.to_bech32();

	const serializedWalletUTxOs = walletUTxOs.map(utxo => Cardano.TransactionUnspentOutput.from_bytes(fromHex(utxo)));
	const serializedCollateral = collateral.map(utxo => Cardano.TransactionUnspentOutput.from_bytes(fromHex(utxo)));

	const counterAddressBech32 = counterAddress.to_bech32();

	const scriptUTxOs = await selectUTxOsWithPolicy(counterAddressBech32, counterSymbol);

	// Uniform random, change later
	const counterToSpend = scriptUTxOs[Math.floor(Math.random() * scriptUTxOs.length)];
	const counterToSpendSerialized = serializeUTxO(walletAddressBech32, counterToSpend);
	const counterNameHex = getNameFromSerializedAsset(counterToSpend.amount[1].unit);

	const countHash = counterToSpend.data_hash;
	const currentCount = valueFromHash[countHash];
	const countHex = toHex(Buffer.from((currentCount + 1).toString(), 'utf-8'));

	const minter = new Minter(protocolParameters);

	const counterOutput = newOutput(counterAddress, 
						valueWithAsset(counterSymbol, counterNameHex, 1).checked_add(Cardano.Value.new(Cardano.BigNum.from_str("2000000"))), 
						counterDatum(currentCount + 1)
	);

	const valueToPay = Cardano.Value.new(
		Cardano.BigNum.from_str("40000000")
	);

	const paymentOutput = newOutput(appAddress, valueToPay);

	minter.addOutput(counterOutput);
	minter.addOutput(paymentOutput);

	let { input, change } = CS.CoinSelection.randomImprove(serializedWalletUTxOs, 
		 													minter.outputs, 
		 													4, 
		 													[counterToSpendSerialized/*, testInput*/]);

	for (let i = 0; i < input.length; i++) {

		minter.addInput(input[i]);
	}

	const mintedAsset = valueWithAsset(accessorSymbol, counterNameHex + countHex, 1);
	const changeWithMint = change.checked_add(mintedAsset);

	const fee = 1100000;
	minter.setFee(fee);

	const feeValue = Cardano.Value.new(Cardano.BigNum.from_str(fee.toString()));
	const changeValueWithFee = changeWithMint.checked_sub(feeValue);

	const changeOutput = newOutput(walletAddress, changeValueWithFee);
	minter.addOutput(changeOutput);

	minter.setCollateral(serializedCollateral);

	minter.addDatum(counterDatum(currentCount));
	minter.addDatum(counterDatum(currentCount + 1));

	const redeemerIndex = minter.builder.index_of_input(counterToSpendSerialized.input()).toString();

	minter.addRedeemer(dummySpendRedeemer(redeemerIndex));
	minter.addRedeemer(dummyMintRedeemer(0));

	const validator = await getAccessTokenValidator();
	const policy = await getAccessTokenPolicy();

	minter.addScript(validator);
	minter.addScript(policy);

	const txBody = minter.finalize();

    /*const auxData = generateMetadataERC721(NFTSymbol, "Botanica #Z79A");

	const auxDataHash = Cardano.hash_auxiliary_data(auxData);
	txBody.set_auxiliary_data_hash(auxDataHash);*/

	const mintAsset = mintValueWithAsset(accessorSymbol, counterNameHex + countHex, 1);
	txBody.set_mint(mintAsset);

	const txHash = Cardano.hash_transaction(txBody);
	const appKey = await getAppKey();

	const vKeyWitnesses = Cardano.Vkeywitnesses.new();
	const vKeyWitness = Cardano.make_vkey_witness(txHash, appKey);
	vKeyWitnesses.add(vKeyWitness);
	minter.witnessSet.set_vkeys(vKeyWitnesses);

	const tx = Cardano.Transaction.new(
		txBody,
		Cardano.TransactionWitnessSet.from_bytes(
			minter.witnessSet.to_bytes(),
		),
		//auxData
	);

	const serializedTransaction = toHex(Buffer.from(tx.to_bytes().buffer));

	return serializedTransaction;
}

async function buildMintTransaction(walletAddressHex, 
									selectedAccessToken, 
									walletUTxOs, 
									collateral, 
									traitsMetadata) {

	const walletAddress = Cardano.Address.from_bytes(fromHex(walletAddressHex));
	const walletAddressBech32 = walletAddress.to_bech32();

	const accessorUTXO = selectedAccessToken.utxo;
	const accessorNameHex = toHex(Buffer.from(selectedAccessToken.name));

	const nftNameSuffixHex = toHex(Buffer.from("A"));
	const nftName = accessorNameHex + nftNameSuffixHex;

	const serializedWalletUTxOs = walletUTxOs.map(utxo => Cardano.TransactionUnspentOutput.from_bytes(fromHex(utxo)));
	const serializedCollateral = collateral.map(utxo => Cardano.TransactionUnspentOutput.from_bytes(fromHex(utxo)));

	const candidateUTxOs = removeUTxOsById(serializedWalletUTxOs, accessorUTXO.tx_hash, accessorUTXO.tx_index);

	const minter = new Minter(protocolParameters);

	const burnOutput = newOutput(burnAddress,
							valueWithAsset(accessorSymbol, accessorNameHex, 1).checked_add(Cardano.Value.new(Cardano.BigNum.from_str("1900000"))),
							counterDatum(0)
	);

	minter.addOutput(burnOutput);

	let { input, change } = CS.CoinSelection.randomImprove(candidateUTxOs, 
		 													minter.outputs, 
		 													4, 
		 													[serializeUTxO(walletAddressBech32, accessorUTXO)]);

	for (let i = 0; i < input.length; i++) {

		minter.addInput(input[i]);
	}

	const mintedAsset = valueWithAsset(NFTSymbol, nftName, 1);
	const changeWithMint = change.checked_add(mintedAsset);

	const fee = 700000;
	minter.setFee(fee);

	const feeValue = Cardano.Value.new(Cardano.BigNum.from_str(fee.toString()));
	const changeValueWithFee = changeWithMint.checked_sub(feeValue);

	const changeOutput = newOutput(walletAddress, changeValueWithFee);
	minter.addOutput(changeOutput);

	minter.setCollateral(serializedCollateral);
	minter.addRedeemer(NFTMintRedeemer(0));

	const policy = await getNFTPolicy();

	minter.addScript(policy);

	const txBody = minter.finalize();

	const mintAsset = mintValueWithAsset(NFTSymbol, nftName, 1);
	txBody.set_mint(mintAsset);

	const txHash = Cardano.hash_transaction(txBody);
	const appKey = await getAppKey();

	const vKeyWitnesses = Cardano.Vkeywitnesses.new();
	const vKeyWitness = Cardano.make_vkey_witness(txHash, appKey);
	vKeyWitnesses.add(vKeyWitness);
	minter.witnessSet.set_vkeys(vKeyWitnesses);

    const auxData = generateMetadataERC721(NFTSymbol, "Botanica #Z79A", traitsMetadata);

	const auxDataHash = Cardano.hash_auxiliary_data(auxData);
	txBody.set_auxiliary_data_hash(auxDataHash);

	const tx = Cardano.Transaction.new(
		txBody,
		Cardano.TransactionWitnessSet.from_bytes(
			minter.witnessSet.to_bytes()
		),
		auxData
	);

	const serializedTransaction = toHex(Buffer.from(tx.to_bytes().buffer));

	return serializedTransaction;
}

async function initCounter(walletAddressHex, walletUTxOs, counterName) {

	const walletAddress = Cardano.Address.from_bytes(fromHex(walletAddressHex));
	const walletAddressBech32 = walletAddress.to_bech32();

	const serializedWalletUTxOs = walletUTxOs.map(utxo => Cardano.TransactionUnspentOutput.from_bytes(fromHex(utxo)));

	const counterAddressBech32 = counterAddress.to_bech32();

	const counterNameHex = toHex(Buffer.from(counterName, 'utf-8'));

	const counterUTxOs = await selectUTxOsWithAsset(walletAddressBech32, counterSymbol + counterNameHex);
	const counterUTxO = counterUTxOs[0];

	console.log('COUNTER: ', counterUTxO, counterUTxO.tx_hash, counterUTxO.output_index);
	const candidateUTxOs = removeUTxOsById(serializedWalletUTxOs, counterUTxO.tx_hash, counterUTxO.tx_index);

	const minter = new Minter(protocolParameters);

	const counterOutput = newOutput(counterAddress, 
						valueWithAsset(counterSymbol, counterNameHex, 1).checked_add(Cardano.Value.new(Cardano.BigNum.from_str("1900000"))), 
						counterDatum(0)
	);

	minter.addOutput(counterOutput);

	console.log('candidates: ', candidateUTxOs);
	console.log('full set: ', serializedWalletUTxOs);

	let { input, change } = CS.CoinSelection.randomImprove(candidateUTxOs, 
		 													minter.outputs, 
		 													4, 
		 													[serializeUTxO(counterAddressBech32, counterUTxO)]);

	console.log(input, change);

	for (let i = 0; i < input.length; i++) {

		minter.addInput(input[i]);
	}

	const fee = 200000;
	minter.setFee(fee);

	const feeValue = Cardano.Value.new(Cardano.BigNum.from_str(fee.toString()));
	const changeValueWithFee = change.checked_sub(feeValue);

	const changeOutput = newOutput(walletAddress, changeValueWithFee);
	minter.addOutput(changeOutput);

	const txBody = minter.finalize();

	const txHash = Cardano.hash_transaction(txBody);
	const appKey = await getAppKey();

	const vKeyWitnesses = Cardano.Vkeywitnesses.new();
	const vKeyWitness = Cardano.make_vkey_witness(txHash, appKey);
	vKeyWitnesses.add(vKeyWitness);
	minter.witnessSet.set_vkeys(vKeyWitnesses);

	const tx = Cardano.Transaction.new(
		txBody,
		Cardano.TransactionWitnessSet.from_bytes(
			minter.witnessSet.to_bytes()
		)
		);

	const serializedTranscation = toHex(Buffer.from(tx.to_bytes().buffer));

	return serializedTranscation;
}

async function signAndSubmit(vKeyWitnesses, transaction) {

	const signedTx = Cardano.Transaction.from_bytes(fromHex(transaction));

	const walletVKeyWitness = Cardano.TransactionWitnessSet.from_bytes(
		fromHex(vKeyWitnesses)
	).vkeys().get(0);

	const newVKeyWitnesses = Cardano.Vkeywitnesses.new();
	newVKeyWitnesses.add(walletVKeyWitness);

	if (signedTx.witness_set().vkeys()) {
		const appVKeyWitness = signedTx.witness_set().vkeys().get(0);
		newVKeyWitnesses.add(appVKeyWitness);
	}

	const newWitnessSet = Cardano.TransactionWitnessSet.from_bytes(fromHex(signedTx.witness_set().to_bytes()));
	newWitnessSet.set_vkeys(newVKeyWitnesses);

	const finalTx = Cardano.Transaction.new(
		signedTx.body(),
		newWitnessSet,
		signedTx.auxiliary_data()
	);

	const txHash = await submitTransaction(finalTx.to_bytes());

	return txHash;
}

function serializeUTxO(address, utxo) {

		const loveLaceQuantity = utxo.amount[0].quantity;

		const serializedAddress = Cardano.Address.from_bech32(address);

		const value = Cardano.Value.new(Cardano.BigNum.from_str(loveLaceQuantity));

		const multiAssets = Cardano.MultiAsset.new();

		const assetSymbols = {};

		for (let i = 1; i < utxo.amount.length; i++) {

			const value = utxo.amount[i];
			const assetSymbol = value.unit.slice(0, ASSET_SYMBOL_LENGTH);
			const assetName = value.unit.slice(ASSET_SYMBOL_LENGTH);

			if (!assetSymbols[assetSymbol]) {

				const assets = Cardano.Assets.new();

				assets.insert(
					Cardano.AssetName.new(fromHex(assetName)),
					Cardano.BigNum.from_str(value.quantity)
					);

				assetSymbols[assetSymbol] = assets;
			}
			else {
				assetSymbols[assetSymbol].insert(
					Cardano.AssetName.new(fromHex(assetName)),
					Cardano.BigNum.from_str(value.quantity))
			}
		}

		for (let symbol in assetSymbols) {
			multiAssets.insert(Cardano.ScriptHash.from_bytes(fromHex(symbol)),
				assetSymbols[symbol]);
		}

		value.set_multiasset(multiAssets);

		return newUTxO(utxo.tx_hash, 
			utxo.output_index, 
			serializedAddress, 
			value);
	}

function removeUTxOsById(utxos, hash, index) {

	const utxosFiltered = utxos.filter(utxo => {

		const input = utxo.input();
		return toHex(input.transaction_id().to_bytes()) != hash || input.index() != index;
	});

	return utxosFiltered;
}

async function selectUTxOs(address, asset) {

	return await blockfrostRequest(`/addresses/${address}/utxos/${asset}`);
}

async function selectUTxOsWithPolicy(address, policy) {

	const addressUTxOs = await selectUTxOs(address, "");
	const addressUTxOsWithPolicy = addressUTxOs.filter(utxo => {

		for (let i = 0; i < utxo.amount.length; i++) {
			
			if (utxo.amount[i].unit.slice(0, ASSET_SYMBOL_LENGTH) === policy) {
				return true;
			}
		}

		return false;

	});

	return addressUTxOsWithPolicy;
}

async function selectUTxOsWithAsset(address, asset) {

	const addressUTxOs = await selectUTxOs(address, asset);

	return addressUTxOs;
}

async function blockfrostRequest(endpoint) {
	const response = await axios.get(baseURI + endpoint, {
		headers: {
			project_id: key,
		},
		method : 'GET',
	});

	return response.data;
}

function getNameFromSerializedAsset(serializedAsset) {
	return serializedAsset.slice(ASSET_SYMBOL_LENGTH);
}

function getSymbolFromSerializedAsset(serializedAsset) {
	return serializedAsset.slice(0, ASSET_SYMBOL_LENGTH);
}

function counterDatum(counterValue) {

	const datum = Cardano.PlutusData.new_integer(
			Cardano.BigInt.from_str(counterValue.toString())
	);

	return datum;
}

async function submitTransaction(transactionCBORHex) {

	const response = await axios.post(baseURI + '/tx/submit', transactionCBORHex, {
    headers: {
    	'project_id': key,
    	'Content-Type': 'application/cbor'
    },
		//method: 'POST',
		//body: transactionCBORHex
	});

	return response;
}

function generateMetadataERC721(policyName, NFTName, traits) {

	//console.log('TREE:', tree.generateTreeMetadata([100,200,300,400]));

	const metaTemplate = {};

	metaTemplate[NFTSymbol] = {};
	metaTemplate[NFTSymbol][policyName] = {
		"name": NFTName,
		/*"Leaf": "Blossom 04",
		"Flower": "Sunset 34",
		"Wood Type": "Birch",
		"Flowering": "September-October",
		"Background": "Charcoal",
		"Hemisphere": "Northern",
		"Pot": "Hexagonal White",
		"Seeds": "4f49460325ig7",*/
		"files": [
			{
			"mediaType": "text/html",
			"name": NFTName,
			"src": "ipfs://QmcoiVPbwHzdBDHNLc9fxjZ6nTuyTcWsHATeayxre7CvWV"
			}
		]
	}

	for (let traitIndex = 0; traitIndex < traits.length; traitIndex++) {

		const trait = traits[traitIndex];
		metaTemplate[NFTSymbol][policyName][trait.gene] = trait.allele;
	}

	console.log(metaTemplate);

	const metadata = Cardano.encode_json_str_to_metadatum(JSON.stringify(metaTemplate),
														Cardano.MetadataJsonSchema.NoConversions);

    const generalMetadata = Cardano.GeneralTransactionMetadata.new();
    generalMetadata.insert(Cardano.BigNum.from_str("721"), metadata);

    const auxData = Cardano.AuxiliaryData.new();
    auxData.set_metadata(generalMetadata);

	return auxData;
}

const valueFromHash = {
'ccb127aef877cfc0abeb3633875fec21dfd357a2319808a634e9c7cd1164b4a2': 0,
'ee155ace9c40292074cb6aff8c9ccdd273c81648ff1149ef36bcea6ebb8a3e25': 1,
'bb30a42c1e62f0afda5f0a4e8a562f7a13a24cea00ee81917b86b89e801314aa': 2,
'e88bd757ad5b9bedf372d8d3f0cf6c962a469db61a265f6418e1ffed86da29ec': 3,
'642206314f534b29ad297d82440a5f9f210e30ca5ced805a587ca402de927342': 4,
'fb3d635c7cb573d1b9e9bff4a64ab4f25190d29b6fd8db94c605a218a23fa9ad': 5,
'bfa726c3c149165b108e6ff550cb1a1c4f0fdc2e9f26a9a16f48babe73b600ce': 6,
'873e4fe9e41e924911bba3ec53ff4782efc8c0f244fb75c879f8a4328d0142ca': 7,
'fadd2180bd6b1cfa73a67e7892d878521ef69918995040fb8661647d321e0c55': 8,
'f5c890541793f37bfeefc6edfa38412de005f5ac94f0f1ebfb8b55df20e6f654': 9,
'5b4b01a4a3892ea3751793da57f072ae08eec694ddcda872239fc8239e4bcd1b': 10,
'44e9e1dfd31e4c8c8e05d6db76912790ae9b2f989463f59f709cdd3df7393675': 11,
'5e9d8bac576e8604e7c3526025bc146f5fa178173e3a5592d122687bd785b520': 12,
'cc82403cd25004abbbb6ecb2bed657fc13603728151c3ce5bc687f2c160028ce': 13,
'96b5f154b0afc62c6a91d756ee31dfc219d76c08ebd30341c198e7b22533745e': 14,
'3d71295ebcefbc033087a32f197135794ad72b0c660fc4d48ab441a1cd98c853': 15,
'6e30ba9e2f411e40b031121ddef5821b1cf6627fa618fd3a45936d567b7b0683': 16,
'4c54f47d69e097eed691c686ac18444a10d4abe934c311d0fffba9a3928f9e71': 17,
'b4dd4eedb83933b6e013971585befe56e26e4f0a875aea0938f406563e53eadb': 18,
'a318ee67737d7d19b425d9500db52ae0e6b8e6b0d87b421995221a18fa02eec7': 19,
'5387d49e52ccb13f1704c321eb6e82be63cf494a3f981daa3aab0b2bbf29467f': 20,
'8c272b95141731e2069ed10ad288146965eb76f0a566885323195f4cd7d58f3b': 21,
'd9c38f56d9147ba5ce4a0b52456ef4594c46992b74051e462ab8275845345e98': 22,
'dfff88be5df71a1e88b76d0f5a2449edb77d855b19b3824915bcdf9fc1311823': 23,
'df5078aee07dd171a343fb99d5fc1b5462fb3c94d82bf72dc1b77d9c0aceec29': 24,
'c7a203a908f989d693da05c2d1812b78e6b71521fb01146ebbf596b69b1a84c0': 25,
'6487fa2e6f0e85ef6e887931381057146060bfd2ed7324f7829c369c3628dc16': 26,
'6853c14f4aadce73a3146bf2f7ce551b45b15a10d34526d3c62ee93848f52d64': 27,
'fa0b470cbbd61c551e1624e71dce9ca48095d06dfa6d53b040d99dd288dc1962': 28,
'f3af13541ce4b643d22ba9671733a31fed7e453d5b427082d1ea771e0f7d58ae': 29,
'32e93baec5fceec344438f8a01e295503a3e0669cefe44ed9af8d8f3e5de1347': 30,
'e541533e3033cf2e107b3b44f77ca256e495feb0b002b8704805d555a7c4e9ad': 31,
'23cde9c3cd279c298566fca6c2eefc2b9133677006d248f897ee72e948e6b969': 32,
'613baf6bfa3607ffc2d721491eb3e406d46d2168c2268388b31ef6acaace1c41': 33,
'6d683f9bd0c3b874cdf3da1793b5eb0ea73a074d3e4b66bc62279b09d387fa8d': 34,
'0987ed19688a6a620b72b48f9b1512a79fb81a06bd83f3e5459ecc41abe85d2c': 35,
'1ef277edc0d1901a408f07425f1319d6b7e430467c02948561ddb5833754e18b': 36,
'6ddd43aec05f8c6cbd10e2641a32a0f399ed24db275d73a617b1f18eb807812b': 37,
'547671ede72a8c68d6f7cf5b79abfa679c8285c75b60d6c55c7d13f4597d50c7': 38,
'61c8bdd0dd3ee3664fa995f75b7969669d7e2119bf96bdaa90f01326195e0fa2': 39,
'dc14f5a0b9060142de26f0e87bdca2a28fa28125e231e7dc664223cdecee9a2d': 40,
'be1652ac5ec4378abc1f1b3de0e86088770e4541a16f9b3504bffeb9a434ef1a': 41,
'9e1199a988ba72ffd6e9c269cadb3b53b5f360ff99f112d9b2ee30c4d74ad88b': 42,
'45262f40ee42b0f71855608c466ff80dec3728859a2de93ef71e56d9105510a6': 43,
'8e491db6ce288218af2d8b110f12b8f7e0bd207e8a9e46d9f9b0df42ad2640e6': 44,
'5a54e86cfac1499570df3d8f3ac42a2f0ec0affa5e7342a0e17611fbb54839c8': 45,
'4eafddc95371afe4bc6caf5c4eeace9ce37caffb8841464bea363fc690c1381e': 46,
'4a6f526ec045769d10611190d36d09f95b2160f8662bf530353feb92c328ca19': 47,
'2d6694f09a3024a77735a5bb6c128c019605de7c60f8c13e8e46c9170a4a7132': 48,
'b988a36a55118d32f2c064a64d4a7748a51e7fd0e94924a07bcf6ecc2092765c': 49,
'3193ec10292b1624537acacfc7ba4912f85b3a0e10b7cd7b51ac4572a75f9d23': 50,
'03d7aff822e280df96dc8e9e5128c49796c50c3e43519ec1c1d4a6261cd331d2': 51,
'80b24e56874a36c1451573d88babb509c5d9d214bd10ae726a3c3e0eb17d0415': 52,
'35a6113c4bc7a35f64a0dbbe54a6af4cc194396567331c5d34c40659b3cdf451': 53,
'c4dd5c17fe58746ff7691ae3bc60aa8cc4f0cb8d4cca673e5a1952a7ddf54c73': 54,
'cc0a1213532b9aa92f3199c42f39cbe763c3cae828b68305c59d443fec4f3345': 55,
'e15357f7132b3b31ab905d665d5898bb0a94cab43461bce5ddc81f4b32d7ef52': 56,
'b0d785e1da17b6aafe3e667958afef41a3b6a326fd9aa61e957e0c66dc0bf6f1': 57,
'3db80b48ede216ea3eaf739a6351acc4b4956ac78e3e16f6a13939d2543f3745': 58,
'0ae6102a6dcc5774ec86d49a4a836b5adfb12a672a06584937f2c8dce2d71ffd': 59,
'2a57779a5d0d7cc899f66aa7b9a9273606d9a79758e36f9ae09f2fa3cfc09318': 60,
'b34363f4964c0468c992f79e9e8c1129e6c7838e142f2dd8c194dcdf315db647': 61,
'86a0a0b9e51ad6bfcc58fa9113aee969935b91c5ee867c3708703a2fd7c48881': 62,
'e953784b15abffe01567cb0f31d852f08f0034e950506028fc863bed027f9ce5': 63,
'596d0b5733a0b799bdcdcbf0d2db2eda193dbe73e299913cc082e80088940b36': 64,
'5ba83dbaa744815117a259c8463a61bc01af7275f200a283a89ca06b68015641': 65,
'315d36a09125b34e65c0559f3bb28bdb6add07bd8b2d7d5bafafe26a2010d882': 66,
'adcd844438f8dba152aa61e1dd7753a0c1b5267eb63fa61b7235897b64e0bcd8': 67,
'166551ec92c5560d57e9bc4292d9f4ae56f86891afb844b6f42394e0e97c5559': 68,
'5fe6e61ba5d316860d35271940bb2602eb1643bdc3b70cb5b64c6aba0c141d79': 69,
'fef4c4bc69d27254f899472d31f317904b9996fedde1881c9725aa20f7ed6c46': 70,
'3ae7487e6456347a365840c66a92a46d124c732e9c3611e460146ae003021ba8': 71,
'd92f2c5915a217a596d15c6291fad337be4b64568b23fe242605481afc51a981': 72,
'ff2e482ccd7a391b9694c8a39fb0a1219a566e4a15c437ee28d149c451e45188': 73,
'9e8ce979f2c4b71db5d180741f44d61654a4423bcacfae7449975e365f7ea469': 74,
'a909d767a88ec4de8415c25a012ece5845397bdb3e848f7053ac317e077dd31b': 75,
'066e30e62671a050eb406602745326c09bd160ad09bcc98fd5115a7cfa59fc60': 76,
'72f663d57fe98c95a14c57537e548bc5ac0f0af1faa8e949031bc9378d63b514': 77,
'a97d37da0b88aa83b0c86ccd17494b4abf89fffb816be2bddbdde763c2703070': 78,
'20620c202a35f2c6adf6e067585348e8ea72c31aa607287a186ca40457a3fb5a': 79,
'7c362dd78079a8899179fa5109ae7433162e05ff94954e263dec1843a4cfe567': 80,
'73e059acd56bbbb32b10f1254796cd92cb6fc960ee3edbc159ec6acc462e8d58': 81,
'43402fb0ef8f6e8d61506e73e33c3dfde4a0ec60bb8766cfcbc436139afd1810': 82,
'42e0d0bb51849f0d15eb8a550f09338939df118c3ac88c0619eb3147d6a15996': 83,
'351c6600a45caae1d92f7cb456f3b3f091258ae626df74862b6035438ffbd6a6': 84,
'02380c79b2d62bd8410360bc7f1cb10de051950f38ff349bef9b71baa49f1e7c': 85,
'be5413a963059509b1f0593ba2f1498e631545dff570bdc73728fab8eab9bb2d': 86,
'518226ac83c95fd9cb14491154a2539f34ba5e1efa8001146f1b840e6f7c7454': 87,
'48e4982de3cc059cb80f1bbb4048936a2f9476a5825f5f5e2033e0bd75299f2e': 88,
'66b1ae187c6f9632e743afefd0ee6459678b1d9c001fb02ae95a3fbea78a8aee': 89,
'3840ca2d11d41bf6756eb4545cb6252142dd335ec1aa36ce0812857e0f579dc6': 90,
'3961b49c1519610ac99e02b89e4f6fd65b847ef66eb8ae6911cd41168c271fcb': 91,
'eb98df9923b5119171195e1f1a698f4d4a287552766f898e060d46b6742c1a5a': 92,
'e6c4d813a13eb2c866babbe1a7f224965f748c36c2d252191ad7b77d3f6dcb48': 93,
'd879a09cba8e8ad01d77313c1c57aafdecb81ccf5f8d025093ae3af736c1d784': 94,
'8afa238a07ead5d6503ea5078b8e59825e994699c2690b6b2fe3bfcb0fd8c7c2': 95,
'1fa7b59651e0894fc2e3377707d8db5b823eda3fbb81f1adb81dcfcfce3b34ea': 96,
'321b5fac34432fd50e047e74c0e67b792dafce82c3b6d596131c7a133ba55fe6': 97,
'b7a4cc0f36854309590c132e75dad06a4f6045e57ac93e6dafc9bf0d0018247d': 98,
'e07a156ccb70a41eef8339001bd6a0e0f773e0ee33ce94fb9222df1874d6fddd': 99,
'67882f9c671cb45fc6990a2d14a20b30bfce29ad99a401c283a100662e6600fb': 100
};

module.exports = {
	getAccessTokenPolicy,
	getAccessTokenValidator,
	buildAccessorTransaction,
	buildMintTransaction,
	initCounter,
	signAndSubmit,
	getAccessorTokensInWallet
}