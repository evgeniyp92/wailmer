const express = require('express');

const app = express();

app.get('/', (req, res) => {
  res.send('Goodbye world 💩 This is a test donation 💩');
});

app.listen(8080, () => {
  console.log(`Server listening on port 8080`);
});
