let canvas = $("#Canvas");
let context = canvas.get(0).getContext("2d");

// Function to resize the canvas
function resizeCanvas() {
    const canvasContainer = $("#canvasContainer");
    canvas.attr("width", canvasContainer.width());
    canvas.attr("height", canvasContainer.height());
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
let updateButton = $("#update");
let numElementsInput = $("#numElementsInput");
let arrayInputsContainer = $("#arrayInputsContainer");
let fileUpload = $("#fileUpload");
let algorithmSelect = $("#algorithm");
let formulaElement = $("#softmaxFormula");
let temperatureSlider = $("#temperatureSlider");
let temperatureInput = $("#temperatureInput");
let subtractMaxCheckbox = $("#subtractMax");
let exponentInfo = $("#exponentInfo");
let sumInfo = $("#sumInfo");
let probabilityInfo = $("#probabilityInfo");

let values = [1.0, 2.0, 3.0, 2.5, 1.5, 2.7];
let softmaxValues = calculateAlgorithm(values);

// Function to create array input elements
function createArrayInputs(numElements) {
    arrayInputsContainer.empty();
    for (let i = 0; i < numElements; i++) {
        let value = values[i] || 0;
        let arrayInput = $(`
            <div class="array-input">
                <input type="number" class="value-input" min="0" max="10" step="0.1" value="${value}" data-index="${i}">
                <input type="range" class="value-slider" min="0" max="10" step="0.1" value="${value}" data-index="${i}">
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
    });
    valueInputs.on("input", function () {
        let index = $(this).data("index");
        valueSliders.eq(index).val($(this).val());
        updateValues();
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
});

// Code to handle Reset button
resetButton.click(function () {
    playAnimation = false;
    initializeAnimation();
    draw(true); // Pass true to reset to the original state
});

// Sync temperature slider and input
temperatureSlider.on("input", function () {
    temperatureInput.val(temperatureSlider.val());
    updateValues();
});
temperatureInput.on("input", function () {
    temperatureSlider.val(temperatureInput.val());
    updateValues();
});

// Hide temperature controls for softmax
algorithmSelect.change(function() {
    if (algorithmSelect.val() === 'softargmax') {
        $("#temperatureControl").show();
    } else {
        $("#temperatureControl").hide();
    }
    updateValues();
});
$("#temperatureControl").hide(); // Hide initially for softmax

// Original Softmax function
function softmax(arr) {
    const maxVal = subtractMaxCheckbox.is(":checked") ? Math.max(...arr) : 0;
    const expArr = arr.map(x => Math.exp(x - maxVal));
    const sumExpArr = expArr.reduce((a, b) => a + b, 0);
    return expArr.map(exp => exp / sumExpArr);
}

// Softargmax function with temperature
function softargmax(arr, t) {
    const maxVal = subtractMaxCheckbox.is(":checked") ? Math.max(...arr) : 0;
    const expArr = arr.map(x => Math.exp((x - maxVal) / t));
    const sumExpArr = expArr.reduce((a, b) => a + b, 0);
    return expArr.map(exp => exp / sumExpArr).map((val, idx) => val * arr[idx]);
}

// Update values based on user input
function updateValues() {
    let valueInputs = $(".value-input");
    let inputValues = valueInputs.map(function () {
        return parseFloat($(this).val());
    }).get();
    if (inputValues.length > 0 && inputValues.every(val => !isNaN(val))) {
        values = inputValues;
        softmaxValues = calculateAlgorithm(values);
        initializeAnimation();
        draw(); // Only draw the updated data without starting the animation
        stopButton.hide();
        startButton.show();
        updateFormulaDisplay();
        updateIntermediaryInfo();
    } else if (inputValues.length === 0) {
        context.clearRect(0, 0, canvas.width(), canvas.height());
    }
}

// Calculate based on selected algorithm
function calculateAlgorithm(arr) {
    let algorithm = algorithmSelect.val();
    let temperature = parseFloat(temperatureInput.val());
    if (algorithm === 'softargmax') {
        return softargmax(arr, temperature);
    } else {
        return softmax(arr);
    }
}

// Update the formula display
function updateFormulaDisplay() {
    let algorithm = algorithmSelect.val();
    if (algorithm === 'softargmax') {
        formulaElement.html(`Softargmax: <br> \\( S(x_i) = \\frac{e^{x_i/t}}{\\sum_{j} e^{x_j/t}} \\)`);
    } else {
        formulaElement.html(`Softmax: <br> \\( S(x_i) = \\frac{e^{x_i}}{\sum_{j} e^{x_j}} \\)`);
    }
    MathJax.typeset(); // Ensure MathJax updates the formula
}

// Update intermediary information
function updateIntermediaryInfo() {
    let algorithm = algorithmSelect.val();
    let temperature = parseFloat(temperatureInput.val());
    const maxVal = subtractMaxCheckbox.is(":checked") ? Math.max(...values) : 0;
    let expArr;
    if (algorithm === 'softargmax') {
        expArr = values.map(x => Math.exp((x - maxVal) / temperature));
    } else {
        expArr = values.map(x => Math.exp(x - maxVal));
    }
    let sumExp = expArr.reduce((a, b) => a + b, 0);
    let probArr = expArr.map(exp => exp / sumExp);

    exponentInfo.html(`Exponent: ${expArr.map(e => e.toFixed(2)).join(', ')}`);
    sumInfo.html(`Sum: ${sumExp.toFixed(2)}`);
    probabilityInfo.html(`Probability: ${probArr.map(p => p.toFixed(2)).join(', ')}`);
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const inputValues = content.split(',').map(Number);
            const numElements = inputValues.length;
            numElementsInput.val(numElements);
            createArrayInputs(numElements);
            if (inputValues.every(val => !isNaN(val))) {
                values = inputValues;
                let valueInputs = $(".value-input");
                valueInputs.each(function (index) {
                    $(this).val(inputValues[index]);
                    let valueSliders = $(".value-slider");
                    valueSliders.eq(index).val(inputValues[index]);
                });
                softmaxValues = calculateAlgorithm(values);
                initializeAnimation();
                draw(); // Only draw the updated data without starting the animation
                stopButton.hide();
                startButton.show();
                updateFormulaDisplay();
                updateIntermediaryInfo();
            } else {
                alert("The file contains an invalid array of numbers.");
            }
        };
        reader.readAsText(file);
    }
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
updateButton.click(updateValues);
fileUpload.change(handleFileUpload);
algorithmSelect.change(() => {
    softmaxValues = calculateAlgorithm(values);
    draw(); // Only draw the updated data without starting the animation
    stopButton.hide();
    startButton.show();
    updateFormulaDisplay();
    updateIntermediaryInfo();
});
subtractMaxCheckbox.change(() => {
    updateValues();
});

let currentValues = [...values];
let animationProgress = 0;
const animationSpeed = 0.01; // Adjust this value to control the speed of the animation
let currentIndex = 0;

function initializeAnimation() {
    currentValues = [...values];
    animationProgress = 0;
    currentIndex = 0;
}

function interpolateValue(startVal, endVal, progress) {
    return startVal + (endVal - startVal) * progress;
}

function drawHistogram(data, x, y, width, height, color) {
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const barWidth = width / data.length;
    const minBarHeight = 5; // Minimum height for very small values
    context.fillStyle = color;
    data.forEach((val, index) => {
        const barHeight = Math.max(((val - minVal) / (maxVal - minVal)) * height, minBarHeight); // Scale bar heights
        context.fillRect(x + index * barWidth, y + height - barHeight, barWidth - 2, barHeight);
    });
}

function animate() {
    let Width = canvas.width();
    let Height = canvas.height();
    context.clearRect(0, 0, Width, Height);

    const histogramWidth = Width - 40; // Reduced to fit labels
    const histogramHeight = Height - 60; // Reduced to fit labels

    // Update current value of the current column based on animation progress
    if (currentIndex < values.length) {
        currentValues[currentIndex] = interpolateValue(values[currentIndex], softmaxValues[currentIndex], animationProgress);
        animationProgress = Math.min(animationProgress + animationSpeed, 1);
        if (animationProgress >= 1) {
            currentIndex++;
            animationProgress = 0;
        }
    }

    // Draw transitioning values histogram
    const algorithm = algorithmSelect.val();
    const color = algorithm === 'softargmax' ? 'purple' : 'green';
    drawHistogram(currentValues, 20, 40, histogramWidth, histogramHeight, color);

    // Draw labels
    context.fillStyle = "black";
    context.font = "16px Arial";
    const label = algorithm === 'softargmax' ? 'Softargmax Values' : 'Softmax Values';
    context.fillText(label, Width / 2 - 100, 30);

    if (playAnimation) {
        requestAnimationFrame(animate);
    }
}

function draw(reset = false) {
    let Width = canvas.width();
    let Height = canvas.height();
    context.clearRect(0, 0, Width, Height);

    const histogramWidth = Width - 40; // Reduced to fit labels
    const histogramHeight = Height - 60; // Reduced to fit labels

    // Draw original values histogram
    drawHistogram(values, 20, 40, histogramWidth, histogramHeight, "blue");

    // Draw labels
    context.fillStyle = "black";
    context.font = "16px Arial";
    if (reset) {
        context.fillText("Original Values", Width / 2 - 50, 30);
    } else {
        const algorithm = algorithmSelect.val();
        const label = algorithm === 'softargmax' ? 'Softargmax Values' : 'Softmax Values';
        context.fillText(label, Width / 2 - 100, 30);
    }
}

initializeAnimation();
draw();
updateFormulaDisplay();
updateIntermediaryInfo();
