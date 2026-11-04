/**
 * TOSTAOS F.C. · Formularios de crónicas y calendario (fútbol 7)
 *
 * ── USO NORMAL: actualizarFormulario ─────────────────────────────
 * Deja el formulario de crónicas al día sin perder respuestas:
 *   - sistemas de fútbol 7 en "Sistema" y "Próximo partido: sistema previsto"
 *   - quita las preguntas de local o visitante
 *   - NOTAS ESCRITAS A MANO: una caja "Nota: <jugador>" por jugador (admite decimales: 7,5)
 *     y quita la tabla antigua de notas
 *   - MVP y Peor como botones (no desplegable)
 *   - la lista JUGADORES en todas las preguntas de jugadores
 *   - una caja "Comentario: <jugador>" por jugador
 * Ejecútala cada vez que cambies la lista JUGADORES. Se puede ejecutar todas las veces que quieras.
 *
 * ── SOLO PARA EMPEZAR DE CERO: crearFormulario / crearFormularioCalendario ──
 *
 * IMPORTANTE
 *   - Los nombres de JUGADORES tienen que ser IDÉNTICOS al "nombre" de plantilla.json.
 *   - No cambies los títulos de las preguntas: la web las lee por su título.
 */
 
const FORM_URL = 'https://docs.google.com/forms/d/14BhZk8-Ia04ycePx8-5t9k6IrmtzfbPEYmYcjL7Af4E/edit';
 
const JUGADORES = ['Pablo Corredoira', 'Beltrán Lafuente', 'Gonzalo Mestanza', 'Ricardo Soto', 'Diego Muro',
  'Juan de Solas', 'Jaime Díez', 'Nicolás Cifuentes', 'Miguel Suárez', 'Gonzalo Ballesteros',
  'Antonio Lafuente', 'Javier Laín', 'Manuel Nuñez', 'Jacobo Pérez-Pla', 'Jaime Salafranca',
  'Javier Rodríguez-Moneu', 'Yago Tomé'];
 
// Iguales que en app.js de la web
const SISTEMAS = ['2-3-1', '3-2-1', '3-1-2', '2-1-2-1', '2-2-2', '3-3', 'Otro'];
 
const PRE_NOTA = 'Nota: ';
const PRE_COMENTARIO = 'Comentario: ';
const CAB_NOTAS = 'Nota de cada jugador';
const CAB_COMENTARIOS = 'Comentario sobre cada jugador';
const AYUDA_NOTAS = 'Escribe la nota de 0 a 10, con un decimal si quieres (7,5). Deja en blanco a quien no jugó.';
 
function validacionNota() {
  return FormApp.createTextValidation()
    .setHelpText('Escribe un número del 0 al 10, por ejemplo 7 o 7,5')
    .requireTextMatchesPattern('^(10([.,]0)?|[0-9]([.,][0-9])?)$')
    .build();
}
 
// ═════════════════════════════════════════════════════════════════
function actualizarFormulario() {
  const form = FormApp.openByUrl(FORM_URL);
  const T = FormApp.ItemType;
  const items = () => form.getItems();
  const titulos = () => items().map((it) => it.getTitle());
  const indice = (titulo, tipo) => items().findIndex((it) => it.getTitle() === titulo && (!tipo || it.getType() === tipo));
 
  // 1. Quitar local / visitante y el comentario antiguo en texto libre
  items().filter((it) => /local o visitante/i.test(it.getTitle())).forEach((it) => form.deleteItem(it));
  items().filter((it) => it.getTitle() === CAB_COMENTARIOS && it.getType() === T.PARAGRAPH_TEXT).forEach((it) => form.deleteItem(it));
 
  // 2. Tabla de notas → cabecera "Nota de cada jugador" en el mismo sitio
  const iTabla = indice(CAB_NOTAS, T.GRID);
  if (iTabla >= 0) {
    form.deleteItem(items()[iTabla]);
    const cab = form.addSectionHeaderItem().setTitle(CAB_NOTAS).setHelpText(AYUDA_NOTAS);
    form.moveItem(cab.getIndex(), iTabla);
  }
 
  // 3. MVP y Peor: de desplegable a botones (mismo sitio, mismo título)
  ['MVP del partido', 'Peor del partido'].forEach((titulo) => {
    const i = indice(titulo, T.LIST);
    if (i < 0) return;
    const viejo = items()[i].asListItem();
    const ayuda = viejo.getHelpText(), obligatorio = viejo.isRequired();
    form.deleteItem(i);
    const nuevo = form.addMultipleChoiceItem().setTitle(titulo).setHelpText(ayuda).setRequired(obligatorio);
    form.moveItem(nuevo.getIndex(), i);
  });
 
  // 4. Sistemas, jugadores y textos de ayuda
  items().forEach((it) => {
    const t = it.getTitle(), ty = it.getType();
    if (ty === T.LIST && (t === 'Sistema' || t === 'Próximo partido: sistema previsto')) it.asListItem().setChoiceValues(SISTEMAS);
    if (ty === T.GRID) it.asGridItem().setRows(JUGADORES);
    if (ty === T.CHECKBOX_GRID) it.asCheckboxGridItem().setRows(JUGADORES);
    if (t === 'Once titular' && ty === T.CHECKBOX) it.asCheckboxItem().setChoiceValues(JUGADORES).setHelpText('Marca los 7 que salieron de inicio.');
    if ((t === 'MVP del partido' || t === 'Peor del partido') && ty === T.MULTIPLE_CHOICE) it.asMultipleChoiceItem().setChoiceValues(JUGADORES);
    if (t === CAB_NOTAS && ty === T.SECTION_HEADER) it.setHelpText(AYUDA_NOTAS);
  });
 
  // 5. Cajas de nota (texto corto, con decimales) y de comentario (párrafo)
  cajasPorJugador(form, PRE_NOTA, CAB_NOTAS, AYUDA_NOTAS, ['Once titular', 'Sistema'], 'nota');
  cajasPorJugador(form, PRE_COMENTARIO, CAB_COMENTARIOS, 'Opcional. Deja en blanco a quien no quieras comentar.', ['Peor del partido', 'MVP del partido'], 'comentario');
 
  Logger.log('Formulario actualizado: ' + JUGADORES.length + ' jugadores · notas a mano · MVP y Peor con botones');
}
 
// Deja una caja por jugador con el prefijo dado, debajo de su cabecera.
function cajasPorJugador(form, prefijo, cabecera, ayuda, anclas, tipo) {
  const T = FormApp.ItemType;
  const items = () => form.getItems();
  const esCaja = (it) => it.getTitle().indexOf(prefijo) === 0;
 
  // quitar las de jugadores que ya no están
  items().filter((it) => esCaja(it) && !JUGADORES.includes(it.getTitle().slice(prefijo.length))).forEach((it) => form.deleteItem(it));
 
  // cabecera: si no existe, debajo de la primera ancla que exista
  if (!items().some((it) => it.getType() === T.SECTION_HEADER && it.getTitle() === cabecera)) {
    const t = items().map((it) => it.getTitle());
    let pos = -1;
    anclas.some((a) => { pos = t.indexOf(a); return pos >= 0; });
    const cab = form.addSectionHeaderItem().setTitle(cabecera).setHelpText(ayuda);
    if (pos >= 0) form.moveItem(cab.getIndex(), pos + 1);
  }
 
  // añadir las que faltan, en el orden de JUGADORES, justo después de la última caja (o de la cabecera)
  JUGADORES.forEach((j) => {
    if (items().some((it) => it.getTitle() === prefijo + j)) return;
    const t = items().map((it) => it.getTitle());
    let pos = t.indexOf(cabecera);
    t.forEach((x, i) => { if (x.indexOf(prefijo) === 0) pos = i; });
    const caja = tipo === 'nota'
      ? form.addTextItem().setTitle(prefijo + j).setValidation(validacionNota())
      : form.addParagraphTextItem().setTitle(prefijo + j);
    if (pos >= 0) form.moveItem(caja.getIndex(), pos + 1);
  });
}
 
// ═════════════════════════════════════════════════════════════════
function crearFormulario() {
  const form = FormApp.create('Tostaos F.C. · Crónica de la jornada');
  form.setDescription('Rellénalo después de cada partido. Si te equivocas, vuelve a enviarlo con el mismo número de jornada: la web usará el último envío.');
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);
  const numero = FormApp.createTextValidation().setHelpText('Escribe solo un número').requireNumber().build();
 
  form.addSectionHeaderItem().setTitle('El partido');
  form.addTextItem().setTitle('Jornada').setRequired(true).setValidation(numero);
  form.addDateItem().setTitle('Fecha del partido').setRequired(true);
  form.addTextItem().setTitle('Rival').setRequired(true);
  form.addTextItem().setTitle('Campo');
  form.addTextItem().setTitle('Goles de Tostaos').setRequired(true).setValidation(numero);
  form.addTextItem().setTitle('Goles del rival').setRequired(true).setValidation(numero);
  form.addParagraphTextItem().setTitle('Resumen del partido').setRequired(true)
    .setHelpText('Cuenta cómo fue el partido. Deja una línea en blanco entre párrafos.');
  form.addParagraphTextItem().setTitle('Momentos clave')
    .setHelpText('Uno por línea: minuto - tipo - descripción. Tipos: Gol, Ocasión, Tarjeta, Cambio.\nEjemplo:\n9 - Gol - Beltrán de falta directa\n30 - Cambio - Entra Minos');
 
  form.addPageBreakItem().setTitle('Alineación');
  form.addListItem().setTitle('Sistema').setChoiceValues(SISTEMAS).setRequired(true);
  form.addCheckboxItem().setTitle('Once titular').setChoiceValues(JUGADORES).setHelpText('Marca los 7 que salieron de inicio.');
 
  form.addPageBreakItem().setTitle('Rendimiento de cada jugador');
  form.addSectionHeaderItem().setTitle(CAB_NOTAS).setHelpText(AYUDA_NOTAS);
  JUGADORES.forEach((j) => form.addTextItem().setTitle(PRE_NOTA + j).setValidation(validacionNota()));
  const cantidades = ['0', '1', '2', '3', '4', '5+'];
  form.addGridItem().setTitle('Goles de cada jugador').setHelpText('Puedes dejar en blanco a quien no marcó.').setRows(JUGADORES).setColumns(cantidades);
  form.addGridItem().setTitle('Asistencias de cada jugador').setHelpText('Puedes dejar en blanco a quien no dio ninguna.').setRows(JUGADORES).setColumns(cantidades);
  form.addCheckboxGridItem().setTitle('Tarjetas').setRows(JUGADORES).setColumns(['Amarilla', 'Roja']);
  form.addMultipleChoiceItem().setTitle('MVP del partido').setChoiceValues(JUGADORES).setRequired(true);
  form.addMultipleChoiceItem().setTitle('Peor del partido').setChoiceValues(JUGADORES).setHelpText('"El más tostao" de la jornada. Saldrá en la web como rasca y gana.');
  form.addSectionHeaderItem().setTitle(CAB_COMENTARIOS).setHelpText('Opcional. Deja en blanco a quien no quieras comentar.');
  JUGADORES.forEach((j) => form.addParagraphTextItem().setTitle(PRE_COMENTARIO + j));
 
  form.addPageBreakItem().setTitle('Próximo partido y estrategia');
  form.addDateItem().setTitle('Próximo partido: fecha');
  form.addTimeItem().setTitle('Próximo partido: hora');
  form.addTextItem().setTitle('Próximo partido: rival');
  form.addTextItem().setTitle('Próximo partido: campo');
  form.addListItem().setTitle('Próximo partido: sistema previsto').setChoiceValues(SISTEMAS);
  form.addParagraphTextItem().setTitle('Estrategia del míster').setHelpText('Resumen del planteamiento para el próximo partido.');
  form.addParagraphTextItem().setTitle('Claves del partido').setHelpText('Una por línea (con balón, sin balón, balón parado…).');
  form.addParagraphTextItem().setTitle('Bajas y avisos').setHelpText('Lesionados, sancionados, hora de quedada…');
 
  const hoja = SpreadsheetApp.create('Tostaos F.C. · Crónicas (respuestas)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());
  Logger.log('Formulario para el míster: ' + form.getPublishedUrl());
  Logger.log('Editar formulario: ' + form.getEditUrl());
  Logger.log('Hoja de respuestas: ' + hoja.getUrl());
}
//----------------------------- FORMULARIO CRÓNICAS -----------------------------------------------------------
// mister: https://docs.google.com/forms/d/e/1FAIpQLSdExrvDrF_BZZ18lkEVfJnv73TNVGG1hdFAJmmmfHxW6qFRmw/viewform
// Editar formulario: https://docs.google.com/forms/d/14BhZk8-Ia04ycePx8-5t9k6IrmtzfbPEYmYcjL7Af4E/edit
// Hoja de respuestas: https://docs.google.com/spreadsheets/d/1UF64MQTzSgda_0nKgW2xl05h8vy6kBPnPK6Vi98ctXo/edit
//---------------------------------------------------- -----------------------------------------------------------
function crearFormularioCalendario() {
  const form = FormApp.create('Tostaos F.C. · Calendario');
  form.setDescription('Añade o cambia un partido del calendario. Para cambiar uno, envíalo otra vez con el mismo número de jornada. Para quitarlo, marca "Cancelado".');
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);
  const numero = FormApp.createTextValidation().setHelpText('Escribe solo un número').requireNumber().build();
  form.addTextItem().setTitle('Jornada').setRequired(true).setValidation(numero);
  form.addDateItem().setTitle('Fecha').setRequired(true);
  form.addTimeItem().setTitle('Hora');
  form.addTextItem().setTitle('Rival').setRequired(true);
  form.addTextItem().setTitle('Campo');
  form.addMultipleChoiceItem().setTitle('Estado')
    .setChoiceValues(['Confirmado', 'Por confirmar', 'Aplazado', 'Cancelado']).setRequired(true);
  form.addTextItem().setTitle('Notas').setHelpText('Opcional: "Cambio de hora", "Por lluvia", "Quedamos 30 min antes"…');
  const hoja = SpreadsheetApp.create('Tostaos F.C. · Calendario (respuestas)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());
  Logger.log('Formulario de calendario para el míster: ' + form.getPublishedUrl());
  Logger.log('Editar formulario de calendario: ' + form.getEditUrl());
  Logger.log('Hoja de respuestas del calendario: ' + hoja.getUrl());
}

//----------------------------------FORMULARIO CALENDARIO---------------------------------------------------
// Míster: https://docs.google.com/forms/d/e/1FAIpQLSeQBkMn_ffWed9QKy0V1mSp5TGymA5A1DjWgJULdgUV_9G6GQ/viewform
// Editar formulario de calendario: https://docs.google.com/forms/d/1-jMg0-4INsLRiroFfubyzrM_6PVtBR3vRibO8ZBX57E/edit
// Hoja de respuestas del calendario: https://docs.google.com/spreadsheets/d/1F9O-Wsp7NiRrRrxwTlonZwGEue-ukGtQzr0ojku3nJ8/edit
