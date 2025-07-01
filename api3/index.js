
require('dotenv').config();

const path = require('path')
const express = require('express');
const app = express();
const port = process.env.PORT || 1001;
const session = require('express-session');


app.use(session({
  secret: 'kurukurukirarin',
  resave: false,
  saveUninitialized: false
}));

app.use((req, res, next) => {
  const contentLength = parseInt(req.headers['content-length'] || '0', 10);
  if (contentLength > 10 * 1024 * 1024) { 
    return res.status(413).json({ message: 'Payload too large (header)' });
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));


app.use('/', async (req, res) => {

  try {

    const endpoint = require(`./endpoints/${req.path}`);


    const handler = endpoint[req.method.toLowerCase()];
    if (typeof handler !== 'function') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const authHeader = req.headers['x-chiwa-user-data'];
    const auth = JSON.parse(authHeader || '{}');
    await handler(req, res, auth);
    return;
  } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND') {
      return res.status(404).json({ message: 'Endpoint Not Found' });
    }
    console.error(e);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ message: 'Payload too large' });
  }
  console.error(err);
  res.status(500).json({ message: 'Unexpected Server Error' });
});

app.listen(port, () => {
  console.log(`App run on http://127.0.0.1:${port}`);
});