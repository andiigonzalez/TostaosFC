/**
 * TOSTAOS F.C. · Formulario de crónicas (fútbol 7)
 *
 * ── USO NORMAL: actualizarFormulario ─────────────────────────────
 * Arregla el formulario que YA tienes sin perder respuestas:
 *   - pone los sistemas de fútbol 7 en "Sistema" y "Próximo partido: sistema previsto"
 *   - quita las preguntas de local o visitante
 *   - pone la lista JUGADORES en todas las preguntas de jugadores
 *   - deja una caja "Comentario: <jugador>" por jugador (añade las que faltan y quita las sobrantes)
 * Ejecútala cada vez que cambies la lista JUGADORES.
 *
 * ── SOLO PARA EMPEZAR DE CERO: crearFormulario ───────────────────
 * Crea un formulario y una hoja nuevos. No la uses si ya tienes uno.
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

const PRE_COMENTARIO = 'Comentario: ';

// ═════════════════════════════════════════════════════════════════
function actualizarFormulario() {
  const form = FormApp.openByUrl(FORM_URL);

  // 1. Quitar local / visitante
  form.getItems().filter((it) => /local o visitante/i.test(it.getTitle())).forEach((it) => form.deleteItem(it));

  // 2. Quitar la pregunta antigua de comentarios en texto libre (si sigue ahí)
  form.getItems().filter((it) => it.getTitle() === 'Comentario sobre cada jugador' && it.getType() === FormApp.ItemType.PARAGRAPH_TEXT)
    .forEach((it) => form.deleteItem(it));

  // 3. Sistemas, jugadores y textos de ayuda
  form.getItems().forEach((it) => {
    const t = it.getTitle(), ty = it.getType();
    if (ty === FormApp.ItemType.LIST && (t === 'Sistema' || t === 'Próximo partido: sistema previsto')) it.asListItem().setChoiceValues(SISTEMAS);
    if (ty === FormApp.ItemType.GRID) it.asGridItem().setRows(JUGADORES);
    if (ty === FormApp.ItemType.CHECKBOX_GRID) it.asCheckboxGridItem().setRows(JUGADORES);
    if (t === 'Once titular' && ty === FormApp.ItemType.CHECKBOX) it.asCheckboxItem().setChoiceValues(JUGADORES).setHelpText('Marca los 7 que salieron de inicio.');
    if ((t === 'MVP del partido' || t === 'Peor del partido') && ty === FormApp.ItemType.LIST) it.asListItem().setChoiceValues(JUGADORES);
  });

  // 4. Cajas de comentario: una por jugador
  form.getItems().filter((it) => it.getTitle().indexOf(PRE_COMENTARIO) === 0 && !JUGADORES.includes(it.getTitle().slice(PRE_COMENTARIO.length)))
    .forEach((it) => form.deleteItem(it));
  const yaTienen = form.getItems().filter((it) => it.getTitle().indexOf(PRE_COMENTARIO) === 0).map((it) => it.getTitle().slice(PRE_COMENTARIO.length));
  if (!form.getItems().some((it) => it.getType() === FormApp.ItemType.SECTION_HEADER && it.getTitle() === 'Comentario sobre cada jugador')) {
    const cab = form.addSectionHeaderItem().setTitle('Comentario sobre cada jugador').setHelpText('Opcional. Deja en blanco a quien no quieras comentar.');
    const t = form.getItems().map((it) => it.getTitle());
    const pos = Math.max(t.indexOf('Peor del partido'), t.indexOf('MVP del partido'));
    if (pos >= 0) form.moveItem(cab.getIndex(), pos + 1);
  }
  JUGADORES.filter((j) => !yaTienen.includes(j)).forEach((j) => {
    const t = form.getItems().map((it) => it.getTitle());
    let pos = -1;
    t.forEach((x, i) => { if (x.indexOf(PRE_COMENTARIO) === 0 || x === 'Comentario sobre cada jugador') pos = i; });
    const nueva = form.addParagraphTextItem().setTitle(PRE_COMENTARIO + j);
    if (pos >= 0) form.moveItem(nueva.getIndex(), pos + 1);
  });

  Logger.log('Formulario actualizado: ' + JUGADORES.length + ' jugadores, sistemas ' + SISTEMAS.join(', '));
}

// ═════════════════════════════════════════════════════════════════
function crearFormulario() {
  const form = FormApp.create('Tostaos F.C. · Crónica de la jornada');
  form.setDescription('Rellénalo después de cada partido. Si te equivocas, vuelve a enviarlo con el mismo número de jornada: la web usará el último envío.');
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);
  const numero = FormApp.createTextValidation().setHelpText('Escribe solo un número').requireNumber().build();

  // 1. El partido
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

  // 2. Alineación
  form.addPageBreakItem().setTitle('Alineación');
  form.addListItem().setTitle('Sistema').setChoiceValues(SISTEMAS).setRequired(true);
  form.addCheckboxItem().setTitle('Once titular').setChoiceValues(JUGADORES).setHelpText('Marca los 7 que salieron de inicio.');

  // 3. Rendimiento
  form.addPageBreakItem().setTitle('Rendimiento de cada jugador');
  form.addGridItem().setTitle('Nota de cada jugador').setHelpText('Nota de 1 a 10. Marca "No jugó" si no participó.')
    .setRows(JUGADORES).setColumns(['No jugó', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10']).setRequired(true);
  const cantidades = ['0', '1', '2', '3', '4', '5+'];
  form.addGridItem().setTitle('Goles de cada jugador').setHelpText('Puedes dejar en blanco a quien no marcó.').setRows(JUGADORES).setColumns(cantidades);
  form.addGridItem().setTitle('Asistencias de cada jugador').setHelpText('Puedes dejar en blanco a quien no dio ninguna.').setRows(JUGADORES).setColumns(cantidades);
  form.addCheckboxGridItem().setTitle('Tarjetas').setRows(JUGADORES).setColumns(['Amarilla', 'Roja']);
  form.addListItem().setTitle('MVP del partido').setChoiceValues(JUGADORES).setRequired(true);
  form.addListItem().setTitle('Peor del partido').setChoiceValues(JUGADORES).setHelpText('"El más tostao" de la jornada. Saldrá en la web como rasca y gana.');
  form.addSectionHeaderItem().setTitle('Comentario sobre cada jugador').setHelpText('Opcional. Deja en blanco a quien no quieras comentar.');
  JUGADORES.forEach((j) => form.addParagraphTextItem().setTitle(PRE_COMENTARIO + j));

  // 4. Próximo partido
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
## mister: https://docs.google.com/forms/d/e/1FAIpQLSdExrvDrF_BZZ18lkEVfJnv73TNVGG1hdFAJmmmfHxW6qFRmw/viewform
## Editar formulario: https://docs.google.com/forms/d/14BhZk8-Ia04ycePx8-5t9k6IrmtzfbPEYmYcjL7Af4E/edit
## Hoja de respuestas: https://docs.google.com/spreadsheets/d/1UF64MQTzSgda_0nKgW2xl05h8vy6kBPnPK6Vi98ctXo/edit
