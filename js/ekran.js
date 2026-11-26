// Экран бота: четыре раздела из одного файла данных.
import { AHMAT, esc, dataRu, obnovlenoRu, itog, ITOG_RU, chisloRu } from './format.js?v=9f1d2cfe';
import { VERSIYA } from './version.js?v=9f1d2cfe';
import { sezonAhmata, lideryLigi } from './statistika.js?v=9f1d2cfe';

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();
tg?.setHeaderColor?.('#00a862');
tg?.setBackgroundColor?.('#00392f');

const ekran = document.getElementById('ekran');
let D = null;
let vkladkaStat = 'ahmat';
let vkladkaTabl = 'vse';
let vkladkaKubka = 'gruppy';
let vkladkaMatchey = 'vse';

const turnirEtap = (m) => [m.turnir, m.etap].filter(Boolean).join(', ');

function strokaMatcha(m) {
  const i = itog(m);
  const pen = m.penalti ? `<small>пен. ${m.penalti.join(':')}</small>` : '';
  const sprava = m.schet
    ? `<span class="schet num">${m.schet.join(':')}${pen}</span>`
    : `<span class="vremya num">${esc(m.vremya ?? '')}</span>`;
  const opis = `${dataRu(m.data)}. ${esc(turnirEtap(m))}${i ? `. ${ITOG_RU[i]}` : ''}`;
  return `<div class="match"><span class="tochka ${i ?? ''}" aria-hidden="true"></span>
    <span class="kto">${esc(m.doma)} - ${esc(m.vgostyah)}<small>${opis}</small></span>${sprava}</div>`;
}

function razdelMatchi() {
  const s = D.sleduyushchiy;
  const ah = D.rpl.tablica.find((t) => t.komanda === AHMAT);
  const verh = s ? `<section class="bolshoy">
      <div class="pod">Следующий матч. ${esc(turnirEtap(s))}</div>
      <div class="zag komandy">${esc(s.doma)}<br>${esc(s.vgostyah)}</div>
      <div class="zag kogda num">${dataRu(s.data)}${s.vremya ? `, ${esc(s.vremya)} МСК` : ''}</div>
      <div class="dop">Напоминание за час придёт в чат бота. Выключить: команда /stop</div>
    </section>` : '<section class="bolshoy"><div class="pod">Ближайших матчей в календаре нет</div></section>';
  const spisok = D.matchi.filter((m) => vkladkaMatchey === 'vse' || (vkladkaMatchey === 'rpl' ? m.turnir === 'РПЛ' : m.turnir !== 'РПЛ'));
  const sygrany = spisok.filter((m) => m.schet).reverse();
  const vperedi = spisok.filter((m) => !m.schet);
  return `${verh}
    <div class="blok">
      ${ah ? `<button class="mesto" data-idti="tablica"><span>Место в РПЛ, ${chisloRu(ah.ochki, 'очко', 'очка', 'очков')}</span><span class="zag num">${ah.mesto}</span></button>` : ''}
    </div>
    <div class="vkl" role="tablist">
      ${[['vse', 'Все'], ['rpl', 'РПЛ'], ['kubok', 'Кубок']].map(([k, t]) => `<button data-matchi="${k}" class="${k === vkladkaMatchey ? 'on' : ''}">${t}</button>`).join('')}
    </div>
    <div class="blok">
      ${sygrany.length ? `<h2>Последние матчи</h2>${sygrany.slice(0, 8).map(strokaMatcha).join('')}` : ''}
      ${vperedi.length ? `<h2>Впереди</h2>${vperedi.slice(0, 8).map(strokaMatcha).join('')}` : ''}
    </div>`;
}

const TABLICY = { vse: 'Все матчи', doma: 'Дома', vgostyah: 'В гостях' };
const tochki = (f) => (f ?? []).map((i) => `<i class="${i}"></i>`).join('');

function pereklyuchatel(imya, varianty, tekushchaya) {
  return `<div class="vkl" role="tablist">${Object.entries(varianty).map(([k, v]) =>
    `<button role="tab" data-${imya}="${k}" class="${k === tekushchaya ? 'on' : ''}" aria-selected="${k === tekushchaya}">${typeof v === 'string' ? v : v.nazv}</button>`).join('')}</div>`;
}

function razdelTablica() {
  const spisok = vkladkaTabl === 'vse' ? D.rpl.tablica : (D.rpl[vkladkaTabl] ?? []);
  const forma = vkladkaTabl === 'vse' ? (D.rpl.forma ?? {}) : null;
  const stroki = spisok.map((t) => `<tr class="${t.komanda === AHMAT ? 'ah' : ''}">
      <td class="m num">${t.mesto}</td><td class="k">${esc(t.komanda)}${forma?.[t.komanda] ? `<span class="forma" aria-label="Форма">${tochki(forma[t.komanda])}</span>` : ''}</td>
      <td class="v num">${t.igry}</td><td class="v num">${t.pobedy}-${t.nichi}-${t.porazheniya}</td>
      <td class="v num">${t.zabito}:${t.propushcheno}</td><td class="o num">${t.ochki}</td></tr>`).join('');
  return `${pereklyuchatel('tabl', TABLICY, vkladkaTabl)}
    <div class="blok"><h2>Таблица РПЛ. ${TABLICY[vkladkaTabl]}</h2>
    ${spisok.length ? `<table class="tabl num"><thead><tr><th></th><th class="k">Команда</th><th>И</th><th>В-Н-П</th><th>Мячи</th><th>О</th></tr></thead>
    <tbody>${stroki}</tbody></table>` : '<p class="pusto">Таблица сейчас недоступна</p>'}
    ${forma ? '<p class="podpis">Точки: пять последних матчей, новый справа. Зелёная победа, жёлтая ничья, красная поражение.</p>' : '<p class="podpis">Посчитано по сыгранным матчам календаря.</p>'}
    </div>`;
}

const SPISKI = {
  ahmat: { nazv: 'Ахмат' },
  bombardiry: { nazv: 'Голы', chislo: (i) => i.goly, pod: (i) => (i.penalti ? `с пенальти ${i.penalti}` : '') },
  assistenty: { nazv: 'Передачи', chislo: (i) => i.peredachi, pod: () => '' },
  glyas: { nazv: 'Гол+пас', chislo: (i) => i.ochki, pod: () => '' },
  liga: { nazv: 'Лига' },
};

const plitka = (chislo, podpis, klass = '') => `<div class="plitka ${klass}"><span class="zag num">${chislo}</span><span>${podpis}</span></div>`;
const vnp = (s) => `${s.pobedy}-${s.nichi}-${s.porazheniya}`;
const drob = (n) => String(n).replace('.', ',');
const slovo = (n, a, b, c) => chisloRu(n, a, b, c).replace(/^-?\d+ /, '');
const SERIYA = { pobeda: ['победа', 'победы', 'побед'], nichya: ['ничья', 'ничьи', 'ничьих'], porazh: ['поражение', 'поражения', 'поражений'] };

function statAhmat() {
  const s = sezonAhmata(D.matchi);
  if (!s.igry) return '<div class="blok"><p class="pusto">Сыгранных матчей в РПЛ пока нет</p></div>';
  const ser = s.seriya ? `${chisloRu(s.seriya.n, ...SERIYA[s.seriya.itog])} подряд` : '';
  const schet = (x) => (x ? `<span class="zag num">${x.schet}</span><span>${esc(x.sopernik)}, ${dataRu(x.data)}</span>` : '<span>нет</span>');
  return `<div class="blok"><h2>Ахмат в РПЛ</h2>
    <div class="plitki">
      ${plitka(s.igry, slovo(s.igry, 'матч', 'матча', 'матчей'))}
      ${plitka(s.ochki, slovo(s.ochki, 'очко', 'очка', 'очков'), 'yarko')}
      ${plitka(vnp(s), 'победы, ничьи, поражения')}
      ${plitka(`${s.zabito}:${s.propushcheno}`, 'забито и пропущено')}
      ${plitka(drob(s.golyZaMatch), 'забивает за матч')}
      ${plitka(drob(s.propZaMatch), 'пропускает за матч')}
      ${plitka(s.suhie, `${slovo(s.suhie, 'матч', 'матча', 'матчей')} на ноль`)}
      ${plitka(s.bezGolov, `${slovo(s.bezGolov, 'матч', 'матча', 'матчей')} без гола`)}
    </div>
    <h2>Дома и в гостях</h2>
    <table class="tabl num"><thead><tr><th class="k"></th><th>И</th><th>В-Н-П</th><th>Мячи</th><th>О</th></tr></thead><tbody>
      ${[['Дома', s.doma], ['В гостях', s.vgostyah]].map(([n, x]) => `<tr><td class="k">${n}</td><td class="v">${x.igry}</td><td class="v">${vnp(x)}</td><td class="v">${x.zabito}:${x.propushcheno}</td><td class="o">${x.ochki}</td></tr>`).join('')}
    </tbody></table>
    <h2>Рекорды сезона</h2>
    <div class="rekord"><span class="pod">Крупная победа</span>${schet(s.pobeda)}</div>
    <div class="rekord"><span class="pod">Крупное поражение</span>${schet(s.porazhenie)}</div>
    ${ser ? `<div class="rekord"><span class="pod">Серия сейчас</span><span class="zag ${s.seriya.itog}">${ser}</span></div>` : ''}
    <p class="podpis">${drob(s.ochkiZaMatch)} очка за матч в РПЛ. Всего сыграно матчей во всех турнирах: ${s.vseTurniry}.</p>
  </div>`;
}

function statLiga() {
  const l = lideryLigi(D.rpl.tablica);
  return `<div class="blok"><h2>Лидеры РПЛ среди команд</h2>
    ${l.map((x) => `<div class="rekord ${x.komanda === AHMAT ? 'ah' : ''}"><span class="pod">${x.nazv}</span><span class="zag num">${x.chislo}</span><span>${esc(x.komanda)}, ${x.pod}</span></div>`).join('')}
    <p class="podpis">Таблицы «Дома» и «В гостях» в разделе «Таблица».</p>
  </div>`;
}

function razdelStatistika() {
  const sp = SPISKI[vkladkaStat];
  const verh = pereklyuchatel('stat', SPISKI, vkladkaStat);
  if (vkladkaStat === 'ahmat') return verh + statAhmat();
  if (vkladkaStat === 'liga') return verh + statLiga();
  const lyudi = D.rpl.statistika[vkladkaStat] ?? [];
  const stroki = lyudi.map((i, n) => `<tr class="${i.ahmat ? 'ah' : ''}"><td class="m num">${n + 1}</td>
      <td class="k">${esc(i.imya)}<small>${esc(i.komanda)}${sp.pod(i) ? `. ${esc(sp.pod(i))}` : ''}</small></td>
      <td class="o num">${sp.chislo(i)}</td></tr>`).join('');
  const svoi = lyudi.filter((i) => i.ahmat).length;
  return `${verh}
    <div class="blok"><h2>Лидеры РПЛ. ${sp.nazv}</h2>
      ${lyudi.length ? `<table class="tabl num"><tbody>${stroki}</tbody></table>` : '<p class="pusto">Статистика сейчас недоступна</p>'}
      <p class="podpis">${svoi ? 'Игроки Ахмата выделены.' : 'Игроков Ахмата в первой десятке нет.'}</p>
    </div>`;
}

const KUBOK = { gruppy: 'Группы', plejoff: 'Плей-офф', matchi: 'Матчи Ахмата' };

function tablicaGruppy(g) {
  return `<h2>${esc(g.nazvanie)}</h2>
    <table class="tabl num"><thead><tr><th></th><th class="k">Команда</th><th>И</th><th>В</th><th>ВП</th><th>ПП</th><th>П</th><th>О</th></tr></thead><tbody>
    ${g.komandy.map((c) => `<tr class="${c.komanda === AHMAT ? 'ah' : ''}"><td class="m">${c.mesto}</td><td class="k">${esc(c.komanda)}</td>
      <td class="v">${c.igry}</td><td class="v">${c.pobedy}</td><td class="v">${c.pobedyPen}</td><td class="v">${c.porazheniyaPen}</td><td class="v">${c.porazheniya}</td><td class="o">${c.ochki}</td></tr>`).join('')}
    </tbody></table>`;
}

function kartaPary(p) {
  const komanda = (k) => `<div class="kom${k === p.pobeditel ? ' proshla' : ''}${k === AHMAT ? ' ahm' : ''}"><span class="imya">${esc(k)}</span>
    ${p.matchi.map((m) => `<span class="zag num">${m.schet ? (m.doma === k ? m.schet[0] : m.schet[1]) : '-'}</span>`).join('')}</div>`;
  const daty = p.matchi.map((m) => `${dataRu(m.data)}${m.vremya ? `, ${esc(m.vremya)}` : ''}${m.penalti ? `, пен. ${m.penalti.join(':')}` : ''}`).join('; ');
  return `<div class="para">${p.komandy.map(komanda).join('')}<small>${p.matchi.length > 1 ? 'Два матча: ' : ''}${daty}</small></div>`;
}

function razdelKubokPlejoff() {
  const puti = D.kubok.plejoff ?? [];
  if (!puti.length) return '<div class="blok"><p class="pusto">Сетка плей-офф пока недоступна</p></div>';
  const etap = (e) => `<div class="etap"><h3>${esc(e.nazvanie)}</h3>
    ${e.pary.length ? e.pary.map(kartaPary).join('') : '<div class="para pustaya">Пары определятся позже</div>'}</div>`;
  return `${puti.map((p) => `<div class="blok"><h2>${esc(p.put)}</h2><div class="setka">${p.etapy.map(etap).join('')}</div></div>`).join('')}
    <div class="blok"><h2>Финал</h2>
      <div class="para final"><span class="zag">Суперфинал</span><small>Победитель Пути РПЛ против победителя Пути регионов</small></div>
      <p class="podpis">Сетку можно листать вбок. Команда, которая прошла дальше, выделена.</p></div>`;
}

function razdelKubok() {
  const verh = pereklyuchatel('kubok', KUBOK, vkladkaKubka);
  if (vkladkaKubka === 'plejoff') return verh + razdelKubokPlejoff();
  if (vkladkaKubka === 'gruppy') {
    const gruppy = D.kubok.gruppy?.length ? D.kubok.gruppy : (D.kubok.gruppa ? [D.kubok.gruppa] : []);
    return `${verh}<div class="blok">${gruppy.length ? gruppy.map(tablicaGruppy).join('') : '<p class="pusto">Таблицы групп пока недоступны</p>'}
      <p class="podpis">Путь РПЛ, групповой этап. ВП: победа по пенальти, 2 очка. ПП: поражение по пенальти, 1 очко.</p></div>`;
  }
  const matchi = D.matchi.filter((m) => m.turnir === 'Кубок России');
  return `${verh}<div class="blok"><h2>Матчи Ахмата в Кубке</h2>${matchi.length ? matchi.slice().reverse().map(strokaMatcha).join('') : '<p class="pusto">Матчей пока нет</p>'}</div>`;
}

const RAZDELY = { matchi: razdelMatchi, tablica: razdelTablica, statistika: razdelStatistika, kubok: razdelKubok };
let tekushchiy = 'matchi';

function pokazat(razdel, { naverh = true } = {}) {
  tekushchiy = razdel;
  document.querySelectorAll('.panel button').forEach((b) => b.classList.toggle('on', b.dataset.razdel === razdel));
  const ist = `Источники: РПЛ ${esc(D.istochniki.rpl)}, Кубок ${esc(D.istochniki.kubok)}.`;
  const vnim = D.preduprezhdeniya?.length ? '<br><span class="vnimanie">Часть данных из запасного источника.</span>' : '';
  ekran.innerHTML = `<div class="poyavlenie">${RAZDELY[razdel]()}<p class="vnizu">Обновлено ${obnovlenoRu(D.obnovleno)}. ${ist} Версия ${VERSIYA}.${vnim}</p></div>`;
  if (naverh) window.scrollTo({ top: 0 });
}

document.querySelector('.panel').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-razdel]');
  if (b && D) { pokazat(b.dataset.razdel); tg?.HapticFeedback?.selectionChanged(); }
});
ekran.addEventListener('click', (e) => {
  const b = e.target.closest('button');
  if (!b) return;
  if (b.dataset.idti) pokazat(b.dataset.idti);
  if (b.dataset.stat) { vkladkaStat = b.dataset.stat; pokazat('statistika', { naverh: false }); }
  if (b.dataset.matchi) { vkladkaMatchey = b.dataset.matchi; pokazat('matchi', { naverh: false }); }
  if (b.dataset.tabl) { vkladkaTabl = b.dataset.tabl; pokazat('tablica', { naverh: false }); }
  if (b.dataset.kubok) { vkladkaKubka = b.dataset.kubok; pokazat('kubok', { naverh: false }); }
});

// В сети данные лежат в открытом репозитории bot-akhmat-dannye, на компьютере рядом с экраном.
const DANNYE = location.hostname === 'localhost' ? 'dannye/akhmat.json' : 'https://xasi88.github.io/bot-akhmat-dannye/akhmat.json';
fetch(`${DANNYE}?v=${Date.now()}`, { cache: 'no-store' })
  .then((o) => { if (!o.ok) throw new Error(o.status); return o.json(); })
  .then((d) => { D = d; pokazat(tekushchiy); })
  .catch(() => { ekran.innerHTML = '<p class="pusto">Данные не загрузились. Проверьте интернет и откройте ещё раз.</p>'; });
