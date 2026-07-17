// ============================================================
//  Gráfica Velocidad (V) vs Caudal (Q) para un diámetro fijo
// ============================================================
//
//  Dibuja una gráfica cartesiana SVG, técnica y minimalista:
//   - Recta verde ascendente: Q = k · V  (k depende del diámetro).
//   - Punto azul destacado: el resultado calculado.
//   - Cuatro líneas de referencia normativas con su punto gris de
//     intersección, el caudal encima y la etiqueta/valor debajo.
//
//  Se expone en window.dibujarGraficaCaudal para que la llame caudal.js
//  tras cada cálculo. Trabaja siempre en m/s (eje X) y L/s (eje Y),
//  sin importar las unidades elegidas en la barra.

(function () {
  const NS = "http://www.w3.org/2000/svg";

  // Límites de referencia (velocidad en m/s), de izquierda a derecha.
  const LIMITES = [
    { etiqueta: "IWA min", v: 0.06 },
    { etiqueta: "CONAGUA min", v: 0.3 },
    { etiqueta: "CONAGUA max concreto", v: 3.0 },
    { etiqueta: "CONAGUA max", v: 5.0 },
  ];

  // Crea un nodo SVG con atributos (y texto opcional).
  function el(nombre, attrs = {}, texto) {
    const nodo = document.createElementNS(NS, nombre);
    for (const clave in attrs) nodo.setAttribute(clave, attrs[clave]);
    if (texto != null) nodo.textContent = texto;
    return nodo;
  }

  const fmt = (q) => q.toFixed(2);

  // Paso "bonito" (1, 2, 5 · 10ⁿ) para las marcas del eje Y.
  function pasoBonito(max, divisiones) {
    const bruto = max / divisiones;
    const mag = Math.pow(10, Math.floor(Math.log10(bruto)));
    const n = bruto / mag;
    const paso = n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10;
    return paso * mag;
  }

  // d en metros, vCalc en m/s, qCalcM3s en m³/s.
  function dibujar(dMetros, vCalc, qCalcM3s) {
    const cont = document.querySelector("#grafica-lienzo");
    if (!cont) return;

    // Pendiente de la recta: Q(L/s) = k · V(m/s) con el diámetro fijo.
    const k = ((Math.PI * dMetros ** 2) / 4) * 1000; // L/s por cada m/s
    const qCalc = qCalcM3s * 1000; // caudal calculado, en L/s

    // --- Escalas de los ejes ---
    const vMax = Math.max(6, Math.ceil(vCalc * 1.12)); // eje X: al menos 6 m/s
    const stepY = pasoBonito(k * vMax, 5);
    const qMax = Math.ceil((k * vMax) / stepY) * stepY || stepY;

    // --- Geometría del lienzo ---
    const W = 700, H = 510;
    const m = { izq: 62, der: 22, arr: 46, aba: 130 };
    const x0 = m.izq, x1 = W - m.der, y0 = m.arr, y1 = H - m.aba;
    const X = (v) => x0 + (v / vMax) * (x1 - x0); // velocidad -> px
    const Y = (q) => y1 - (q / qMax) * (y1 - y0); // caudal -> px

    const svg = el("svg", {
      viewBox: `0 0 ${W} ${H}`,
      role: "img",
      "aria-label": `Velocidad contra caudal: resultado Q = ${fmt(qCalc)} litros por segundo a ${fmt(vCalc)} metros por segundo.`,
    });
    svg.appendChild(el("title", {}, "Velocidad V vs Caudal Q"));

    // --- Rejilla horizontal + marcas del eje Y ---
    for (let q = 0; q <= qMax + 1e-9; q += stepY) {
      const y = Y(q);
      svg.appendChild(el("line", { x1: x0, y1: y, x2: x1, y2: y, class: "g-rejilla" }));
      svg.appendChild(el("text", { x: x0 - 8, y: y + 4, class: "g-tick g-tick--y" }, fmt(q)));
    }
    // --- Rejilla vertical + marcas enteras del eje X ---
    for (let v = 0; v <= vMax + 1e-9; v += 1) {
      const x = X(v);
      svg.appendChild(el("line", { x1: x, y1: y0, x2: x, y2: y1, class: "g-rejilla" }));
      svg.appendChild(el("text", { x, y: y1 + 16, class: "g-tick g-tick--x" }, String(v)));
    }

    // --- Ejes principales ---
    svg.appendChild(el("line", { x1: x0, y1, x2: x1, y2: y1, class: "g-eje" }));
    svg.appendChild(el("line", { x1: x0, y1: y0, x2: x0, y2: y1, class: "g-eje" }));

    // --- Títulos de los ejes ---
    svg.appendChild(el("text", { x: (x0 + x1) / 2, y: H - 8, class: "g-eje-titulo" }, "Velocidad V (m/s)"));
    const cy = (y0 + y1) / 2;
    svg.appendChild(el("text", { x: 16, y: cy, class: "g-eje-titulo", transform: `rotate(-90 16 ${cy})` }, "Caudal Q (L/s)"));

    // --- Recta V–Q (verde, de origen a vMax) ---
    svg.appendChild(el("line", { x1: X(0), y1: Y(0), x2: X(vMax), y2: Y(k * vMax), class: "g-recta" }));

    // --- Líneas de referencia + punto gris en cada intersección ---
    LIMITES.forEach((lim, i) => {
      if (lim.v > vMax) return;
      const x = X(lim.v);
      const qRef = k * lim.v;
      const y = Y(qRef);

      // Línea vertical punteada: de la base hasta la recta.
      svg.appendChild(el("line", { x1: x, y1, x2: x, y2: y, class: "g-ref" }));
      // Punto gris en la intersección.
      svg.appendChild(el("circle", { cx: x, cy: y, r: 4, class: "g-punto-ref" }));
      // Caudal encima (escalonado para que no choquen los cercanos).
      const dy = i % 2 === 0 ? -12 : -26;
      svg.appendChild(el("text", { x, y: Math.max(y + dy, 14), class: "g-q-ref" }, `Q = ${fmt(qRef)} L/s`));
      // Etiqueta y valor debajo del eje (dos filas escalonadas).
      const baseY = i % 2 === 0 ? y1 + 34 : y1 + 66;
      svg.appendChild(el("text", { x, y: baseY, class: "g-lim-nombre" }, lim.etiqueta));
      svg.appendChild(el("text", { x, y: baseY + 15, class: "g-lim-valor" }, `${lim.v.toFixed(2)} m/s`));
    });

    // --- Punto azul del resultado (destacado, al frente) ---
    const bx = X(vCalc), by = Y(qCalc);
    svg.appendChild(el("line", { x1: bx, y1, x2: bx, y2: by, class: "g-ref g-ref--azul" }));
    svg.appendChild(el("circle", { cx: bx, cy: by, r: 7, class: "g-punto" }));
    svg.appendChild(el("text", { x: bx, y: Math.max(by - 14, 14), class: "g-q-punto" }, `Q = ${fmt(qCalc)} L/s`));

    // Reemplaza el contenido anterior y revela la gráfica y las notas.
    cont.replaceChildren(svg);
    const sec = document.querySelector("#grafica");
    const notas = document.querySelector("#grafica-notas");
    if (sec) sec.hidden = false;
    if (notas) notas.hidden = false;
  }

  window.dibujarGraficaCaudal = dibujar;
})();
