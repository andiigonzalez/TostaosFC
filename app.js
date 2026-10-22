/* Tostaos F.C. · web que se alimenta del formulario de crónicas.
   No hace falta tocar este archivo: la configuración está en config.js */
(function () {
  'use strict';

  const CFG = Object.assign({ urlRespuestasCSV: '', usarEjemplo: false, liga: '', temporada: '', ciudad: '', lema: '' }, window.TOSTAOS_CONFIG || {});

  // Títulos de las preguntas del formulario (idénticos a crear-formulario.gs)
  const Q = {
    jornada: 'Jornada', fecha: 'Fecha del partido', rival: 'Rival', localia: '¿Local o visitante?', campo: 'Campo',
    gf: 'Goles de Tostaos', gc: 'Goles del rival', resumen: 'Resumen del partido', momentos: 'Momentos clave',
    sistema: 'Sistema', titulares: 'Once titular',
    nota: 'Nota de cada jugador', goles: 'Goles de cada jugador', asist: 'Asistencias de cada jugador', tarjetas: 'Tarjetas',
    mvp: 'MVP del partido', comentarios: 'Comentario sobre cada jugador',
    pFecha: 'Próximo partido: fecha', pHora: 'Próximo partido: hora', pRival: 'Próximo partido: rival',
    pLocalia: 'Próximo partido: ¿local o visitante?', pCampo: 'Próximo partido: campo', pSistema: 'Próximo partido: sistema previsto',
    estrategia: 'Estrategia del míster', claves: 'Claves del partido', bajas: 'Bajas y avisos', peor: 'Peor del partido'
  };

  const FORMACIONES = {
    '4-3-3': [['POR', 50, 88, 'POR'], ['LD', 85, 68, 'DEF'], ['DFC', 62, 72, 'DEF'], ['DFC', 38, 72, 'DEF'], ['LI', 15, 68, 'DEF'], ['MC', 72, 47, 'MED'], ['MCD', 50, 53, 'MED'], ['MC', 28, 47, 'MED'], ['ED', 82, 20, 'DEL'], ['DC', 50, 14, 'DEL'], ['EI', 18, 20, 'DEL']],
    '4-4-2': [['POR', 50, 88, 'POR'], ['LD', 85, 68, 'DEF'], ['DFC', 62, 72, 'DEF'], ['DFC', 38, 72, 'DEF'], ['LI', 15, 68, 'DEF'], ['MD', 85, 43, 'MED'], ['MC', 62, 48, 'MED'], ['MC', 38, 48, 'MED'], ['MI', 15, 43, 'MED'], ['DC', 63, 16, 'DEL'], ['DC', 37, 16, 'DEL']],
    '3-5-2': [['POR', 50, 88, 'POR'], ['DFC', 74, 71, 'DEF'], ['DFC', 50, 74, 'DEF'], ['DFC', 26, 71, 'DEF'], ['CAD', 87, 44, 'MED'], ['MC', 66, 46, 'MED'], ['MCD', 50, 55, 'MED'], ['MC', 34, 46, 'MED'], ['CAI', 13, 44, 'MED'], ['DC', 63, 16, 'DEL'], ['DC', 37, 16, 'DEL']]
  };
  const ROLE_ORDER = ['POR', 'DEF', 'MED', 'DEL', ''];
  const ROLE_NAME = { POR: 'Portero', DEF: 'Defensa', MED: 'Centrocampista', DEL: 'Delantero', '': 'Por definir' };

  const S = { tab: 'inicio', view: 'alineacion', filtro: 'todos', jornadaSel: null, plantilla: [], calendario: [], cronicas: [] };

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
      const o = {}; head.forEach((h, i) => { o[h] = (r[i] || '').trim(); }); return o;
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
  function parseFecha(s) {
    if (!s) return null;
    let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
    if (m) return new Date(+m[3] < 100 ? 2000 + +m[3] : +m[3], +m[2] - 1, +m[1]);
    return null;
  }
  function fechaLarga(s) { const d = parseFecha(s); return d ? DIAS[d.getDay()] + ' ' + d.getDate() + ' ' + MESES[d.getMonth()] + ' ' + d.getFullYear() : (s || '[Fecha]'); }
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
      const titulares = g(Q.titulares).split(/,\s*/).filter(Boolean);
      const comentarios = {};
      g(Q.comentarios).split(/\n/).forEach((line) => {
        const i = line.indexOf(':'); if (i < 1) return;
        comentarios[norm(line.slice(0, i))] = line.slice(i + 1).trim();
      });
      const jugadores = {};
      S.plantilla.forEach((p) => {
        const notaRaw = g(Q.nota, p.nombre);
        const jugo = notaRaw !== '' && norm(notaRaw) !== 'no jugo';
        const tarj = g(Q.tarjetas, p.nombre);
        const com = comentarios[norm(p.nombre)] || comentarios[norm(p.corto)] || Object.keys(comentarios).filter((k) => norm(p.nombre).startsWith(k) && k.length > 2).map((k) => comentarios[k])[0] || '';
        jugadores[p.nombre] = {
          jugo, nota: jugo ? parseFloat(notaRaw.replace(',', '.')) : null,
          goles: toInt(g(Q.goles, p.nombre)), asist: toInt(g(Q.asist, p.nombre)),
          amarilla: /amarilla/i.test(tarj), roja: /roja/i.test(tarj),
          titular: titulares.some((t) => norm(t) === norm(p.nombre)), comentario: com
        };
      });
      const momentos = g(Q.momentos).split(/\n/).map((l) => l.trim()).filter(Boolean).map((l) => {
        const parts = l.split(/\s+[-–]\s+/);
        if (parts.length >= 3) return { min: parts[0].replace(/'$/, '') + "'", tipo: parts[1], texto: parts.slice(2).join(' - ') };
        if (parts.length === 2) return { min: parts[0].replace(/'$/, '') + "'", tipo: '', texto: parts[1] };
        return { min: '', tipo: '', texto: l };
      });
      byJ[j] = {
        jornada: j, fecha: g(Q.fecha), rival: g(Q.rival) || '[Rival]', local: norm(g(Q.localia)) !== 'visitante', campo: g(Q.campo),
        gf, gc, res: gf > gc ? 'V' : gf === gc ? 'E' : 'D', resumen: g(Q.resumen), momentos,
        sistema: g(Q.sistema), titulares, jugadores, mvp: g(Q.mvp), peor: g(Q.peor),
        proximo: { fecha: g(Q.pFecha), hora: g(Q.pHora), rival: g(Q.pRival), localia: g(Q.pLocalia), campo: g(Q.pCampo), sistema: g(Q.pSistema), estrategia: g(Q.estrategia), claves: g(Q.claves), bajas: g(Q.bajas) }
      }; // si se reenvía la misma jornada, gana el último envío
    });
    return Object.values(byJ).sort((a, b) => a.jornada - b.jornada);
  }

  function statsJugador(nombre) {
    const hist = S.cronicas.filter((c) => c.jugadores[nombre] && c.jugadores[nombre].jugo);
    const notas = hist.map((c) => c.jugadores[nombre].nota).filter((n) => n != null && !isNaN(n));
    return {
      pj: hist.length,
      titular: hist.filter((c) => c.jugadores[nombre].titular).length,
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
  const roleCls = (p) => (p && p.posicion ? p.posicion : 'X');
  const roleTxt = (p) => (p && p.posicion ? ROLE_NAME[p.posicion] : 'Por definir');
  const formaHTML = (forma) => '<span class="form">' + forma.map((n) => {
    const cls = n == null ? '' : n >= 7 ? 'hi' : n >= 5 ? 'mid' : 'lo';
    return '<i class="' + cls + '" title="' + (n == null ? 'No jugó' : 'Nota ' + fmt1(n)) + '"></i>';
  }).join('') + '</span>';
  const ultima = () => S.cronicas[S.cronicas.length - 1];

  function proximoPartido() {
    const u = ultima();
    const jugadas = new Set(S.cronicas.map((c) => c.jornada));
    const cal = S.calendario.filter((c) => !jugadas.has(c.jornada)).sort((a, b) => a.jornada - b.jornada)[0];
    if (u && u.proximo && u.proximo.rival) {
      const p = u.proximo;
      return { jornada: cal ? cal.jornada : u.jornada + 1, fecha: fechaLarga(p.fecha), hora: hora(p.hora) || '[hh:mm]', rival: p.rival, local: norm(p.localia) !== 'visitante', campo: p.campo || (cal && cal.campo) || '[Campo]', sistema: p.sistema, estrategia: p.estrategia, claves: p.claves, bajas: p.bajas };
    }
    if (cal) return { jornada: cal.jornada, fecha: parseFecha(cal.fecha) ? fechaLarga(cal.fecha) : 'Fecha por fijar', hora: cal.hora, rival: cal.rival, local: cal.local !== false, campo: cal.campo, sistema: '', estrategia: '', claves: '', bajas: '' };
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
        : '<div class="card card--accent"><span class="eyebrow eyebrow--accent">Próximo partido</span><p class="muted">Añade los partidos en calendario.json.</p></div>') +
      '</div>' + premiosHTML(u) +
      '<div class="card"><h2 class="h2">Temporada en números</h2><div class="stats">' +
      [['Partidos', t.pj], ['Victorias', t.v], ['Empates', t.e], ['Derrotas', t.d], ['Goles a favor', t.gf], ['Goles en contra', t.gc]].map((x) => '<div class="stat"><b>' + x[1] + '</b><span>' + x[0] + '</span></div>').join('') +
      '</div></div>';
    initRascas($('#view-inicio'));
  }

  function alineacion() {
    const u = ultima();
    const sistema = u && FORMACIONES[u.sistema] ? u.sistema : '4-3-3';
    const slots = FORMACIONES[sistema].map((s) => ({ role: s[0], x: s[1], y: s[2], grupo: s[3], p: null }));
    if (u) {
      const tit = S.plantilla.filter((p) => u.jugadores[p.nombre] && u.jugadores[p.nombre].titular).slice(0, 11);
      const sobran = [];
      tit.sort((a, b) => ROLE_ORDER.indexOf(a.posicion || '') - ROLE_ORDER.indexOf(b.posicion || '')).forEach((p) => {
        const s = slots.find((sl) => !sl.p && sl.grupo === p.posicion);
        if (s) s.p = p; else sobran.push(p);
      });
      sobran.forEach((p) => { const s = slots.slice().reverse().find((sl) => !sl.p && sl.grupo !== 'POR') || slots.find((sl) => !sl.p); if (s) s.p = p; });
    }
    return { u, sistema, slots };
  }

  function renderPlantilla() {
    const { u, sistema, slots } = alineacion();
    const enCampo = new Set(slots.filter((s) => s.p).map((s) => s.p.nombre));
    const banquillo = S.plantilla.filter((p) => !enCampo.has(p.nombre));
    const lines = '<div class="ln" style="inset:16px;border-radius:4px"></div><div class="ln" style="left:16px;right:16px;top:50%;border-width:2px 0 0"></div><div class="ln" style="left:50%;top:50%;width:110px;height:110px;margin:-55px 0 0 -55px;border-radius:999px"></div><div class="ln" style="left:25%;right:25%;top:16px;height:90px;border-top:0"></div><div class="ln" style="left:25%;right:25%;bottom:16px;height:90px;border-bottom:0"></div>';
    const pitch = slots.map((s) => s.p
      ? '<button class="pl" style="left:' + s.x + '%;top:' + s.y + '%" data-jugador="' + esc(s.p.nombre) + '" aria-label="' + esc(s.p.nombre) + ', ' + s.role + '"><span class="pl__dot">' + dorsal(s.p) + '</span><span class="pl__name">' + esc(nombreCorto(s.p)) + '</span><span class="pl__role">' + s.role + '</span></button>'
      : '<span class="pl" style="left:' + s.x + '%;top:' + s.y + '%;cursor:default"><span class="pl__dot pl__dot--empty">?</span><span class="pl__role">' + s.role + '</span></span>').join('');
    const perfiles = S.plantilla.slice().sort((a, b) => (b.capitan ? 1 : 0) - (a.capitan ? 1 : 0)).map((p) => {
      const st = statsJugador(p.nombre);
      return '<button class="pcard" data-jugador="' + esc(p.nombre) + '"><span class="pcard__top">' + (p.foto ? '<img class="foto" src="' + esc(p.foto) + '" alt="">' : ICON.person) + '<span class="pcard__num">' + dorsal(p) + '</span></span>' +
        '<span class="pcard__body"><span><span class="pcard__name">' + esc(p.nombre) + (p.capitan ? ' (C)' : '') + '</span><span class="pcard__meta"><span class="role ' + roleCls(p) + '">' + roleTxt(p) + '</span>' + [p.edad ? p.edad + ' años' : '', p.pie].filter(Boolean).map(esc).join(' · ') + '</span></span>' +
        '<span class="mini-stats"><span><b>' + st.pj + '</b><small>Partidos</small></span><span><b>' + fmt1(st.media) + '</b><small>Nota media</small></span><span><b>' + st.goles + '</b><small>Goles</small></span><span><b>' + st.asist + '</b><small>Asistencias</small></span></span>' +
        (p.descripcion ? '<p>' + esc(p.descripcion) + '</p>' : '') + '</span></button>';
    }).join('');
    const filas = S.plantilla.slice().sort((a, b) => ROLE_ORDER.indexOf(a.posicion || '') - ROLE_ORDER.indexOf(b.posicion || '')).map((p) => {
      const st = statsJugador(p.nombre);
      <td><button class="linkish nombre2" data-jugador="' + esc(p.nombre) + '"><b>' + esc(p.nombre.split(' ')[0]) + '</b><span>' + esc(p.apellido != null ? p.apellido : (p.nombre.split(' ')[1] || '')) + (p.capitan ? ' (C)' : '') + '</span></button></td>
        '<td class="c">' + st.pj + '</td><td class="c">' + st.titular + '</td><td class="c">' + st.goles + '</td><td class="c">' + st.asist + '</td><td class="c">' + st.amarillas + ' / ' + st.rojas + '</td><td class="c">' + st.mvps + '</td><td class="c"><b>' + fmt1(st.media) + '</b></td><td>' + formaHTML(st.forma) + '</td></tr>';
    }).join('');
    const bajas = u && u.proximo && u.proximo.bajas;

    $('#view-plantilla').innerHTML =
      '<div class="page-head"><div><span class="eyebrow eyebrow--accent">Equipo</span><h1 class="h1">Alineación y plantilla</h1></div>' +
      '<div class="seg" role="group" aria-label="Vista"><button data-view="alineacion" aria-pressed="' + (S.view === 'alineacion') + '">Alineación</button><button data-view="tabla" aria-pressed="' + (S.view === 'tabla') + '">Plantilla</button><button data-view="jugadores" aria-pressed="' + (S.view === 'jugadores') + '">Jugadores</button></div></div>' +
      (S.view === 'alineacion'
        ? '<div class="row-wrap"><div class="pitch-col"><div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><b>' + (u ? 'Once inicial · Jornada ' + u.jornada : 'Once inicial') + '</b><span class="pill pill--ink" style="font-family:var(--display);font-size:20px">' + sistema + '</span></div><div class="pitch">' + lines + pitch + '</div>' + (u ? '' : '<p class="muted">El once aparecerá cuando el míster envíe la primera crónica.</p>') + '</div>' +
          '<div class="side-col">' + (u ? '<div class="card"><h2 class="h2" style="font-size:24px">Banquillo</h2>' + (banquillo.length ? banquillo.map((p) => '<button class="bench-row" data-jugador="' + esc(p.nombre) + '"><span class="n">' + dorsal(p) + '</span><span class="name">' + esc(p.nombre) + '</span><span class="role ' + roleCls(p) + '">' + roleTxt(p) + '</span></button>').join('') : '<p class="muted">Toda la plantilla salió de titular.</p>') + '</div>' : '') +
          '<div class="card"><h2 class="h2" style="font-size:24px">Notas del míster</h2><span class="muted" style="margin-top:-8px">Beltrán Lafuente Beltrán · Míster y capitán</span><p class="body2" style="font-size:14px;white-space:pre-line">' + esc(bajas || 'Sin avisos por ahora.') + '</p></div></div></div>' +
          '<div style="display:flex;flex-direction:column;gap:14px"><div class="carousel-head"><div><h2 class="h2" style="font-size:30px">Perfiles de jugadores</h2><span class="muted">' + S.plantilla.length + ' jugadores · pulsa una tarjeta para ver su historial</span></div><div class="arrows"><button class="icon-btn" data-car="-1" aria-label="Anteriores">' + ICON.left + '</button><button class="icon-btn" data-car="1" aria-label="Siguientes">' + ICON.right + '</button></div></div><div class="carousel" id="carousel">' + perfiles + '</div></div>'
                  : S.view === 'jugadores'
           ? '<span class="muted">' + S.plantilla.length + ' jugadores · pulsa una tarjeta para ver su historial</span><div class="pgrid">' + perfiles + '</div>'
        : '<span class="muted swipe-hint">Desliza hacia la derecha para ver todas las estadísticas →</span><div class="table-box"><table><thead><tr><th>#</th><th>Jugador</th><th>Pos.</th><th class="c">PJ</th><th class="c">Titular</th><th class="c">Goles</th><th class="c">Asist.</th><th class="c">Tarjetas</th><th class="c">MVP</th><th class="c">Nota media</th><th>Forma (últ. 5)</th></tr></thead><tbody>' + filas + '</tbody></table></div>' +
          '<div class="legend"><span><i class="form"><i class="hi"></i></i>Nota 7 o más</span><span><i class="form"><i class="mid"></i></i>5 a 6,9</span><span><i class="form"><i class="lo"></i></i>Menos de 5</span><span><i class="form"><i></i></i>No jugó</span></div>');
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
      .sort((a, b) => (c.jugadores[b.nombre].titular - c.jugadores[a.nombre].titular) || (ROLE_ORDER.indexOf(a.posicion || '') - ROLE_ORDER.indexOf(b.posicion || '')));
    const ratings = jugaron.map((p) => {
      const d = c.jugadores[p.nombre], isMvp = norm(c.mvp) === norm(p.nombre);
      return '<button class="rcard' + (isMvp ? ' rcard--mvp' : '') + '" data-jugador="' + esc(p.nombre) + '"><span class="rcard__head"><span class="num-badge">' + dorsal(p) + '</span><span><b>' + esc(p.nombre) + '</b><span class="muted" style="font-size:12px">' + roleTxt(p) + (d.titular ? ' · Titular' : ' · Suplente') + (isMvp ? ' · MVP' : '') + '</span></span><span class="rcard__nota">' + fmt1(d.nota) + '</span></span>' +
        '<span class="trio"><span><b>' + d.goles + '</b><small>Goles</small></span><span><b>' + d.asist + '</b><small>Asist.</small></span><span><b>' + (d.roja ? 'Roja' : d.amarilla ? 'Amarilla' : '–') + '</b><small>Tarjetas</small></span></span>' +
        (d.comentario ? '<span class="body2" style="font-size:14px">' + esc(d.comentario) + '</span>' : '') +
        '<span class="rcard__more">Ver historial de crónicas' + ICON.right.replace('width="20" height="20"', 'width="14" height="14"') + '</span></button>';
    }).join('');
    const opts = S.cronicas.map((x, i) => '<option value="' + x.jornada + '"' + (i === idx ? ' selected' : '') + '>Jornada ' + x.jornada + ' · ' + esc(x.rival) + '</option>').join('');
    $('#view-partidos').innerHTML =
      '<div class="page-head"><div><span class="eyebrow eyebrow--accent">Crónica semanal</span><h1 class="h1">Jornada ' + c.jornada + '</h1></div>' +
      '<div class="jselect"><button class="icon-btn icon-btn--light" data-j="-1" aria-label="Jornada anterior"' + (idx === 0 ? ' disabled' : '') + '>' + ICON.left + '</button><label class="sr" style="position:absolute;left:-9999px" for="jsel">Elegir jornada</label><select id="jsel">' + opts + '</select><button class="icon-btn icon-btn--light" data-j="1" aria-label="Jornada siguiente"' + (idx === S.cronicas.length - 1 ? ' disabled' : '') + '>' + ICON.right + '</button></div></div>' +
      '<div class="dark scoreboard"><small>' + fechaLarga(c.fecha) + (c.campo ? ' · ' + esc(c.campo) : '') + ' · ' + (c.local ? 'Local' : 'Visitante') + '</small><div class="scoreboard__row"><span class="scoreboard__team">' + (c.local ? 'TOSTAOS F.C.' : esc(c.rival).toUpperCase()) + '</span><span class="scoreboard__score">' + (c.local ? c.gf + ' – ' + c.gc : c.gc + ' – ' + c.gf) + '</span><span class="scoreboard__team">' + (c.local ? esc(c.rival).toUpperCase() : 'TOSTAOS F.C.') + '</span></div>' + (goleadores.length ? '<small>Goles de Tostaos: ' + goleadores.join(', ') + '</small>' : '') + '</div>' +
      '<div class="row-wrap"><div class="card summary"><h2 class="h2" style="font-size:26px">Resumen del partido</h2>' + (parrafos || '<p class="muted">Sin resumen.</p>') + '</div>' +
      '<div class="card moments"><h2 class="h2" style="font-size:26px;margin-bottom:6px">Momentos clave</h2>' + (c.momentos.length ? c.momentos.map((m) => '<div class="moment"><span class="moment__min">' + esc(m.min) + '</span>' + (m.tipo ? '<span class="tag ' + norm(m.tipo).replace(/[^a-z]/g, '') + '">' + esc(m.tipo) + '</span>' : '') + '<span class="body2" style="font-size:14px">' + esc(m.texto) + '</span></div>').join('') : '<p class="muted">Sin momentos clave.</p>') + '</div></div>' +
      premiosHTML(c) +
      '<div style="display:flex;flex-direction:column;gap:16px"><div class="page-head" style="align-items:baseline"><h2 class="h2" style="font-size:30px">Análisis jugador a jugador</h2><span class="muted">Nota de 1 a 10 · pulsa para ver su historial</span></div><div class="ratings">' + (ratings || '<p class="muted">Sin notas.</p>') + '</div></div>';
    initRascas($('#view-partidos'));
  }

  function renderCalendario() {
    const n = proximoPartido();
    const porJ = {}; S.cronicas.forEach((c) => { porJ[c.jornada] = c; });
    const js = new Set(S.calendario.map((c) => c.jornada).concat(S.cronicas.map((c) => c.jornada)));
    const lista = Array.from(js).sort((a, b) => a - b).map((j) => {
      const cal = S.calendario.find((c) => c.jornada === j) || {};
      const cr = porJ[j];
      const local = cr ? cr.local : cal.local !== false;
      const rival = cr ? cr.rival : cal.rival || '[Rival]';
      const estado = cr ? 'jugado' : n && n.jornada === j ? 'proximo' : 'pendiente';
      return { j, local, rival, cr, cal, estado, fecha: cr ? fechaCorta(cr.fecha) : (parseFecha(cal.fecha) ? fechaCorta(cal.fecha) : 'Por fijar') };
    }).filter((f) => S.filtro === 'todos' || (S.filtro === 'jugados' ? f.estado === 'jugado' : f.estado !== 'jugado'));
    const claves = n && n.claves ? n.claves.split(/\n/).filter((x) => x.trim()) : [];
    $('#view-calendario').innerHTML =
      (n ? '<div class="dark next"><div class="next__main"><div style="display:flex;flex-direction:column;gap:8px"><span class="pill pill--accent" style="align-self:flex-start;letter-spacing:.1em;text-transform:uppercase">Próximo partido · Jornada ' + n.jornada + '</span><span class="next__title">' + partidoTitulo(n.local, n.rival) + '</span></div>' +
        '<div class="facts"><div class="fact">' + ICON.cal + '<span><small>Fecha</small><b>' + esc(n.fecha) + '</b></span></div><div class="fact">' + ICON.clock + '<span><small>Hora</small><b>' + esc(n.hora || '[hh:mm]') + '</b></span></div><div class="fact">' + ICON.pin + '<span><small>Lugar</small><b>' + esc(n.campo || '[Campo]') + ' · ' + (n.local ? 'Local' : 'Visitante') + '</b></span></div><div class="fact">' + ICON.shield + '<span><small>Rival</small><b>' + esc(n.rival) + '</b></span></div></div></div>' +
        <h2 class="h2" style="font-size:30px;text-transform:uppercase;color:#D9700F">La estrategia del míster</h2>
        (n.sistema ? '<div class="chips"><span class="pill pill--ink">Sistema ' + esc(n.sistema) + '</span></div>' : '') +
        '<p class="body2" style="font-size:14px;white-space:pre-line">' + esc(n.estrategia || 'El míster publicará aquí su planteamiento con la crónica de la jornada.') + '</p>' +
        (claves.length ? '<ul>' + claves.map((k) => '<li>' + esc(k) + '</li>').join('') + '</ul>' : '') +
        (n.bajas ? '<p class="muted" style="font-size:13px;white-space:pre-line"><b>Avisos:</b> ' + esc(n.bajas) + '</p>' : '') + '</div></div>' : '') +
      '<div class="page-head"><div><span class="eyebrow eyebrow--accent">Temporada ' + esc(CFG.temporada) + '</span><h1 class="h1">Calendario</h1></div><div class="chips" role="group" aria-label="Filtrar partidos">' +
      [['todos', 'Todos'], ['proximos', 'Próximos'], ['jugados', 'Jugados']].map((f) => '<button data-filtro="' + f[0] + '" aria-pressed="' + (S.filtro === f[0]) + '">' + f[1] + '</button>').join('') + '</div></div>' +
      '<div class="fixtures">' + (lista.length ? lista.map((f) => '<div class="fixture' + (f.estado === 'proximo' ? ' fixture--next' : '') + '"><span class="fixture__date"><small>J' + f.j + '</small><b>' + esc(f.fecha) + '</b></span>' +
        '<span class="fixture__main"><b>' + (f.local ? 'Tostaos F.C. vs ' + esc(f.rival) : esc(f.rival) + ' vs Tostaos F.C.') + '</b><span class="muted" style="font-size:13px">' + esc([f.cal.hora, f.cr ? f.cr.campo : f.cal.campo].filter(Boolean).join(' · ')) + '</span></span>' +
        '<span class="fixture__venue">' + (f.local ? 'Local' : 'Visitante') + '</span><span class="fixture__score">' + (f.cr ? (f.local ? f.cr.gf + '–' + f.cr.gc : f.cr.gc + '–' + f.cr.gf) : '–') + '</span>' +
        '<span class="pill fixture__status ' + (f.estado === 'jugado' ? 'pill--soft' : f.estado === 'proximo' ? 'pill--accent' : 'pill--line') + '">' + ({ jugado: 'Jugado', proximo: 'Próximo', pendiente: 'Pendiente' })[f.estado] + '</span>' +
        (f.cr ? '<button class="linkish" data-ir-jornada="' + f.j + '">Crónica</button>' : '') + '</div>').join('') : '<div class="empty">No hay partidos en este filtro.</div>') + '</div>';
     const tit = $('#view-calendario .next__title'); if (tit) { const fit = () => { tit.style.fontSize = ''; let fs = parseFloat(getComputedStyle(tit).fontSize); while (tit.scrollWidth > tit.clientWidth && fs > 16) { fs -= 1; tit.style.fontSize = fs + 'px'; } }; fit(); if (document.fonts) document.fonts.ready.then(fit); }
  }

  // ── rasca y gana: MVP y "el más tostao" ───────────────────
  const TROFEO = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 4h8v5a4 4 0 0 1-8 0z"/><path d="M8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4"/><path d="M12 13v4M8.5 20h7M10 17h4"/></svg>';
  const TOSTADA = '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 11a4 4 0 0 1 3-6.5h8A4 4 0 0 1 19 11v8.5H5z"/><path d="M9 13.5l1.5 1.5M14 12l1 1.5M11 17l1.2-.8"/><path d="M9 3c-.6-.8.6-1.2 0-2M13 3c-.6-.8.6-1.2 0-2" stroke-width="1.4"/></svg>';
  const leido = (k) => { try { return localStorage.getItem('rasca:' + k) === '1'; } catch (e) { return false; } };
  const marcar = (k) => { try { localStorage.setItem('rasca:' + k, '1'); } catch (e) { /* sin almacenamiento */ } };

  function premiosHTML(c) {
    if (!c) return '';
    const tarjeta = (tipo, nombre) => {
      const p = jugador(nombre); if (!p) return '';
      const d = c.jugadores[p.nombre] || {};
      const mvp = tipo === 'mvp';
      return '<div class="rasca rasca--' + tipo + '" data-key="j' + c.jornada + '-' + tipo + '">' +
        '<div class="rasca__prize" aria-hidden="true">' +
        '<span class="rasca__icon">' + (mvp ? TROFEO : TOSTADA) + '</span>' +
        '<span class="rasca__label">' + (mvp ? 'MVP de la jornada ' : 'El más tostao · Jornada ') + c.jornada + '</span>' +
        '<span class="rasca__name">' + esc(p.nombre) + (p.capitan ? ' (C)' : '') + '</span>' +
        '<span class="rasca__meta">' + (dorsal(p) !== '–' ? 'Dorsal ' + dorsal(p) + ' · ' : '') + 'Nota ' + fmt1(d.nota) + '</span>' +
        (d.comentario ? '<span class="rasca__quote">«' + esc(d.comentario) + '»</span>' : '') +
        '<button class="linkish rasca__more" data-jugador="' + esc(p.nombre) + '" tabindex="-1">Ver su historial</button>' +
        '</div>' +
        '<canvas class="rasca__cover"></canvas>' +
        '<button class="rasca__skip">Revelar sin rascar</button>' +
        '</div>';
    };
    const cards = tarjeta('mvp', c.mvp) + tarjeta('peor', c.peor);
    if (!cards) return '';
    return '<div class="premios"><div class="page-head" style="align-items:baseline"><div><span class="eyebrow eyebrow--accent">Rasca y gana</span><h2 class="h2" style="font-size:30px">Premios de la jornada ' + c.jornada + '</h2></div><span class="muted">Rasca con el dedo o el ratón</span></div><div class="premios__grid">' + cards + '</div></div>';
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
      const mvp = el.classList.contains('rasca--mvp');
      const revelar = (celebrar) => {
        if (el.classList.contains('is-revealed')) return;
        el.classList.add('is-revealed'); prize.removeAttribute('aria-hidden');
        el.querySelector('.rasca__more').removeAttribute('tabindex');
        marcar(key);
        if (celebrar && mvp) confeti(el);
        if (celebrar && !mvp) el.classList.add('humo');
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
      if (mvp) { g.addColorStop(0, '#F7D58B'); g.addColorStop(0.5, '#E9A53C'); g.addColorStop(1, '#C97A16'); }
      else { g.addColorStop(0, '#7A7F87'); g.addColorStop(0.5, '#4A4F57'); g.addColorStop(1, '#2A2D33'); }
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 0.12; ctx.strokeStyle = '#FFFFFF'; ctx.lineWidth = 10;
      for (let x = -H; x < W; x += 28) { ctx.beginPath(); ctx.moveTo(x, H); ctx.lineTo(x + H, 0); ctx.stroke(); }
      ctx.globalAlpha = 1; ctx.textAlign = 'center'; ctx.fillStyle = mvp ? '#15171A' : '#FFFFFF';
      const titulo = mvp ? '¿QUIÉN ES EL MVP?' : '¿QUIÉN SE HA TOSTADO?';
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
  function abrirHistorial(nombre) {
    const p = jugador(nombre); if (!p) return;
    const st = statsJugador(p.nombre);
    const hist = S.cronicas.filter((c) => c.jugadores[p.nombre] && c.jugadores[p.nombre].jugo).slice().reverse();
    const box = $('#modal .modal__box');
    box.innerHTML = '<div class="modal__head"><span class="num-badge num-badge--accent">' + dorsal(p) + '</span><div><span class="eyebrow">Historial de crónicas</span><span class="modal__title" id="modal-title">' + esc(p.nombre) + (p.capitan ? ' (C)' : '') + '</span><span style="font-size:13px;color:#C9CDD4">' + (p.posicion ? ROLE_NAME[p.posicion] : 'Posición por definir') + ' · Temporada ' + esc(CFG.temporada) + '</span></div><button class="icon-btn icon-btn--light" data-close aria-label="Cerrar historial">' + ICON.close + '</button></div>' +
      '<div class="modal__body"><div class="stats">' + [['Nota media', fmt1(st.media)], ['Partidos', st.pj], ['Goles', st.goles], ['Asistencias', st.asist], ['Veces MVP', st.mvps]].map((x) => '<div class="stat"><b style="font-size:28px">' + x[1] + '</b><span>' + x[0] + '</span></div>').join('') + '</div>' +
      '<div><h3 class="h2" style="font-size:22px;margin-bottom:6px">Jornada a jornada</h3>' + (hist.length ? hist.map((c) => {
        const d = c.jugadores[p.nombre];
        return '<div class="hist"><span class="hist__nota"><small>Nota</small><b>' + fmt1(d.nota) + '</b></span><div class="hist__main"><div class="hist__top"><b>Jornada ' + c.jornada + ' · ' + (c.local ? 'Tostaos F.C. vs ' + esc(c.rival) : esc(c.rival) + ' vs Tostaos F.C.') + '</b><span style="font-family:var(--display);font-weight:800;font-size:20px">' + (c.local ? c.gf + '–' + c.gc : c.gc + '–' + c.gf) + '</span></div>' +
          '<span class="muted" style="font-size:13px">' + fechaCorta(c.fecha) + ' · ' + (d.titular ? 'Titular' : 'Suplente') + ' · ' + d.goles + ' goles · ' + d.asist + ' asist.' + (d.amarilla ? ' · Amarilla' : '') + (d.roja ? ' · Roja' : '') + (norm(c.mvp) === norm(p.nombre) ? ' · MVP' : '') + '</span>' +
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
    const t = e.target.closest('[data-jugador],[data-view],[data-filtro],[data-j],[data-car],[data-close],[data-ir-jornada]');
    if (e.target.id === 'modal') return cerrarHistorial();
    if (!t) return;
    if (t.dataset.close !== undefined) return cerrarHistorial();
    if (t.dataset.jugador) return abrirHistorial(t.dataset.jugador);
    if (t.dataset.view) { S.view = t.dataset.view; return renderPlantilla(); }
    if (t.dataset.filtro) { S.filtro = t.dataset.filtro; return renderCalendario(); }
    if (t.dataset.car) { const c = $('#carousel'); if (c) c.scrollBy({ left: (+t.dataset.car) * 276, behavior: 'smooth' }); return; }
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
