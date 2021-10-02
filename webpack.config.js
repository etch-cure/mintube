const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");
const BASE_JS = "./src/client/js/";
module.exports = {
  entry: {
    main: BASE_JS + "main.js",
    videoPlayer: BASE_JS + "videoPlayer.js",
    recorder: BASE_JS + "recorder.js",
    commentSection: BASE_JS + "commentSection.js",
    msgComponent: BASE_JS + "msgComponent.js",
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/styles.css",
    }),
  ],
  output: {
    // [name] => entry의 key값
    filename: "js/[name].js",
    path: path.resolve(__dirname, "assets"),
    // 지우고 다시 빌드
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [["@babel/preset-env", { targets: "defaults" }]],
          },
        },
      },
      {
        test: /\.scss$/,
        // 로더는 역순으로 로드됨!!
        // style-loader: js에서 스타일을 넣는거-> js가 커짐, 별로임
        // MiniCssExtractPlugin로 변경
        use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
      },
    ],
  },
};