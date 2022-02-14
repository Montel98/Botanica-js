import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import initGame from './tree/Game.js';

import './style.css';

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';

//import cbor from 'cbor-web';

import treeAutumn from './images/bonsaiAutumn.png';
import treeSummer from './images/bonsaiSummer.png';
import twitterLogo from './images/twitterLogo.png';
import discordLogo from './images/discordLogo.png';
import chromosome from './images/chromosome.svg';
import treePruned from './images/treePruned.png';
import navigationIcon from './images/menu-icon.png';
import growthLapse from './images/growth-lapse.png';

class Game extends React.Component {

    componentDidMount() {

        setTimeout(() => {
        initGame();
        }, 40);
    }

    render() {

        return (
            <div id="game">
                <canvas id="glCanvas"></canvas>
                <div id="modeButtons">
                    <div class="modeButton" id="pan">Pan Mode</div>
                    <div class="modeButton" id="prune">Prune Mode*</div>
                    <div id="modeButtonMessage">*Still in development</div>
                </div>
            </div>
        );
    }
}

class Header extends React.Component {

    constructor() {

        super();
        this.state = { isDropdownToggled: false };
        this.toggleDropdown = this.toggleDropdown.bind(this);
    }

    toggleDropdown() {

        this.setState( {isDropdownToggled: !this.state.isDropdownToggled} );
    }

    render() {

        return (
            <div id="headerContainer">
                <div id="header">
                    <Title />
                    <Navigation navigationType="navigation" className="navigationTitle"/>
                    <Wallet />
                    <SocialLinks />
                    <MinimizedNavigation toggleDropdown = {this.toggleDropdown}/>
                </div>
                {this.state.isDropdownToggled && <Navigation navigationType="navigationMinDropdown" className="navigationTitleMin"/>}
            </div>
        );
    }
}

function Title() {

    return (
        <div id="title">
            Botanica
        </div>
    );
}

function MinimizedNavigation(props) {

    return (
        <div id="navigationMin">
            <img src={navigationIcon} onClick={props.toggleDropdown}/>
        </div>
    );
}

function Navigation(props) {

    return (
        <div id={props.navigationType}>
            <nav>
                <ul>
                    <li>
                        <a href="#treeFeaturesContainer"><div class={props.className}>Features</div></a>
                    </li>
                    <li>
                        <a href="#chromosomeContainer"><div class={props.className}>Genome</div></a>
                    </li>
                    <li>
                        <a href="#roadmapContainer"><div class={props.className}>Roadmap</div></a>
                    </li>
                    <li>
                        <a href="#faq"><div class={props.className}>FAQ</div></a>
                    </li>
                </ul>
            </nav>
        </div>
    );
}

class Accordion extends React.Component  {

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

class Wallet extends React.Component {

    constructor() {

        super();
        this.state = { isSubmitted: false, isMintButtonLocked: false, tokens: {} , selectedToken: "" };
    }

    //const [isSubmitted, setIsSubmitted] = useState(false);

    async componentDidMount() {

        /*this.setState({ tokens: (await this.getAccessorTokens()).tokens })

        const tokenNames = Object.keys(this.state.tokens);

        if (tokenNames.length > 0) {
            this.setState({selectedToken: tokenNames[0]});
        }*/
    }

    accessTokenList() {

        console.log(Object.keys(this.state.tokens));

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

        //const isEnabled = await window.cardano.enable();
        const isEnabled = false;

        if (isEnabled && !this.state.isMintButtonLocked) {

            this.setState({ isMintButtonLocked: true });

            const address = await window.cardano.getUsedAddresses();

            //console.log('sending....');

            //const response = await fetch(`http://localhost:3000/mint/${address}`);
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

            //this.togglePopup();

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

function TopText() {

    return (
        <div class="topText">
            <div class="topTextUpper">
                Maintainable 3D trees growing in real time.
            </div>
            <div class="topTextLower">
                Botanica is a collection of dynamic and unique Alonzo-era NF(Trees), adding a splash of green to the Cardano ecosystem.<br /><br />No images, no external models, 100% code!
            </div>
        </div>
    );
}

function MintInfo() {

    return (
        <div id="mintInfo">
            <p>
            Why will minting be split into 2 transactions?<br />
            Cardano currently allows a total transaction size under 16KB. Reliably squeezing the ability to both mint and remint (e.g. to prune the tree) proved tricky. To circumvent this limitation, minting is split into 2 one-time transactions. Transaction 1 will mint an 'accessor' NFT which allows you to redeem the tree in transaction 2. In transaction 2, your accessor token is sent to a burn address where it is provably irrecoverable.
            When minting, please ensure you have at least 2 ADA on top of the 38 ADA minting price. This is to cover the 1.6 ADA required when sending tokens between addresses, as well as the standard transaction fees.
            </p>
            {/*<img class="featureImage" src={TreeImage} alt="Tree in Autumn" />*/}
        </div>
    );
}

function GrowthBox(props) {
    return (
        <div class="featureBox" id="growthBox">
            <div class="featureTitle">
                Real-Time Growth
            </div>
            <div class="featureImage">
                <img src={growthLapse} class="bla" />
            </div>
            <div class="featureBody">
                {/*<div class="featureTitle">Real-Time Growth</div>*/}
                <div class="featureTextSmall">*Available on release</div>
                <div class="featureText">Patience is a virtue: from a fragile sapling to a mature tree, your tree will continuously grow in front of your eyes. Each tree has a unique growth pattern.<br /><br />Growth time aligns with approximately 6 weeks of the calendar year.</div>
            </div>
        </div>
        );
}

function SeasonBox(props) {
    return (
        <div class="featureBox" id="seasonBox">
            <div class="featureTitle">
                Seasons
            </div>
            <div class="featureImage">
            <ReactCompareSlider
                itemOne={<ReactCompareSliderImage src={treeAutumn} />}
                itemTwo={<ReactCompareSliderImage src={treeSummer} />}
            />
            </div>
            <div class="featureBody">
                {/*<div class="featureTitle">Seasons</div>*/}
                <div class="featureTextSmall">*Available on release</div>
                <div class="featureText">The appearance of the trees is constantly changing. They go through the autumn and flower blooming seasons of the hemisphere they reside (Northern or Southern) - no year is ever the same!</div>
            </div>
        </div>
        );
}

function PruningBox(props) {

    return (
        <div class="featureBox" id="pruningBox">
            <div class="featureTitle">
                Pruning
            </div>
            <div class="featureImage">
            <img src={treePruned} class="bla" />
            </div>
            <div class="featureBody">
                {/*<div class="featureTitle">Pruning</div>*/}
                <div class="featureTextSmall">*Available shortly after release (see roadmap)</div>
                <div class="featureText">Thanks to the power of Plutus smart contracts, you will be able to gradually modify the appearance of a tree to your liking, all while still maintaining the same policy ID. <br /><br />Specific regions can be cut, spawning a new shoot to grow in a random, different direction.</div>
            </div>
        </div>
        );
}

function SocialLinks(props) {
    return (
        <div class="socialLink">
            <div class="twitter">
                <a href={"https://twitter.com/BotanicaTrees"}>
                    <img src={twitterLogo} />
                </a>
            </div>
            <div class="discord">
                <a>
                    <img src={discordLogo} />
                </a>
            </div>
        </div>
    );
}

function Genome(props) {
    return (
        <div id="chromosome">
            <div id="chromosomeText">With the exception of the pot design, background and tree location (hemisphere), each trait is genetically encoded. All traits combined theoretically allow <span style={{"font-weight": "bold"}}>47,900,160</span> possible combinations.</div>
            <img src={chromosome} />
        </div>
    );
}

function Footer(props) {
    return (
        <div id="socialLinkFooter">
            <div class="twitter">
                <a href={"https://twitter.com/BotanicaTrees"}>
                    <img src={twitterLogo} />
                </a>
            </div>
            <div class="discord">
                <img src={discordLogo} />
            </div>
        </div>
    );
}

function Roadmap(props) {

    return (
        <div id="roadmap">
            <div class="roadmapQuarter">
                <div class="roadmapQuarterHeader">Q3 2021<br/>(Prototyping Phase)</div>
                {/*<div class="roadmapMonthHeader">July</div>
                <div class="roadmapContents">
                    <ul>
                        <li>Idea inception / Brainstorming {' \u2713'}</li>
                    </ul>
                </div>*/}
                <div class="roadmapMonthHeader">August - September</div>
                <div class="roadmapContents">
                    <ul>
                        <li>Lightweight WebGL engine development and tree generation prototyping {' \u2713'}</li>
                    </ul>
                </div>
            </div>
            <div class="roadmapQuarter">
                <div class="roadmapQuarterHeader">Q4 2021<br/>(Development Phase)</div>
                <div class="roadmapMonthHeader">October - November</div>
                <div class="roadmapContents">
                    <ul>
                        <li>Main development of tree generation algorithm, growth and season mechanisms {' \u2713'}</li>
                    </ul>
                </div>
                <div class="roadmapMonthHeader">December</div>
                <div class="roadmapContents">
                    <ul>
                        <li>Integration of Plutus Smart Contracts {' \u2713'}</li>
                    </ul>
                </div>
            </div>
            <div class="roadmapQuarter">
                <div class="roadmapQuarterHeader">Q1/Q2 2022<br/>(Testing / Marketing / Add-On Phase)</div>
                <div class="roadmapContents"></div>
                <div class="roadmapContents">
                    <ul>
                        <li>Testing and final tweaks</li>
                        <li>Main Release (Date TBA)</li>
                        <li>Pruning extension release - Ability to view and modify trees directly on the site via wallet signing</li>
                        <li>Website upgrades - Ability to view genetic traits directly on site, compare genetic similarity to other trees etc.</li>
                        <li>Potential plans for implementing genetic mutations</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

function NavigationLink(props) {

    return (
        <div id="navigationMin">
            <img src={navigationIcon} />
        </div>
    );
}

function TreeFeatures(props) {
    return (
        <div id="treeFeatures">
            <GrowthBox />
            <SeasonBox />
            <PruningBox />
        </div>
    );
}

ReactDOM.render(
    <div id="mainContainer">
        <div class="testGrid">
            <Header />
            <Game />
            <TopText />
        </div>
        <div id="treeFeaturesContainer">
            <div id="featuresTitle">Features</div>
            <TreeFeatures />
        </div>
        <div id="chromosomeContainer">
            <div id="chromosomeTitle">Genome</div>
                <Genome />
        </div>
        <div id="roadmapContainer">
            <div id="roadmapTitle">Current Task Milestones & Roadmap</div>
            <div id="roadmapText">While we feel that in its current state this project offers something fresh and unique to the space, ultimately the community decides its future. There are ideas for additional features (besides pruning) we would like to add after release, contingent on community interest in the project. Please note that the roadmap is not exhaustive and is subject to change, though <span style={{"font-weight": "bold"}}>realistic</span> goals in the near-mid term have been detailed.</div>
            <Roadmap />
        </div>
        <div id="faq">
            <div id="faqTitle">FAQ</div>
            <div id="faqText">The release date, total supply and mint price are to be announced in the near future.</div>
            <Accordion />
        </div>
        <div id="footer">
            <Footer />
        </div>
    </div>,
    document.getElementById('root')
);

/*function makeWheel(cx, cy, outerRadius) {

    let svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    let g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    let animate = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");

    animate.setAttribute("attributeName", "transform");
    animate.setAttribute("attributeType","XML");
    animate.setAttribute("type", "rotate");
    animate.setAttribute("from", `0 ${cx} ${cy}`);
    animate.setAttribute("to", `360 ${cx} ${cy}`);
    animate.setAttribute("dur", "1s");
    animate.setAttribute("repeatCount", "indefinite");

    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");

    g.appendChild(animate);

    svg.appendChild(g);

    for (let i = 0; i < 8; i++) {

        let angle = (i / 8) * (2.0 * Math.PI);
        let x = cx + outerRadius * Math.cos(angle);
        let y = cy + outerRadius * Math.sin(angle);
        g.appendChild(newDot(x, y));
    }

    return svg;

    return <svg xlmns="http://www.w3.org/2000/svg"></svg>
}

function newDot(x, y) {

    let newDot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    newDot.setAttribute("cx", `${x}`);
    newDot.setAttribute("cy", `${y}`);
    newDot.setAttribute("r", "20");

    let animate = document.createElementNS("http://www.w3.org/2000/svg", "animateTransform");
    return newDot;
}

function makeLoader(cx, cy, outerRadius) {
    const wheel = makeWheel(cx, cy, outerRadius);
    wheel.id = "loadingWheel";
    //document.getElementById("gridContainer").appendChild(wheel);
    //document.body.appendChild(wheel);
    return wheel;
}*/
