const express = require("express");

const app = express();
const router = require("./routes");

const errorHandler = require("./middlewares/errorHandler")

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar rutas
app.use('/api', router);

app.get("/", (req, res) => {
    res.send(`
        <h1> Curso de Express.js V3</h1>
        <p> Esto es un server corriendo en el puerto ${process.env.PORT || 3000} </p>
    `);
});

// Middleware de manejo de errores (debe ir al final, después de todas las rutas)
app.use(errorHandler);

// Exportar la aplicación para que pueda ser usada por server.js
module.exports = app;