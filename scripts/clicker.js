// ---- DOM REFERENCES ----
const clickButton = document.getElementById('clickMe');
const upgradeText = document.getElementById('upgradeText');
const upgradeList = document.getElementById('upgradeList');

// ---- STATE ----
let dubloons = 0;
let dpc = 1;

// ---- DUBLOONS ----
function incrementDubloons() {
    dubloons += dpc;
}

function getDPC() {
    let dpc = 1;
    for (let index = 0; index < upgrades.length; index++) {
        dpc += (upgrades[index].dpcBonus*upgrades[index].count);
    }
    return dpc;
}

function formatDubloonCount(count) {
    if (count < 1000000) return count.toLocaleString();
    else if (count < 1000000000) return `${(count / 1000000).toFixed(2)}M`;
    else if (count < 1000000000000) return `${(count / 1000000000).toFixed(2)}B`;
    else if (count < 1000000000000000) return `${(count / 1000000000000).toFixed(2)}T`;
    else return `${(count / 1000000000000000).toFixed(2)}Q`;
}

// ---- UPGRADES ----

class Upgrade {

    constructor(name, baseCost, dpcBonus, unlocked) {
        this.name = name;
        this.dpcBonus = dpcBonus;
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
        dpc = getDPC();
        return true;
    }

}

const upgrades = [
    new Upgrade("Compass", 10, 1, true),
    new Upgrade("Spyglass", 50, 5),
    new Upgrade("Treasure Map", 250, 25),
    new Upgrade("Rum Barrel", 1250, 125),
    new Upgrade("Crewmate", 6250, 625),
    new Upgrade("Cannon", 31250, 3125),
    new Upgrade("Jolly Roger", 156250, 15625),
    new Upgrade("Fleet Ship", 781250, 78125),
    new Upgrade("Pirate Cove", 3875000, 387500),
    new Upgrade("Cursed Artifact", 18750000, 1875000)
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
    upgradeBox.appendChild(upgradeNameAndCount);

    const upgradeCost = document.createElement('p');
    upgradeCost.dataset.title = "cost";
    upgradeCost.innerText = `${formatDubloonCount(upgrades[index].cost)}`;
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
    upgradeText.classList.toggle('hidden', currentUpgrade.name === "Cursed Artifact");
    upgradeText.innerText = `purchase ${10 - currentUpgrade.count} more ${currentUpgrade.name} to unlock the next upgrade`;
}

function updateDubloonText() {
    document.getElementById('dubloonCount').innerText = `Dubloons: ${formatDubloonCount(dubloons)}`;
    document.getElementById('dubloonsPerVoyage').innerText = `per voyage: ${formatDubloonCount(dpc)}`;
}

// ---- ON CLICK ----

clickButton.addEventListener('click', () => {
    incrementDubloons();
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
    dpc = getDPC();
    checkUnlocks();
    for (let index = 0; index < upgrades.length; ++index) {
        if (upgrades[index].unlocked) drawUpgrade(index);
        else break;
    }
    updateDubloonText();
    updateUpgradeText();
}
else drawUpgrade(0);
