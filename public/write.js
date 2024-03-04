const canvas = document.getElementById('canvas');
const recordBtn = document.getElementById('recordBtn');
const playBtn = document.getElementById('playBtn');
const clearBtn = document.getElementById('clearBtn');
const context = canvas.getContext('2d');
const colorPicker = document.getElementById('colorPicker');

let isRecording = false;
let isPlaying = false;
let recordedData = [];
let isDrawing = false;
let lastDrawTime = 0;
recordBtn.addEventListener('click', toggleRecording);
playBtn.addEventListener('click', playAnimation);
clearBtn.addEventListener('click', reset);
canvas.addEventListener('mousedown', startDrawing);
canvas.addEventListener('mouseup', stopDrawing);
canvas.addEventListener('mousemove', draw);

colorPicker.addEventListener('change', (e) => {
  const color = e.target.value;
  context.strokeStyle = color;
});


const container = document.getElementById('container');

function resizeCanvas() {
  canvas.width = container.offsetWidth;
  canvas.height = container.offsetHeight;
}

window.addEventListener('resize', resizeCanvas);

// Initial resizing
resizeCanvas();

function reset(){
	  recordedData.length=0;
	  clearCanvas();
}
function toggleRecording() {
  isRecording = !isRecording;
  recordBtn.textContent = isRecording ? 'Stop Recording' : 'Start Recording';
}

function playAnimation() {
  if (recordedData.length === 0) {
    return;
  }
  isPlaying = true;
  clearCanvas();
  animate();
}

function startDrawing(event) {

isRecording=true;
  if (!isRecording) {
    return;
  }
  isDrawing = true;
  lastDrawTime = new Date();
  
  	 context.beginPath();
  const { offsetX, offsetY } = event;
	   context.moveTo(offsetX, offsetY);
	     recordedData.push({ x: offsetX, y: offsetY,t:-1 });
}

function stopDrawing() {
  isDrawing = false;
 
}


function draw(event) {
  if (!isRecording || !isDrawing) {
    return;
  }
  const { offsetX, offsetY } = event;
  recordedData.push({ x: offsetX, y: offsetY,t:new Date().getTime()-lastDrawTime.getTime() });
  context.lineTo(offsetX, offsetY);
  context.stroke();
  lastDrawTime = new Date();
}

function clearCanvas() {
  context.clearRect(0, 0, canvas.width, canvas.height);

}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
async function animate() {
  if (!isPlaying) {
    return;
  }
  clearCanvas();
  context.beginPath();


  for (let i = 0; i < recordedData.length; i++) {
    const { x, y,t } = recordedData[i];
	console.log(x,y,t);

	if(t<0) {
		context.beginPath();
			context.moveTo(x, y);
		}else{
	context.lineTo(x, y);
    context.stroke();
		}

	await sleep(t);
  }
}