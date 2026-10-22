/**
 * TOSTAOS F.C. · Crea el formulario de crónicas y su hoja de respuestas.
 *
 * Cómo usarlo (solo una vez):
 *  1. Entra en https://script.google.com con la cuenta de Google del equipo.
 *  2. "Nuevo proyecto", borra lo que haya y pega TODO este archivo.
 *  3. Revisa la lista JUGADORES de abajo (deben llamarse EXACTAMENTE igual
 *     que en data/plantilla.json de la web).
 *  4. Pulsa Ejecutar ▶ con la función "crearFormulario" y acepta los permisos.
 *  5. Abre "Registro de ejecución": ahí salen el enlace del formulario
 *     (para el míster) y el de la hoja de respuestas.
 *
 * IMPORTANTE: no cambies los títulos de las preguntas después de crearlo.
 * La web lee las respuestas por esos títulos.
 */

const JUGADORES = [
  'Pablo Corredoira',
  'Beltrán Lafuente Beltrán',
  'Gonzalo Mestanza',
  'Ricardo Soto',
  'Diego Muro Matoses',
  'Antonio Lafuente',
  'Miguel Marcos',
  'Minos',
  'Jacobo Perez Pla',
  'Nacho Gratacós'
];

const SISTEMAS = ['4-3-3', '4-4-2', '3-5-2', 'Otro'];

function crearFormulario() {
  const form = FormApp.create('Tostaos F.C. · Crónica de la jornada');
  form.setDescription(
    'Rellénalo después de cada partido. Si te equivocas, vuelve a enviarlo con el mismo número de jornada: la web usará el último envío.'
  );
  form.setCollectEmail(false);
  form.setAllowResponseEdits(true);

  const numero = FormApp.createTextValidation()
    .setHelpText('Escribe solo un número')
    .requireNumber()
    .build();

  // ── 1. EL PARTIDO ────────────────────────────────────────────
  form.addSectionHeaderItem().setTitle('El partido');
  form.addTextItem().setTitle('Jornada').setRequired(true).setValidation(numero);
  form.addDateItem().setTitle('Fecha del partido').setRequired(true);
  form.addTextItem().setTitle('Rival').setRequired(true);
  form.addMultipleChoiceItem().setTitle('¿Local o visitante?')
    .setChoiceValues(['Local', 'Visitante']).setRequired(true);
  form.addTextItem().setTitle('Campo');
  form.addTextItem().setTitle('Goles de Tostaos').setRequired(true).setValidation(numero);
  form.addTextItem().setTitle('Goles del rival').setRequired(true).setValidation(numero);
  form.addParagraphTextItem().setTitle('Resumen del partido').setRequired(true)
    .setHelpText('Cuenta cómo fue el partido. Deja una línea en blanco entre párrafos.');
  form.addParagraphTextItem().setTitle('Momentos clave')
    .setHelpText('Uno por línea: minuto - tipo - descripción. Tipos: Gol, Ocasión, Tarjeta, Cambio.\nEjemplo:\n9 - Gol - Beltrán de falta directa\n60 - Cambio - Entra Minos por Gonzalo');

  // ── 2. ALINEACIÓN ────────────────────────────────────────────
  form.addPageBreakItem().setTitle('Alineación');
  form.addListItem().setTitle('Sistema').setChoiceValues(SISTEMAS).setRequired(true);
  form.addCheckboxItem().setTitle('Once titular').setChoiceValues(JUGADORES)
    .setHelpText('Marca los que salieron de inicio.');

  // ── 3. RENDIMIENTO ───────────────────────────────────────────
  form.addPageBreakItem().setTitle('Rendimiento de cada jugador');
  const notas = ['No jugó', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  form.addGridItem().setTitle('Nota de cada jugador')
    .setHelpText('Nota de 1 a 10. Marca "No jugó" si no participó.')
    .setRows(JUGADORES).setColumns(notas).setRequired(true);
  const cantidades = ['0', '1', '2', '3', '4', '5+'];
  form.addGridItem().setTitle('Goles de cada jugador')
    .setHelpText('Puedes dejar en blanco a quien no marcó.')
    .setRows(JUGADORES).setColumns(cantidades);
  form.addGridItem().setTitle('Asistencias de cada jugador')
    .setHelpText('Puedes dejar en blanco a quien no dio ninguna.')
    .setRows(JUGADORES).setColumns(cantidades);
  form.addCheckboxGridItem().setTitle('Tarjetas')
    .setRows(JUGADORES).setColumns(['Amarilla', 'Roja']);
  form.addListItem().setTitle('MVP del partido').setChoiceValues(JUGADORES).setRequired(true);
  form.addListItem().setTitle('Peor del partido').setChoiceValues(JUGADORES)
    .setHelpText('"El más tostao" de la jornada. Saldrá en la web como rasca y gana.');
  form.addParagraphTextItem().setTitle('Comentario sobre cada jugador')
    .setHelpText('Uno por línea: Nombre: comentario.\nEjemplo:\nMinos: incansable en la presión\nPablo Corredoira: dos paradas de mérito');

  // ── 4. PRÓXIMO PARTIDO ───────────────────────────────────────
  form.addPageBreakItem().setTitle('Próximo partido y estrategia');
  form.addDateItem().setTitle('Próximo partido: fecha');
  form.addTimeItem().setTitle('Próximo partido: hora');
  form.addTextItem().setTitle('Próximo partido: rival');
  form.addMultipleChoiceItem().setTitle('Próximo partido: ¿local o visitante?')
    .setChoiceValues(['Local', 'Visitante']);
  form.addTextItem().setTitle('Próximo partido: campo');
  form.addListItem().setTitle('Próximo partido: sistema previsto').setChoiceValues(SISTEMAS);
  form.addParagraphTextItem().setTitle('Estrategia del míster')
    .setHelpText('Resumen del planteamiento para el próximo partido.');
  form.addParagraphTextItem().setTitle('Claves del partido')
    .setHelpText('Una por línea (con balón, sin balón, balón parado…).');
  form.addParagraphTextItem().setTitle('Bajas y avisos')
    .setHelpText('Lesionados, sancionados, hora de quedada…');

  // ── Hoja de respuestas ───────────────────────────────────────
  const hoja = SpreadsheetApp.create('Tostaos F.C. · Crónicas (respuestas)');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, hoja.getId());

  Logger.log('Formulario para el míster: ' + form.getPublishedUrl());
  Logger.log('Editar formulario: ' + form.getEditUrl());
  Logger.log('Hoja de respuestas: ' + hoja.getUrl());
}
