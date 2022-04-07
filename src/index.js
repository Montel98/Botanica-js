import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import initGame from './tree/Game.js';

import './style.css';

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import Wallet from './components/Wallet.jsx';
import Accordion from './components/Accordion.jsx';

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
                <div class="roadmapMonthHeader">September</div>
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