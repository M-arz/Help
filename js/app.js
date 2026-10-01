// js/app.js

let tickets = [];
let editandoId = null;

// Elementos del DOM
const form = document.getElementById("formTicket");
const tabla = document.getElementById("tablaTickets");
const tablaHistorial = document.getElementById("tablaHistorial");
const stats = document.getElementById("statsHelpdesk");
const mensaje = document.getElementById("mensajeHelpdesk");
const mensajeCarga = document.getElementById("mensajeCarga");
const buscarTicket = document.getElementById("buscarTicket");
const filtroPrioridad = document.getElementById("filtroPrioridad");
const filtroEstado = document.getElementById("filtroEstado");
const contadorTickets = document.getElementById("contadorTickets");
const formTitle = document.getElementById("formTitle");
const btnSubmit = document.getElementById("btnSubmit");
const btnExportarPDF = document.getElementById("btnExportarPDF");

// Formateador de Fechas
function formatearFecha(fechaStr) {
    if (!fechaStr) return '—';
    const f = new Date(fechaStr);
    return f.toLocaleString('es-CO', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

function mostrarCargando() {
    if (!mensajeCarga) return;
    mensajeCarga.classList.remove("hidden");
    mensajeCarga.textContent = "⏳ Conectando con la base de datos...";
    mensajeCarga.className = "mensaje-api loading";
}

function mostrarError(msg) {
    if (!mensajeCarga) return;
    mensajeCarga.classList.remove("hidden");
    mensajeCarga.textContent = `❌ ${msg}`;
    mensajeCarga.className = "mensaje-api error";
}

function mostrarExito(msg) {
    if (!mensajeCarga) return;
    mensajeCarga.classList.remove("hidden");
    mensajeCarga.textContent = `✅ ${msg}`;
    mensajeCarga.className = "mensaje-api success";
}

// Cargar desde BD
async function cargarTickets() {
    try {
        mostrarCargando();
        tickets = await obtenerTickets();
        mostrarExito(`Cargados ${tickets.length} tickets desde MySQL.`);
        renderTickets();
    } catch (error) {
        mostrarError("Error al conectar con la base de datos MySQL.");
    }
}

// Búsqueda y Filtros
function obtenerFiltrados() {
    const texto = buscarTicket.value.trim().toLowerCase();
    const prioridad = filtroPrioridad.value;
    const estado = filtroEstado.value;

    return tickets.filter(t => {
        const coincideTexto = t.cliente.toLowerCase().includes(texto) || t.descripcion.toLowerCase().includes(texto);
        const coincidePrioridad = prioridad === "todos" || t.prioridad === prioridad;
        const matchEstado = estado === "todos" || t.estado === estado;

        return coincideTexto && coincidePrioridad && matchEstado;
    });
}

// Renderizado de Tablas
function renderTickets() {
    const listaActual = obtenerFiltrados();
    tabla.innerHTML = "";
    contadorTickets.textContent = `${listaActual.length} ticket(s)`;

    if (!listaActual.length) {
        tabla.innerHTML = `<tr><td colspan="8" style="text-align:center;">No hay tickets registrados.</td></tr>`;
    } else {
        listaActual.forEach(t => {
            const tr = document.createElement("tr");
            tr.dataset.id = t.id;
            const estadoClase = t.estado.replace(/\s+/g, '.');

            tr.innerHTML = `
                <td><strong>#${t.id}</strong></td>
                <td>${t.cliente}</td>
                <td><span class="badge badge-prioridad-${t.prioridad}">${t.prioridad}</span></td>
                <td>${t.categoria}</td>
                <td>${t.descripcion}</td>
                <td><small>${formatearFecha(t.fecha_creacion)}</small></td>
                <td><span class="badge badge-estado-${estadoClase}">${t.estado}</span></td>
                <td>
                    <button class="btn-action btn-status">Cambiar Estado</button>
                    <button class="btn-action btn-edit">Editar</button>
                    <button class="btn-action btn-delete">Eliminar</button>
                </td>
            `;
            tabla.appendChild(tr);
        });
    }

    renderHistorial();
    actualizarDashboard(listaActual);
}

function renderHistorial() {
    if (!tablaHistorial) return;
    tablaHistorial.innerHTML = "";

    if (!tickets.length) {
        tablaHistorial.innerHTML = `<tr><td colspan="5" style="text-align:center;">Sin datos en el historial.</td></tr>`;
        return;
    }

    tickets.forEach(t => {
        const tr = document.createElement("tr");
        const esResuelto = t.estado === "Resuelto";

        tr.innerHTML = `
            <td><strong>#${t.id}</strong></td>
            <td>${t.cliente}</td>
            <td><span class="badge badge-estado-${t.estado.replace(/\s+/g, '.')}">${t.estado}</span></td>
            <td><small>${formatearFecha(t.fecha_creacion)}</small></td>
            <td>${esResuelto && t.fecha_salida ? `<strong>${formatearFecha(t.fecha_salida)}</strong>` : '<span style="color: gray;">— (Pendiente)</span>'}</td>
        `;
        tablaHistorial.appendChild(tr);
    });
}

function actualizarDashboard(listaActual) {
    const total = listaActual.length;
    const abiertos = listaActual.filter(t => t.estado === "Abierto").length;
    const enProceso = listaActual.filter(t => t.estado === "En Proceso").length;
    const resueltos = listaActual.filter(t => t.estado === "Resuelto").length;

    stats.innerHTML = `
        <div class="metric-pill"><div class="metric-info"><span>Total Tickets</span><strong>${total}</strong></div></div>
        <div class="metric-pill"><div class="metric-info"><span>Abiertos</span><strong>${abiertos}</strong></div></div>
        <div class="metric-pill"><div class="metric-info"><span>En Proceso</span><strong>${enProceso}</strong></div></div>
        <div class="metric-pill"><div class="metric-info"><span>Resueltos</span><strong>${resueltos}</strong></div></div>
    `;
}

// Eventos de Acciones (Eliminar, Editar, Cambiar Estado)
tabla.addEventListener("click", async event => {
    const boton = event.target.closest("button");
    if (!boton) return;

    const id = event.target.closest("tr").dataset.id;
    const ticket = tickets.find(t => String(t.id) === String(id));

    if (boton.classList.contains("btn-delete")) {
        if (confirm(`¿Eliminar ticket #${id} de la base de datos?`)) {
            try {
                await eliminarTicket(id);
                await cargarTickets();
                mostrarExito(`Ticket #${id} eliminado.`);
            } catch (error) {
                mostrarError("No se pudo eliminar de la base de datos.");
            }
        }
    } else if (boton.classList.contains("btn-edit")) {
        if (ticket) {
            document.getElementById("ticketId").value = ticket.id;
            document.getElementById("cliente").value = ticket.cliente;
            document.getElementById("prioridad").value = ticket.prioridad;
            document.getElementById("categoria").value = ticket.categoria;
            document.getElementById("descripcion").value = ticket.descripcion;
            
            editandoId = id;
            formTitle.textContent = `Editando Ticket #${id}`;
            btnSubmit.textContent = "Actualizar Ticket";
            form.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    } else if (boton.classList.contains("btn-status")) {
        let nuevoEstado = "Abierto";
        if (ticket.estado === "Abierto") nuevoEstado = "En Proceso";
        else if (ticket.estado === "En Proceso") nuevoEstado = "Resuelto";

        try {
            await cambiarEstadoTicket(id, nuevoEstado);
            await cargarTickets();
        } catch (error) {
            mostrarError("No se pudo cambiar el estado en la base de datos.");
        }
    }
});

// Guardar o Actualizar
form.addEventListener("submit", async event => {
    event.preventDefault();
    const cliente = document.getElementById("cliente").value.trim();
    const prioridad = document.getElementById("prioridad").value;
    const categoria = document.getElementById("categoria").value;
    const descripcion = document.getElementById("descripcion").value.trim();

    try {
        if (editandoId !== null) {
            await actualizarTicket(editandoId, { cliente, prioridad, categoria, descripcion });
            mostrarExito(`Ticket #${editandoId} actualizado en MySQL.`);
            editandoId = null;
            formTitle.textContent = "Nuevo Ticket de Soporte";
            btnSubmit.textContent = "Crear Ticket";
        } else {
            await crearTicket({ cliente, prioridad, categoria, descripcion });
            mostrarExito("Nuevo ticket guardado en la base de datos.");
        }
        form.reset();
        await cargarTickets();
    } catch (error) {
        mostrarError("Error al guardar en la base de datos.");
    }
});

// PDF Export
function exportarHistorialPDF() {
    if (!tickets.length) return alert("No hay datos para exportar.");
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("HelpDesk • Historial de Casos (MySQL)", 14, 20);

    const columnas = ["ID", "Cliente", "Estado", "Creación", "Salida"];
    const filas = tickets.map(t => [
        `#${t.id}`,
        t.cliente,
        t.estado,
        formatearFecha(t.fecha_creacion),
        t.estado === "Resuelto" ? formatearFecha(t.fecha_salida) : "— (Pendiente)"
    ]);

    doc.autoTable({ head: [columnas], body: filas, startY: 30 });
    doc.save(`HelpDesk_Reporte_BD.pdf`);
}

if (btnExportarPDF) btnExportarPDF.addEventListener("click", exportarHistorialPDF);

buscarTicket.addEventListener("input", renderTickets);
filtroPrioridad.addEventListener("change", renderTickets);
filtroEstado.addEventListener("change", renderTickets);

// Cargar datos al iniciar
cargarTickets();