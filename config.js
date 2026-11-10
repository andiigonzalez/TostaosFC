// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE LA WEB DE TOSTAOS F.C.  (lo único que hay que tocar)
// ─────────────────────────────────────────────────────────────
window.TOSTAOS_CONFIG = {
  // Enlace CSV de la hoja de respuestas del formulario.
  // En la hoja: Archivo › Compartir › Publicar en la web ›
  // elige la pestaña de respuestas y "Valores separados por comas (.csv)".
  urlRespuestasCSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vRQIeG503Oxf3hWbZ5AQ0cdQvhXYwP2FDoySOWRo5XuL7fN2kln3c-sdTd6GeaH20XfEImQfyptRf6S/pub?gid=2124660980&single=true&output=csv",
  urlCalendarioCSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vR_jbFooWcyC8ylGccDozwOAM7xXHvakpcRWtKzUm2QW17NiGw5ONnb5GYDvtNykg3uWJhCMx5bKvd6/pub?gid=2060369509&single=true&output=csv",
  // true = enseña los datos de prueba de data/ejemplo.csv (para ver cómo queda).
  // Ponlo en false cuando hayas pegado el enlace de arriba.
  usarEjemplo: false,

  liga: "[Liga]",
  temporada: "26/27",
  ciudad: "Madrid",
  lema: "[Lema o frase del equipo]"
};
