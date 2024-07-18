let canvas = $("#Canvas");
let context = canvas.get(0).getContext("2d");

// Function to resize the canvas
function resizeCanvas() {
    const canvasContainer = $("#canvasContainer");
    canvas.attr("width", canvasContainer.width());
    canvas.attr("height", canvasContainer.height() + 40); // Increased height to fit exponent values
}

// Set canvas size initially
resizeCanvas();

// Resize canvas when window is resized
$(window).resize(function() {
    resizeCanvas();
});

let playAnimation = false;
let startButton = $("#start");
let stopButton = $("#stop");
let resetButton = $("#reset");
let numElementsInput = $("#numElementsInput");
let arrayInputsContainer = $("#arrayInputsContainer");
let formulaElement = $("#softmaxFormula");
let temperatureSlider = $("#temperatureSlider");
let temperatureInput = $("#temperatureInput");
let subtractMaxCheckbox = $("#subtractMax");

let values = [0.2, 0.4, 0.6, 0.5, 0.3, 0.7];
let softargmaxValues = calculateSoftargmax(values);
let animationRunning = false;

// Function to create array input elements
function createArrayInputs(numElements) {
    arrayInputsContainer.empty();
    for (let i = 0; i < numElements; i++) {
        let value = values[i] || 0;
        let arrayInput = $(`
            <div class="array-input">
                <input type="number" class="value-input" min="0" max="1" step="0.01" value="${value}" data-index="${i}">
                <input type="range" class="value-slider" min="0" max="1" step="0.01" value="${value}" data-index="${i}">
            </div>
        `);
        arrayInputsContainer.append(arrayInput);
    }
    bindArrayInputEvents();
}

// Bind events for array input elements
function bindArrayInputEvents() {
    let valueSliders = $(".value-slider");
    let valueInputs = $(".value-input");

    // Sync value sliders and inputs
    valueSliders.on("input", function () {
        let index = $(this).data("index");
        valueInputs.eq(index).val($(this).val());
        updateValues();
        if (!animationRunning) {
            startAnimation();
        }
    });
    valueInputs.on("input", function () {
        let index = $(this).data("index");
        valueSliders.eq(index).val($(this).val());
        updateValues();
        if (!animationRunning) {
            startAnimation();
        }
    });
    valueInputs.on("change", function () {
        updateValues();
        if (!animationRunning) {
            startAnimation();
        }
    });
}

// Code to disable Start button initially
stopButton.hide();
startButton.click(function () {
    $(this).hide();
    stopButton.show();
    playAnimation = true;
    animate();
});

// Code to disable Stop button
stopButton.click(function () {
    $(this).hide();
    startButton.show();
    playAnimation = false;
    animationRunning = false;
});

// Code to handle Reset button
resetButton.click(function () {
    playAnimation = false;
    animationRunning = false;
    initializeAnimation();
    draw(true); // Pass true to reset to the original state
});

// Sync temperature slider and input
temperatureSlider.on("input", function () {
    temperatureInput.val(temperatureSlider.val());
    updateValues();
    if (!animationRunning) {
        startAnimation();
    }
});
temperatureInput.on("input", function () {
    temperatureSlider.val(temperatureInput.val());
    updateValues();
    if (!animationRunning) {
        startAnimation();
    }
});

// Update values based on user input
function updateValues() {
    let valueInputs = $(".value-input");
    let inputValues = valueInputs.map(function () {
        return parseFloat($(this).val());
    }).get();
    if (inputValues.length > 0 && inputValues.every(val => !isNaN(val))) {
        values = inputValues;
        softargmaxValues = calculateSoftargmax(values);
        initializeAnimation();
        draw(); // Only draw the updated data without starting the animation
        stopButton.hide();
        startButton.show();
        updateFormulaDisplay();
    } else if (inputValues.length === 0) {
        context.clearRect(0, 0, canvas.width(), canvas.height());
    }
}

// Softargmax function with temperature
function calculateSoftargmax(arr) {
    let temperature = parseFloat(temperatureInput.val());
    const maxVal = subtractMaxCheckbox.is(":checked") ? Math.max(...arr) : 0;
    const expArr = arr.map(x => Math.exp((x - maxVal) / temperature));
    const sumExpArr = expArr.reduce((a, b) => a + b, 0);
    return expArr.map(exp => exp / sumExpArr).map((val, idx) => val * arr[idx]);
}

// Update the formula display
function updateFormulaDisplay() {
    formulaElement.html(`Softargmax: <br> \\( S(x_i) = \\frac{e^{x_i/t}}{\\sum_{j} e^{x_j/t}} \\)`);
    MathJax.typeset(); // Ensure MathJax updates the formula
}

// Handle number of elements change
numElementsInput.on("input", function () {
    let numElements = parseInt($(this).val());
    if (!isNaN(numElements) && numElements > 0) {
        createArrayInputs(numElements);
        updateValues();
    } else {
        context.clearRect(0, 0, canvas.width(), canvas.height());
    }
});

// Initial array values and inputs
createArrayInputs(values.length);

// Event listeners
temperatureSlider.on("input", updateValues);
temperatureInput.on("input", updateValues);
subtractMaxCheckbox.change(updateValues);

let currentValues = [...values];
let animationProgress = 0;
const animationSpeed = 0.01; // Adjust this value to control the speed of the animation
let currentIndex = 0;

function initializeAnimation() {
    currentValues = [...values];
    animationProgress = 0;
    currentIndex = 0;
    draw(true); // Reset to original state
}

function interpolateValue(startVal, endVal, progress) {
    return startVal + (endVal - startVal) * progress;
}

function drawHistogram(data, x, y, width, height, color, expArr, probArr) {
    const barWidth = width / data.length;
    context.fillStyle = color;
    data.forEach((val, index) => {
        const barHeight = val * height; // Normalize bar heights to fit within canvas
        context.fillRect(x + index * barWidth, y + height - barHeight, barWidth - 2, barHeight);

        // Draw exponent and probability values
        context.fillStyle = "black";
        context.font = "12px Arial";
        context.fillText(probArr[index].toFixed(2), x + index * barWidth, y + height + 15);
        context.fillText(expArr[index].toFixed(2), x + index * barWidth, y + height + 30);
        context.fillStyle = color
    });
}

function animate() {
    let Width = canvas.width();
    let Height = canvas.height();
    context.clearRect(0, 0, Width, Height);

    const histogramWidth = Width - 40; // Reduced to fit labels
    const histogramHeight = Height - 80; // Increased height to fit labels

    // Update current value of the current column based on animation progress
    if (currentIndex < values.length) {
        currentValues[currentIndex] = interpolateValue(values[currentIndex], softargmaxValues[currentIndex], animationProgress);
        animationProgress = Math.min(animationProgress + animationSpeed, 1);
        if (animationProgress >= 1) {
            currentIndex++;
            animationProgress = 0;
        }
    }

    // Draw transitioning values histogram
    context.fillStyle = "purple";
    const expArr = values.map(x => Math.exp((x - (subtractMaxCheckbox.is(":checked") ? Math.max(...values) : 0)) / parseFloat(temperatureInput.val())));
    const probArr = expArr.map(exp => exp / expArr.reduce((a, b) => a + b, 0));
    drawHistogram(currentValues, 20, 40, histogramWidth, histogramHeight, "purple", expArr, probArr);

    // Draw labels
    context.fillStyle = "black";
    context.font = "16px Arial";
    context.fillText('Softargmax Values', Width / 2 - 100, 30);

    if (playAnimation) {
        requestAnimationFrame(animate);
    } else {
        animationRunning = false;
    }
}

function draw(reset = false) {
    let Width = canvas.width();
    let Height = canvas.height();
    context.clearRect(0, 0, Width, Height);

    const histogramWidth = Width - 40; // Reduced to fit labels
    const histogramHeight = Height - 80; // Increased height to fit labels

    // Draw original values histogram
    context.fillStyle = reset ? "blue" : "purple";
    const expArr = values.map(x => Math.exp((x - (subtractMaxCheckbox.is(":checked") ? Math.max(...values) : 0)) / parseFloat(temperatureInput.val())));
    const probArr = expArr.map(exp => exp / expArr.reduce((a, b) => a + b, 0));
    drawHistogram(values, 20, 40, histogramWidth, histogramHeight, context.fillStyle, expArr, probArr);

    // Draw labels
    context.fillStyle = "black";
    context.font = "16px Arial";
    if (reset) {
        context.fillText("Original Values", Width / 2 - 50, 30);
    } else {
        context.fillText('Softargmax Values', Width / 2 - 100, 30);
    }
}

function startAnimation() {
    stopButton.show();
    startButton.hide();
    playAnimation = true;
    animationRunning = true;
    requestAnimationFrame(animate);
}

initializeAnimation();
draw();
updateFormulaDisplay();
