
import { DOMParser } from 'xmldom';

class ApiService {
  static URL_CONTROLLER = "";
  static PASSKEY = "";

  static init(config) {
    this.URL_CONTROLLER = config.url.endsWith('/')
      ? config.url + "controller_ws.php"
      : config.url + "/controller_ws.php";
    this.PASSKEY = config.passkey;
  }

  static async request(action, extraData = {}) {
    const params = new URLSearchParams({
      action,
      key: this.PASSKEY,
      ...extraData
    }).toString();

    try {
      const response = await fetch(`${this.URL_CONTROLLER}?${params}`);
      const text = await response.text();

      // ERROR DETECTADO: Si el servidor manda HTML (como el error que viste), 
      // significa que el PHP falló o la URL es incorrecta.
      if (text.trim().toLowerCase().startsWith('<!doctype html') || text.trim().toLowerCase().startsWith('<html')) {
        console.error("El servidor devolvió HTML en lugar de XML. Posible error 404 o 500.");
        return { result: "error", result_text: "Respuesta inválida del servidor (HTML)" };
      }

      return this.parseXmlToJson(text);
    } catch (error) {
      console.error("Error en request:", error);
      return { result: "error", result_text: "Error de conexión" };
    }
  }

  static parseXmlToJson(xmlString) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString.trim(), "text/xml");
      const nodes = xmlDoc.documentElement.childNodes;
      const list = [];
      const obj = {};
      let isList = false;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (node.nodeType === 1) { // Node.ELEMENT_NODE

          // --- MEJORA PARA CDATA ---
          // Buscamos dentro del nodo si tiene hijos (el CDATA es un hijo del tag)
          let value = "";
          if (node.childNodes && node.childNodes.length > 0) {
            for (let j = 0; j < node.childNodes.length; j++) {
              const child = node.childNodes[j];
              // Aceptamos tanto TEXT_NODE (3) como CDATA_SECTION_NODE (4)
              if (child.nodeType === 3 || child.nodeType === 4) {
                value += child.nodeValue;
              }
            }
          } else {
            value = node.textContent || "";
          }
          value = value.trim();
          // -------------------------

          if (node.nodeName.startsWith('item_') || node.nodeName.startsWith('prod_')) {
            isList = true;
            const item = {};
            for (let k = 0; k < node.childNodes.length; k++) {
              const child = node.childNodes[k];
              if (child.nodeType === 1) {
                // USAR LA MISMA LÓGICA DE EXTRACCIÓN DE VALOR QUE EL NODO PADRE
                let childValue = "";
                if (child.childNodes && child.childNodes.length > 0) {
                  for (let l = 0; l < child.childNodes.length; l++) {
                    const gChild = child.childNodes[l];
                    if (gChild.nodeType === 3 || gChild.nodeType === 4) {
                      childValue += gChild.nodeValue;
                    }
                  }
                } else {
                  childValue = child.textContent || "";
                }
                item[child.nodeName] = childValue.trim();
              }
            }
            list.push(item);
          } else {
            obj[node.nodeName] = value;
          }
        }
      }
      return isList ? list : obj;
    } catch (e) {
      console.error("Error parseando XML:", e);
      return { result: "error", result_text: "Error de lectura XML" };
    }
  }

  static async inicia_sesion(usuario, password) {
    return await this.request("inicia_sesion", { login_usuario: usuario, login_password: password });
  }
  static async get_almacenes_list(id_usuario) {
    return await this.request("get_almacenes_list", { id_usuario: id_usuario });
  }

  static async get_terminales_list(id_usuario, id_almacen) {
    return await this.request("get_terminales_list", { id_usuario, id_almacen });
  }

  static async get_pickeo_list(id_usuario, id_terminal) {
    return await this.request("get_pickeo_list", { id_usuario, id_terminal });
  }
  static async pickeo_checkout(id_usuario, id_terminal, lista_productos) {
    // Enviamos el JSON de la lista al servidor
    return await this.request("pickeo_checkout", {
      id_usuario,
      id_terminal,
      datos_pickeo: JSON.stringify(lista_productos)
    });
  }
}

export default ApiService;
