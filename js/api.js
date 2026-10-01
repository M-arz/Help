// js/api.js
const API_URL = 'http://localhost:3000/api/tickets';

async function obtenerTickets() {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error('Error al obtener los tickets');
    return await res.json();
}

async function crearTicket(payload) {
    const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error al crear el ticket');
    return await res.json();
}

async function actualizarTicket(id, payload) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Error al actualizar el ticket');
    return await res.json();
}

async function cambiarEstadoTicket(id, nuevoEstado) {
    const res = await fetch(`${API_URL}/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nuevoEstado })
    });
    if (!res.ok) throw new Error('Error al cambiar el estado del ticket');
    return await res.json();
}

async function eliminarTicket(id) {
    const res = await fetch(`${API_URL}/${id}`, {
        method: 'DELETE'
    });
    if (!res.ok) throw new Error('Error al eliminar el ticket');
    return await res.json();
}