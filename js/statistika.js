// Статистика Ахмата за сезон из его матчей. Без DOM: проверяется тестами.
import { AHMAT, itog, sopernik } from './format.js?v=9f1d2cfe';

const nashi = (m) => (m.doma === AHMAT ? m.schet : [m.schet[1], m.schet[0]]);

function itogi(matchi) {
  const s = { igry: 0, pobedy: 0, nichi: 0, porazheniya: 0, zabito: 0, propushcheno: 0, ochki: 0 };
  for (const m of matchi) {
    const [my, oni] = nashi(m);
    s.igry += 1; s.zabito += my; s.propushcheno += oni;
    if (my > oni) { s.pobedy += 1; s.ochki += 3; } else if (my === oni) { s.nichi += 1; s.ochki += 1; } else s.porazheniya += 1;
  }
  return s;
}

// Серия: сколько последних матчей подряд с одним итогом.
function seriya(matchi) {
  const it = matchi.map(itog);
  if (!it.length) return null;
  const posl = it[it.length - 1];
  let n = 0;
  for (let i = it.length - 1; i >= 0 && it[i] === posl; i--) n += 1;
  return { itog: posl, n };
}

// Самый крупный счёт: по разнице, при равенстве больше забито.
function krupnyy(matchi, znak) {
  let luchshiy = null;
  for (const m of matchi) {
    const [my, oni] = nashi(m);
    const r = (my - oni) * znak;
    if (r <= 0) continue;
    const ves = r * 100 + (znak > 0 ? my : oni);
    if (!luchshiy || ves > luchshiy.ves) luchshiy = { ves, sopernik: sopernik(m), schet: `${my}:${oni}`, data: m.data };
  }
  if (!luchshiy) return null;
  const { ves, ...x } = luchshiy;
  return x;
}

export function sezonAhmata(vse) {
  const rpl = vse.filter((m) => m.turnir === 'РПЛ' && m.schet);
  const s = itogi(rpl);
  return {
    ...s,
    golyZaMatch: s.igry ? Math.round((s.zabito / s.igry) * 10) / 10 : 0,
    propZaMatch: s.igry ? Math.round((s.propushcheno / s.igry) * 10) / 10 : 0,
    ochkiZaMatch: s.igry ? Math.round((s.ochki / s.igry) * 10) / 10 : 0,
    suhie: rpl.filter((m) => nashi(m)[1] === 0).length,
    bezGolov: rpl.filter((m) => nashi(m)[0] === 0).length,
    doma: itogi(rpl.filter((m) => m.doma === AHMAT)),
    vgostyah: itogi(rpl.filter((m) => m.vgostyah === AHMAT)),
    pobeda: krupnyy(rpl, 1),
    porazhenie: krupnyy(rpl, -1),
    seriya: seriya(rpl),
    vseTurniry: vse.filter((m) => m.schet).length,
  };
}

// Лидеры лиги по таблице: лучшая атака, лучшая защита, больше всего побед и ничьих.
export function lideryLigi(tablica) {
  if (!tablica?.length) return [];
  const max = (pole) => tablica.reduce((a, b) => (b[pole] > a[pole] ? b : a));
  const min = (pole) => tablica.reduce((a, b) => (b[pole] < a[pole] ? b : a));
  const ataka = max('zabito'), zashchita = min('propushcheno'), pobedy = max('pobedy'), nichi = max('nichi');
  return [
    { nazv: 'Лучшая атака', komanda: ataka.komanda, chislo: ataka.zabito, pod: 'забито' },
    { nazv: 'Лучшая защита', komanda: zashchita.komanda, chislo: zashchita.propushcheno, pod: 'пропущено' },
    { nazv: 'Больше всего побед', komanda: pobedy.komanda, chislo: pobedy.pobedy, pod: 'побед' },
    { nazv: 'Больше всего ничьих', komanda: nichi.komanda, chislo: nichi.nichi, pod: 'ничьих' },
  ];
}
