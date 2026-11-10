/* Tostaos F.C. · web que se alimenta del formulario de crónicas.
   No hace falta tocar este archivo: la configuración está en config.js */
(function () {
  'use strict';

  const CFG = Object.assign({ urlRespuestasCSV: '', urlCalendarioCSV: '', usarEjemplo: false, liga: '', temporada: '', ciudad: '', lema: '' }, window.TOSTAOS_CONFIG || {});

  // Títulos de las preguntas del formulario (idénticos a crear-formulario.gs)
  const Q = {
    jornada: 'Jornada', fecha: 'Fecha del partido', rival: 'Rival', campo: 'Campo',
    gf: 'Goles de Tostaos', gc: 'Goles del rival', resumen: 'Resumen del partido',
    nota: 'Nota de cada jugador', goles: 'Goles de cada jugador', asist: 'Asistencias de cada jugador', tarjetas: 'Tarjetas',
    mvp: 'MVP del partido',
    pFecha: 'Próximo partido: fecha', pHora: 'Próximo partido: hora', pRival: 'Próximo partido: rival',
    pCampo: 'Próximo partido: campo',
    estrategia: 'Estrategia del míster', bajas: 'Bajas y avisos'
  };

  const ROLE_ORDER = ['POR', 'DEF', 'DEF-BAN', 'MED', 'MED-BAN', 'DEL', ''];

   const ROLE_NAME = {
     POR: 'Portero',
     DEF: 'Defensa',
     'DEF-BAN': 'Defensa banda',
     MED: 'Mediocentro',
     'MED-BAN': 'Mediocentro banda',
     DEL: 'Delantero',
     '': 'Por definir'
   };
   
   const ROLE_CODE = {
     'portero': 'POR', 'por': 'POR',
     'defensa': 'DEF', 'def': 'DEF',
     'defensa banda': 'DEF-BAN', 'def-ban': 'DEF-BAN',
     'mediocentro': 'MED', 'med': 'MED', 'centrocampista': 'MED',
     'mediocentro banda': 'MED-BAN', 'med-ban': 'MED-BAN',
     'delantero': 'DEL', 'del': 'DEL'
   };

  const S = { tab: 'inicio', view: 'jugadores', filtro: 'todos', jornadaSel: null, plantilla: [], calendario: [], cronicas: [] };

  // ── utilidades ─────────────────────────────────────────────
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const fmt1 = (n) => (n == null || isNaN(n) ? '–' : n.toFixed(1).replace('.', ','));
  const $ = (sel, root) => (root || document).querySelector(sel);
  const ICON = {
    left: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>',
    right: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>',
    close: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    cal: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>',
    clock: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/></svg>',
    shield: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/></svg>',
    person: '<svg width="96" height="110" viewBox="0 0 96 110" aria-hidden="true"><circle cx="48" cy="38" r="22" fill="#2F333A"/><path d="M8 110 C8 80 26 66 48 66 C70 66 88 80 88 110 Z" fill="#2F333A"/></svg>'
  };

  // CSV con comillas, comas y saltos de línea dentro de celdas
  function parseCSV(text) {
    const rows = []; let row = []; let cell = ''; let q = false;
    text = text.replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map((h) => h.trim());
    return rows.filter((r) => r.some((c) => c.trim() !== '')).map((r) => {
      const o = {}; head.forEach((h, i) => { const v = (r[i] || '').trim(); if (v !== '' || !(h in o)) o[h] = v; }); return o;
    });
  }

  function makeGetter(row) {
    const keys = Object.keys(row);
    const map = {}; keys.forEach((k) => { map[norm(k)] = k; });
    return (title, jugador) => {
      const want = jugador ? norm(title + ' [' + jugador + ']') : norm(title);
      const k = map[want];
      return k ? row[k] : '';
    };
  }

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  const MESES_L = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const DIAS_L = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  function parseFecha(s) {
    if (!s) return null;
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) return new Date(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[2] - 1, +m[1]);
    return null;
  }
  // "Jueves 8 de Octubre, 2026"
  function fechaLarga(s) { const d = parseFecha(s); return d ? DIAS_L[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES_L[d.getMonth()] + ', ' + d.getFullYear() : (s || '[Fecha]'); }
  function fechaCorta(s) { const d = parseFecha(s); return d ? d.getDate() + ' ' + MESES[d.getMonth()] : (s || '–'); }
  const hora = (s) => (s ? s.replace(/^(\d{1,2}:\d{2})(:\d{2})?.*$/, '$1') : '');
  const toInt = (v) => { const n = parseInt(String(v).replace('+', ''), 10); return isNaN(n) ? 0 : n; };

  // ── datos ──────────────────────────────────────────────────
  function buildCronicas(rows) {
    const byJ = {};
    rows.forEach((row) => {
      const g = makeGetter(row);
      const j = toInt(g(Q.jornada));
      if (!j) return;
      const gf = toInt(g(Q.gf)), gc = toInt(g(Q.gc));
      const mvp = g(Q.mvp);
      const jugadores = {};
      S.plantilla.forEach((p) => {
        const notaRaw = g('Nota: ' + p.nombre) || g(Q.nota, p.nombre);       // nota escrita a mano (o la tabla antigua)
        const notaNum = parseFloat(String(notaRaw).replace(',', '.'));
        const tarj = g(Q.tarjetas, p.nombre);
        const goles = toInt(g(Q.goles, p.nombre)), asist = toInt(g(Q.asist, p.nombre));
        // jugó si tiene nota, o marcó, dio una asistencia, vio tarjeta o fue MVP
        const jugo = !isNaN(notaNum) || goles > 0 || asist > 0 || /amarilla|roja/i.test(tarj) || norm(mvp) === norm(p.nombre);
        const com = g('Análisis: ' + p.nombre) || g('Comentario: ' + p.nombre) || '';   // solo crónicas antiguas: ya no se pide
        jugadores[p.nombre] = {
          jugo, nota: !isNaN(notaNum) ? notaNum : null, goles, asist,
          amarilla: /amarilla/i.test(tarj), roja: /roja/i.test(tarj), comentario: com
        };
      });
      byJ[j] = {
        jornada: j, fecha: g(Q.fecha), rival: g(Q.rival) || '[Rival]', local: true, campo: g(Q.campo),
        gf, gc, res: gf > gc ? 'V' : gf === gc ? 'E' : 'D', resumen: g(Q.resumen),
        jugadores, mvp,
        proximo: { fecha: g(Q.pFecha), hora: g(Q.pHora), rival: g(Q.pRival), campo: g(Q.pCampo), estrategia: g(Q.estrategia), bajas: g(Q.bajas) }
      }; // si se reenvía la misma jornada, gana el último envío
    });
    return Object.values(byJ).sort((a, b) => a.jornada - b.jornada);
  }

  function statsJugador(nombre) {
    const hist = S.cronicas.filter((c) => c.jugadores[nombre] && c.jugadores[nombre].jugo);
    const notas = hist.map((c) => c.jugadores[nombre].nota).filter((n) => n != null && !isNaN(n));
    return {
      pj: hist.length,
      goles: hist.reduce((s, c) => s + c.jugadores[nombre].goles, 0),
      asist: hist.reduce((s, c) => s + c.jugadores[nombre].asist, 0),
      amarillas: hist.filter((c) => c.jugadores[nombre].amarilla).length,
      rojas: hist.filter((c) => c.jugadores[nombre].roja).length,
      mvps: S.cronicas.filter((c) => norm(c.mvp) === norm(nombre)).length,
      media: notas.length ? notas.reduce((a, b) => a + b, 0) / notas.length : null,
      forma: S.cronicas.slice(-5).map((c) => (c.jugadores[nombre] && c.jugadores[nombre].jugo ? c.jugadores[nombre].nota : null))
    };
  }
  const jugador = (nombre) => S.plantilla.find((p) => norm(p.nombre) === norm(nombre));
  const dorsal = (p) => (p && p.dorsal != null && p.dorsal !== '' ? p.dorsal : '–');
  const nombreCorto = (p) => (p ? (p.corto || p.nombre) + (p.capitan ? ' (C)' : '') : '');
  const roleCode = (p) => {if (!p || !p.posicion) return ''; return ROLE_CODE[norm(p.posicion)] || '';};

const roleCls = (p) => roleCode(p) || 'X';

// Etiqueta corta visible: POR, DEF, DEF-BAN, MED, MED-BAN o DEL
const roleTxt = (p) => roleCode(p) || 'Por definir';

// Nombre completo para la ficha individual
const roleNombre = (p) => {const code = roleCode(p);return code ? ROLE_NAME[code] : 'Por definir';};
  const formaHTML = (forma) => '<span class="form">' + forma.map((n) => {
    const cls = n == null ? '' : n >= 7 ? 'hi' : n >= 5 ? 'mid' : 'lo';
    return '<i class="' + cls + '" title="' + (n == null ? 'No jugó' : 'Nota ' + fmt1(n)) + '"></i>';
  }).join('') + '</span>';
  const ultima = () => S.cronicas[S.cronicas.length - 1];

  function proximoPartido() {
    const u = ultima();
    const jugadas = new Set(S.cronicas.map((c) => c.jornada));
    const cal = S.calendario.filter((c) => !jugadas.has(c.jornada)).sort((a, b) => a.jornada - b.jornada)[0];
    const p = (u && u.proximo) || {};
    const estrategia = { estrategia: p.estrategia || '', bajas: p.bajas || '' };
    // Fecha, hora, rival y campo: primero el calendario; si no hay, lo que puso el míster en la crónica
    if (cal) return Object.assign({ jornada: cal.jornada, fecha: parseFecha(cal.fecha) ? fechaLarga(cal.fecha) : 'Fecha por fijar', hora: hora(cal.hora) || '[hh:mm]', rival: cal.rival, local: true, campo: cal.campo || '[Campo]', estado: cal.estado || '', notas: cal.notas || '' }, estrategia);
    if (p.rival) return Object.assign({ jornada: u.jornada + 1, fecha: fechaLarga(p.fecha), hora: hora(p.hora) || '[hh:mm]', rival: p.rival, local: true, campo: p.campo || '[Campo]', estado: '', notas: '' }, estrategia);
    return null;
  }
  const partidoTitulo = (local, rival) => (local ? 'Tostaos F.C. <span>vs</span> ' + esc(rival) : esc(rival) + ' <span>vs</span> Tostaos F.C.');

  // ── vistas ─────────────────────────────────────────────────
  function renderInicio() {
    const u = ultima(), n = proximoPartido();
    const t = { pj: S.cronicas.length, v: 0, e: 0, d: 0, gf: 0, gc: 0 };
    S.cronicas.forEach((c) => { t[c.res.toLowerCase()]++; t.gf += c.gf; t.gc += c.gc; });
    $('#view-inicio').innerHTML =
      '<div class="dark hero"><div class="hero__text"><span class="eyebrow">Bienvenidos al vestuario</span><h1>TOSTAOS F.C.</h1><p>' + esc(CFG.lema) + '. Aquí tenéis la plantilla, la crónica de cada jornada y el calendario de partidos.</p></div>' +
      '<div class="hero__ctas"><a class="btn btn--accent" href="#partidos">Leer la crónica</a><a class="btn btn--ghost-dark" href="#plantilla">Ver la plantilla</a></div></div>' +
      '<div class="grid-auto">' +
      (u ? '<div class="card"><span class="eyebrow">Último partido · Jornada ' + u.jornada + '</span><div class="score-line"><strong>' + (u.local ? 'Tostaos F.C.' : esc(u.rival)) + '</strong><span class="score-box">' + (u.local ? u.gf + ' – ' + u.gc : u.gc + ' – ' + u.gf) + '</span><strong style="text-align:right">' + (u.local ? esc(u.rival) : 'Tostaos F.C.') + '</strong></div><span class="muted">' + fechaLarga(u.fecha) + (u.campo ? ' · ' + esc(u.campo) : '') + ' <span class="result-tag ' + u.res + '">' + ({ V: 'Victoria', E: 'Empate', D: 'Derrota' })[u.res] + '</span></span></div>'
        : '<div class="card"><span class="eyebrow">Último partido</span><p class="muted">Todavía no hay crónicas. Aparecerá aquí en cuanto el míster rellene el formulario.</p></div>') +
      (n ? '<div class="card card--accent"><span class="eyebrow eyebrow--accent">Próximo partido · Jornada ' + n.jornada + '</span><div><div class="h2" style="font-size:30px">' + partidoTitulo(n.local, n.rival).replace(/<\/?span>/g, '') + '</div><span class="muted">' + esc(n.fecha) + ' · ' + esc(n.hora) + ' · ' + esc(n.campo) + '</span></div><a class="btn" style="align-self:flex-start" href="#calendario">Ver calendario</a></div>'
        : '<div class="card card--accent"><span class="eyebrow eyebrow--accent">Próximo partido</span><p class="muted">El míster aún no ha añadido el próximo partido.</p></div>') +
      '</div>' + premiosHTML(u) +
      '<div class="card"><h2 class="h2">Temporada en números</h2><div class="stats">' +
      [['Partidos', t.pj], ['Victorias', t.v], ['Empates', t.e], ['Derrotas', t.d], ['Goles a favor', t.gf], ['Goles en contra', t.gc]].map((x) => '<div class="stat"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>').join('') +
      '</div></div>';
    initRascas($('#view-inicio'));
  }

  function renderPlantilla() {
    const perfiles = S.plantilla.slice().sort((a, b) => (b.capitan ? 1 : 0) - (a.capitan ? 1 : 0)).map((p) => {
      const st = statsJugador(p.nombre);
      return '<button class="pcard" data-jugador="' + esc(p.nombre) + '"><span class="pcard__top">' + (p.foto ? '<img class="foto" src="' + esc(p.foto) + '" alt="">' : '') + '<span class="pcard__id"><span class="pcard__name">' + esc(p.corto || p.nombre) + (p.capitan ? '&nbsp;<span class="pcard__cap" title="Capitán">C</span>' : '') + '</span><span class="pcard__pos">' + esc(roleNombre(p)) + '</span></span><span class="pcard__num">' + dorsal(p) + '</span></span>' +
        '<span class="pcard__body"><span class="pcard__full">' + esc(p.nombre) + '</span>' +
        '<span class="mini-stats"><span><b>' + st.pj + '</b><small>Partidos</small></span><span><b>' + fmt1(st.media) + '</b><small>Nota media</small></span><span><b>' + st.goles + '</b><small>Goles</small></span><span><b>' + st.asist + '</b><small>Asistencias</small></span></span>' +
        (p.mo ? '<span class="pcard__mo"><small>Modus operandi</small>' + esc(p.mo) + '</span>' : '') + (p.descripcion ? '<p>' + esc(p.descripcion) + '</p>' : '') + '</span></button>';
    }).join('');
    const filas = S.plantilla.slice().sort((a, b) => ROLE_ORDER.indexOf(roleCode(a)) - ROLE_ORDER.indexOf(roleCode(b))).map((p) => {
      const st = statsJugador(p.nombre);
      return '<tr><td class="num">' + dorsal(p) + '</td><td><button class="linkish nombre2" data-jugador="' + esc(p.nombre) + '"><b>' + esc(nombreCorto(p)) + '</b></button></td><td><span class="role ' + roleCls(p) + '">' + roleTxt(p) + '</span></td>' +
        '<td class="c">' + st.pj + '</td><td class="c">' + st.goles + '</td><td class="c">' + st.asist + '</td><td class="c">' + st.amarillas + ' / ' + st.rojas + '</td><td class="c">' + st.mvps + '</td><td class="c"><b>' + fmt1(st.media) + '</b></td><td>' + formaHTML(st.forma) + '</td></tr>';
    }).join('');

    $('#view-plantilla').innerHTML =
      '<div class="page-head"><div><span class="eyebrow eyebrow--accent">Equipo</span><h1 class="h1">Plantilla</h1></div>' +
      '<div class="seg" role="group" aria-label="Vista"><button data-view="jugadores" aria-pressed="' + (S.view === 'jugadores') + '">Jugadores</button><button data-view="tabla" aria-pressed="' + (S.view === 'tabla') + '">Estadísticas</button></div></div>' +
      (S.view === 'jugadores'
        ? '<span class="muted">' + S.plantilla.length + ' jugadores · pulsa una tarjeta para ver su historial</span><div class="pgrid">' + perfiles + '</div>'
        : '<span class="muted swipe-hint">Desliza hacia la derecha para ver todas las estadísticas →</span><div class="table-box"><table><thead><tr><th>#</th><th>Jugador</th><th>Pos.</th><th class="c">PJ</th><th class="c">Goles</th><th class="c">Asist.</th><th class="c">Tarjetas</th><th class="c">MVP</th><th class="c">Nota media</th><th>Forma (últ. 5)</th></tr></thead><tbody>' + filas + '</tbody></table></div>' +
          '<div class="legend"><span><i class="form"><i class="hi"></i></i>Nota 7 o más</span><span><i class="form"><i class="mid"></i></i>5 a 6,9</span><span><i class="form"><i class="lo"></i></i>Menos de 5</span><span><i class="form"><i></i></i>No jugó</span></div>');
    // Nombre corto siempre en una línea: si no cabe, se reduce la letra
    const encajar = () => document.querySelectorAll('#view-plantilla .pcard__name').forEach((el) => { el.style.fontSize = ''; let fs = parseFloat(getComputedStyle(el).fontSize); while (el.scrollWidth > el.clientWidth && fs > 16) { fs -= 1; el.style.fontSize = fs + 'px'; } });
    encajar(); if (document.fonts) document.fonts.ready.then(encajar);
  }

  function renderPartidos() {
    if (!S.cronicas.length) {
      $('#view-partidos').innerHTML = '<div class="page-head"><div><span class="eyebrow eyebrow--accent">Crónica semanal</span><h1 class="h1">Partidos</h1></div></div><div class="empty">Aún no hay crónicas. En cuanto el míster rellene el formulario, aparecerán aquí.</div>';
      return;
    }
    const idx = S.jornadaSel == null ? S.cronicas.length - 1 : Math.max(0, S.cronicas.findIndex((c) => c.jornada === S.jornadaSel));
    const c = S.cronicas[idx];
    const goleadores = S.plantilla.filter((p) => c.jugadores[p.nombre] && c.jugadores[p.nombre].goles).map((p) => esc(nombreCorto(p)) + (c.jugadores[p.nombre].goles > 1 ? ' (' + c.jugadores[p.nombre].goles + ')' : ''));
    const parrafos = c.resumen.split(/\n\s*\n|\n/).filter((x) => x.trim()).map((x) => '<p class="body2">' + esc(x) + '</p>').join('');
    const jugaron = S.plantilla.filter((p) => c.jugadores[p.nombre] && c.jugadores[p.nombre].jugo)
      .sort((a, b) => ROLE_ORDER.indexOf(roleCode(a)) - ROLE_ORDER.indexOf(roleCode(b)));
    const ratings = jugaron.map((p) => {
      const d = c.jugadores[p.nombre], isMvp = norm(c.mvp) === norm(p.nombre);
      return '<button class="rcard' + (isMvp ? ' rcard--mvp' : '') + '" data-jugador="' + esc(p.nombre) + '"><span class="rcard__head"><span class="num-badge">' + dorsal(p) + '</span><span><b>' + esc(nombreCorto(p)) + '</b><span class="muted" style="font-size:12px">' + roleNombre(p) + (isMvp ? ' · MVP' : '') + '</span></span><span class="rcard__nota">' + fmt1(d.nota) + '</span></span>' +
        '<span class="trio"><span><b>' + d.goles + '</b><small>Goles</small></span><span><b>' + d.asist + '</b><small>Asist.</small></span><span><b>' + (d.roja ? 'Roja' : d.amarilla ? 'Amarilla' : '–') + '</b><small>Tarjetas</small></span></span>' +
        (d.comentario ? '<span class="body2" style="font-size:14px">' + esc(d.comentario) + '</span>' : '') +
        '<span class="rcard__more">Ver su historial' + ICON.right.replace('width="20" height="20"', 'width="14" height="14"') + '</span></button>';
    }).join('');
    const opts = S.cronicas.map((x, i) => '<option value="' + x.jornada + '"' + (i === idx ? ' selected' : '') + '>Jornada ' + x.jornada + ' · ' + esc(x.rival) + '</option>').join('');
    $('#view-partidos').innerHTML =
      '<div class="page-head"><div><span class="eyebrow eyebrow--accent">Crónica semanal</span><h1 class="h1">Jornada ' + c.jornada + '</h1></div>' +
      '<div class="jselect"><button class="icon-btn icon-btn--light" data-j="-1" aria-label="Jornada anterior"' + (idx === 0 ? ' disabled' : '') + '>' + ICON.left + '</button><label class="sr" style="position:absolute;left:-9999px" for="jsel">Elegir jornada</label><select id="jsel">' + opts + '</select><button class="icon-btn icon-btn--light" data-j="1" aria-label="Jornada siguiente"' + (idx === S.cronicas.length - 1 ? ' disabled' : '') + '>' + ICON.right + '</button></div></div>' +
      '<div class="dark scoreboard"><small>' + fechaLarga(c.fecha) + (c.campo ? ' · ' + esc(c.campo) : '') + '</small><div class="scoreboard__row"><span class="scoreboard__team">' + (c.local ? 'TOSTAOS F.C.' : esc(c.rival).toUpperCase()) + '</span><span class="scoreboard__score">' + (c.local ? c.gf + ' – ' + c.gc : c.gc + ' – ' + c.gf) + '</span><span class="scoreboard__team">' + (c.local ? esc(c.rival).toUpperCase() : 'TOSTAOS F.C.') + '</span></div>' + (goleadores.length ? '<small>Goles de Tostaos: ' + goleadores.join(', ') + '</small>' : '') + '</div>' +
      '<div class="row-wrap"><div class="card summary"><h2 class="h2" style="font-size:26px">Resumen del partido</h2>' + (parrafos || '<p class="muted">Sin resumen.</p>') + '</div>' +
      '</div>' +
      premiosHTML(c) +
      '<div style="display:flex;flex-direction:column;gap:16px"><div class="page-head" style="align-items:baseline"><h2 class="h2" style="font-size:30px">Jugador a jugador</h2><span class="muted">Nota de 0 a 10 · pulsa para ver su historial</span></div><div class="ratings">' + (ratings || '<p class="muted">Sin notas.</p>') + '</div></div>';
    // Marcador en una fila: si un nombre no cabe, baja a dos líneas por palabras ("TOSTAOS / F.C.").
    // Solo si una palabra sola no cabe, o haría falta una 3ª línea, se reduce la letra de los dos equipos.
    const encajarMarcador = () => {
      const eqs = Array.from(document.querySelectorAll('#view-partidos .scoreboard__team'));
      eqs.forEach((el) => { el.style.fontSize = ''; });
      if (!eqs.length) return;
      let fs = parseFloat(getComputedStyle(eqs[0]).fontSize);
      const noCabe = () => eqs.some((el) => el.scrollWidth > el.clientWidth || el.scrollHeight > parseFloat(getComputedStyle(el).lineHeight) * 2 + 2);
      while (noCabe() && fs > 11) { fs -= 1; eqs.forEach((el) => { el.style.fontSize = fs + 'px'; }); }
    };
    encajarMarcador(); if (document.fonts) document.fonts.ready.then(encajarMarcador);
    initRascas($('#view-partidos'));
  }

  function renderCalendario() {
    const n = proximoPartido();
    const porJ = {}; S.cronicas.forEach((c) => { porJ[c.jornada] = c; });
    const js = new Set(S.calendario.map((c) => c.jornada).concat(S.cronicas.map((c) => c.jornada)));
    const lista = Array.from(js).sort((a, b) => a - b).map((j) => {
      const cal = S.calendario.find((c) => c.jornada === j) || {};
      const cr = porJ[j];
      const local = true;
      const rival = cr ? cr.rival : cal.rival || '[Rival]';
      const aviso = !cr && /aplazado|por confirmar/i.test(cal.estado || '') ? cal.estado : '';
      const estado = cr ? 'jugado' : aviso ? 'aviso' : n && n.jornada === j ? 'proximo' : 'pendiente';
      return { j, local, rival, cr, cal, estado, aviso, fecha: cr ? fechaCorta(cr.fecha) : (parseFecha(cal.fecha) ? fechaCorta(cal.fecha) : 'Por fijar') };
    }).filter((f) => S.filtro === 'todos' || (S.filtro === 'jugados' ? f.estado === 'jugado' : f.estado !== 'jugado'));
    $('#view-calendario').innerHTML =
      (n ? '<div class="dark next"><div class="next__main"><div style="display:flex;flex-direction:column;gap:8px"><span class="pill pill--accent" style="align-self:flex-start;letter-spacing:.1em;text-transform:uppercase">Próximo partido · Jornada ' + n.jornada + '</span><span class="next__title">' + partidoTitulo(n.local, n.rival) + '</span>' + (n.estado && !/confirmado/i.test(n.estado) || /por confirmar/i.test(n.estado || '') ? '<span class="pill pill--aviso" style="align-self:flex-start">' + esc(n.estado) + '</span>' : '') + (n.notas ? '<span style="color:#C9CDD4;font-size:14px">' + esc(n.notas) + '</span>' : '') + '</div>' +
        '<div class="facts"><div class="fact">' + ICON.cal + '<span><small>Fecha</small><b>' + esc(n.fecha) + '</b></span></div><div class="fact">' + ICON.clock + '<span><small>Hora</small><b>' + esc(n.hora || '[hh:mm]') + '</b></span></div><div class="fact">' + ICON.pin + '<span><small>Lugar</small><b>' + esc(n.campo || '[Campo]') + '</b></span></div><div class="fact">' + ICON.shield + '<span><small>Rival</small><b>' + esc(n.rival) + '</b></span></div></div></div>' +
        '<div class="strategy"><h2 class="h2" style="font-size:30px;text-transform:uppercase;color:#D9700F">La estrategia del míster</h2>' +
        '<p class="body2" style="font-size:14px;white-space:pre-line">' + esc(n.estrategia || 'El míster publicará aquí su planteamiento con la crónica de la jornada.') + '</p>' +
        (n.bajas ? '<p class="muted" style="font-size:13px;white-space:pre-line"><b>Avisos:</b> ' + esc(n.bajas) + '</p>' : '') + '</div></div>' : '') +
      '<div class="page-head"><div><span class="eyebrow eyebrow--accent">Temporada ' + esc(CFG.temporada) + '</span><h1 class="h1">Calendario</h1></div><div class="chips" role="group" aria-label="Filtrar partidos">' +
      [['todos', 'Todos'], ['proximos', 'Próximos'], ['jugados', 'Jugados']].map((f) => '<button data-filtro="' + f[0] + '" aria-pressed="' + (S.filtro === f[0]) + '">' + f[1] + '</button>').join('') + '</div></div>' +
      '<div class="fixtures">' + (lista.length ? lista.map((f) => '<div class="fixture' + (f.estado === 'proximo' ? ' fixture--next' : '') + '"><span class="fixture__date"><small>J' + f.j + '</small><b>' + esc(f.fecha) + '</b></span>' +
        '<span class="fixture__main"><b>' + (f.local ? 'Tostaos F.C. vs ' + esc(f.rival) : esc(f.rival) + ' vs Tostaos F.C.') + '</b><span class="muted" style="font-size:13px">' + esc([f.cr ? fechaLarga(f.cr.fecha) : (parseFecha(f.cal.fecha) ? fechaLarga(f.cal.fecha) : ''), hora(f.cal.hora), f.cr ? f.cr.campo : f.cal.campo, !f.cr && f.cal.notas ? f.cal.notas : ''].filter(Boolean).join(' · ')) + '</span></span>' +
        '<span class="fixture__score">' + (f.cr ? (f.local ? f.cr.gf + '–' + f.cr.gc : f.cr.gc + '–' + f.cr.gf) : '–') + '</span>' +
        '<span class="pill fixture__status ' + (f.estado === 'jugado' ? 'pill--soft' : f.estado === 'proximo' ? 'pill--accent' : f.estado === 'aviso' ? 'pill--aviso' : 'pill--line') + '">' + (f.estado === 'aviso' ? esc(f.aviso) : ({ jugado: 'Jugado', proximo: 'Próximo', pendiente: 'Pendiente' })[f.estado]) + '</span>' +
        (f.cr ? '<button class="linkish" data-ir-jornada="' + f.j + '">Crónica</button>' : '') + '</div>').join('') : '<div class="empty">No hay partidos en este filtro.</div>') + '</div>';
    const tit = $('#view-calendario .next__title'); if (tit) { const fit = () => { tit.style.fontSize = ''; let fs = parseFloat(getComputedStyle(tit).fontSize); while (tit.scrollWidth > tit.clientWidth && fs > 16) { fs -= 1; tit.style.fontSize = fs + 'px'; } }; fit(); if (document.fonts) document.fonts.ready.then(fit); }
  }

  // ── rasca y gana: MVP de la jornada ──────────────────────
  const TROFEO = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8.5 20h7M10 17h4"/></svg>';
  const leido = (k) => { try { return localStorage.getItem('rasca:' + k) === '1'; } catch (e) { return false; } };
  const marcar = (k) => { try { localStorage.setItem('rasca:' + k, '1'); } catch (e) { /* sin almacenamiento */ } };

  function premiosHTML(c) {
    if (!c) return '';
    const tarjeta = (nombre) => {
      const p = jugador(nombre); if (!p) return '';
      const d = c.jugadores[p.nombre] || {};
      return '<div class="rasca rasca--mvp" data-key="j' + c.jornada + '-mvp">' +
        '<div class="rasca__prize" aria-hidden="true">' +
        '<span class="rasca__icon">' + TROFEO + '</span>' +
        '<span class="rasca__label">MVP de la jornada ' + c.jornada + '</span>' +
        '<span class="rasca__name">' + esc(nombreCorto(p)) + '</span>' +
        '<span class="rasca__meta">' + (dorsal(p) !== '–' ? 'Dorsal ' + dorsal(p) + ' · ' : '') + 'Nota ' + fmt1(d.nota) + '</span>' +
        (d.comentario ? '<span class="rasca__quote">«' + esc(d.comentario) + '»</span>' : '') +
        '<button class="linkish rasca__more" data-jugador="' + esc(p.nombre) + '" tabindex="-1">Ver su historial</button>' +
        '</div>' +
        '<canvas class="rasca__cover"></canvas>' +
        '<button class="rasca__skip">Revelar sin rascar</button>' +
        '</div>';
    };
    const cards = tarjeta(c.mvp);
    if (!cards) return '';
    return '<div class="premios"><div class="page-head" style="align-items:baseline"><div><span class="eyebrow eyebrow--accent">Rasca y gana</span><h2 class="h2" style="font-size:30px">MVP de la jornada ' + c.jornada + '</h2></div><span class="muted">Rasca con el dedo o el ratón</span></div><div class="premios__grid">' + cards + '</div></div>';
  }

  function confeti(el) {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const colores = ['#F08A24', '#15171A', '#E8B931', '#FFFFFF', '#1F7A4D'];
    for (let i = 0; i < 40; i++) {
      const s = document.createElement('i');
      s.className = 'confeti';
      s.style.left = (10 + Math.random() * 80) + '%';
      s.style.background = colores[i % colores.length];
      s.style.setProperty('--dx', (Math.random() * 160 - 80) + 'px');
      s.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      s.style.animationDelay = (Math.random() * 0.2) + 's';
      el.appendChild(s);
      setTimeout(() => s.remove(), 1600);
    }
  }

  function initRascas(root) {
    root.querySelectorAll('.rasca').forEach((el) => {
      const key = el.dataset.key, canvas = el.querySelector('canvas'), prize = el.querySelector('.rasca__prize');
      const revelar = (celebrar) => {
        if (el.classList.contains('is-revealed')) return;
        el.classList.add('is-revealed'); prize.removeAttribute('aria-hidden');
        el.querySelector('.rasca__more').removeAttribute('tabindex');
        marcar(key);
        if (celebrar) confeti(el);
      };
      el.querySelector('.rasca__skip').addEventListener('click', () => revelar(true));
      if (leido(key)) { revelar(false); return; }

      let rascando = false, last = null, moves = 0;
      const ctx = canvas.getContext('2d');
      const pintar = () => {
      const r = el.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      const W = r.width, H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.scale(dpr, dpr);
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#F7D58B'); g.addColorStop(0.5, '#E9A53C'); g.addColorStop(1, '#C97A16');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.12; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 10;
      for (let x = -H; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.fillStyle = '#15171A';
      const titulo = '¿QUIÉN ES EL MVP?';
      let fs = 34; ctx.font = '800 ' + fs + 'px "Barlow Condensed", sans-serif';
      while (ctx.measureText(titulo).width > W - 40 && fs > 16) { fs -= 2; ctx.font = '800 ' + fs + 'px "Barlow Condensed", sans-serif'; }
      ctx.fillText(titulo, W / 2, H / 2 - 4);
      ctx.font = '600 14px Inter, sans-serif';
      ctx.fillText('Rasca aquí', W / 2, H / 2 + 24);
      ctx.globalCompositeOperation = 'destination-out';
      };
      pintar();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (!moves) pintar(); });

      const pos = (e) => { const b = canvas.getBoundingClientRect(); return { x: e.clientX - b.left, y: e.clientY - b.top }; };
      const rascar = (p) => {
        ctx.lineWidth = 44; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(last ? last.x : p.x, last ? last.y : p.y); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.beginPath(); ctx.arc(p.x, p.y, 22, 0, Math.PI * 2); ctx.fill();
        last = p;
        if (++moves % 12 === 0) {
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
          let clear = 0, total = 0;
          for (let i = 3; i < data.length; i += 4 * 16) { total++; if (data[i] === 0) clear++; }
          if (clear / total > 0.5) revelar(true);
        }
      };
      canvas.addEventListener('pointerdown', (e) => { rascando = true; last = null; canvas.setPointerCapture(e.pointerId); rascar(pos(e)); });
      canvas.addEventListener('pointermove', (e) => { if (rascando) rascar(pos(e)); });
      const fin = () => { rascando = false; last = null; };
      canvas.addEventListener('pointerup', fin); canvas.addEventListener('pointercancel', fin);
    });
  }

  // ── historial (modal) ─────────────────────────────────────
  let lastFocus = null;
  function fichaHTML(p) {
    const filas = [['Posición', roleNombre(p)]].filter((x) => x[1]);
    return '<div class="ficha"><div class="ficha__datos">' + filas.map((x) => '<span><small>' + x[0] + '</small><b>' + esc(x[1]) + '</b></span>').join('') + '</div>' +
      (p.descripcion ? '<div><small>Resumen</small><p>' + esc(p.descripcion) + '</p></div>' : '') +
      (p.mo ? '<div><small>Modus operandi</small><p>' + esc(p.mo) + '</p></div>' : '') +
      (p.gracioso ? '<div class="ficha__fun"><small>Lo que no sale en las estadísticas</small><p>' + esc(p.gracioso) + '</p></div>' : '') +
      '</div>';
  }
  function abrirHistorial(nombre) {
    const p = jugador(nombre); if (!p) return;
    const st = statsJugador(p.nombre);
    const hist = S.cronicas.filter((c) => c.jugadores[p.nombre] && c.jugadores[p.nombre].jugo).slice().reverse();
    const box = $('#modal .modal__box');
    box.innerHTML = '<div class="modal__head"><span class="num-badge num-badge--accent">' + dorsal(p) + '</span><div><span class="eyebrow">Perfil del jugador</span><span class="modal__title" id="modal-title">' + esc(nombreCorto(p)) + '</span><span style="font-size:13px;color:#C9CDD4">' + esc(p.nombre) + ' · ' + roleNombre(p) + ' · Temporada ' + esc(CFG.temporada) + '</span></div><button class="icon-btn icon-btn--light" data-close aria-label="Cerrar historial">' + ICON.close + '</button></div>' +
      '<div class="modal__body">' + fichaHTML(p) + '<div class="stats">' + [['Nota media', fmt1(st.media)], ['Partidos', st.pj], ['Goles', st.goles], ['Asistencias', st.asist], ['Veces MVP', st.mvps]].map((x) => '<div class="stat"><b style="font-size:28px">' + x[1] + '</b><span>' + x[0] + '</span></div>').join('') + '</div>' +
      '<div><h3 class="h2" style="font-size:22px;margin-bottom:6px">Jornada a jornada</h3>' + (hist.length ? hist.map((c) => {
        const d = c.jugadores[p.nombre];
        return '<div class="hist"><span class="hist__nota"><small>Nota</small><b>' + fmt1(d.nota) + '</b></span><div class="hist__main"><div class="hist__top"><b>Jornada ' + c.jornada + ' · ' + (c.local ? 'Tostaos F.C. vs ' + esc(c.rival) : esc(c.rival) + ' vs Tostaos F.C.') + '</b><span style="font-family:var(--display);font-weight:800;font-size:20px">' + (c.local ? c.gf + '–' + c.gc : c.gc + '–' + c.gf) + '</span></div>' +
          '<span class="muted" style="font-size:13px">' + fechaLarga(c.fecha) + ' · ' + d.goles + ' goles · ' + d.asist + ' asist.' + (d.amarilla ? ' · Amarilla' : '') + (d.roja ? ' · Roja' : '') + (norm(c.mvp) === norm(p.nombre) ? ' · MVP' : '') + '</span>' +
          (d.comentario ? '<p class="body2" style="font-size:14px;margin-top:4px">' + esc(d.comentario) + '</p>' : '') + '</div></div>';
      }).join('') : '<p class="muted">Aún no ha jugado ningún partido con crónica.</p>') + '</div></div>';
    lastFocus = document.activeElement;
    $('#modal').hidden = false; document.body.style.overflow = 'hidden'; box.focus();
  }
  function cerrarHistorial() { $('#modal').hidden = true; document.body.style.overflow = ''; if (lastFocus) lastFocus.focus(); }

  // ── navegación y eventos ──────────────────────────────────
  const RENDER = { inicio: renderInicio, plantilla: renderPlantilla, partidos: renderPartidos, calendario: renderCalendario };
  function go() {
    const t = (location.hash || '#inicio').slice(1);
    S.tab = RENDER[t] ? t : 'inicio';
    document.querySelectorAll('.view').forEach((v) => { v.hidden = v.dataset.view !== S.tab; });
    document.querySelectorAll('.tabs a').forEach((a) => { if (a.dataset.tab === S.tab) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    RENDER[S.tab]();
    window.scrollTo(0, 0);
  }
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-jugador],[data-view],[data-filtro],[data-j],[data-close],[data-ir-jornada]');
    if (e.target.id === 'modal') return cerrarHistorial();
    if (!t) return;
    if (t.dataset.close !== undefined) return cerrarHistorial();
    if (t.dataset.jugador) return abrirHistorial(t.dataset.jugador);
    if (t.dataset.view) { S.view = t.dataset.view; return renderPlantilla(); }
    if (t.dataset.filtro) { S.filtro = t.dataset.filtro; return renderCalendario(); }
    if (t.dataset.j) {
      const i = S.jornadaSel == null ? S.cronicas.length - 1 : S.cronicas.findIndex((c) => c.jornada === S.jornadaSel);
      const n = S.cronicas[i + (+t.dataset.j)]; if (n) { S.jornadaSel = n.jornada; renderPartidos(); } return;
    }
    if (t.dataset.irJornada) { S.jornadaSel = +t.dataset.irJornada; location.hash = '#partidos'; }
  });
  document.addEventListener('change', (e) => { if (e.target.id === 'jsel') { S.jornadaSel = +e.target.value; renderPartidos(); } });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !$('#modal').hidden) cerrarHistorial(); });
  window.addEventListener('hashchange', go);

  // ── arranque ──────────────────────────────────────────────
  async function cargar() {
    $('#brand-sub').textContent = [CFG.liga, CFG.temporada ? 'Temporada ' + CFG.temporada : ''].filter(Boolean).join(' · ');
    $('#foot-left').textContent = 'Tostaos F.C.' + (CFG.ciudad ? ' · ' + CFG.ciudad : '');
    const aviso = (msg) => { const a = $('#aviso'); a.innerHTML = msg; a.hidden = false; };
    try {
      const [pl, cal] = await Promise.all([fetch('plantilla.json').then((r) => r.json()), fetch('calendario.json').then((r) => r.json()).catch(() => [])]);
      S.plantilla = pl; S.calendario = cal;
    } catch (err) {
      aviso('No se pudo leer <b>plantilla.json</b>. Si abres el archivo directamente desde tu ordenador no funciona: súbelo a GitHub Pages o usa un servidor local.');
      return go();
    }
    if (CFG.urlCalendarioCSV) {
      try {
        const sepC = CFG.urlCalendarioCSV.indexOf('?') >= 0 ? '&' : '?';
        const txtC = await fetch(CFG.urlCalendarioCSV + sepC + 't=' + Date.now(), { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
        const porJ = {};
        S.calendario.forEach((c) => { porJ[c.jornada] = c; });          // base: calendario.json (si tiene algo)
        parseCSV(txtC).forEach((row) => {                                // cada envío; el último de cada jornada manda
          const g = makeGetter(row), j = toInt(g('Jornada'));
          if (!j) return;
          porJ[j] = { jornada: j, fecha: g('Fecha'), hora: g('Hora'), rival: g('Rival') || '[Rival]', campo: g('Campo'), estado: g('Estado'), notas: g('Notas') };
        });
        S.calendario = Object.values(porJ).filter((c) => !/cancelado/i.test(c.estado || '')).sort((a, b) => a.jornada - b.jornada);
      } catch (err) {
        aviso('No se pudo cargar el calendario. Revisa el enlace <b>urlCalendarioCSV</b> de config.js.');
      }
    }
    let url = CFG.urlRespuestasCSV;
    if (!url && CFG.usarEjemplo) { url = 'ejemplo.csv'; aviso('Estás viendo <b>datos de ejemplo</b>. Cuando tengas el formulario, pega el enlace CSV en config.js y pon <code>usarEjemplo: false</code>.'); }
    if (url) {
      try {
        const sep = url.indexOf('?') >= 0 ? '&' : '?';
        const txt = await fetch(url + (url.startsWith('http') ? sep + 't=' + Date.now() : ''), { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.text(); });
        S.cronicas = buildCronicas(parseCSV(txt));
      } catch (err) {
        aviso('No se pudieron cargar las crónicas. Revisa que el enlace de config.js sea el CSV publicado de la hoja de respuestas.');
      }
    }
    go();
  }
  cargar();
})();
