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
let arrayInput = $("#arrayInput");
let fileUpload = $("#fileUpload");

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
    draw();
});

// Softmax function
function softmax(arr) {
    const maxVal = Math.max(...arr);
    const expArr = arr.map(x => Math.exp(x - maxVal));
    const sumExpArr = expArr.reduce((a, b) => a + b, 0);
    return expArr.map(exp => exp / sumExpArr);
}

// Update values based on user input
function updateValues() {
    let inputValues = arrayInput.val().split(',').map(Number);
    if (inputValues.length > 0 && inputValues.every(val => !isNaN(val))) {
        values = inputValues;
        softmaxValues = softmax(values);
        initializeAnimation();
        draw(); // Only draw the updated data without starting the animation
        stopButton.hide();
        startButton.show();
    } else {
        alert("Please enter a valid array of numbers.");
    }
}

// Handle file upload
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const content = e.target.result;
            const inputValues = content.split(',').map(Number);
            if (inputValues.length > 0 && inputValues.every(val => !isNaN(val))) {
                values = inputValues;
                softmaxValues = softmax(values);
                arrayInput.val(content); // Update the text input with file content
                initializeAnimation();
                draw(); // Only draw the updated data without starting the animation
                stopButton.hide();
                startButton.show();
            } else {
                alert("The file contains an invalid array of numbers.");
            }
        };
        reader.readAsText(file);
    }
}

// Initial array values
let values = [1.0, 2.0, 3.0, 2.5, 1.5];
let softmaxValues = softmax(values);

// Event listeners
updateButton.click(updateValues);
fileUpload.change(handleFileUpload);

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
    drawHistogram(currentValues, 20, 40, histogramWidth, histogramHeight, "green");

    // Draw labels
    context.fillStyle = "black";
    context.font = "16px Arial";
    context.fillText("Original Values to Softmax Values", Width / 2 - 100, 30);

    if (playAnimation) {
        requestAnimationFrame(animate);
    }
}

function draw() {
    let Width = canvas.width();
    let Height = canvas.height();
    context.clearRect(0, 0, Width, Height);

    const histogramWidth = Width - 40; // Reduced to fit labels
    const histogramHeight = Height - 60; // Reduced to fit labels

    // Draw original values histogram
    drawHistogram(values, 20, 40, histogramWidth, histogramHeight, "green");

    // Draw labels
    context.fillStyle = "black";
    context.font = "16px Arial";
    context.fillText("Original Values", Width / 2 - 50, 30);
}

initializeAnimation();
draw();
