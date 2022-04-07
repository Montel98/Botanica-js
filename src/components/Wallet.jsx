import React, { useState } from 'react';

export default class Wallet extends React.Component {

    constructor() {

        super();
        this.state = { isSubmitted: false, isMintButtonLocked: false, tokens: {} , selectedToken: "" };
    }

    async componentDidMount() {

        /*this.setState({ tokens: (await this.getAccessorTokens()).tokens })

        const tokenNames = Object.keys(this.state.tokens);

        if (tokenNames.length > 0) {
            this.setState({selectedToken: tokenNames[0]});
        }*/
    }

    accessTokenList() {

        const accessTokenUTxOs = Object.keys(this.state.tokens).map(name => 
            <option value={name}>{name}</option>
        );

        return(
            <select value={this.state.selectedToken} onChange={this.handleChange}>
                {accessTokenUTxOs}
            </select>
        );
    }

    handleChange = (event) => {
        this.setState({ selectedToken: event.target.value });
    }

    togglePopup = (event) => {

        this.setState({isSubmitted: true});
    }

    redeem = async (event) => {

        const isEnabled = await window.cardano.enable();

        if (isEnabled) {

            const address = await window.cardano.getUsedAddresses();

            const tokenUTxO = this.state.tokens[this.state.selectedToken];

            const utxos = await window.cardano.getUtxos();
            const collateralInputs = await window.cardano.getCollateral();

            const tokensJSON = {inputs: utxos, 
                                collateral: collateralInputs, 
                                selected: {name: this.state.selectedToken, utxo: tokenUTxO}
                                };

            const tokenURL = `http://localhost:3001/redeem/${address[0]}`;

            const transactionResponse = await fetch(tokenURL, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(tokensJSON)
            });

            const transctionResponseJSON = await transactionResponse.json();
            const transactionHex = transctionResponseJSON.transaction;

            try {

                const vKeyWitnessSet =  await window.cardano.signTx(transactionHex, true);

                const sumbissionJSON = {vKeyWitnesses: vKeyWitnessSet, transaction: transactionHex};

                const submitURL = `http://localhost:3001/submit/${address[0]}`;

                const submissionResponse = await fetch(submitURL, {
                    method: 'POST',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    redirect: 'follow',
                    referrerPolicy: 'no-referrer',
                    body: JSON.stringify(sumbissionJSON)
                });
            }
            catch (e) {
                console.log(e);
            }
        }
    }

    async getAccessorTokens() {

        //const isEnabled = await window.cardano.enable();
        const isEnabled = false;

        if (isEnabled) {

            const address = await window.cardano.getUsedAddresses();

            const tokenURL = `http://localhost:3001/accessorTokens/${address[0]}`;

            const tokenResponse = await fetch(tokenURL, {
                method: 'GET'
            });

            const tokensJSON = await tokenResponse.json();

            return tokensJSON;
        }
        else {

            return {};
        }
    }

    connectWallet = async (e) => {

        const isEnabled = false;

        if (isEnabled && !this.state.isMintButtonLocked) {

            this.setState({ isMintButtonLocked: true });

            const address = await window.cardano.getUsedAddresses();

            //console.log('sending....');

            const utxos = await window.cardano.getUtxos();

            const collateralInputs = await window.cardano.getCollateral();
            const transactionJSON = {inputs: utxos, collateral: collateralInputs};

            const mintURL = `http://localhost:3001/mint/${address[0]}`;
            const transactionResponse = await fetch(mintURL, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json'
                },
                redirect: 'follow',
                referrerPolicy: 'no-referrer',
                body: JSON.stringify(transactionJSON)
            });

            const transctionResponseJSON = await transactionResponse.json();
            const transactionHex = transctionResponseJSON.transaction;

            try {

                const vKeyWitnessSet =  await window.cardano.signTx(transactionHex, true);

                const sumbissionJSON = {vKeyWitnesses: vKeyWitnessSet, transaction: transactionHex};

                const submitURL = `http://localhost:3001/submit/${address[0]}`;

                const submissionResponse = await fetch(submitURL, {
                    method: 'POST',
                    mode: 'cors',
                    cache: 'no-cache',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    redirect: 'follow',
                    referrerPolicy: 'no-referrer',
                    body: JSON.stringify(sumbissionJSON)
                });
            }
            catch (e) {
            }

            this.setState({ isMintButtonLocked: false });
        }
    }

    render() {

        return (
            <div id="walletContainer">
                {/*<div id="wallet" onClick={this.connectWallet}>*/}
                <div id="wallet">
                    <a>Connect Wallet</a>
                </div>
                {/*<div id="redeem" onClick={this.redeem}>
                    <a>Redeem </a>
                </div>
                <div>
                    {this.accessTokenList()}
                </div>*/}
                {this.state.isSubmitted && <div id="popup">Transaction submitted successfully.</div>}
            </div>
        );
    }
}