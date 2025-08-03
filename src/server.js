const app = require("./app.js");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.info(`Aplicacion funcionando en http://localhost:${PORT}`);
});