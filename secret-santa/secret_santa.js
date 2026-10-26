const STORAGE_KEY = "secret-santa-names";

/**
 * Returns a shuffled copy of the given array (Fisher-Yates)
 * **/
function shuffle(array) {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

/**
 * Returns a random permutation of the adults where nobody draws themselves
 * **/
function drawAdults(adults) {
    let receivers;
    do {
        receivers = shuffle(adults);
    } while (receivers.some((receiver, i) => receiver === adults[i]));
    return receivers;
}

/**
 * Returns one kid per adult, spreading the kids as evenly as possible
 * **/
function drawKids(kids, nAdults) {
    if (kids.length === 0) {
        return Array(nAdults).fill(null);
    }
    const shuffledKids = shuffle(kids);
    const slots = [...Array(nAdults)].map((_, i) => shuffledKids[i % shuffledKids.length]);
    return shuffle(slots);
}

function readNames(id) {
    return document.getElementById(id).value
        .split("\n")
        .map(name => name.trim())
        .filter(name => name.length > 0);
}

function findDuplicate(names) {
    const seen = new Set();
    for (const name of names) {
        const key = name.toLowerCase();
        if (seen.has(key)) {
            return name;
        }
        seen.add(key);
    }
    return null;
}

function draw() {
    hideError();
    const adults = readNames("adults");
    const kids = readNames("kids");
    saveNames();

    if (adults.length < 2) {
        errorDisplay("Il faut au moins 2 adultes.");
        return;
    }

    const duplicate = findDuplicate([...adults, ...kids]);
    if (duplicate) {
        errorDisplay("Le nom « " + duplicate + " » apparaît deux fois. Ajoute une initiale pour les différencier.");
        return;
    }

    if (kids.length > adults.length) {
        errorDisplay("Il y a plus d'enfants que d'adultes : certains enfants n'auraient pas de cadeau.");
        return;
    }

    const adultReceivers = drawAdults(adults);
    const kidReceivers = drawKids(kids, adults.length);

    const linkList = document.getElementById("linkList");
    linkList.innerHTML = "";
    adults.forEach((giver, i) => {
        const url = buildLink({ g: giver, a: adultReceivers[i], k: kidReceivers[i] });
        addToLinkList(giver, url);
    });

    document.getElementById("setup").classList.add("hidden");
    document.getElementById("results").classList.remove("hidden");
}

/**
 * The result is stored in the URL hash, which is never sent to the server.
 * It is only encoded, not encrypted: it hides the names from a quick glance.
 * **/
function buildLink(result) {
    const bytes = new TextEncoder().encode(JSON.stringify(result));
    const encoded = btoa(String.fromCharCode(...bytes))
        .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    return location.origin + location.pathname + "#" + encoded;
}

function parseLink(hash) {
    try {
        const base64 = hash.replace(/-/g, "+").replace(/_/g, "/");
        const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        const result = JSON.parse(new TextDecoder().decode(bytes));
        return result && result.g && result.a ? result : null;
    } catch (e) {
        return null;
    }
}

function addToLinkList(giver, url) {
    const li = document.createElement("li");

    const name = document.createElement("span");
    name.classList.add("who");
    name.textContent = giver;

    const copyButton = document.createElement("button");
    copyButton.classList.add("btn");
    copyButton.textContent = "Copier le lien";
    copyButton.onclick = () => {
        navigator.clipboard.writeText(url).then(() => {
            copyButton.textContent = "Copié ✓";
            setTimeout(() => copyButton.textContent = "Copier le lien", 2000);
        });
    };

    li.appendChild(name);
    li.appendChild(copyButton);

    if (navigator.share) {
        const shareButton = document.createElement("button");
        shareButton.classList.add("btn");
        shareButton.textContent = "Partager";
        shareButton.onclick = () => navigator.share({ title: "Secret Santa", text: "Ton Secret Santa, " + giver + " :", url: url }).catch(() => {});
        li.appendChild(shareButton);
    }

    document.getElementById("linkList").appendChild(li);
}

function backToSetup() {
    document.getElementById("results").classList.add("hidden");
    document.getElementById("setup").classList.remove("hidden");
}

function showResult() {
    document.getElementById("revealHidden").classList.add("hidden");
    document.getElementById("revealShown").classList.remove("hidden");
}

function errorDisplay(text) {
    const error = document.getElementById("error");
    error.textContent = text;
    error.classList.remove("hidden");
}

function hideError() {
    document.getElementById("error").classList.add("hidden");
}

function saveNames() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            adults: document.getElementById("adults").value,
            kids: document.getElementById("kids").value
        }));
    } catch (e) {}
}

function loadNames() {
    try {
        const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (saved) {
            document.getElementById("adults").value = saved.adults || "";
            document.getElementById("kids").value = saved.kids || "";
        }
    } catch (e) {}
}

function init() {
    const result = location.hash.length > 1 ? parseLink(location.hash.slice(1)) : null;

    if (!result) {
        loadNames();
        return;
    }

    document.getElementById("setup").classList.add("hidden");
    document.getElementById("reveal").classList.remove("hidden");
    document.getElementById("giverName").textContent = result.g;
    document.getElementById("adultName").textContent = result.a;
    if (result.k) {
        document.getElementById("kidName").textContent = result.k;
    } else {
        document.getElementById("kidTarget").classList.add("hidden");
    }
}

window.addEventListener("DOMContentLoaded", init);
window.addEventListener("hashchange", () => location.reload());
