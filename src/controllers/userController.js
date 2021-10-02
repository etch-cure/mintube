import User from "../models/User";
import fetch from "node-fetch";
import bcrypt from "bcrypt";
import normalize from 'normalize-path'

const isProduction = process.env.NODE_ENV === 'production';
const gh_client = isProduction ? process.env.GH_CLIENT : process.env.GH_CLIENT_DEV;
const gh_secret = isProduction ? process.env.GH_SECRET : process.env.GH_SECRET_DEV;

export const getJoin = (req, res) => res.render("join", { pageTitle: "Join" });
export const postJoin = async (req, res) => {
  const { name, username, email, password, password2, location } = req.body;
  const pageTitle = "Join";
  if (password !== password2) {
    req.flash("error", "Password confirmation does not match.");
    return res.status(400).render("join", {
      pageTitle,
    });
  }
  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    req.flash("error", "This username/email is already taken.");
    return res.status(400).render("join", {
      pageTitle,
    });
  }
  try {
    await User.create({
      name,
      username,
      email,
      password,
      location,
    });
    return res.redirect("/login");
  } catch (error) {
    req.flash("error", error._message);
    return res.status(400).render("join", {
      pageTitle: "Upload Video",
    });
  }
};
export const getLogin = (req, res) =>
  res.render("login", { pageTitle: "Login" });

export const postLogin = async (req, res) => {
  const { username, password } = req.body;
  const pageTitle = "Login";
  const user = await User.findOne({ username, socialOnly: false });
  if (!user) {
    req.flash("error", "An account with this username does not exists.");
    return res.status(400).render("login", {
      pageTitle,
    });
  }
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    req.flash("error", "Wrong password");
    return res.status(400).render("login", {
      pageTitle,
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  req.flash("success", `Hello!! ${user.name}`);
  return res.redirect("/");
};

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: gh_client,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: gh_client,
    client_secret: gh_secret,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        avatarUrl: userData.avatar_url,
        name: userData.name,
        username: userData.login,
        email: emailObj.email,
        password: "",
        socialOnly: true,
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    req.flash("success", `Hello!! ${user.name}`);
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const logout = (req, res) => {
  req.flash("info", " Bye Bye ");
  req.session.loggedIn = false;
  req.session.user = null;
  setTimeout(() => {
    req.session.destroy();
  }, 1000)
  return res.redirect("/");
};
export const getEdit = (req, res) => {
  return res.render("edit-profile", { pageTitle: "Edit Profile" });
};
export const postEdit = async (req, res) => {
  const {
    session: {
      user: { _id, avatarUrl },
    },
    body: { name, email, username, location },
    file,
  } = req;

  const existUserName = await User.exists({
    username,
    _id: { $ne: _id }
  })
  const existEmail = await User.exists({
    email,
    _id: { $ne: _id }
  })
  if (existUserName | existEmail) {
    const errorMessage = existUserName ? "같은 UserName이 존재합니다." : "같은 Email이 존재합니다."
    req.flash("error", errorMessage);
    return res.status(400).render("edit-profile", {
      pageTitle: "Edit Profile"
    });
  } else {
    const isProduction = process.env.NODE_ENV === 'production'
    const updatedUser = await User.findByIdAndUpdate(
      _id,
      {
        avatarUrl: file ? (isProduction ? file.location : normalize(file.path)) : avatarUrl,
        name,
        email,
        username,
        location,
      },
      { new: true }
    );
    req.session.user = updatedUser;
  }

  req.flash("success", "유저 프로필을 수정하였습니다.");
  return res.redirect("/users/edit");
};

export const getChangePassword = (req, res) => {
  if (req.session.user.socialOnly === true) {
    req.flash("error", "Can't change password.");
    return res.redirect("/");
  }
  return res.render("users/change-password", { pageTitle: "Change Password" });
};

export const postChangePassword = async (req, res) => {
  const {
    session: {
      user: { _id },
    },
    body: { oldPassword, newPassword, newPasswordConfirmation },
  } = req;
  const user = await User.findById(_id);
  const ok = await bcrypt.compare(oldPassword, user.password);
  if (!ok) {
    req.flash("error", "The current password is incorrect");
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
    });
  }
  if (newPassword !== newPasswordConfirmation) {
    req.flash("error", "The password does not match the confirmation");
    return res.status(400).render("users/change-password", {
      pageTitle: "Change Password",
    });
  }
  user.password = newPassword;
  await user.save();
  req.flash("info", "Password updated!!");
  return res.redirect("/users/logout");
};

export const see = async (req, res) => {
  const { id } = req.params;
  // populate 두번해서 video랑 owner가지고 오기
  const user = await User.findById(id).populate({
    path: "videos",
    populate: {
      path: "owner",
      model: "User",
    },
  });
  if (!user) {
    return res.status(404).render("404", { pageTitle: "User not found." });
  }

  return res.render("users/profile", {
    pageTitle: user.name,
    user,
  });
};