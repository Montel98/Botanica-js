import React, { useState } from 'react';

export default class Accordion extends React.Component  {

    constructor() {

        super();
        this.state = { selectedBox: -1 };
    }

    accordionBox(index, question, answer) {

        return (
            <div class="accordionBox">
            <div class={this.state.selectedBox == index ? "accordionHeader expanded" : "accordionHeader"} onClick={() => this.toggleSelection(index)}><div class="accordionHeaderContent">{question}</div><div class="accordionHeaderContent">{this.state.selectedBox == index ? "-" : "+"}</div></div>
            {this.state.selectedBox == index && <div class="dropDown">{answer}</div>}
            </div>
        );
    }

    toggleSelection(index) {

        if (this.state.selectedBox == index) {
            this.setState( {selectedBox: -1 } );
        }
        else {
            this.setState( {selectedBox: index} );
        }
    }

    render() {

        return (
            <div class="accordion">
                {this.accordionBox(0, "What do I need to mint?", <div class="dropDownContent">You will need Nami Wallet - minting will be done directly via this site using smart contracts. All you are required to do is sign the generated transaction.</div>)}
                {this.accordionBox(1, "How can I view my tree?", <div class="dropDownContent">You will be able to view your tree by entering your policy ID and asset name into a site like <a href="https://pool.pm">pool.pm</a>. Once pruning is released, you will also be able to view your tree and utilize the available tools directly on this site.</div>)}
                {this.accordionBox(2, "Where can I find the smart contract source code?", <div class="dropDownContent">The current state of the source code for all the contracts to be used can be found in the Github repository provided below. This will also include the locations of the datums and policy IDs used closer to launch.<br /><br /><a href="https://github.com/Montel98/Botanica-Smart-Contracts">Source Code</a></div>)}
                {this.accordionBox(3, "Are the trees on-chain?", <div class="dropDownContent">Not currently. The maximum transaction size on Cardano is currently 16KB, while the code for a single tree is ~200KB. However, with Cardano's long-term scaling plans, migrating the trees on-chain is a possibility in the future.</div>)}
            </div>
        );
    }
}