const express = require('express');

const PORT = process.env.PORT;
const PUBLIC_FOLDER = path.join(__dirname, '../public');

const app = express();

app.use(express.static(PUBLIC_FOLDER));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
