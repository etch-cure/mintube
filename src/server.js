import express from "express";
import morgan from "morgan";
import session from "express-session";
import MongoStore from "connect-mongo";
import rootRouter from "./routers/rootRouter";
import videoRouter from "./routers/videoRouter";
import userRouter from "./routers/userRouter";
import { localsMiddleware } from "./middlewares";
 
const app = express();

app.set("view engine", "pug");
app.set("views", "src/views");
const logger = morgan("dev");

app.use(logger);
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    // true: 요청 중에 세션이 수정되지 않은 경우에도 강제로 세션을 저장소에 저장함.
    resave: false,
    // true: 초기화 되지 않은 세션을 저장소에 강제로 저장
    // false: 초기화된 세션만 저장소에 저장 (새 세션이지만 수정되지 않은 세션은 초기화 안함 -> 저장안함)
    saveUninitialized: false, //https://github.com/expressjs/session#saveuninitialized
    store: MongoStore.create({ mongoUrl: process.env.DB_URL }),
  })
);

app.use(localsMiddleware);
app.use("/uploads", express.static("uploads"));
app.use("/", rootRouter);
app.use("/videos", videoRouter);
app.use("/users", userRouter);


export default app;
