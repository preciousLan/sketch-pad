const uploadImage = document.getElementById("upload-img");

const imageLayer = document.querySelector(".image-layer");
const drawLayer = document.querySelector(".draw-layer");
const imageCont = imageLayer.getContext("2d");
const drawCont = drawLayer.getContext("2d");

// Default tools
let drawing = false;
let currentTool = "pen";
let brushSize = 2;
let brushColor = "#000000";
let undoStack = [];
let redoStack = [];
let currentPath = [];

function selectTool(tool) {
  currentTool = tool;
  // Indicate active button
  document.querySelectorAll('.tool-btn').forEach(btn => {
    if (btn.dataset.tool === tool) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Restore default cursor for eraser (no ash circle overlay)
  if (tool === "eraser") {
    drawLayer.style.cursor = "crosshair";
    drawLayer.classList.remove("eraser-cursor");
  } else {
    drawLayer.style.cursor = "crosshair";
    drawLayer.classList.remove("eraser-cursor");
  }
}

// Connect input changes to the brush size and color
document.getElementById("brushColor").oninput = (e) =>
  (brushColor = e.target.value);
document.getElementById("brushSize").oninput = (e) => {
  brushSize = e.target.value;
  // No eraser cursor overlay to update
};

// Listen for mouse actions on the canvas..draw section
drawLayer.addEventListener("mousedown", startDraw);
drawLayer.addEventListener("mousemove", draw);
drawLayer.addEventListener("mouseup", endDraw);
drawLayer.addEventListener("mouseout", endDraw);

// Save initial blank state and set initial tool
window.addEventListener("DOMContentLoaded", () => {
  saveState();
  selectTool(currentTool);
  // Hide eraser cursor on load
  drawLayer.style.setProperty('--eraser-x', `-100px`);
  drawLayer.style.setProperty('--eraser-y', `-100px`);
  drawLayer.style.setProperty('--eraser-size', `32px`);
  // Attach tool button click events
  document.querySelectorAll('.tool-btn').forEach(btn => {
    btn.addEventListener('click', () => selectTool(btn.dataset.tool));
  });
});

//startDraw
function startDraw(e) {
  drawing = true;
  drawCont.beginPath();
  drawCont.moveTo(e.offsetX, e.offsetY);
  currentPath = [[e.offsetX, e.offsetY]];
  saveState(); // Save state before starting a new path
}

function draw(e) {
  // Remove eraser cursor overlay logic
  if (!drawing) return;

  if (currentTool === "pen") {
    drawCont.strokeStyle = brushColor;
    drawCont.lineWidth = brushSize;
    drawCont.lineCap = "round";
    drawCont.lineTo(e.offsetX, e.offsetY);
    drawCont.stroke();
    currentPath.push([e.offsetX, e.offsetY]);
  } else if (currentTool === "eraser") {
    drawCont.save();
    drawCont.beginPath();
    drawCont.arc(e.offsetX, e.offsetY, brushSize / 2, 0, Math.PI * 2);
    drawCont.clip();
    drawCont.clearRect(
      e.offsetX - brushSize / 2,
      e.offsetY - brushSize / 2,
      brushSize,
      brushSize
    );
    drawCont.restore();
    // Do not call saveState here
  }
}

//savestate
function saveState() {
  undoStack.push(drawLayer.toDataURL());
  redoStack.length = 0;
}

function endDraw() {
  if (drawing) {
    saveState();
  }
  drawing = false;
  drawCont.closePath();
}

//upload image to the imagecont
uploadImage.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    imageCont.clearRect(0, 0, imageLayer.width, imageLayer.height);

    // Calculate aspect ratio fit
    const canvasWidth = imageLayer.width;
    const canvasHeight = imageLayer.height;
    const imgWidth = img.width;
    const imgHeight = img.height;

    const scale = Math.min(canvasWidth / imgWidth, canvasHeight / imgHeight);
    const drawWidth = imgWidth * scale;
    const drawHeight = imgHeight * scale;
    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;

    imageCont.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  };
  img.src = URL.createObjectURL(file);
});

function undo() {
  if (undoStack.length <= 1) {
    return;
  }
  redoStack.push(undoStack.pop());
  const last = undoStack[undoStack.length - 1];
  const img = new Image();
  img.onload = () => {
    drawCont.clearRect(0, 0, drawLayer.width, drawLayer.height);
    drawCont.drawImage(img, 0, 0);
  };
  img.src = last;
}

function redo() {
  if (redoStack.length === 0) return;

  const next = redoStack.pop();
  undoStack.push(next);
  const img = new Image();
  img.onload = () => {
    drawCont.clearRect(0, 0, drawLayer.width, drawLayer.height);
    drawCont.drawImage(img, 0, 0);
  };
  img.src = next;
}

function saveDrawing() {
  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = imageLayer.width;
  finalCanvas.height = imageLayer.height;
  const ctx = finalCanvas.getContext("2d");
  ctx.drawImage(drawLayer, 0, 0);
  const link = document.createElement("a");
  link.download = "drawing.png";
  link.href = finalCanvas.toDataURL();
  link.click();
}

function hexToRgba(hex) {
  // Convert hex color to [r,g,b,a]
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [
    (num >> 16) & 255,
    (num >> 8) & 255,
    num & 255,
    255
  ];
}

function colorMatch(a, b) {
  // Compare [r,g,b,a] arrays
  return a[0] === b[0] && a[1] === b[1] && a[2] === b[2] && a[3] === b[3];
}

function fillAt(x, y) {
  const ctx = drawCont;
  const width = drawLayer.width;
  const height = drawLayer.height;
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  const startIdx = (Math.floor(y) * width + Math.floor(x)) * 4;
  const targetColor = [
    data[startIdx],
    data[startIdx + 1],
    data[startIdx + 2],
    data[startIdx + 3]
  ];
  const fillColor = hexToRgba(brushColor);

  if (colorMatch(targetColor, fillColor)) return; // Already filled

  const stack = [[Math.floor(x), Math.floor(y)]];
  while (stack.length) {
    const [cx, cy] = stack.pop();
    if (cx < 0 || cy < 0 || cx >= width || cy >= height) continue;
    const idx = (cy * width + cx) * 4;
    const pixel = [
      data[idx],
      data[idx + 1],
      data[idx + 2],
      data[idx + 3]
    ];
    if (!colorMatch(pixel, targetColor)) continue;

    // Set pixel to fill color
    data[idx] = fillColor[0];
    data[idx + 1] = fillColor[1];
    data[idx + 2] = fillColor[2];
    data[idx + 3] = fillColor[3];

    // Push neighbors
    stack.push([cx + 1, cy]);
    stack.push([cx - 1, cy]);
    stack.push([cx, cy + 1]);
    stack.push([cx, cy - 1]);
  }
  ctx.putImageData(imageData, 0, 0);
}

// Hook fill tool button
drawLayer.addEventListener("click", function (e) {
  if (currentTool === "fill") {
    fillAt(e.offsetX, e.offsetY);
    saveState();
  }
});
