const uploadImage = document.getElementById("upload-img");

const imageLayer = document.querySelector(".image-layer");
const drawLayer = document.querySelector(".draw-layer");
const imageCont = imageLayer.getContext("2d");
const drawCont = drawLayer.getContext("2d");

//Default tools
let drawing = false;
let currentTool = "pen";
let brushSize = 2;
let brushColor = "#000000";
const undoStack = [];
const redoStack = [];

function selectTool(tool) {
  currentTool = tool;
}

//connect input changes to the brush size and color
document.getElementById("brushColor").oninput = (e) =>
  (brushColor = e.target.value);
document.getElementById("brushSize").oninput = (e) =>
  (brushSize = e.target.value);

//listen for mouse actions on the canvas..draw section
drawLayer.addEventListener("mousedown", startDraw);
drawLayer.addEventListener("mousemove", draw);
drawLayer.addEventListener("mouseup", endDraw);
drawLayer.addEventListener("mouseout", endDraw);

//startDraw
function startDraw(e) {
  drawing = true;
  drawCont.beginPath();
  drawCont.moveTo(e.offsetX, e.offsetY);
  savestate();
}

function draw(e) {
  if (drawing === false) {
    return;
  }

  if (currentTool === "pen") {
    drawCont.strokeStyle = brushColor;
    drawCont.lineWidth = brushSize;
    drawCont.lineCap = "round";
    drawCont.lineTo(e.offsetX, e.offsetY);
    drawCont.stroke();
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
  }
}

//savestate
function savestate() {
  undoStack.push(drawLayer.toDataURL());
  redoStack.length = 0;
}

function endDraw() {
  drawing = false;
  drawCont.closePath();
}

//upload image to the imagecont
uploadImage.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    imageCont.drawImage(img, 0, 0, imageLayer.width, imageLayer.height);
  };
  img.src = URL.createObjectURL(file);
});

function undo() {
  if (undoStack.length === 0) {
    return;
  }
  redoStack.push(drawLayer.toDataURL());
  const last = undoStack.pop();
  const img = new Image();
  img.onload = () => {
    drawCont.clearRect(0, 0, drawLayer.width, drawLayer.height);
    drawCont.drawImage(img, 0, 0);
  };
  img.src = last;
}

function redo() {
  if (redoStack.length === 0) return;

  // Save current state before redoing
  undoStack.push(drawLayer.toDataURL());

  const next = redoStack.pop();
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

//  Very basic fill tool (only fills background)
function fillCanvas() {
  drawCtx.fillStyle = brushColor;
  drawCtx.fillRect(0, 0, drawCanvas.width, drawCanvas.height);
}

// Hook fill tool button
drawCanvas.addEventListener("click", function (e) {
  if (currentTool === "fill") {
    fillCanvas(); // Simplified version, for complex area-fill use flood fill logic
    saveState();
  }
});
