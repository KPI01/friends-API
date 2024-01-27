const crypto = require("crypto");
const express = require("express");
const session = require("express-session");
const jwt = require("jsonwebtoken");
const routes = require("./router/friends");

const app = new express();

let users = {};

/**
 *
 * @param {string} username
 * @returns {boolean}
 */
function doesExist(name) {
  let user = users[name];

  if (user) {
    return true;
  } else {
    return false;
  }
}
/**
 *
 * @param {string} email
 * @param {string} password
 * @returns {object}
 */
function validateUser(email, password) {
  const user = users[email];
  console.log(user);
  const passSaved = user.password;

  if (email && password) {
    if (passSaved) {
      const passDecrypted = decrypt(passSaved);
      if (passDecrypted === password) {
        return { isValid: true };
      } else {
        return { isValid: false, reason: "Invalid data" };
      }
    } else {
      return {
        isValid: false,
        reason:
          "Is not possible to read user's password, possibly user doesn't exist",
      };
    }
  } else {
    let missingData = []
    if (!email) missingData.push('email')
    if (!password) missingData.push('clave')
    return {
      isValid: false,
      reason: `Missing data: ${missingData.join(', ')}`
    }
  }
}

// Session data
const SECRET = crypto.randomBytes(32);
const ALGORITHM = "aes-256-cbc";
const IV = crypto.randomBytes(16);

// Functions encrypt and decrypt
/**
 * 
 * @param {string} text
 * @returns {string}
 */
function encrypt(text) {
  const CIPHER = crypto.createCipheriv(ALGORITHM, SECRET, IV);
  const encrypt = CIPHER.update(text, "utf-8", "hex") + CIPHER.final("hex");
  return encrypt;
}
/**
 * 
 * @param {string} textEncrypted
 * @returns {string}
 */
function decrypt(textEncrypted) {
  const DECIPHER = crypto.createDecipheriv(ALGORITHM, SECRET, IV);
  const decrypt =
    DECIPHER.update(textEncrypted, "hex", "utf-8") + DECIPHER.final("utf-8");
  return decrypt;
}

app.use(
  session({
    secret: SECRET.toString("utf-8"),
    resave: true,
    saveUninitialized: true,
  })
);
app.use(express.json());

// GET request: welcome to API
app.get("/", function (req, res) {
  return res.json({ message: "Welcome to friends app!" });
});

// POST request: register user
app.post("/register", function (req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const pass = req.body.password;

  if (name && email && pass) {
    if (doesExist(name)) {
      return res.json({ message: "User already exists!" });
    } else {
      users[email] = {
        name: name,
        password: encrypt(pass),
      };
      return res.json({
        message: "User has been added successfully",
        userAdded: users[email],
      });
    }
  } else {
    let missingData = [];
    if (!name) missingData.push("nombre");
    if (!email) missingData.push("email");
    if (!pass) missingData.push("clave");
    return res.json({
      message: `Missing data: ${missingData.join(
        ", "
      )}`,
    });
  }
});

// POST request: user login
app.post("/login", function (req, res) {
  const email = req.body.email;
  const pass = req.body.password;
  const validationObject = validateUser(email, pass);

  if (validationObject.isValid) {
    // Creating access token
    let accTkn = jwt.sign({
      data: pass},
      SECRET, {expiresIn: '1h'}
    )
    // Saves access token in authorization object from session
    req.session.authorization = {
      accTkn,email
    }
    return res.json({
      message: `Hello ${users[email].name}, you have logged in successfully!`,
    });
  } else {
    return res.json({
      message: `Error: ${validationObject.reason}`,
    });
  }
});

// Authorize user
app.use('/friends', function (req,res,next){
  if (req.session.authorization) {
    // Access token in authorization object from session
    let tkn = req.session.authorization['accTkn']
    // Verify token
    jwt.verify(tkn,SECRET,function (err,user){
      if(err) {
        return res.json({message:'User not authenticated'})
      } else {
        req.user = user
        next() // Access to friends route
      }
    })
  } else {
    return res.json({message:'User not logged in'})
  }
})

/*
Accessed only when user is authenticated 
User routes in friends.js
*/
app.use('/friends',routes)

export default app

// Server
const PROTOCOL = "http";
const DOMAIN = "localhost";
const PORT = process.env.PORT || 3000;

app.listen(PORT, function () {
  console.log(`Servidor escuchando en: ${PROTOCOL}://${DOMAIN}:${PORT}`);
});
