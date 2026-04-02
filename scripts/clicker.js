// ---- DOM REFERENCES ----
const clickButton = document.getElementById('clickMe');
const upgradeText = document.getElementById('upgradeText');
const upgradeList = document.getElementById('upgradeList');

// ---- STATE ----
let dubloons = 0;
let dpc = 1;
let dps = 0;

// ---- DUBLOONS ----

function getDPS() {
    let dps = 0;
    for (let index = 0; index < upgrades.length; index++) {
        dps += upgrades[index].dpsBonus * upgrades[index].count;
    }
    return dps;
}

function formatDubloonCount(count) {
    if (count < 1000000) return Math.floor(count).toLocaleString();
    else if (count < 1000000000) return `${(count / 1000000).toFixed(2)}M`;
    else if (count < 1000000000000) return `${(count / 1000000000).toFixed(2)}B`;
    else if (count < 1000000000000000) return `${(count / 1000000000000).toFixed(2)}T`;
    else return `${(count / 1000000000000000).toFixed(2)}Q`;
}

// ---- UPGRADES ----

class Upgrade {

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

const upgrades = [
    new Upgrade("Cabin Boy", 10, 0.1, true),
    new Upgrade("Doctor", 50, 1, ),
    new Upgrade("Navigator", 250, 5),
    new Upgrade("Sharpshooter", 1250, 10),
    new Upgrade("Musician", 6250, 50),
    new Upgrade("Carpenter", 31250, 100),
    new Upgrade("Archaeologist", 156250, 500),
    new Upgrade("Helmsman", 781250, 1000),
    new Upgrade("Cook", 3875000, 5000),
    new Upgrade("Swordsman", 18750000, 10000)
];

function checkUnlocks() {
    for (let index = 0; index < upgrades.length - 1; ++index) {
        if (upgrades[index].count >= 10 ) upgrades[index+1].unlocked = true;
    }
}

function getIndexOfCurrentUpgrade() {
for (let index = upgrades.length - 1; index >= 0; --index) {
    if (upgrades[index].unlocked) return index;
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
    slots += getIndexOfCurrentUpgrade();
    return slots;
}

const inventory = [null, null, null, null, null, null, null, null, null, null, null, null]

function getSpinWeights() {
    const weights = [50, 30, 15, 4, 1]
    const maxTier = Math.floor(getIndexOfCurrentUpgrade() / 2);
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

// ---- DOM UPDATE ----

function drawUpgrade(index) {
    const upgradeBox = document.createElement('div');
    upgradeBox.dataset.index = index;
    upgradeBox.classList.add("upgradeBox");

    const upgradeNameAndCount = document.createElement('p');
    upgradeNameAndCount.dataset.title = "nameAndCount";
    upgradeNameAndCount.innerText = `${upgrades[index].name} (${formatDubloonCount(upgrades[index].count)})`;
    upgradeNameAndCount.classList.add('no-highlight');
    upgradeBox.appendChild(upgradeNameAndCount);

    const upgradeCost = document.createElement('p');
    upgradeCost.dataset.title = "cost";
    upgradeCost.innerText = `${formatDubloonCount(upgrades[index].cost)}`;
    upgradeCost.classList.add('no-highlight');
    upgradeBox.appendChild(upgradeCost);

    upgradeList.appendChild(upgradeBox);

    upgradeBox.addEventListener('click', (event) => {
        const index = Number(event.currentTarget.dataset.index);
        let bought = upgrades[index].buy();
        if (!bought) return;
        updateUpgradeText();
        updateUpgrade(index);
        if (upgrades[index].count === 10 && index != 9) drawUpgrade(index + 1);
        updateDubloonText();
        localStorage.setItem('dubloons', dubloons.toString());
        localStorage.setItem('upgrades', JSON.stringify(upgrades));
    });
}

function updateUpgrade(index) {
    const upgradeBox = document.querySelector(`[data-index="${index}"]`);
    upgradeBox.querySelector('[data-title="nameAndCount"]').innerText = `${upgrades[index].name} (${formatDubloonCount(upgrades[index].count)})`;
    upgradeBox.querySelector('[data-title="cost"]').innerText = `${formatDubloonCount(upgrades[index].cost)}`;
}

function updateUpgradeText() {
    const currentUpgrade = upgrades.findLast(_upgrade => _upgrade.unlocked);
    if (currentUpgrade.name === "Swordsman") {
        upgradeText.classList.add('hidden');
        return;
    }
    let remaining = 10 - currentUpgrade.count;
    upgradeText.innerText = remaining === 1 
        ? `recruit ${remaining} more ${(currentUpgrade.name).toLowerCase()} to unlock the next crewmate`
        : `recruit ${remaining} more ${(currentUpgrade.name).toLowerCase()}s to unlock the next crewmate`;
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
if ((upgradeArray = JSON.parse(localStorage.getItem('upgrades'))) != null) {
    for (let index = 0; index < upgradeArray.length; ++index) {
        upgrades[index].count = upgradeArray[index].count;
        upgrades[index].cost = upgradeArray[index].cost;
    }
    dps = getDPS();
    dubloons += getIdleDubloons();
    checkUnlocks();
    for (let index = 0; index < upgrades.length; ++index) {
        if (upgrades[index].unlocked) drawUpgrade(index);
        else break;
    }
    updateDubloonText();
    updateUpgradeText();
}
else drawUpgrade(0);

setInterval(() => {
    dubloons += dps / 10;
    updateDubloonText();
}, 100);
