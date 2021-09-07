const startBtn = document.getElementById("startBtn");
const video = document.getElementById("preview");

let stream;
let recorder;
let videoFile;

const handleDownload = () => {
  const a = document.createElement("a");
  a.href = videoFile;
  a.download = "MyRecording.webm";
  document.body.appendChild(a);
  a.click();
};

const handleStop = () => {
  startBtn.innerText = "Download Recording";
  startBtn.removeEventListener("click", handleStop);
  startBtn.addEventListener("click", handleDownload);
  recorder.stop();
};

const handleStart = () => {
  startBtn.innerText = "Stop Recording";
  startBtn.removeEventListener("click", handleStart);
  startBtn.addEventListener("click", handleStop);
  recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  // data를 이용할수 있을때 발생하는 이벤트 (stop한 이후에도 발생)
  recorder.ondataavailable = (event) => {
    // 중요!! blob data를 브라우저내의 url로 바꾸어서 사용 (브라우저내의 메모리에 있음)
    // base64 데이터도 blob으로 바꾸거나 URL로 바꾸어 사용할수있는지 궁금
    // ToDo: base64를 url로 바꾸어 사용하는 패키지 만들기
    videoFile = URL.createObjectURL(event.data);
    video.srcObject = null;
    video.src = videoFile;
    video.loop = true;
    video.play();
  };
};

const init = async () => {
  stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: true,
  });
  video.srcObject = stream;
  video.play();
};

startBtn.addEventListener("click", handleStart);