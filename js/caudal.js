import { crearCalculadora } from "./units.js";

// La calculadora solo DECLARA qué magnitudes usa y cómo calcula.
// El motor arma la barra de unidades y hace todas las conversiones.
crearCalculadora({
  form: "#caudal-form",
  resultado: "#resultado",

  // Entradas: cada campo dice su magnitud (positivo => debe ser > 0).
  entradas: {
    diametro: { magnitud: "longitud", positivo: true },
    velocidad: { magnitud: "velocidad" },
  },

  // Salidas: qué devuelve y con qué etiqueta.
  salidas: {
    caudal: { magnitud: "caudal", etiqueta: "Caudal" },
  },

  // Recibe las entradas YA en unidad base (SI) y devuelve la salida en base.
  calcular({ diametro, velocidad }) {
    // Q = A × v   (diámetro y velocidad ya vienen en metros y m/s)
    const area = (Math.PI * diametro ** 2) / 4;
    return { caudal: area * velocidad };
  },
});
