// Elementos del HTML
const form = document.querySelector("#caudal-form");
const resultado = document.querySelector("#resultado");

// Se ejecuta al enviar el formulario
form.addEventListener("submit", (event) => {
  event.preventDefault();

  // Lee los valores
  const diametroMm = Number(form.diametro.value);
  const velocidad = Number(form.velocidad.value);

  // Valida los datos
  if (
    !Number.isFinite(diametroMm) ||
    !Number.isFinite(velocidad) ||
    diametroMm <= 0 ||
    velocidad < 0
  ) {
    resultado.textContent = "Ingresa valores válidos.";
    return;
  }

  // Convierte milímetros a metros
  const diametroM = diametroMm / 1000;

  // Q = A × v
  const area = Math.PI * diametroM ** 2 / 4;

  // Convierte m³/s a L/s
  const caudalLps = area * velocidad * 1000;

  // Muestra el resultado
  resultado.textContent = `Caudal: ${caudalLps.toFixed(2)} L/s`;
});