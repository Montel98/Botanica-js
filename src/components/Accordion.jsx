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
                {this.accordionBox(
                    0, 
                    "What technologies are used?", 
                    <div class="dropDownContent">WebGL is used for the renderer that draws the trees. The front-end is made primarily with React.js, while the back-end uses Node.js and Express.js for the server.</div>
                )}
                {this.accordionBox(
                    1,
                    "Where can I find the source code?", 
                    <div class="dropDownContent">The current state of the main source code, which includes the graphics engine and tree generation, can be found below:<br />
                    <a href="https://github.com/Montel98/Botanica-js"> Source Code</a><br /><br />
                    The Smart Contract Extension can also be found here:<br />
                    <a href="https://github.com/Montel98/Botanica-Smart-Contracts">Smart Contract Source Code</a></div>)}
            </div>
        );
    }
}