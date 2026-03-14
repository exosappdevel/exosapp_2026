<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>WS Auditor Panel</title>
    <style>
        body { font-family: sans-serif; background: #f4f7f6; padding: 20px; color: #333; }
        .container { max-width: 900px; margin: auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { border-bottom: 2px solid #3182ce; padding-bottom: 10px; color: #2c5282; }
        .section { margin-bottom: 25px; padding: 15px; border: 1px solid #e2e8f0; border-radius: 5px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        select, input, textarea { width: 100%; padding: 8px; margin-bottom: 10px; border: 1px solid #cbd5e0; border-radius: 4px; box-sizing: border-box; }
        textarea { font-family: monospace; resize: vertical; min-height: 80px; }
        button { padding: 10px 20px; cursor: pointer; border: none; border-radius: 4px; font-weight: bold; color: white; margin-right: 10px; }
        .btn-audit { background: #3182ce; }
        .btn-test { background: #48bb78; }
        pre { background: #2d3748; color: #a0aec0; padding: 15px; overflow: auto; border-radius: 5px; max-height: 400px; white-space: pre-wrap; word-wrap: break-word; }
        .param-row { background: #edf2f7; padding: 10px; margin-bottom: 5px; border-radius: 4px; }
    </style>
</head>
<body>

<div class="container">
    <h1>WebServices Auditor Interface</h1>

    <div class="section">
        <label for="methodList">Seleccionar Método:</label>
        <select id="methodList">
            <option value="">Cargando métodos...</option>
        </select>
        <button class="btn-audit" onclick="auditMethod()">Auditar</button>
    </div>

    <div id="auditSection" class="section" style="display:none;">
        <h3>Parámetros para: <span id="selectedActionTitle"></span></h3>
        <p><i id="actionDescription"></i></p>
        <form id="testForm">
            <div id="paramsContainer"></div>
            <button type="button" class="btn-test" onclick="runTest()">Ejecutar Test</button>
        </form>
    </div>

    <div id="resultSection" class="section" style="display:none;">
        <h3>Resultado del Servidor:</h3>
        <pre id="xmlResult"></pre>
    </div>
</div>

<script>
    const WS_URL = 'controller_ws.php';

    async function loadMethods() {
        try {
            const response = await fetch(WS_URL + "?action=audit_methods");
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");
            const select = document.getElementById('methodList');
            select.innerHTML = '';
            
            const responseNode = xmlDoc.getElementsByTagName('response')[0];
            const nodes = responseNode.childNodes;
            for (let node of nodes) {
                if (node.nodeType === 1 && node.nodeName.startsWith('method_')) {
                    const action = node.getElementsByTagName('action')[0].textContent;
                    const option = document.createElement('option');
                    option.value = action;
                    option.textContent = action;
                    select.appendChild(option);
                }
            }
        } catch (e) {
            console.error("Error loadMethods:", e);
        }
    }

    async function auditMethod() {
        const action = document.getElementById('methodList').value;
        if (!action) return;

        try {
            const response = await fetch(WS_URL + "?action=" + action + "&sub_action=audit");
            const text = await response.text();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(text, "text/xml");

            document.getElementById('selectedActionTitle').textContent = action;
            document.getElementById('actionDescription').textContent = 
                xmlDoc.getElementsByTagName('descripcion')[0]?.textContent || "Sin descripción";

            const container = document.getElementById('paramsContainer');
            container.innerHTML = '';
            
            const responseNode = xmlDoc.getElementsByTagName('response')[0];
            const nodes = responseNode.childNodes;
            let hasParams = false;

            for (let node of nodes) {
                if (node.nodeType === 1 && node.nodeName.startsWith('item_')) {
                    const nombreNode = node.getElementsByTagName('nombre')[0];
                    if (nombreNode) {
                        const originalName = nombreNode.textContent;
                        
                        // 1. Limpieza del nombre (quitar "(opcional)", "(JSON)", "(XML)" y espacios)
                        const cleanName = originalName.replace(/\s*\(.*?\)\s*/g, '').trim();
                        
                        // 2. Detectar si requiere TextArea (JSON o XML)
                        const isLargeText = /JSON|XML/i.test(originalName);
                        
                        const div = document.createElement('div');
                        div.className = 'param-row';
                        
                        let inputHtml = '';
                        if (isLargeText) {
                            inputHtml = '<textarea name="' + cleanName + '" placeholder="Ingrese contenido ' + originalName + '"></textarea>';
                        } else {
                            inputHtml = '<input type="text" name="' + cleanName + '" placeholder="Valor para ' + cleanName + '">';
                        }

                        div.innerHTML = '<label>' + originalName + ':</label>' + inputHtml;
                        container.appendChild(div);
                        hasParams = true;
                    }
                }
            }

            if (!hasParams) {
                container.innerHTML = '<p>Este método no requiere parámetros adicionales.</p>';
            }

            document.getElementById('auditSection').style.display = 'block';
            document.getElementById('resultSection').style.display = 'none';
        } catch (e) {
            alert("Error al auditar: " + e);
        }
    }

    async function runTest() {
        const action = document.getElementById('methodList').value;
        const formData = new FormData(document.getElementById('testForm'));
        const params = new URLSearchParams();
        params.append('action', action);
        
        for (let [key, value] of formData.entries()) {
            params.append(key, value);
        }

        try {
            const response = await fetch(WS_URL + "?" + params.toString());
            const text = await response.text();
            const resultDisplay = document.getElementById('xmlResult');
            const trimmedText = text.trim();

            if (trimmedText.startsWith("<" + "?xml") || trimmedText.startsWith("<response")) {
                resultDisplay.textContent = formatXml(text);
            } else {
                resultDisplay.textContent = "Respuesta no válida:\n\n" + text;
            }
            document.getElementById('resultSection').style.display = 'block';
            resultDisplay.scrollIntoView({ behavior: 'smooth' });
        } catch (e) {
            alert("Error: " + e);
        }
    }

    function formatXml(xml) {
        let formatted = '';
        let reg = /(>)(<)(\/*)/g;
        xml = xml.replace(reg, '$1\r\n$2$3');
        let pad = 0;
        xml.split('\r\n').forEach(function(node) {
            let indent = 0;
            if (node.match( /.+<\/\w[^>]*>$/ )) indent = 0;
            else if (node.match( /^<\/\w/ )) { if (pad !== 0) pad -= 1; }
            else if (node.match( /^<\w[^>]*[^\/]>.*$/ )) indent = 1;
            formatted += '  '.repeat(pad) + node + '\r\n';
            pad += indent;
        });
        return formatted;
    }

    window.onload = loadMethods;
</script>

</body>
</html>