// crearCalculadora viene de units.js (cargado antes en el HTML).
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
    caudal: { magnitud: "caudal", etiqueta: "Caudal (Q)" },
  },

  // Recibe las entradas YA en unidad base (SI) y devuelve la salida en base.
  calcular({ diametro, velocidad }) {
    // Q = A × v   (diámetro y velocidad ya vienen en metros y m/s)
    const area = (Math.PI * diametro ** 2) / 4;
    return { caudal: area * velocidad };
  },

  // Tras cada cálculo válido: dibuja la gráfica velocidad–caudal.
  // Todo llega en base (SI): diámetro en m, velocidad en m/s, caudal en m³/s.
  alCalcular({ diametro, velocidad }, { caudal }) {
    if (window.dibujarGraficaCaudal) {
      window.dibujarGraficaCaudal(diametro, velocidad, caudal);
    }
  },
});
