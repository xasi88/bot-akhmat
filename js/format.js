// Форматы дат, счёта и итога матча. Без DOM: проверяется тестами.
export const AHMAT = 'Ахмат';
const MESYACY = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const DNI = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[z]));

export function dataRu(iso, { den = false } = {}) {
  const [g, m, d] = iso.split('-').map(Number);
  const tekst = `${d} ${MESYACY[m - 1]}`;
  if (!den) return tekst;
  return `${tekst}, ${DNI[new Date(Date.UTC(g, m - 1, d)).getUTCDay()]}`;
}

// Время обновления: ISO в UTC, показываем по Москве.
export function obnovlenoRu(iso) {
  const d = new Date(new Date(iso).getTime() + 3 * 3600 * 1000).toISOString();
  return `${dataRu(d.slice(0, 10))}, ${d.slice(11, 16)} МСК`;
}

// Итог для Ахмата: pobeda, nichya, porazh. Ничья в Кубке решается пенальти.
export function itog(m) {
  if (!m.schet) return null;
  const doma = m.doma === AHMAT;
  let [my, oni] = doma ? m.schet : [m.schet[1], m.schet[0]];
  if (my === oni && m.penalti) [my, oni] = doma ? m.penalti : [m.penalti[1], m.penalti[0]];
  return my > oni ? 'pobeda' : my < oni ? 'porazh' : 'nichya';
}

export const ITOG_RU = { pobeda: 'победа', nichya: 'ничья', porazh: 'поражение' };

export function sopernik(m) {
  return m.doma === AHMAT ? m.vgostyah : m.doma;
}

export function chisloRu(n, odin, dva, pyat) {
  const a = Math.abs(n) % 100, b = a % 10;
  if (a > 10 && a < 20) return `${n} ${pyat}`;
  if (b === 1) return `${n} ${odin}`;
  if (b >= 2 && b <= 4) return `${n} ${dva}`;
  return `${n} ${pyat}`;
}
