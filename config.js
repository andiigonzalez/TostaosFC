// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE LA WEB DE TOSTAOS F.C.  (lo único que hay que tocar)
// ─────────────────────────────────────────────────────────────
window.TOSTAOS_CONFIG = {
  // Enlace CSV de la hoja de respuestas del formulario.
  // En la hoja: Archivo › Compartir › Publicar en la web ›
  // elige la pestaña de respuestas y "Valores separados por comas (.csv)".
  urlRespuestasCSV: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSnRun3Ad-yAVA5EfK5Cheqkz1z5vZNa_x_RK4X7qLiYpsYX3iQdK3AKTcLDyQZhbOHx_-ZHdmc1V6j/pub?output=csv",

  // true = enseña los datos de prueba de data/ejemplo.csv (para ver cómo queda).
  // Ponlo en false cuando hayas pegado el enlace de arriba.
  usarEjemplo: false,

  liga: "[Liga]",
  temporada: "26/27",
  ciudad: "Madrid",
  lema: "[Lema o frase del equipo]"
};
