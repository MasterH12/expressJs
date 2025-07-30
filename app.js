require("dotenv").config();
const express = require("express");


const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send(`
        <h1> Curso de Express.js V3</h1>
        <p> Esto es un server corriendo en el puerto ${PORT} </p>
    `);
});

app.get("/users/:id", (req, res) => {
    const userId = req.params.id;
    res.json({
        id: userId,
        message: `Usuario con ID: ${userId}`
    });
});

app.get("/search", (req, res) => {
    const termino = req.query.termino || "no especificado";
    const categoria = req.query.categoria || "Todas";

    res.json({
        termino: termino,
        categoria: categoria,
        message: `Búsqueda realizada - Término: ${termino}, Categoría: ${categoria}`
    });
});

app.listen(PORT, () => {
    console.info("Aplicaci[on funcionando en puerto ", PORT);
});