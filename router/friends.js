const express = require('express');

const router = express.Router();

let friends = {
  'johnsmith@mail.com': {
    firstName: 'John',
    lastName: 'Doe',
    DOB: '22-12-1990',
  },
  'annasmith@mail.com': {
    firstName: 'Anna',
    lastName: 'smith',
    DOB: '02-07-1983',
  },
  'peterjones@mail.com': {
    firstName: 'Peter',
    lastName: 'Jones',
    DOB: '21-03-1989',
  },
};

// GET request: shows all friends
router.get('/', function (req, res) {
  res.send(JSON.stringify(friends));
});

// GET request: show friend by ID
router.get('/:email', function (req, res) {
  const email = req.params.email;
  res.send(JSON.stringify(friends[email]));
});

// POST request: add new friend
router.post('/', function (req, res) {
  const email = req.body.email;
  const firstName = req.body.firstName
  const lastName = req.body.lastName
  const DOB = req.body.DOB

  if (email && firstName && lastName && DOB) {
    friends[email] = {
      firstName,
      lastName,
      DOB
    };
    return res.send(`Se ha agregado a ${friends[email].firstName} ${friends[email].lastName} exitosamente`);
  } else {
    let missingData = []
    if (!email) missingData.push('email')
    if (!firstName) missingData.push('primer nombre')
    if (!lastName) missingData.push('segundo nombre')
    if (!DOB) missingData.push('fecha de nacimiento')
    return res.send({message:`No se han encontrado los siguientes datos para el usuario: ${missingData.join(', ')}`})
  }
});

// PUT request: update friend by ID
router.put('/:email', function (req, res) {
  const email = req.params.email;
  let changes = {
    firstName: {},
    lastName: {},
    DOB: {}
  };

  if (req.body) {
    if (req.body.firstName) {
      changes.firstName.old = friends[email].firstName;
      changes.firstName.new = req.body.firstName;
      friends[email].firstName = req.body.firstName;
    }
    if (req.body.lastName) {
      changes.lastName.old = friends[email].lastName;
      changes.lastName.new = req.body.lastName;
      friends[email].lastName = req.body.lastName;
    }
    if (req.body.DOB) {
      changes.DOB.old = friends[email].DOB;
      changes.DOB.new = req.body.DOB;
      friends[email].DOB = req.body.DOB;
    }
    res.send(
      `Al usuario con email:${email} se le hicieron los siguientes cambios: ${JSON.stringify(changes)}`
    );
  } else {
    res.send(`No se han encontrado datos sobre el usuario`);
  }
});

// DELETE request: deletes user by ID
router.delete('/:email', function (req, res) {
    const email = req.params.email
    
    if (email) {
        delete friends[email]
        res.send(`Se ha eliminado el usuario: ${email}`)
    } else {
        res.send(`No se ha especificado ningún usuario a eliminar`)
    }
});

// Export router
module.exports = router;
