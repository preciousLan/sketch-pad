document.getElementById("upload-img");

const imageLayer = document.querySelector(".image-layer");
const drawLayer = document.querySelector(".draw-layer");
const imageCont = imageLayer.getContext("2d");
const drawCont = drawLayer.getContext("2d");

//Default tools
let drawing = false;
let currentTool = "pen";
let brushSize = 2;
let brushColor = "#000000";

function selectTool(tool) {
  currentTool = tool;
}

//connect input changes to the brush size and color
document.getElementById("brushColor").oninput = (e) =>
  (brushColor = e.target.value);
document.getElementById("brushSize").oninput = (e) =>
  (brushSize = e.target.value);

//listen for mouse actions on the canvas..draw section
drawLayer.addEventListener("mousedown", starDraw);
drawLayer.addEventListener("mousemove", draw);
drawLayer.addEventListener("mouseup", endDraw);
drawLayer.addEventListener("mouseout", endDraw);

//startDraw
function starDraw(e) {
  drawing = true;
  drawCont.beginPath();
  drawCont.moveTo(e.offsetX, e.offsetY);
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

function endDraw() {
  drawing = false;
  drawCont.closePath();
}
