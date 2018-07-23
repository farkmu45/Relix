const express = require('express');
const app = express();

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('hello');
});

app.listen(3000, () => {
  console.log(`Server started on 3000`);
});
