const radiusUl = document.getElementById("radiusList");
const classRadiusLabels = "col-sm-4";
const classRadiusLi = "list-group-item bg-transparent row"


const shapeCalculators = {
    egg: {
        getRadius: (size, x) => {
            return Math.sqrt((x * size * (1 - x/size))/((2*x)/size + 1))
        }
    },
    sphere: {
        getRadius: (size, x) => {
            const r = size/2.0;
            return Math.sqrt(Math.pow(r, 2) - Math.pow(x - r, 2))
        }
    }
}

function calculateResults() {
    clearList();
    const size = parseFloat(document.getElementById('variableT').value);
    const nStage = parseFloat(document.getElementById('variableX').value);
    const shapeSelector = document.getElementById("shape");
    const shape = shapeSelector.options[shapeSelector.selectedIndex].value;
    const calculator = shapeCalculators[shape];

    if(isNaN(size)) {
        alertDisplay("Indiquez une taille par pitié.");
        return;
    }

    if(isNaN(nStage)) {
        alertDisplay("Faudrait peut être mettre un nombre d'étage aussi.");
        return;
    }

    if(!calculator) {
        alertDisplay("C'est quoi cette forme?");
        return;
    }

    const heights = listAllHeights(size, nStage);

    for(let index = heights.length - 1; index >= 0; index--) {
        const currentRadius = calculator.getRadius(size, heights[index])
        addToRadiusList(index + 1, currentRadius, size)
    }
}

/**
 * Returns middle height of given stage x for height size and number of stages nStage
 * **/
function halfHeightOfX(x, size, nStage) {
    return (size / nStage) * (x + 0.5)
}

function listAllHeights(size, nStage) {
    return [...Array(nStage)].map((_, i) => halfHeightOfX(i, size, nStage))
}

function addToRadiusList(i, radius, size) {
    let li = document.createElement("li");
    li.setAttribute("class", classRadiusLi);

    let label1 = document.createElement("span");
    label1.setAttribute("class", classRadiusLabels);
    label1.appendChild(document.createTextNode("Etage " + i + ":"))

    let label2 = document.createElement("span");
    label2.setAttribute("class", classRadiusLabels);
    label2.appendChild(document.createTextNode(radius.toFixed(2)));

    let graph = document.createElement("div");
    graph.classList.add("bg-white");
    graph.classList.add("graph-bar");
    graph.style.height = "100%";
    graph.style.float = "right"
    graph.setAttribute("data-width", (radius / size) * 600);

    li.appendChild(label1)
    li.appendChild(label2)
    li.appendChild(graph)

    radiusUl.appendChild(li)
    adjustGraphWidth();
}

function clearList() {
    radiusUl.innerHTML = '';
}

function alertDisplay(text) {
    const alert = document.getElementById('alert');
    alert.textContent = text;
    alert.classList.remove("invisible");
    setTimeout(() => alert.classList.add("invisible"), 2000);
}

function adjustGraphWidth() {
    const graphs = document.querySelectorAll(".graph-bar");
    graphs.forEach(graph => {
        let baseWidth = parseFloat(graph.getAttribute("data-width"));

        if (window.innerWidth <= 768) {
            graph.style.width = Math.round(baseWidth * 0.4) + "px"; // Scale down width
        } else {
            graph.style.width = baseWidth + "px";
        }
    });
}

window.addEventListener("resize", adjustGraphWidth);
window.addEventListener("DOMContentLoaded", adjustGraphWidth);