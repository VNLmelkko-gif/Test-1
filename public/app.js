const amountEl = document.getElementById('amount');
const rateEl = document.getElementById('rate');
const modeEls = document.querySelectorAll('input[name="mode"]');
const msgEl = document.getElementById('msg');
let lastEmail = '';

function calc() {
  const fmt = new Intl.NumberFormat(LOCALES[currentLang], { style: 'currency', currency: 'EUR' });
  const amount = parseFloat(amountEl.value) || 0;
  const rate = parseFloat(rateEl.value) / 100;
  const mode = document.querySelector('input[name="mode"]:checked').value;

  const net = mode === 'net' ? amount : amount / (1 + rate);
  const vat = net * rate;
  const gross = net + vat;

  document.getElementById('r-net').textContent = fmt.format(net);
  document.getElementById('r-vat').textContent = fmt.format(vat);
  document.getElementById('r-gross').textContent = fmt.format(gross);
}

[amountEl, rateEl, ...modeEls].forEach((el) => el.addEventListener('input', calc));

// Päivitä laskuri ja viesti kielen vaihtuessa
window.onLangChange = () => {
  calc();
  if (lastEmail) msgEl.textContent = t('contact.ok').replace('{email}', lastEmail);
};
calc();

document.getElementById('signup').addEventListener('submit', (e) => {
  e.preventDefault();
  lastEmail = document.getElementById('email').value.trim();
  msgEl.textContent = t('contact.ok').replace('{email}', lastEmail);
  e.target.reset();
});
