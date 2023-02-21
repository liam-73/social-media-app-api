// require("dotenv").config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const errorHandler = require('./middlewares/error-handler.middleware');

const app = express();
const port = process.env.PORT;

// connecting to db
mongoose.connect(process.env.MONGODB_URL);

// routers
const router = require('./routes');

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => res.send('SOCIAL MEDIA APP BY LIAM'));
app.use(router);
app.use(errorHandler);

app.listen(port, () => {
  console.log('Server is up on port ' + port);
});
