import { DOMParser } from '@xmldom/xmldom';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

class ApiService {
  static URL_CONTROLLER = "";
  static PASSKEY = "";
  static URL_FILES_CIRUGIAS = "";
  //static fields_as_arrays ={  } 


  static init(config: { url: string; passkey: string }) {
    this.URL_CONTROLLER = config.url.endsWith('/')
      ? config.url + "controller_ws.php"
      : config.url + "/controller_ws.php";
    this.URL_FILES_CIRUGIAS = "https://exorta.creaccionesweb.com/pagos_cirugias/";
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


  static parseXmlToJson(xmlString: string): any {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlString.trim(), "text/xml");
      // Validamos que exista el elemento raíz
      if (!xmlDoc || !xmlDoc.documentElement) {
        console.error("Error: El XML recibido está vacío o mal formado");
        return null; // O el valor por defecto que manejes
      }

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
          return node.nodeName.toLowerCase() == "data" ? [] : ""; // O puedes devolver [] si sabes que siempre debería ser lista
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
      return parseNode(xmlDoc.documentElement as any);
    } catch (e) {
      console.error("Error parseando XML:", e);
      return { result: "error", result_text: "Error de lectura XML" };
    }
  }

  static async uploadFileDirect(file: { uri: string, name: string, type: string }): Promise<string> {
    const formData = new FormData();

    if (Platform.OS === 'web') {
      try {
        const response = await fetch(file.uri);
        const blob = await response.blob();
        // IMPORTANTE: Lo mandamos como 'files' para que coincida con el $_FILES['files'] del PHP
        formData.append('files[]', blob, file.name);
      } catch (e) {
        console.error("Error convirtiendo URI a Blob en Web", e);
      }
    } else {
      // @ts-ignore
      formData.append('files', {
        uri: Platform.OS === 'android' ? file.uri : file.uri.replace('file://', ''),
        name: file.name,
        type: file.type,
      });
    }

    // Apuntamos al controlador oficial con la nueva acción y la PASSKEY por URL
    const uploadUrl = `${this.URL_CONTROLLER}?action=upload_pago_cirugia&key=${this.PASSKEY}`;

    try {
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json',
          // Dejar que el navegador asigne el Content-Type automático en Web
          ...(Platform.OS !== 'web' && { 'Content-Type': 'multipart/form-data' })
        },
      });
    
      const text = await response.text();
      const result = this.parseXmlToJson(text);

      if (result.result === 'ok' && result.url) {
        return result.url; // Retornamos la URL que guardó tu PHP
      } else {
        console.error("Error del servidor:", result.result_text);
        return "";
      }
    } catch (error) {
      console.error("Error en uploadFileDirect:", error);
      throw error;
    }
  }

  static async audit_ws_log(limit: string, page: string, search: string) {
    return await this.request("audit_ws_log", { limit: limit, page: page, search: search });
  }
  static async inicia_sesion(usuario: string, password: string) {
    return await this.request("inicia_sesion", { login_usuario: usuario, login_password: password });
  }
  static async save_profile(id_usuario_app: string, tema: string, app_language: string, menu_favorites: string) {
    return await this.request("save_profile", { id_usuario_app, tema, app_language, menu_favorites });
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
    return await this.request("get_tecnicos", { id_usuario });
  }
  static async get_hospitales(id_almacen: string) {
    return await this.request("get_hospitales", { id_almacen });
  }
  static async get_subdistribuidor(es_socio: string) {
    return await this.request("get_subdistribuidor", { es_socio });
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
  static async buscar_cirugia(
    id_usuario: string,
    estatus: string,
    filtrar_fecha: string,
    fecha_inicial: string,
    fecha_final: string,
    vendedor: string,
    tecnico: string,
    subdistribuidor: string,
    codigo_cirugia: string,
    limite: string,
    orderby: string
  ) {
    return await this.request("buscar_cirugia", {
      id_usuario,
      estatus,
      filtrar_fecha,
      fecha_inicial,
      fecha_final,
      vendedor,
      tecnico,
      subdistribuidor,
      codigo_cirugia,
      limite,
      orderby
    });
  }

  // En ApiService.ts
}

export default ApiService;