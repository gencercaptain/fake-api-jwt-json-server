const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const server = jsonServer.create()
const router = jsonServer.router('./database.json')
var userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))

server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789'

const expiresIn = 3600

// Create a token from a payload 
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn })
}

// Verify the token 
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? decode : err)
}

// Check if the user exists in database
function isAuthenticated({ email, password }) {
  return userdb.users.findIndex(user => user.email === email && user.password === password) !== -1
}

// Register New User
server.post('/auth/register', (req, res) => {
  console.log("register endpoint called; request body:");
  console.log(req.body);
  const { email, password } = req.body;

  if (isAuthenticated({ email, password }) === true) {
    const status = 401;
    const message = 'Email and Password already exist';
    res.status(status).json({ status, message });
    return
  }

  fs.readFile("./users.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({ status, message })
      return
    };

    // Get current users data
    var data = JSON.parse(data.toString());

    // Get the id of last user   
    var last_item_id = data.users[data.users.length - 1].id;

    //Add new user
    data.users.push({ id: last_item_id + 1, email: email, password: password }); //add some data
    var writeData = fs.writeFile("./users.json", JSON.stringify(data), (err, result) => {  // WRITE
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      }
    });
  });

  // Create token for new user
  const access_token = createToken({ email, password })
  console.log("Access Token:" + access_token);
  var decoded = jwt.decode(access_token, { complete: true });
  console.log(decoded.header);
  console.log(decoded.payload);
  var token_type = "Bearer";
  var expires_on = decoded.payload.exp;
  res.status(200).json({ access_token, token_type, expires_on })
})

// Login to one of the users from ./users.json
server.post('/auth/login', (req, res) => {
  console.log("login endpoint called; request body:");
  console.log(req.body);
  const { email, password } = req.body;
  if (isAuthenticated({ email, password }) === false) {
    const status = 401
    const message = 'Incorrect email or password'
    res.status(status).json({ status, message })
    return
  }
  const access_token = createToken({ email, password })
  console.log("Access Token:" + access_token);
  var decoded = jwt.decode(access_token, { complete: true });
  console.log(decoded.header);
  console.log(decoded.payload);
  var token_type = "Bearer";
  var expires_on = decoded.payload.exp;
  var date = Date.parse(expires_on);
  console.log(date);
  res.status(200).json({ access_token, token_type, expires_on })
})

server.get('/account/me', (req, res) => {
  console.log("account me endpoint called");
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Error in authorization format'
    res.status(status).json({ status, message })
    return
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
    console.log(verifyTokenResult);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const message = 'Access token not provided'
      res.status(status).json({ status, message })
      return
    }
    console.log(verifyTokenResult);
    var user = userdb.users.find(user => user.email === verifyTokenResult.email && user.password === verifyTokenResult.password)
    res.status(200).json(user)

  } catch (err) {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({ status, message })
  }
})

server.get('/account/basket', (req, res) => {
  console.log("account basket endpoint called");
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Error in authorization format'
    res.status(status).json({ status, message })
    return
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
    console.log(verifyTokenResult);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const message = 'Access token not provided'
      res.status(status).json({ status, message })
      return
    }
    console.log(verifyTokenResult);
    var user = userdb.users.find(user => user.email === verifyTokenResult.email && user.password === verifyTokenResult.password)
    console.log(user);
    var basket = userdb.basket.filter(basket => basket.userId === user.id)
    console.log(basket);
    res.status(200).json(basket)

  } catch (err) {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({ status, message })
  }
})

server.post('/account/basket', (req, res) => {
  console.log("account basket endpoint called; request body:");
  console.log(req.body);
  const { productId } = req.body;
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Error in authorization format'
    res.status(status).json({ status, message })
    return
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
    console.log(verifyTokenResult);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const message = 'Access token not provided'
      res.status(status).json({ status, message })
      return
    }
    console.log(verifyTokenResult);
    var user = userdb.users.find(user => user.email === verifyTokenResult.email && user.password === verifyTokenResult.password)
    console.log(user);

    fs.readFile("./users.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };

      // Get current users data
      var data = JSON.parse(data.toString());
      // Get the id of last user   
      var basket = data.basket.find(basket => basket.productId === productId && basket.userId === user.id);
      if (basket == undefined) {
        var last_item_id = data.basket[data.basket.length - 1].id || 1;
        data.basket.push({ id: last_item_id + 1, userId: user.id, productId: productId, "quantity": 1 }); //add some data       
      }
      else {
        basket.quantity += 1;
        //basket.put(basket);
        //data.basket.push(basket); //update data        
      }

      var writeData = fs.writeFileSync("./users.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({ status, message })
          return
        }
      });
      userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'));
    });
    res.status(201).json({})

  } catch (err) {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({ status, message })
  }
})

server.delete('/account/basket/:id', (req, res) => {
  console.log("account basket endpoint called");
  const id = req.params["id"];
  console.log(id);
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Error in authorization format'
    res.status(status).json({ status, message })
    return
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);
    console.log(verifyTokenResult);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const message = 'Access token not provided'
      res.status(status).json({ status, message })
      return
    }
    console.log(verifyTokenResult);
    var user = userdb.users.find(user => user.email === verifyTokenResult.email && user.password === verifyTokenResult.password)
    console.log(user);

    fs.readFile("./users.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };

      // Get current users data
      var data = JSON.parse(data.toString());
      // Get the id of last user   
      var index = data.basket.findIndex(basket => basket.id === id);
      data.basket.splice(index, 1);

      var writeData = fs.writeFileSync("./users.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({ status, message })
          return
        }
      });
      userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'));
    });
    res.status(201).json({})

  } catch (err) {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({ status, message })
  }
})

server.use(/^(?!\/auth|\/account).*$/, (req, res, next) => {
  console.log("public endpoint called");
  next()

  // if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
  //   const status = 401
  //   const message = 'Error in authorization format'
  //   res.status(status).json({ status, message })
  //   return
  // }
  // try {
  //   let verifyTokenResult;
  //   verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

  //   if (verifyTokenResult instanceof Error) {
  //     const status = 401
  //     const message = 'Access token not provided'
  //     res.status(status).json({ status, message })
  //     return
  //   }
  //   next()
  // } catch (err) {
  //   const status = 401
  //   const message = 'Error access_token is revoked'
  //   res.status(status).json({ status, message })
  // }
})

server.use(router)

server.listen(8000, () => {
  console.log('Run Auth API Server')
})