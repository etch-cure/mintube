import "regenerator-runtime";
// 코드보니깐 dotenv를 import해서 config함수를 실행해줌
import "dotenv/config";
import "./db";
import "./models/User";
import "./models/Video";
import "./models/Comment";
import app from "./server";

const PORT = process.env.PORT || 4000;

const handleListening = () =>
  console.log(`✅ Server listenting on http://localhost:${PORT} 🚀`);

app.listen(PORT, handleListening);