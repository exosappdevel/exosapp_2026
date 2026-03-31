import { DOMParser } from 'xmldom';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class ApiService {
  static URL_CONTROLLER = "";
  static PASSKEY = "";
  static URL_FILES_CIRUGIAS = "";
  

  static init(config: { url: string; passkey: string }) {
    this.URL_CONTROLLER = config.url.endsWith('/')
                                  ? config.url + "controller_ws.php"
                                  : config.url + "/controller_ws.php";
    this.URL_FILES_CIRUGIAS = "https://exorta.creaccionesweb.com/pagos_cirugias/"; /*config.url.endsWith('/')
                                  ? config.url + "pagos_cirugias/"
                                  : config.url + "/pagos_cirugias/";*/
    this.PASSKEY = config.passkey;
  }

  static async request(action: string, extraData: Record<string, string> = {}): Promise<any> {
    const params = new URLSearchParams({
      action,
      key: this.PASSKEY,
      ...extraData
    }).toString();

    try {
      // --- INICIO LÓGICA EXPIRACIÓN 5 MIN ---
      // Cada vez que se hace una petición, actualizamos la última actividad
      const now = Date.now().toString();
      AsyncStorage.setItem('@exosapp_last_activity', now).catch(e => console.log("Error actualizando actividad"));
      // --- FIN LÓGICA EXPIRACIÓN 5 MIN ---

      const response = await fetch(`${this.URL_CONTROLLER}?${params}`);
      const text = await response.text();

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
  static parseXmlToJson_org(xmlString: string): any {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString.trim(), "text/xml");
      const nodes = xmlDoc.documentElement.childNodes;
      const list: any[] = [];
      const obj: Record<string, string> = {};
      let isList = false;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i] as any;
        if (node.nodeType === 1) {
          let value = "";
          if (node.childNodes && node.childNodes.length > 0) {
            for (let j = 0; j < node.childNodes.length; j++) {
              const child = node.childNodes[j];
              if (child.nodeType === 3 || child.nodeType === 4) {
                value += child.nodeValue;
              }
            }
          } else {
            value = node.textContent || "";
          }
          value = value.trim();

          if (node.nodeName.startsWith('item_') || node.nodeName.startsWith('prod_') || node.nodeName.startsWith('subitem_')) {
            isList = true;
            const item: Record<string, string> = {};
            for (let k = 0; k < node.childNodes.length; k++) {
              const child = node.childNodes[k];
              if (child.nodeType === 1) {
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

  static parseXmlToJson(xmlString: string): any {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString.trim(), "text/xml");

      // Función interna para procesar nodos
      const parseNode = (node: Node): any => {
        // Si el nodo solo tiene texto (no tiene etiquetas hijos)
        if (node.childNodes.length === 1 && (node.firstChild?.nodeType === 3 || node.firstChild?.nodeType === 4)) {
          return node.firstChild.nodeValue?.trim() || "";
        }

        const children = node.childNodes;
        let itemsArray: any[] = [];
        let propertiesObj: any = {};
        let isList = false;
        if (children.length === 0) {
          return []; // O puedes devolver [] si sabes que siempre debería ser lista
        }
        for (let i = 0; i < children.length; i++) {
          const child = children[i] as any;
          if (child.nodeType === 1) { // Nodo tipo Elemento
            const name = child.nodeName;
            const value = parseNode(child);

            // Si detectamos prefijos de lista, marcamos como lista y guardamos en array
            if (name.startsWith('item_') || name.startsWith('subitem_') || name.startsWith('prod_')) {
              isList = true;
              itemsArray.push(value);
            } else {
              propertiesObj[name] = value;
            }
          }
        }

        // Si se identificó como lista (como en get_terminales_list), devolvemos el Array
        // Si no, devolvemos el objeto con propiedades (para los niveles internos)
        return isList ? itemsArray : propertiesObj;
      };

      // Empezamos desde el primer elemento (saltando el <response>)
      return parseNode(xmlDoc.documentElement);
    } catch (e) {
      console.error("Error parseando XML:", e);
      return { result: "error", result_text: "Error de lectura XML" };
    }
  }

  static async inicia_sesion(usuario: string, password: string) {
    return await this.request("inicia_sesion", { login_usuario: usuario, login_password: password });
  }
  static async save_profile(id_usuario_app: string, tema: string, app_language: string) {
    return await this.request("save_profile", { id_usuario_app, tema, app_language });
  }

  static async get_almacenes_list(id_usuario: string) {
    return await this.request("get_almacenes_list", { id_usuario });
  }

  static async get_terminales_list(id_usuario: string, id_almacen: string) {
    return await this.request("get_terminales_list", { id_usuario, id_almacen });
  }

  static async get_pickeo_list(id_usuario: string, id_terminal: string) {
    return await this.request("get_pickeo_list", { id_usuario, id_terminal });
  }

  static async pickeo_checkout(id_usuario: string, id_terminal: string, lista_productos: any[]) {
    return await this.request("pickeo_checkout", {
      id_usuario,
      id_terminal,
      datos_pickeo: JSON.stringify(lista_productos)
    });
  }

  static async get_set_categorias() {
    return await this.request("get_set_categorias", {});
  }
  static async get_set_subcategorias(id_categoria: string) {
    return await this.request("get_set_subcategorias", { id_categoria });
  }
  static async get_set_categorias_subcategorias() {
    return await this.request("get_set_categorias_subcategorias", {});
  }
  static async get_equipos_poder_categoria() {
    return await this.request("get_equipos_poder_categoria", {});
  }
  static async get_instrumental_categoria() {
    return await this.request("get_instrumental_categoria", {});
  }
  static async get_consumible_categoria() {
    return await this.request("get_consumible_categoria", {});
  }
  static async get_estados() {
    return await this.request("get_estados", {});
  }
  static async get_vendedores(id_usuario: string, first_row: string) {
    return await this.request("get_vendedores", { id_usuario, first_row });
  }
  static async get_tecnicos(id_usuario: string) {
    return await this.request("get_vendedores", { id_usuario });
  }
  static async get_hospitales(id_almacen: string) {
    return await this.request("get_hospitales", { id_almacen });
  }
  static async get_subdistribuidor() {
    return await this.request("get_subdistribuidor", {});
  }
  static async get_medicos_list(id_usuario: string) {
    return await this.request("get_medicos_list", { id_usuario });
  }
  static async guarda_cirugia(
    id_usuario: string,
    id_almacen: string,
    tipo: string,
    nuevo_cirugia_id: string,
    nuevo_cirugia_fecha: string,
    nuevo_cirugia_hora: string,
    nuevo_cirugia_estado: string,
    nuevo_cirugia_ciudad: string,
    nuevo_cirugia_vendedor: string,
    nuevo_cirugia_tecnico: string,
    nuevo_cirugia_tecnico_2: string,
    nuevo_cirugia_subdistribuidor: string,
    nuevo_cirugia_subdistribuidor_txt: string,
    nuevo_cirugia_hospital: string,
    nuevo_cirugia_medico: string,
    minialmacen_string: string,
    equipopoder_string: string,
    adicionales_string: string,
    consumibles_string: string,
    nuevo_cirugia_notas: string,
    nuevo_cirugia_paciente: string,
    nuevo_cirugia_paciente_p: string,
    nuevo_cirugia_paciente_m: string,
    nuevo_cirugia_esteril: string,
    nuevo_cirugia_orden_pago: string,
    nuevo_cirugia_file_name: string) {
    return await this.request("guardar_cirugia", {
      id_usuario,
      id_almacen,
      tipo,
      nuevo_cirugia_id,
      nuevo_cirugia_fecha,
      nuevo_cirugia_hora,
      nuevo_cirugia_estado,
      nuevo_cirugia_ciudad,
      nuevo_cirugia_vendedor,
      nuevo_cirugia_tecnico,
      nuevo_cirugia_tecnico_2,
      nuevo_cirugia_subdistribuidor,
      nuevo_cirugia_subdistribuidor_txt,
      nuevo_cirugia_hospital,
      nuevo_cirugia_medico,
      minialmacen_string,
      equipopoder_string,
      adicionales_string,
      consumibles_string,
      nuevo_cirugia_notas,
      nuevo_cirugia_paciente,
      nuevo_cirugia_paciente_p,
      nuevo_cirugia_paciente_m,
      nuevo_cirugia_esteril,
      nuevo_cirugia_orden_pago,
      nuevo_cirugia_file_name
    });
  }
  // En ApiService.ts

  // En ApiServices.ts

  static async uploadFileDirect(file: { uri: string, name: string, type: string }): Promise<string> {
    const uploader = "UploadHandler.php";
    const formData = new FormData();

    // El servidor espera 'files[]' según tu código de jQuery
    // @ts-ignore
    formData.append('files[]', {
      uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
      name: file.name,
      type: file.type,
    });

    const uploadUrl = this.URL_FILES_CIRUGIAS + "UploadHandler.php";

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
      });

      const result = await response.json();
      if (result.files && result.files.length > 0) {
        // Retornamos la URL final del servidor
        return this.URL_FILES_CIRUGIAS +  "files/" + result.files[0].name;
      }
      return "";
    } catch (error) {
      console.error("Error en uploadFileDirect:", error);
      return "";
    }
  }
}

export default ApiService;