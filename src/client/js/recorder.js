import { createFFmpeg, fetchFile } from "@ffmpeg/ffmpeg";
import { showMsg } from "./msgComponent.js"
const actionBtn = document.getElementById("actionBtn");
const video = document.getElementById("preview");
const recordTime = document.getElementById("record-time");
const recordScreen = document.getElementById("record-screen");
const recordCamera = document.getElementById("record-camera");

let stream;
let recorder;
let videoFile;

const files = {
  input: "recording.webm",
  output: "output.mp4",
  thumb: "thumbnail.jpg",
};

const downloadFile = (fileUrl, fileName) => {
  const a = document.createElement("a");
  a.href = fileUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
};

const handleDownload = async () => {
  actionBtn.removeEventListener("click", handleDownload);
  actionBtn.innerText = "Transcoding...";
  actionBtn.disabled = true;

  try {
    // ffmpeg 로드
    const ffmpeg = createFFmpeg({
      corePath: '/ffmpeg/ffmpeg-core.js',
      log: true,
    });
    await ffmpeg.load();
  
    // videoFile데이터를 ffmpeg에 쓰기(로드)
    ffmpeg.FS("writeFile", files.input, await fetchFile(videoFile));
  
    // 로드한 파일을 60프레임의 mp4파일로 변경
    await ffmpeg.run("-i", files.input, "-r", "60", files.output);
  
    // 썸네일 생성
    await ffmpeg.run(
      "-i",
      files.input,
      "-ss",
      "00:00:01",
      "-frames:v",
      "1",
      files.thumb
    );
  
    // 변경한 파일을 Uint8Array 로 변경
    const mp4File = ffmpeg.FS("readFile", files.output);
    const thumbFile = ffmpeg.FS("readFile", files.thumb);
  
    // 블롭 만들기
    const mp4Blob = new Blob([mp4File.buffer], { type: "video/mp4" });
    const thumbBlob = new Blob([thumbFile.buffer], { type: "image/jpg" });
  
    // 가짜 url 만들기
    const mp4Url = URL.createObjectURL(mp4Blob);
    const thumbUrl = URL.createObjectURL(thumbBlob);
  
    downloadFile(mp4Url, "MyRecording.mp4");
    downloadFile(thumbUrl, "MyThumbnail.jpg");
    
    ffmpeg.FS("unlink", files.input);
    ffmpeg.FS("unlink", files.output);
    ffmpeg.FS("unlink", files.thumb);
  
    URL.revokeObjectURL(mp4Url);
    URL.revokeObjectURL(thumbUrl);
    URL.revokeObjectURL(videoFile);
  
    showMsg('녹화 및 파일 변환에 성공했습니다. 다운로드를 확인해주세요.', 'success');
  }
  catch (error) {
    showMsg('녹화 혹은 파일 변환에 실패했습니다. 다운로드를 확인해주세요.', 'error');
  }

  actionBtn.disabled = false;
  actionBtn.innerText = "Record Again";
  actionBtn.onclick = handleStart;
};

const handleStart = () => {
  if (stream === null || stream === undefined) {
    showMsg('선택한 레코딩 미디어가 없습니다.', 'error');
    throw new Error ('선택한 레코딩 미디어가 없습니다.');
  }
  const recordingTime = parseInt(recordTime.value);
  if (recordingTime === NaN || recordingTime < 2) {
    showMsg('레코딩 시간이 잘못 되었습니다. 2초 이상 입력해주세요', 'error');
    recordTime.value = 2;
    throw new Error('레코딩 시간이 잘못 되었습니다.');
  }
  actionBtn.innerText = "Recording";
  actionBtn.disabled = true;

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
    actionBtn.innerText = "Download";
    actionBtn.disabled = false;
    actionBtn.onclick = handleDownload;
  };

  try {
    recorder.start();
  } catch (error) {
    showMsg('녹화할 미디어를 찾지 못하였습니다. 녹화할 미디어를 선택해주세요.', 'error');
    actionBtn.disabled = false;
    actionBtn.innerText = "Start Recording";
    actionBtn.onclick = handleStart;
  }
  setTimeout(() => {
    recorder.stop();
  }, recordingTime * 1000);
};

const handleSelectScreen = async () => {
  try {
    stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: {
        width: 1024,
        height: 576,
      },
    });
    video.srcObject = stream;
    video.play();
    actionBtn.disabled = false;
    actionBtn.innerText = "Start Recording";
  } catch (error) {
    actionBtn.disabled = true;
    actionBtn.innerText = "Select Recorder";
    showMsg('녹화할 미디어를 찾지 못하였습니다. 녹화할 미디어를 선택해주세요.', 'error');
  }
  actionBtn.onclick = handleStart;
};

const handleSelectCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    });
    video.srcObject = stream;
    video.play();
    actionBtn.disabled = false;
    actionBtn.innerText = "Start Recording";
  } catch (error) {
    actionBtn.disabled = true;
    actionBtn.innerText = "Select Recorder";
    showMsg('녹화할 미디어를 찾지 못하였습니다. 녹화할 미디어를 선택해주세요.', 'error');
  }
  actionBtn.onclick = handleStart;
};

recordScreen.addEventListener("click", handleSelectScreen);
recordCamera.addEventListener("click", handleSelectCamera);

handleSelectScreen();
