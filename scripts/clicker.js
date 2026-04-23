// ---- DOM REFERENCES ----
const clickButton = document.getElementById('clickMe');
const crewmateText = document.getElementById('crewmateText');
const crewmateList = document.getElementById('crewmateList');

// ---- STATE ----
let dubloons = 0;
let dpc = 1;
let dps = 0;

// ---- DUBLOONS ----

function getDPS() {
    let dps = 0;
    for (let index = 0; index < crewmates.length; index++) {
        dps += crewmates[index].dpsBonus * crewmates[index].count;
    }
    return dps;
}

function formatDubloonCount(count) {
    if (count < 10) return `${(count).toFixed(2)}`;
    else if (count < 1000000) return Math.floor(count).toLocaleString();
    else if (count < 1000000000) return `${(count / 1000000).toFixed(2)}M`;
    else if (count < 1000000000000) return `${(count / 1000000000).toFixed(2)}B`;
    else if (count < 1000000000000000) return `${(count / 1000000000000).toFixed(2)}T`;
    else return `${(count / 1000000000000000).toFixed(2)}Q`;
}

// ---- CREWMATES ----

class Crewmate {

    constructor(name, baseCost, dpsBonus, unlocked) {
        this.name = name;
        this.dpsBonus = dpsBonus;
        this.count = 0;
        this.baseCost = baseCost;
        this.cost = baseCost;
        this.unlocked = unlocked ?? false;
    }

    buy() {
        if (dubloons < this.cost) return false;
        ++this.count;
        dubloons -= this.cost;
        this.cost = Math.round(this.baseCost*1.15**this.count); 
        checkUnlocks();
        dps = getDPS();
        return true;
    }

}

const crewmates = [
    new Crewmate("Cabin Boy", 10, 0.1, true),
    new Crewmate("Plunderer", 50, 1, ),
    new Crewmate("Navigator", 250, 5),
    new Crewmate("Sharpshooter", 1250, 10),
    new Crewmate("Musician", 6250, 50),
    new Crewmate("Carpenter", 31250, 100),
    new Crewmate("Researcher", 156250, 500),
    new Crewmate("Helmsman", 781250, 1000),
    new Crewmate("Cook", 3875000, 5000),
    new Crewmate("Swordsman", 18750000, 10000)
];

function checkUnlocks() {
    for (let index = 0; index < crewmates.length - 1; ++index) {
        if (crewmates[index].count >= 10 ) crewmates[index+1].unlocked = true;
    }
}

function getIndexOfCurrentCrewmate() {
for (let index = crewmates.length - 1; index >= 0; --index) {
    if (crewmates[index].unlocked) return index;
}
}

function getIdleDubloons() {
    const lastSeen = Number(localStorage.getItem('lastSeen'))/1000;
    const now = Date.now()/1000;
    const secondsElapsed = now - lastSeen;
    if (secondsElapsed > 86400) return 86400 * dps;
    else return secondsElapsed * dps;
}

// ---- ITEMS ----

class Item { 

    constructor(name, tier, type, value, consumable) {
        this.name = name;
        this.tier = tier;
        this.type = type;
        this.value = value;
        this.consumable = consumable ?? false;
    }
}

const itemNames = ['Compass', 'Treasure Map', 'Cannon', 'Lucky Dice', 'Jolly Roger', 'Straw Hat', 'Spyglass', 'Sword', 'Ancient Text', 'Slingshot', 'Meat', 'Rum Barrel', 'Medicine', 'Powder Barrel', 'Dubloons']

const itemTypes = ['dpcFlat', 'dpcMult', 'dpsFlat', 'spinLuck', 'dpsMult', 'heldMult', 'spinLuck', 'critChance', 'recruitmentDiscount', 'critMult', 'dpsBurst', 'tempDpsMult', 'tempDpcMult', 'tempDpcMult', 'instantDubloons']

const itemValues = [
    [1, 3, 8, 25, 75],
    [1.25, 1.5, 2, 3, 5],
    [2, 8, 30, 120, 500],
    [1, 2, 3, 4, 5],
    [1.05, 1.1, 1.2, 1.35, 1.5],
    [1.05, 1.1, 1.2, 1.35, 1.5],
    [1, 2, 3, 4, 5],
    [0.05, 0.08, 0.12, 0.18, 0.25],
    [0.05, 0.1, 0.18, 0.28, 0.4],
    [1.5, 2, 3, 4.5, 7],
    [0.5, 1, 2, 4, 8],
    [1.5, 2, 2.5, 3, 5],
    [1.5, 2, 2.5, 3, 5],
    [2, 4, 8, 15, 30],
    [50, 300, 2000, 30000, 500000]
]

const items = [];

for (let i = 0; i < itemNames.length; ++i) {
    let itemRow = [];
    for (let j = 0; j < itemValues[i].length; ++j) {
        if (i > 9) itemRow.push(new Item(itemNames[i], j, itemTypes[i], itemValues[i][j], true));
        else itemRow.push(new Item(itemNames[i], j, itemTypes[i], itemValues[i][j]));
    }
    items.push(itemRow);
}

function getSlotCount() {
    let slots = 3;
    slots += getIndexOfCurrentCrewmate();
    return slots;
}

const inventory = [null, null, null, null, null, null, null, null, null, null, null, null]

function getSpinWeights() {
    const weights = [50, 30, 15, 4, 1]
    const maxTier = Math.floor(getIndexOfCurrentCrewmate() / 2);
    for (let index = 0; index < weights.length; ++index) {
        if (index > maxTier) weights[index] = 0;
    }
    inventory.filter(e => e !== null).forEach(element => {
        if (element.type === 'spinLuck') {
            for (let index = 0; index < weights.length; index++) {
                if (index < 2) weights[index] -= element.value;
                if (index > 2) weights[index] += element.value;
                if (weights[index] < 0) weights[index] = 0;
            }
        }
    });
    return weights;
}

function rollRarity() {
    const weights = getSpinWeights();
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        roll -= weights[i];
        if (roll <= 0) return i;
    }
}

function rollItem() {
    let i = Math.floor(Math.random() * items.length);
    return items[i][rollRarity()];
}

function rollItemSprite() {
    const item = rollItem();
    if (item.type === 'instantDubloons') rollDubloonCount(item.tier);
}

// ---- DOM UPDATE ----

function drawCrewmate(index) {
    const crewmateBox = document.createElement('div');
    crewmateBox.dataset.index = index;
    crewmateBox.classList.add("crewmateBox");

    const crewmateTitleAndCount = document.createElement('p');
    crewmateTitleAndCount.dataset.title = "nameAndCount";
    crewmateTitleAndCount.innerText = `${crewmates[index].name} (${formatDubloonCount(crewmates[index].count)})`;
    crewmateTitleAndCount.classList.add('no-highlight');
    crewmateBox.appendChild(crewmateTitleAndCount);

    const crewmateCost = document.createElement('p');
    crewmateCost.dataset.title = "cost";
    crewmateCost.innerText = `${formatDubloonCount(crewmates[index].cost)}`;
    crewmateCost.classList.add('no-highlight');
    crewmateBox.appendChild(crewmateCost);

    crewmateList.appendChild(crewmateBox);

    crewmateBox.addEventListener('click', (event) => {
        const index = Number(event.currentTarget.dataset.index);
        if (!crewmates[index].buy()) return;
        updateCrewmateText();
        updateCrewmate(index);
        if (crewmates[index].count === 10 && index != 9) drawCrewmate(index + 1);
        updateDubloonText();
        localStorage.setItem('dubloons', dubloons.toString());
        localStorage.setItem('crewmates', JSON.stringify(crewmates));
    });
}

function updateCrewmate(index) {
    const crewmateBox = document.querySelector(`[data-index="${index}"]`);
    crewmateBox.querySelector('[data-title="nameAndCount"]').innerText = `${crewmates[index].name} (${formatDubloonCount(crewmates[index].count)})`;
    crewmateBox.querySelector('[data-title="cost"]').innerText = `${formatDubloonCount(crewmates[index].cost)}`;
}

function updateCrewmateText() {
    const currentCrewmate = crewmates.findLast(_crewmate => _crewmate.unlocked);
    if (currentCrewmate.name === "Swordsman") {
        crewmateText.classList.add('hidden');
        return;
    }
    let remaining = 10 - currentCrewmate.count;
    crewmateText.innerText = remaining === 1 
        ? `recruit ${remaining} more ${(currentCrewmate.name).toLowerCase()} to unlock the next crewmate`
        : `recruit ${remaining} more ${(currentCrewmate.name).toLowerCase()}s to unlock the next crewmate`;
}

function updateDubloonText() {
    document.getElementById('dubloonCount').innerText = `Dubloons: ${formatDubloonCount(dubloons)}`;
    document.getElementById('dubloonsPerSecond').innerText = `per second: ${formatDubloonCount(dps)}`;
}

// ---- EVENT LISTENERS ----

clickButton.addEventListener('click', () => {
    dubloons += dpc;
    updateDubloonText();
    localStorage.setItem('dubloons', dubloons.toString());
});

window.addEventListener('beforeunload', () => {
    localStorage.setItem('lastSeen', Date.now().toString());
    localStorage.setItem('dubloons', dubloons.toString());
})

// ---- INIT ----
dubloons = Number(localStorage.getItem('dubloons')) || 0;
let crewmateArray = [];
if ((crewmateArray = JSON.parse(localStorage.getItem('crewmates'))) != null) {
    for (let index = 0; index < crewmateArray.length; ++index) {
        crewmates[index].count = crewmateArray[index].count;
        crewmates[index].cost = crewmateArray[index].cost;
    }
    dps = getDPS();
    dubloons += getIdleDubloons();
    checkUnlocks();
    for (let index = 0; index < crewmates.length; ++index) {
        if (crewmates[index].unlocked) drawCrewmate(index);
        else break;
    }
    updateDubloonText();
    updateCrewmateText();
}
else drawCrewmate(0);

setInterval(() => {
    dubloons += dps / 10;
    updateDubloonText();
}, 100);

setInterval(() => {
    location.reload();
}, 30000);
