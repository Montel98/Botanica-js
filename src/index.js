import React, { useState } from 'react';
import ReactDOM from 'react-dom';

import initGame from './tree/Game.js';

import './style.css';

import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import Wallet from './components/Wallet.jsx';
import Accordion from './components/Accordion.jsx';

import treeAutumn from './images/bonsaiAutumn.png';
import treeSummer from './images/bonsaiSummer.png';
import githubLogo from './images/githubLogo.png';
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
                Botanica is a WebGL project with dynamic, procedurally generated trees that change throughout the year.
            </div>
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
                <div class="featureText">Once the tree has matured, you are able to gradually modify the appearance of a tree to your liking. <br /><br />Specific regions can be cut, spawning a new shoot to grow in a random, different direction.</div>
            </div>
        </div>
        );
}

function SocialLinks(props) {
    return (
        <div class="socialLink">
            <div class="twitter">
                <a href={"https://github.com/Montel98/Botanica-js"}>
                    <img src={githubLogo} />
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
                <a href={"https://github.com/Montel98/Botanica-js"}>
                    <img src={githubLogo} />
                </a>
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
        <div id="faq">
            <div id="faqTitle">FAQ</div>
            <Accordion />
        </div>
        <div id="footer">
            <Footer />
        </div>
    </div>,
    document.getElementById('root')
);