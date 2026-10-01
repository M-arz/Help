// server.js
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Pool de conexiones a MySQL
const db = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10
});

// 1. OBTENER TODOS LOS TICKETS
app.get('/api/tickets', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM tickets ORDER BY id DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 2. CREAR UN NUEVO TICKET
app.post('/api/tickets', async (req, res) => {
    const { cliente, prioridad, categoria, descripcion } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO tickets (cliente, prioridad, categoria, descripcion) VALUES (?, ?, ?, ?)',
            [cliente, prioridad, categoria, descripcion]
        );
        res.status(201).json({ id: result.insertId, cliente, prioridad, categoria, descripcion, estado: 'Abierto' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 3. ACTUALIZAR UN TICKET (DATOS)
app.put('/api/tickets/:id', async (req, res) => {
    const { id } = req.params;
    const { cliente, prioridad, categoria, descripcion } = req.body;
    try {
        await db.query(
            'UPDATE tickets SET cliente = ?, prioridad = ?, categoria = ?, descripcion = ? WHERE id = ?',
            [cliente, prioridad, categoria, descripcion, id]
        );
        res.json({ message: 'Ticket actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 4. CAMBIAR ESTADO Y REGISTRAR HORA DE SALIDA
app.patch('/api/tickets/:id/estado', async (req, res) => {
    const { id } = req.params;
    const { nuevoEstado } = req.body;

    // Si pasa a Resuelto, asignamos NOW(). Si pasa a otro estado, limpiamos NULL.
    const fechaSalidaSql = nuevoEstado === 'Resuelto' ? 'NOW()' : 'NULL';

    try {
        await db.query(
            `UPDATE tickets SET estado = ?, fecha_salida = ${fechaSalidaSql} WHERE id = ?`,
            [nuevoEstado, id]
        );
        res.json({ message: 'Estado actualizado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 5. ELIMINAR UN TICKET
app.delete('/api/tickets/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM tickets WHERE id = ?', [id]);
        res.json({ message: 'Ticket eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor HelpDesk corriendo en http://localhost:${PORT}`);
});