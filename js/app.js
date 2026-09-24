let tickets = JSON.parse(localStorage.getItem("helpdesk_tickets")) || [
    { id: "101", cliente: "Ana María Gómez", prioridad: "Alta", categoria: "Hardware", descripcion: "Falla en el teclado de la workstation principal", estado: "Abierto" },
    { id: "102", cliente: "Carlos Pérez", prioridad: "Media", categoria: "Software", descripcion: "Error al sincronizar la base de datos local", estado: "En Proceso" },
    { id: "103", cliente: "Sofía Ruiz", prioridad: "Urgente", categoria: "Redes", descripcion: "Sin conexión a internet en el segundo piso", estado: "Abierto" }
];

let editandoId = null;

const form = document.getElementById("formTicket");
const tabla = document.getElementById("tablaTickets");
const stats = document.getElementById("statsHelpdesk");
const mensaje = document.getElementById("mensajeHelpdesk");
const buscarTicket = document.getElementById("buscarTicket");
const filtroPrioridad = document.getElementById("filtroPrioridad");
const filtroEstado = document.getElementById("filtroEstado");
const contadorTickets = document.getElementById("contadorTickets");
const formTitle = document.getElementById("formTitle");
const btnSubmit = document.getElementById("btnSubmit");
const btnToggleMetrics = document.getElementById("btnToggleMetrics");

// Nuevas constantes para ocultar/mostrar la tabla de tickets
const btnToggleTable = document.getElementById("btnToggleTable");
const sectionTable = document.getElementById("sectionTable");

function guardarEnStorage() {
    localStorage.setItem("helpdesk_tickets", JSON.stringify(tickets));
}

// Lógica para replegar / desplegar métricas
if (btnToggleMetrics) {
    btnToggleMetrics.addEventListener("click", () => {
        stats.classList.toggle("hidden");
        if (stats.classList.contains("hidden")) {
            btnToggleMetrics.textContent = "Mostrar Métricas ";
        } else {
            btnToggleMetrics.textContent = "Ocultar Métricas ";
        }
    });
}

// Lógica para replegar / desplegar la tabla de tickets
if (btnToggleTable) {
    btnToggleTable.addEventListener("click", () => {
        sectionTable.classList.toggle("hidden");
        if (sectionTable.classList.contains("hidden")) {
            btnToggleTable.textContent = "Mostrar Tickets ";
        } else {
            btnToggleTable.textContent = "Ocultar Tickets ";
        }
    });
}

function calcularMetricasTickets(listaActual) {
    const total = listaActual.length;
    const abiertos = listaActual.filter(t => t.estado === "Abierto").length;
    const enProceso = listaActual.filter(t => t.estado === "En Proceso").length;
    const resueltos = listaActual.filter(t => t.estado === "Resuelto").length;

    return { total, abiertos, enProceso, resueltos };
}

function actualizarDashboard(listaActual) {
    const m = calcularMetricasTickets(listaActual);
    
    stats.innerHTML = `
        <div class="metric-pill">
            <div class="metric-info">
                <span>Total Tickets</span>
                <strong>${m.total}</strong>
            </div>
            <div class="metric-icon">
                <img src="img/ticket.png" alt="Total">
            </div>
        </div>
        <div class="metric-pill">
            <div class="metric-info">
                <span>Abiertos</span>
                <strong>${m.abiertos}</strong>
            </div>
            <div class="metric-icon">
                <img src="img/abiertos.png" alt="Abiertos">
            </div>
        </div>
        <div class="metric-pill">
            <div class="metric-info">
                <span>En Proceso</span>
                <strong>${m.enProceso}</strong>
            </div>
            <div class="metric-icon">
                <img src="img/carga.png" alt="En Proceso">
            </div>
        </div>
        <div class="metric-pill">
            <div class="metric-info">
                <span>Resueltos</span>
                <strong>${m.resueltos}</strong>
            </div>
            <div class="metric-icon">
                <img src="img/ticketresuelto.png" alt="Resueltos">
            </div>
        </div>
    `;
}

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

function renderTickets() {
    const listaActual = obtenerFiltrados();
    tabla.innerHTML = "";
    contadorTickets.textContent = `${listaActual.length} ticket(s)`;

    if (!listaActual.length) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 7;
        td.textContent = "No se encontraron tickets registrados.";
        td.style.textAlign = "center";
        td.style.color = "var(--text-muted)";
        tr.appendChild(td);
        tabla.appendChild(tr);
        actualizarDashboard(listaActual);
        return;
    }

    listaActual.forEach(t => {
        const tr = document.createElement("tr");
        tr.dataset.id = t.id;

        tr.innerHTML = `
            <td><strong>#${t.id}</strong></td>
            <td>${t.cliente}</td>
            <td><span class="badge badge-prioridad-${t.prioridad}">${t.prioridad}</span></td>
            <td>${t.categoria}</td>
            <td>${t.descripcion}</td>
            <td><span class="badge badge-estado-${t.estado.replace(" ", ".")}">${t.estado}</span></td>
            <td>
                <button class="btn-action btn-status" title="Cambiar Estado"> Cambiar Estado</button>
                <button class="btn-action btn-edit" title="Editar Ticket"> Editar</button>
                <button class="btn-action btn-delete" title="Eliminar Ticket"> Eliminar</button>
            </td>
        `;
        tabla.appendChild(tr);
    });

    actualizarDashboard(listaActual);
}

tabla.addEventListener("click", event => {
    const boton = event.target.closest("button");
    if (!boton) return;

    const fila = event.target.closest("tr");
    const id = fila.dataset.id;

    if (boton.classList.contains("btn-delete")) {
        if (confirm(`¿Estás seguro de eliminar el ticket #${id}?`)) {
            tickets = tickets.filter(t => String(t.id) !== String(id));
            guardarEnStorage();
            renderTickets();
        }
    } else if (boton.classList.contains("btn-edit")) {
        const ticket = tickets.find(t => String(t.id) === String(id));
        if (ticket) {
            document.getElementById("ticketId").value = ticket.id;
            document.getElementById("cliente").value = ticket.cliente;
            document.getElementById("prioridad").value = ticket.prioridad;
            document.getElementById("categoria").value = ticket.categoria;
            document.getElementById("descripcion").value = ticket.descripcion;
            
            editandoId = id;
            formTitle.textContent = `Editando Ticket #${id}`;
            btnSubmit.textContent = "Actualizar Ticket";
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } else if (boton.classList.contains("btn-status")) {
        const ticket = tickets.find(t => String(t.id) === String(id));
        if (ticket) {
            if (ticket.estado === "Abierto") {
                ticket.estado = "En Proceso";
            } else if (ticket.estado === "En Proceso") {
                ticket.estado = "Resuelto";
            } else {
                ticket.estado = "Abierto";
            }
            guardarEnStorage();
            renderTickets();
        }
    }
});

form.addEventListener("submit", event => {
    event.preventDefault();
    const cliente = document.getElementById("cliente").value.trim();
    const prioridad = document.getElementById("prioridad").value;
    const categoria = document.getElementById("categoria").value;
    const descripcion = document.getElementById("descripcion").value.trim();

    if (!cliente || !prioridad || !categoria || !descripcion) {
        mensaje.textContent = "Por favor complete todos los campos.";
        return;
    }

    if (editandoId !== null) {
        tickets = tickets.map(t => String(t.id) === String(editandoId) ? { ...t, cliente, prioridad, categoria, descripcion } : t);
        editandoId = null;
        formTitle.textContent = "Nuevo Ticket de Soporte";
        btnSubmit.textContent = "Crear Ticket";
    } else {
        const nuevoTicket = {
            id: Date.now().toString().slice(-4),
            cliente,
            prioridad,
            categoria,
            descripcion,
            estado: "Abierto"
        };
        tickets.push(nuevoTicket);
    }

    mensaje.textContent = "";
    form.reset();
    guardarEnStorage();
    renderTickets();
});

buscarTicket.addEventListener("input", renderTickets);
filtroPrioridad.addEventListener("change", renderTickets);
filtroEstado.addEventListener("change", renderTickets);

renderTickets();