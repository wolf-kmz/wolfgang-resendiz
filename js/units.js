// ============================================================
//  Motor de unidades compartido para todas las calculadoras
// ============================================================
//
// Idea central: todo se convierte a una UNIDAD BASE (SI), el
// cálculo se hace siempre en base, y el resultado se convierte
// a la unidad que el usuario elija en la barra inferior.
//
// Para agregar una magnitud nueva (p. ej. volumen) basta con
// añadir una entrada aquí abajo: la barra la mostrará sola.

// factor = cuánto vale 1 unidad expresada en la unidad base.
export const MAGNITUDES = {
  longitud:  { base: "m",    unidades: { mm: 0.001, cm: 0.01, m: 1, in: 0.0254, ft: 0.3048 } },
  velocidad: { base: "m/s",  unidades: { "m/s": 1, "km/h": 1 / 3.6, "ft/s": 0.3048, mph: 0.44704 } },
  caudal:    { base: "m³/s", unidades: { "L/s": 0.001, "m³/h": 1 / 3600, "m³/s": 1, gpm: 6.30902e-5 } },
  volumen:   { base: "m³",   unidades: { mL: 1e-6, L: 0.001, "m³": 1, gal: 0.00378541 } },
};

// Conversiones entre unidad elegida y unidad base.
export const aBase     = (valor, magnitud, unidad) => valor * MAGNITUDES[magnitud].unidades[unidad];
export const desdeBase = (valor, magnitud, unidad) => valor / MAGNITUDES[magnitud].unidades[unidad];

// ---- Preferencias del usuario (se recuerdan entre calculadoras) ----
const CLAVE = "unidades-preferidas";

const leerPrefs = () => {
  try {
    return JSON.parse(localStorage.getItem(CLAVE)) || {};
  } catch {
    return {};
  }
};

const guardarPref = (magnitud, unidad) => {
  const prefs = leerPrefs();
  prefs[magnitud] = unidad;
  try {
    localStorage.setItem(CLAVE, JSON.stringify(prefs));
  } catch {
    /* modo privado sin almacenamiento: se ignora */
  }
};

// ---- Utilidades ----
const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

const formatear = (v) => {
  if (!Number.isFinite(v)) return "—";
  const abs = Math.abs(v);
  const decimales = abs >= 100 ? 1 : abs >= 1 ? 2 : 4;
  return v.toFixed(decimales);
};

// ---- Barra inferior de unidades (se arma sola con las magnitudes) ----
function construirBarra(magnitudes, unidadActual, alCambiar) {
  const barra = document.createElement("div");
  barra.className = "unit-bar";
  barra.setAttribute("role", "group");
  barra.setAttribute("aria-label", "Unidades");

  const titulo = document.createElement("span");
  titulo.className = "unit-bar__titulo";
  titulo.textContent = "Unidades";
  barra.appendChild(titulo);

  for (const magnitud of magnitudes) {
    const item = document.createElement("label");
    item.className = "unit-bar__item";

    const nombre = document.createElement("span");
    nombre.textContent = capitalizar(magnitud);
    item.appendChild(nombre);

    const select = document.createElement("select");
    for (const unidad of Object.keys(MAGNITUDES[magnitud].unidades)) {
      const opcion = document.createElement("option");
      opcion.value = unidad;
      opcion.textContent = unidad;
      if (unidad === unidadActual[magnitud]) opcion.selected = true;
      select.appendChild(opcion);
    }
    select.addEventListener("change", () => alCambiar(magnitud, select.value));

    item.appendChild(select);
    barra.appendChild(item);
  }

  return barra;
}

// ============================================================
//  crearCalculadora(config)
// ============================================================
//
//  config = {
//    form:       "#id-del-form",
//    resultado:  "#id-del-parrafo",
//    entradas: {
//      campo: { magnitud: "longitud", positivo: true },  // positivo => debe ser > 0
//    },
//    salidas: {
//      clave: { magnitud: "caudal", etiqueta: "Caudal" },
//    },
//    // recibe las entradas YA en unidad base y devuelve las salidas en unidad base
//    calcular(entradasEnBase) { return { clave: valorEnBase }; },
//  }
export function crearCalculadora(config) {
  const form = document.querySelector(config.form);
  const salida = document.querySelector(config.resultado);
  const prefs = leerPrefs();

  // Magnitudes únicas: primero las de entrada, luego las de salida.
  const magnitudes = [];
  const registrar = (defs) =>
    Object.values(defs || {}).forEach((d) => {
      if (!magnitudes.includes(d.magnitud)) magnitudes.push(d.magnitud);
    });
  registrar(config.entradas);
  registrar(config.salidas);

  // Unidad actual por magnitud (preferencia guardada o la primera disponible).
  const unidadActual = {};
  for (const magnitud of magnitudes) {
    const disponibles = Object.keys(MAGNITUDES[magnitud].unidades);
    unidadActual[magnitud] = disponibles.includes(prefs[magnitud])
      ? prefs[magnitud]
      : disponibles[0];
  }

  let yaCalculado = false;

  // Lee las entradas y las convierte a base; devuelve { error } si algo no es válido.
  function leerEntradas() {
    const base = {};
    for (const [campo, def] of Object.entries(config.entradas)) {
      const bruto = Number(form[campo].value);
      const vacio = form[campo].value.trim() === "";
      if (vacio || !Number.isFinite(bruto) || bruto < 0 || (def.positivo && bruto <= 0)) {
        return { error: true };
      }
      base[campo] = aBase(bruto, def.magnitud, unidadActual[def.magnitud]);
    }
    return { valores: base };
  }

  function recalcular({ silencioso }) {
    const { valores, error } = leerEntradas();
    if (error) {
      if (!silencioso) salida.textContent = "Ingresa valores válidos.";
      return;
    }

    const resultados = config.calcular(valores);
    const partes = Object.entries(config.salidas).map(([clave, def]) => {
      const unidad = unidadActual[def.magnitud];
      const valor = desdeBase(resultados[clave], def.magnitud, unidad);
      return `${def.etiqueta}: ${formatear(valor)} ${unidad}`;
    });

    salida.textContent = partes.join(" · ");
    yaCalculado = true;
  }

  // Barra inferior: al cambiar una unidad recalcula (si ya hubo un resultado).
  const barra = construirBarra(magnitudes, unidadActual, (magnitud, unidad) => {
    unidadActual[magnitud] = unidad;
    guardarPref(magnitud, unidad);
    if (yaCalculado) recalcular({ silencioso: true });
  });
  document.body.appendChild(barra);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    recalcular({ silencioso: false });
  });
}
