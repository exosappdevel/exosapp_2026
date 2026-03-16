
{/* 
        categorias.map((item: iCategoria) => (
                <AccordionSection
                  title={item.nombre}
                  isOpen={!!expandedSections["cat_" + item.id_set_categoria]}
                  onPress={() => toggleSection("cat_" + item.id_set_categoria)}
                  theme={theme}
                >
                  <Text>{item.nombre}</Text>
                  {item.subcategorias.map((sub:iSubCategoria)=>(
                      <Text>{sub.nombre}</Text>
                  ))}
                </AccordionSection>
              ))
            }
              */}

{/*
              static parseXmlToJson(xmlString: string): any {
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

          if (node.nodeName.startsWith('item_') || node.nodeName.startsWith('prod_')|| node.nodeName.startsWith('subitem_')) {
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
  */ }