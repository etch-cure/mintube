const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require("path");

module.exports = {
  entry: "./src/client/js/main.js",
  mode: "development",
  // 코드 바뀔때 자동으로 다시빌드
  watch: true,
  plugins: [
    new MiniCssExtractPlugin({
      filename: "css/styles.css",
    }),
  ],
  output: {
    filename: "js/main.js",
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