import TreeSeed from './Seed.js';
import { stemIterator } from './StemIterator.js';

const HOUR_MILLIS = 3600000;
//const MAX_STEMS = 609;
const MAX_STEMS = 545;

const LEAF_GROWTH_LEVEL = 2;
const FLOWER_GROWTH_LEVEL = 4;

const months = ['January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'];

const monthsToEnum = {
    'January': 0,
    'February': 1,
    'March': 2,
    'April': 3,
    'May': 4,
    'June': 5,
    'July': 6,
    'August': 7,
    'September': 8,
    'October': 9,
    'November': 10,
    'December': 11
}

export default class TreeEvent {

    constructor(root, generator, eventFunc, stateGenFunc) {

        this.root = root;
        this.generator = generator;
        this.makeEvent = eventFunc;
        this.getNextState = stateGenFunc;
        this.stemStates = [];
        this.event = null;
    }

    setEvent(event) {
        this.event = event;
    }

    setState(newState) {
        //console.log('new state::: ', newState);
        this.stemStates = newState;
    }

    updateEventAndState(timeElapsed, thresholdDate) {

        let prevEventYear = this.event.start.getFullYear();

        if (timeElapsed > thresholdDate) {

            let newEvent = this.makeEvent(prevEventYear + 1);
            this.setEvent(newEvent);
            this.setState(this.getNextState(this.generator, this.event, this.root));
            //console.log('new event:', this.event);
        }
    }
}

export function initTreeEvent(dateNow, eventType, leadingEventType, /*germinationDate, skipsPerCycle*/) {

    let currentEvent = getEventAtDate(eventType, leadingEventType, dateNow);
    let currentEventYear = currentEvent.start.getFullYear();

    return currentEvent;
}

export function initGenerator(generator, eventType, leadingEventType, dateNow, germinationDate, skipsPerCycle) {

    let firstEvent = getEventAtDate(eventType, leadingEventType, germinationDate);
    let firstEventYear = firstEvent.start.getFullYear();

    let currentEvent = getEventAtDate(eventType, leadingEventType, dateNow);
    let currentEventYear = currentEvent.start.getFullYear();

    let eventCycleCount = currentEventYear - firstEventYear;

    generator.skip(eventCycleCount * skipsPerCycle);
}

function getEventAtDate(eventType, leadingEventType, dateNow) {

    let currentLeadingEventYear = dateNow.getFullYear();
    let currentLeadingEvent = leadingEventType.makeEvent(currentLeadingEventYear);

    if (currentLeadingEvent.start > dateNow) {

        currentLeadingEvent = leadingEventType.makeEvent(currentLeadingEventYear - 1);
    }

    if (eventType == leadingEventType) {

        return currentLeadingEvent;
    }

    let currentEventYear = currentLeadingEvent.end.getFullYear();

    let currentEvent = eventType.makeEvent(currentEventYear);

    if (/*currentLeadingEvent.start > currentEvent.end*/currentLeadingEvent.end > currentEvent.start) {

        currentEvent = eventType.makeEvent(currentEventYear + 1);
    }

    return currentEvent;
}

function getFallStates(generator, event, root) {

    let stemStates = [];
        
    for (let i = 0; i < MAX_STEMS; i++) {

        let randomDay = randomGeometric(generator, event.successRate);

        let fallTick = event.start.getTime() + HOUR_MILLIS * randomDay;

        if (fallTick > event.end) {

            fallTick = event.end;
        }

        stemStates.push(fallTick);
    }

    return stemStates;
}

function getLeafGrowthStates(generator, event, root) {

    let stemStates = [];
        
    for (let i = 0; i < MAX_STEMS; i++) {

        let randomDay = randomGeometric(generator, event.successRate);

        let leafGrowthTick = event.start.getTime() + HOUR_MILLIS * randomDay;

        if (leafGrowthTick > event.end) {

            leafGrowthTick = event.end;
        }
        
        let x = (Math.PI * 0.5 * randomUniform(generator)) - (Math.PI * 0.25);

        stemStates.push({tick: leafGrowthTick, xAngle: x});
    }

    return stemStates;
}

function getFlowerGrowthStates(generator, event, root) {

    let stemStates = [];

    const floweringProbability = 0.7;

    let stemIt = stemIterator(this.root);
    let it = stemIt.next();

    while (!it.done) {

        let currentStem = it.value;

        let isSelected = false;

        let randomNum = randomUniform(generator);

        if (currentStem.stackFrame.branch.level > FLOWER_GROWTH_LEVEL) {

            //let randomNum = randomUniform(generator);

            if (randomNum > floweringProbability) {

                isSelected = true;
            }
        }

        let randomDay = randomGeometric(generator, event.successRate);

        let flowerGrowthTick = event.start.getTime() + HOUR_MILLIS * randomDay;

        if (flowerGrowthTick > event.end) {

            flowerGrowthTick = event.end;
        }

        let z = Math.PI * 2.0 * randomUniform(generator);

        stemStates.push({tick: flowerGrowthTick, zAngle: z, isChosen: isSelected});

        it = stemIt.next();
    }

    return stemStates;
}

function initGrowthGenerator(germinationDate, dateNow) {
    const yearStart = germinationDate.getFullYear();
}

function randomGeometric(generator, probability) {

    let randomNo = generator.randomFloat();

    return Math.ceil(Math.log(1 - randomNo) / Math.log(1 - probability));
}

function randomUniform(generator) {

    return generator.randomFloat();
}

function addSeconds(date, ds) {
    let dateCopy = new Date();
    dateCopy.setTime(date.getTime() + (1000 * ds));
    return dateCopy;
}

function makeBloomEvent(monthStartEnum, monthEndEnum, successFreq, isleadingEvent) {

    let endDay = 30;

    if (monthEndEnum % 2 == 0) {
        endDay = 31;
    }
    else if (monthEndEnum == 1) {
        endDay = 28;
    }

    const monthStart = months[monthStartEnum];
    const monthEnd = months[monthEndEnum];

    const bloomEvent = (year) => {

        const yearStart = year;
        const yearEnd = monthStartEnum > monthEndEnum ? year + 1 : year;

        if (monthEndEnum == 1 && /*year*/yearEnd % 4 == 0) {
            endDay = 29;
        }
        const flowerBloom = {
            start: new Date(`${monthStart} 1 ${yearStart} 0:00:00`),
            end: new Date(`${monthEnd} ${endDay} ${yearEnd} 23:59:59`),
            successRate: successFreq,
            isLeading: isleadingEvent
        };

        return flowerBloom;
    }

    return bloomEvent;
}

function leafFallEvent(startYear) {

    const dayNo = ((startYear + 1) % 4 == 0) ? 29 : 28;

    const leafFall = {
        start: new Date(`September 1 ${startYear} 0:00:00`),
        end: new Date(`February ${dayNo} ${startYear + 1} 23:59:59`),
        successRate: 0.0022,
        isLeading: false
    }

    return leafFall;
}

function leafGrowEvent(year) {

    const leafGrow = {
        start: new Date(`March 1 ${year} 0:00:00`),
        end: new Date(`August 31 ${year} 23:59:59`),
        successRate: 0.003,
        isLeading: true
    }

    return leafGrow;
}

function getFloweringPeriod(genome) {

    const floweringPeriodAllele = genome.getGenotype('Flowering Season').left.allele;

    const dateFromTo = floweringPeriodAllele.name.split('-');

    const startEnum = monthsToEnum[dateFromTo[0]];
    const endEnum = monthsToEnum[dateFromTo[1]];

    //console.log('Flowering Period: ', floweringPeriodAllele.name);

    return {monthStartEnum: startEnum, monthEndEnum: endEnum};
}

// Autumn: 1st September - 30th November
// Spring: 1st March - 31st May


// Calculate No. Autumn Cycles
// When growing during autumn, make no new leaves
// Last leaf ALWAYS falls by end of autumn
// Last leaf ALWAYS grows by end of spring
// Later: Growth occurs at 50% normal rate during autumn and winter

// If germination starts anywhere during autumn cycle, count as full cycle

// For flowers:
// Generate set of indexes for level 4+
// When iterating over stems: if index exists, add flower

export function initTreeEvents(root, genome, dateNow, germinationDate) {

    const period = getFloweringPeriod(genome);

    const flowerBloomStartEvent = makeBloomEvent(period.monthStartEnum, period.monthEndEnum, 0.004, true);
    const flowerBloomEndEvent = makeBloomEvent(
        ((period.monthEndEnum + 1) % 12), 
        (period.monthStartEnum - 1) < 0 ? 12 + ((period.monthStartEnum - 1) % 12) : period.monthStartEnum - 1, 
        0.004, 
        false
    );

    const newSpring = new TreeEvent(root, TreeSeed.spring, leafGrowEvent, getLeafGrowthStates);

    initGenerator(TreeSeed.spring, newSpring, newSpring, dateNow, germinationDate, MAX_STEMS);

    newSpring.setEvent(initTreeEvent(dateNow, newSpring, newSpring));
    newSpring.setState(newSpring.getNextState(TreeSeed.spring, newSpring.event, root));

    const newAutumn = new TreeEvent(root, TreeSeed.autumn, leafFallEvent, getFallStates);

    initGenerator(TreeSeed.autumn, newAutumn, newSpring, dateNow, germinationDate, 2*MAX_STEMS);

    newAutumn.setEvent(initTreeEvent(dateNow, newAutumn, newSpring));
    newAutumn.setState(newAutumn.getNextState(TreeSeed.autumn, newAutumn.event, root));

    const newBloomStart = new TreeEvent(root, TreeSeed.bloomStart, flowerBloomStartEvent, getFlowerGrowthStates);

    initGenerator(TreeSeed.bloomStart, newBloomStart, newBloomStart, dateNow, germinationDate, 3*MAX_STEMS);

    newBloomStart.setEvent(initTreeEvent(dateNow, newBloomStart, newBloomStart));
    newBloomStart.setState(newBloomStart.getNextState(TreeSeed.bloomStart, newBloomStart.event, root));

    const newBloomEnd = new TreeEvent(root, TreeSeed.bloomEnd, flowerBloomEndEvent, getFallStates);

    initGenerator(TreeSeed.bloomEnd, newBloomEnd, newBloomStart, dateNow, germinationDate, MAX_STEMS);

    newBloomEnd.setEvent(initTreeEvent(dateNow, newBloomEnd, newBloomStart));
    newBloomEnd.setState(newBloomEnd.getNextState(TreeSeed.bloomEnd, newBloomEnd.event, root));

    return {
            spring: newSpring, 
            autumn: newAutumn, 
            bloomStart: newBloomStart, 
            bloomEnd: newBloomEnd
        };
}