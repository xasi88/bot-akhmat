// Экран бота: четыре раздела из одного файла данных.
import { AHMAT, esc, dataRu, obnovlenoRu, itog, ITOG_RU, chisloRu } from './format.js?v=f450a625';
import { VERSIYA } from './version.js?v=f450a625';

const tg = window.Telegram?.WebApp;
tg?.ready();
tg?.expand();
tg?.setHeaderColor?.('#006b5f');
tg?.setBackgroundColor?.('#023630');

const ekran = document.getElementById('ekran');
let D = null;
let vkladkaStat = 'bombardiry';
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

function razdelTablica() {
  const stroki = D.rpl.tablica.map((t) => `<tr class="${t.komanda === AHMAT ? 'ah' : ''}">
      <td class="m num">${t.mesto}</td><td class="k">${esc(t.komanda)}</td>
      <td class="v num">${t.igry}</td><td class="v num">${t.pobedy}-${t.nichi}-${t.porazheniya}</td>
      <td class="v num">${t.zabito}:${t.propushcheno}</td><td class="o num">${t.ochki}</td></tr>`).join('');
  return `<div class="blok"><h2>Таблица РПЛ</h2>
    <table class="tabl num"><thead><tr><th></th><th class="k">Команда</th><th>И</th><th>В-Н-П</th><th>Мячи</th><th>О</th></tr></thead>
    <tbody>${stroki}</tbody></table></div>`;
}

const SPISKI = {
  bombardiry: { nazv: 'Голы', chislo: (i) => i.goly, pod: (i) => (i.penalti ? `с пенальти ${i.penalti}` : '') },
  assistenty: { nazv: 'Передачи', chislo: (i) => i.peredachi, pod: () => '' },
  glyas: { nazv: 'Гол+пас', chislo: (i) => i.ochki, pod: () => '' },
};

function razdelStatistika() {
  const sp = SPISKI[vkladkaStat];
  const lyudi = D.rpl.statistika[vkladkaStat] ?? [];
  const stroki = lyudi.map((i, n) => `<tr class="${i.ahmat ? 'ah' : ''}"><td class="m num">${n + 1}</td>
      <td class="k">${esc(i.imya)}<small>${esc(i.komanda)}${sp.pod(i) ? `. ${esc(sp.pod(i))}` : ''}</small></td>
      <td class="o num">${sp.chislo(i)}</td></tr>`).join('');
  const svoi = lyudi.filter((i) => i.ahmat).length;
  return `<div class="vkl" role="tablist">
      ${Object.entries(SPISKI).map(([k, v]) => `<button data-stat="${k}" class="${k === vkladkaStat ? 'on' : ''}">${v.nazv}</button>`).join('')}
    </div>
    <div class="blok"><h2>Лидеры РПЛ</h2>
      ${lyudi.length ? `<table class="tabl num"><tbody>${stroki}</tbody></table>` : '<p class="pusto">Статистика сейчас недоступна</p>'}
      <p class="podpis">${svoi ? 'Игроки Ахмата выделены.' : 'Игроков Ахмата в первой десятке нет.'}</p>
    </div>`;
}

function razdelKubok() {
  const g = D.kubok.gruppa;
  const tabl = g ? `<h2>${esc(g.nazvanie)}, Путь РПЛ</h2>
    <table class="tabl num"><thead><tr><th></th><th class="k">Команда</th><th>И</th><th>В</th><th>ВП</th><th>ПП</th><th>П</th><th>О</th></tr></thead><tbody>
    ${g.komandy.map((c) => `<tr class="${c.komanda === AHMAT ? 'ah' : ''}"><td class="m">${c.mesto}</td><td class="k">${esc(c.komanda)}</td>
      <td class="v">${c.igry}</td><td class="v">${c.pobedy}</td><td class="v">${c.pobedyPen}</td><td class="v">${c.porazheniyaPen}</td><td class="v">${c.porazheniya}</td><td class="o">${c.ochki}</td></tr>`).join('')}
    </tbody></table>
    <p class="podpis">ВП: победа по пенальти, 2 очка. ПП: поражение по пенальти, 1 очко.</p>` : '';
  const matchi = D.matchi.filter((m) => m.turnir === 'Кубок России');
  return `<div class="blok">${tabl}
    <h2>Матчи Ахмата в Кубке</h2>${matchi.length ? matchi.slice().reverse().map(strokaMatcha).join('') : '<p class="pusto">Матчей пока нет</p>'}</div>`;
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
});

// В сети данные лежат в открытом репозитории bot-akhmat-dannye, на компьютере рядом с экраном.
const DANNYE = location.hostname === 'localhost' ? 'dannye/akhmat.json' : 'https://xasi88.github.io/bot-akhmat-dannye/akhmat.json';
fetch(`${DANNYE}?v=${Date.now()}`, { cache: 'no-store' })
  .then((o) => { if (!o.ok) throw new Error(o.status); return o.json(); })
  .then((d) => { D = d; pokazat(tekushchiy); })
  .catch(() => { ekran.innerHTML = '<p class="pusto">Данные не загрузились. Проверьте интернет и откройте ещё раз.</p>'; });
