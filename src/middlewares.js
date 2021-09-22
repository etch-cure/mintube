import multer from "multer";
import multerS3 from 'multer-s3'
import aws from 'aws-sdk'

const isProduction = process.env.NODE_ENV === 'production'

const s3 = new aws.S3({
  credentials: {
    accessKeyId: process.env.AWS_ID,
    secretAccessKey: process.env.AWS_SECRET
  }
})
export const localsMiddleware = (req, res, next) => {
  res.locals.loggedIn = Boolean(req.session.loggedIn);
  res.locals.siteName = "Wetube";
  res.locals.loggedInUser = req.session.user || {};
  res.locals.isProduction = isProduction
  next();
};

const s3ImageUploader = multerS3({
  s3: s3,
  bucket: 'mintube-container/images',
  // 버킷 객체의 접근 권한 (default: private => CORS 문제 발생할 수)
  // https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html#canned-acl
  acl: 'public-read'
})

const s3VideoUploader = multerS3({
  s3: s3,
  bucket: 'mintube-container/videos',
  // 버킷 객체의 접근 권한 (default: private => CORS 문제 발생할 수)
  // https://docs.aws.amazon.com/AmazonS3/latest/userguide/acl-overview.html#canned-acl
  acl: 'public-read'
})

export const protectorMiddleware = (req, res, next) => {
  if (req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Not authorized");
    return res.redirect("/login");
  }
};

export const publicOnlyMiddleware = (req, res, next) => {
  if (!req.session.loggedIn) {
    return next();
  } else {
    req.flash("error", "Log in first.");
    return res.redirect("/");
  }
};

export const avatarUpload = multer({
  dest: "uploads/avatars/",
  limits: {
    fileSize: 3000000,
  },
  storage: isProduction ? s3ImageUploader : undefined
});
export const videoUpload = multer({
  dest: "uploads/videos/",
  limits: {
    fileSize: 10000000,
  },
  storage: isProduction ? s3VideoUploader : undefined
});