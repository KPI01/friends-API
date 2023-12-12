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
        return { isValid: false, reason: "Datos inválidos" };
      }
    } else {
      return {
        isValid: false,
        reason:
          "No es posible recuperar clave de usuario, es posible que no exista",
      };
    }
  } else {
    let missingData = []
    if (!email) missingData.push('email')
    if (!password) missingData.push('clave')
    return {
      isValid: false,
      reason: `No se han encontrado los siguientes datos: ${missingData.join(', ')}`
    }
  }
}

// Datos de la sesión
const SECRET = crypto.randomBytes(32);
const ALGORITHM = "aes-256-cbc";
const IV = crypto.randomBytes(16);

// Funciones que crean CIPHER y DECIPHER
/**
 * Función para encriptar textos
 * @param {string} text
 * @returns {string}
 */
function encrypt(text) {
  const CIPHER = crypto.createCipheriv(ALGORITHM, SECRET, IV);
  const encrypt = CIPHER.update(text, "utf-8", "hex") + CIPHER.final("hex");
  return encrypt;
}
/**
 * Función para descifrar textos
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

// GET request: bienvenida a la API
app.get("/", function (req, res) {
  return res.json({ message: "Bienvenido a la app de amigos!" });
});

// POST request: registro
app.post("/register", function (req, res) {
  const name = req.body.name;
  const email = req.body.email;
  const pass = req.body.password;

  if (name && email && pass) {
    if (doesExist(name)) {
      return res.json({ message: "El usuario ya existe!" });
    } else {
      users[email] = {
        name: name,
        password: encrypt(pass),
      };
      return res.json({
        message: "Se ha agregado al usuario adecuadamente!",
        userAdded: users[email],
      });
    }
  } else {
    let missingData = [];
    if (!name) missingData.push("nombre");
    if (!email) missingData.push("email");
    if (!pass) missingData.push("clave");
    return res.json({
      message: `No se han encontrado los siguientes datos: ${missingData.join(
        ", "
      )}`,
    });
  }
});

// POST request: mostrar usuarios
app.post("/login", function (req, res) {
  const email = req.body.email;
  const pass = req.body.password;
  const validationObject = validateUser(email, pass);

  if (validationObject.isValid) {
    let accTkn = jwt.sign({
      data: pass},
      SECRET, {expiresIn: '1h'}
    )
    req.session.authorization = {
      accTkn,email
    }
    return res.json({
      message: `Hola ${users[email].name}, has iniciado sesión exitosamente!`,
    });
  } else {
    return res.json({
      message: `Error al iniciar sesión: ${validationObject.reason}`,
    });
  }
});

// Función para autorizar a usuario
app.use('/friends', function (req,res,next){
  if (req.session.authorization) {
    let tkn = req.session.authorization['accTkn']
    jwt.verify(tkn,SECRET,function (err,user){
      if(err) {
        return res.json({message:'No has sido autenticado'})
      } else {
        req.user = user
        next()
      }
    })
  } else {
    return res.json({message:'No has iniciado sesión'})
  }
})

app.use('/friends',routes)

// Levantar servidor
const PROTOCOL = "http";
const DOMAIN = "localhost";
const PORT = 3000;

app.listen(PORT, function () {
  console.log(`Servidor escuchando en: ${PROTOCOL}://${DOMAIN}:${PORT}`);
});
