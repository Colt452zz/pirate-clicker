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

    constructor(name, baseCost, dpsBonus, dpcBonus, unlocked) {
        this.name = name;
        this.dpsBonus = dpsBonus;
        this.count = 0;
        this.baseCost = baseCost;
        this.cost = baseCost;
        this.unlocked = unlocked;
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
    new Upgrade("Cabin Boy", 10, 0.1, 0, true),
    new Upgrade("Doctor", 50, 1, 0),
    new Upgrade("Navigator", 250, 5, 0),
    new Upgrade("Sharpshooter", 1250, 10, 0),
    new Upgrade("Musician", 6250, 50, 0),
    new Upgrade("Carpenter", 31250, 100, 0),
    new Upgrade("Archaeologist", 156250, 500, 0),
    new Upgrade("Helmsman", 781250, 1000, 0),
    new Upgrade("Cook", 3875000, 5000 ,0),
    new Upgrade("Swordsman", 18750000, 10000, 0)
]

function checkUnlocks() {
    for (let index = 0; index < upgrades.length - 1; ++index) {
        if (upgrades[index].count >= 10 ) upgrades[index+1].unlocked = true;
    }
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
        if (upgrades[index].count === 10 && index < 9) drawUpgrade(index + 1);
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

// ---- ON CLICK ----

clickButton.addEventListener('click', () => {
    dubloons += dpc;
    updateDubloonText();
    localStorage.setItem('dubloons', dubloons.toString());
});

// ---- INIT ----
dubloons = Number(localStorage.getItem('dubloons')) || 0;
if ((upgradeArray = JSON.parse(localStorage.getItem('upgrades'))) != null) {
    for (let index = 0; index < upgradeArray.length; ++index) {
        upgrades[index].count = upgradeArray[index].count;
        upgrades[index].cost = upgradeArray[index].cost;
    }
    dps = getDPS();
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
