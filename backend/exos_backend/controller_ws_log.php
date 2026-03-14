<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Auditoría de Logs - WebService</title>
    <style>
        body { font-family: 'Segoe UI', sans-serif; margin: 0; background-color: #f4f7f6; color: #333; height: 100vh; display: flex; flex-direction: column; }
        
        /* Header y Buscador */
        .header-container { background: white; padding: 15px 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.05); z-index: 10; }
        .search-box { display: flex; gap: 10px; max-width: 600px; }
        input[type="text"] { flex: 1; padding: 10px; border: 1px solid #ddd; border-radius: 4px; outline: none; }
        input[type="text"]:focus { border-color: #3182ce; }
        .btn-search { padding: 10px 25px; background-color: #3182ce; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; }
        .btn-search:hover { background-color: #2c5282; }

        /* Layout de dos columnas */
        .main-layout { display: flex; flex: 1; overflow: hidden; }

        /* Columna Izquierda: Lista */
        .list-column { width: 35%; border-right: 1px solid #eee; background: white; display: flex; flex-direction: column; }
        .table-wrapper { flex: 1; overflow-y: auto; }
        table { width: 100%; border-collapse: collapse; }
        th { position: sticky; top: 0; background: #3182ce; color: white; padding: 12px; font-size: 13px; z-index: 5; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #eee; cursor: pointer; font-size: 13px; vertical-align: top; }
        tr:hover { background-color: #ebf8ff; }
        tr.selected { background-color: #bee3f8; border-left: 4px solid #3182ce; }

        /* Columna Derecha: Detalle */
        .detail-column { width: 65%; background: #edf2f7; display: flex; flex-direction: column; padding: 20px; box-sizing: border-box; }
        .detail-placeholder { flex: 1; display: flex; justify-content: center; align-items: center; color: #a0aec0; flex-direction: column; text-align: center; }
        
        .detail-content { display: flex; flex-direction: column; gap: 20px; height: 100%; }
        .detail-section { flex: 1; display: flex; flex-direction: column; min-height: 0; }
        .detail-label { font-weight: bold; margin-bottom: 8px; color: #2d3748; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
        
        /* Área de visualización de datos grandes */
        .code-view { 
            flex: 1; 
            background: #2d3748; 
            color: #edf2f7; 
            padding: 15px; 
            border-radius: 6px; 
            overflow: auto; 
            font-family: 'Consolas', 'Monaco', 'Courier New', monospace; 
            font-size: 14px; 
            line-height: 1.5;
            white-space: pre-wrap;
            word-break: break-all;
            margin: 0;
            border: 1px solid #1a202c;
        }

        /* Paginación */
        .pagination { padding: 15px; border-top: 1px solid #eee; display: flex; justify-content: center; align-items: center; gap: 10px; background: #fff; }
        .btn-page { padding: 6px 15px; border: 1px solid #3182ce; background: white; color: #3182ce; cursor: pointer; border-radius: 4px; font-weight: 500; }
        .btn-page:disabled { opacity: 0.4; cursor: not-allowed; border-color: #cbd5e0; color: #a0aec0; }
    </style>
</head>
<body>

<div class="header-container">
    <div class="search-box">
        <input type="text" id="searchInput" placeholder="Filtrar por nombre de usuario..." onkeydown="if(event.key==='Enter') startSearch()">
        <button class="btn-search" onclick="startSearch()">BUSCAR</button>
    </div>
</div>

<div class="main-layout">
    <div class="list-column">
        <div class="table-wrapper">
            <table>
                <thead>
                    <tr>
                        <th style="width: 60px;">ID</th>
                        <th style="width: 120px;">Fecha/Hora</th>
                        <th>Nombre Usuario</th>
                    </tr>
                </thead>
                <tbody id="logTableBody">
                    <tr><td colspan="3" style="text-align:center; padding:40px; color:#a0aec0;">Ingrese un criterio y presione BUSCAR</td></tr>
                </tbody>
            </table>
        </div>
        <div class="pagination" id="paginationControls"></div>
    </div>

    <div class="detail-column" id="detailView">
        <div class="detail-placeholder">
            <svg width="64" height="64" fill="none" stroke="currentColor" stroke-width="1" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p style="margin-top:15px; font-size:16px;">Seleccione un registro de la lista para ver el detalle completo</p>
        </div>
    </div>
</div>

<script>
    let page = 1;
    let currentLogs = {}; 

    function startSearch() {
        page = 1;
        loadLogs();
    }

    async function loadLogs() {
        const search = document.getElementById('searchInput').value;
        const tbody = document.getElementById('logTableBody');
        // URL del listado principal
        const url = `controller_ws.php?action=audit_ws_log&page=${page}&search=${encodeURIComponent(search)}`;

        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">Cargando lista...</td></tr>';

        try {
            const response = await fetch(url);
            const xmlText = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            
            const result = xmlDoc.getElementsByTagName("result")[0]?.textContent;
            const dataNode = xmlDoc.getElementsByTagName("data")[0];
            const logs = dataNode ? dataNode.children : [];
            
            tbody.innerHTML = "";
            currentLogs = {}; 

            if (result !== "true" || logs.length === 0) {
                tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">No se encontraron registros</td></tr>';
                return;
            }

            for (let i = 0; i < logs.length; i++) {
                const log = logs[i];
                const id = log.tagName.replace('id', '');
                const nombre = log.getElementsByTagName("nombre")[0]?.textContent || 'Sin nombre';
                const fecha = log.getElementsByTagName("fecha")[0]?.textContent || '';
                const hora = log.getElementsByTagName("hora")[0]?.textContent || '';
                
                // Guardamos solo los metadatos necesarios
                currentLogs[id] = { nombre, id, fecha, hora };

                const row = document.createElement('tr');
                row.id = `row-${id}`;
                row.onclick = () => showDetail(id);
                row.innerHTML = `
                    <td><strong>${id}</strong></td>
                    <td>${fecha}<br><small style="color: #888">${hora}</small></td>
                    <td>${nombre}</td>
                `;
                tbody.appendChild(row);
            }
            updatePagination();

        } catch (error) {
            console.error(error);
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px; color:red;">Error al conectar con el webservice</td></tr>';
        }
    }

    async function showDetail(id) {
        // Efecto visual de selección
        document.querySelectorAll('tr').forEach(r => r.classList.remove('selected'));
        const selectedRow = document.getElementById(`row-${id}`);
        if(selectedRow) selectedRow.classList.add('selected');

        const detailView = document.getElementById('detailView');
        const log = currentLogs[id];

        // Indicador de carga para los datos pesados
        detailView.innerHTML = `
            <div class="detail-placeholder">
                <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3182ce; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite;"></div>
                <p>Descargando entrada y salida del log #${id}...</p>
            </div>
            <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
        `;

        try {
            // URL para obtener el texto plano de input y output
            const baseUrl = `https://exorta.exos.software/controller_ws.php?action=audit_ws_log_data&id_log=${id}`;

            // Peticiones paralelas para mayor velocidad
            const [resInput, resOutput] = await Promise.all([
                fetch(`${baseUrl}&type=input`),
                fetch(`${baseUrl}&type=output`)
            ]);

            const inputText = await resInput.text();
            const outputText = await resOutput.text();

            // Renderizado del detalle ampliado
            detailView.innerHTML = `
                <div class="detail-content">
                    <div style="padding-bottom:10px; border-bottom:1px solid #cbd5e0; display:flex; justify-content:space-between; align-items:center;">
                        <h3 style="margin:0; color:#2d3748;">Detalle del Registro #${id}</h3>
                        <span style="font-size:12px; background:#ebf8ff; color:#2b6cb0; padding:4px 10px; border-radius:20px; font-weight:bold;">
                            ${log.nombre} | ${log.fecha} ${log.hora}
                        </span>
                    </div>
                    
                    <div class="detail-section">
                        <div class="detail-label">INPUT (Datos de Entrada)</div>
                        <pre class="code-view" id="inputCode">${escapeHTML(inputText)}</pre>
                    </div>

                    <div class="detail-section">
                        <div class="detail-label">OUTPUT (Respuesta del Servidor)</div>
                        <pre class="code-view" id="outputCode">${escapeHTML(outputText)}</pre>
                    </div>
                </div>
            `;
        } catch (error) {
            detailView.innerHTML = `
                <div class="detail-placeholder" style="color:#e53e3e;">
                    <p>Error al cargar el contenido detallado del servidor.</p>
                </div>`;
        }
    }

    function escapeHTML(str) {
        if (!str || str.trim() === "") return "Sin contenido o vacío";
        return str.replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
        }[m]));
    }

    function updatePagination() {
        const nav = document.getElementById('paginationControls');
        nav.innerHTML = `
            <button class="btn-page" onclick="changePage(-1)" ${page === 1 ? 'disabled' : ''}>Anterior</button>
            <span style="font-weight:bold; font-size:13px; color:#4a5568;">Página ${page}</span>
            <button class="btn-page" onclick="changePage(1)">Siguiente</button>
        `;
    }

    function changePage(delta) {
        page += delta;
        loadLogs();
        // Limpiar el detalle al cambiar de página
        document.getElementById('detailView').innerHTML = `
            <div class="detail-placeholder">
                <p>Seleccione un registro de la nueva página</p>
            </div>`;
    }
</script>

</body>
</html>