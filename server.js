
require('dotenv').config()
const express = require('express')
const app = express();
const path = require("path")

app.use(express.static(path.join(__dirname, 'public')));
const port = 8000;



app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.use(express.json())
app.use("/api/v1", require("./routes/index"))


app.listen(port, () => {
  console.log(`Example app listening on port http://localhost:${port}/api/v1`)
})