export interface PrioridadResult {
  prioridad: number;
  color: string;
  faltante: number;
}

export const calcularPrioridad = (solicitada: number, recolectada: number): PrioridadResult => {
  const faltante = solicitada - recolectada;
  let prioridad = 0;

  if (faltante === solicitada) {
    prioridad = 1000 + faltante;
  } else if (faltante < solicitada && faltante > 0) {
    prioridad = 2000 + faltante;
  } else {
    prioridad = 3000;
  }

  let color = "#48bb78"; // Verde por defecto para prioridad >= 3000
  if (prioridad <= 2000) {
    color = "#f56565"; // Rojo
  } else if (prioridad < 3000) {
    color = "#ecc94b"; // Amarillo
  }

  return { prioridad, color, faltante: faltante < 0 ? 0 : faltante };
};