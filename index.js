import express from 'express';
import bodyParser from 'body-parser';
import { USERS, ORDERS } from './db.js';
import { authorizationMiddleware } from './middlewares.js';

const app = express();

app.use(bodyParser.json());

/**
 * POST -- create resource
 * req -> input data
 * res -> output data
 */
app.post('/users', (req, res) => {
 const { body } = req;

 console.log(`body`, JSON.stringify(body));

 const isUserExist = USERS.some(el => el.login === body.login);
 if (isUserExist) {
  return res.status(400).send({ message: `user with login ${body.login} already exists` });
 }

 USERS.push(body);

 res.status(200).send({ message: 'User was created' });
});

app.get('/users', (req, res) => {
 const users = USERS.map(user => {
  const { password, ...other } = user;
  return other;
 });
 return res
  .status(200)
  .send(users);
});

app.post('/login', (req, res) => {
 const { body } = req;

 const user = USERS
  .find(el => el.login === body.login && el.password === body.password);

 if (!user) {
  return res.status(400).send({ message: 'User was not found' });
 }

 const token = crypto.randomUUID();

 user.token = token;
 USERS.save(user.login, { token });

 return res.status(200).send({
  token,
  message: 'User was login'
 });
});

app.post('/orders', authorizationMiddleware, (req, res) => {
 const { body, user } = req;

 const order = {
  ...body,
  login: user.login
 };

 ORDERS.push(order);

 return res.status(200).send({ message: 'Order was created', order });
});

app.get('/orders', authorizationMiddleware, (req, res) => {
 const { user } = req;

 const orders = ORDERS.filter(el => el.login === user.login);

 return res.status(200).send(orders);
});

app.get('/address/from/last-5', authorizationMiddleware, (req, res) => {
  const { user } = req;

  const orders = ORDERS.filter(el => el.login === user.login);
  const uniqueAddresses = [...new Set(orders.map(order => order.from))];
  const lastFiveUniqueAddresses = uniqueAddresses.slice(-5);

  res.status(200).send(lastFiveUniqueAddresses.reverse());
});

app.get('/address/to/last-3', authorizationMiddleware, (req, res) => {
  const { user } = req;

  const orders = ORDERS.filter(el => el.login === user.login);
  const uniqueAddresses = [...new Set(orders.map(order => order.to))];
  const lastThreeUniqueAddresses = uniqueAddresses.slice(-3);

  res.status(200).send(lastThreeUniqueAddresses.reverse());
});

app.post('/orders', authorizationMiddleware, (req, res) => {
  const { body, user } = req;
  const { from, to } = body;
  
  const price = Math.floor(Math.random() * (100 - 20 + 1)) + 20;

  const order = {
      login: user.login,
      from,
      to,
      price
  };

  ORDERS.push(order);

  res.status(200).send({ message: 'Order was created', order });
});


app.get('/orders/lowest', authorizationMiddleware, (req, res) => {
  const { user } = req;

  if (!user) {
      return res.status(400).send({ message: `User was not found by token: ${req.headers.authorization}` });
  }

  const userOrders = ORDERS.filter(order => order.login === user.login);

  if (userOrders.length === 0) {
      return res.status(404).send({ message: 'User does not have orders yet' });
  }

  const lowestOrder = userOrders.reduce((prev, current) => {
      return (prev.price < current.price) ? prev : current;
  });

  res.status(200).send(lowestOrder);
});

app.get('/orders/biggest', authorizationMiddleware, (req, res) => {
  const { user } = req;


  if (!user) {
      return res.status(400).send({ message: `User was not found by token: ${req.headers.authorization}` });
  }

  const userOrders = ORDERS.filter(order => order.login === user.login);

  if (userOrders.length === 0) {
      return res.status(404).send({ message: 'User does not have orders yet' });
  }

  const biggestOrder = userOrders.reduce((prev, current) => {
      return (prev.price > current.price) ? prev : current;
  });

  res.status(200).send(biggestOrder);
});



app.listen(8080, () => console.log('Server was started'));