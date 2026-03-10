// Usamos exportación nombrada clara
export const calcularPrioridad = (solicitada, recolectada) => {
  const faltante = solicitada - recolectada;
  let prioridad = 0;

  // Lógica de cálculo
  if (faltante === solicitada) {
    prioridad = 1000 + faltante;
  } else if (faltante < solicitada && faltante > 0) {
    prioridad = 2000 + faltante;
  } else {
    // Si faltante es 0 o menor, prioridad base 3000
    prioridad = 3000; 
  }

  // Lógica de colores corregida (Faltante 0 = Verde)
  let color = "#48bb78"; // Verde por defecto para prioridad >= 3000
  if (prioridad <= 2000) {
    color = "#f56565"; // Rojo
  } else if (prioridad < 3000) {
    color = "#ecc94b"; // Amarillo
  }

  return { prioridad, color, faltante: faltante < 0 ? 0 : faltante };
};