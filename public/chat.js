const chatToggle = document.getElementById('chat-toggle');
const chatPanel = document.getElementById('chat-panel');
const chatLog = document.getElementById('chat-log');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatSend = chatForm.querySelector('button');

const history = []; // [{ role: 'user' | 'model', text }]
let busy = false;

function setOpen(open) {
  chatPanel.hidden = !open;
  chatToggle.setAttribute('aria-expanded', open);
  chatToggle.classList.toggle('open', open);
  if (open) chatInput.focus();
}

chatToggle.addEventListener('click', () => setOpen(chatPanel.hidden));
document.getElementById('chat-close').addEventListener('click', () => setOpen(false));

function addMsg(cls, text) {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  chatLog.appendChild(el);
  chatLog.scrollTop = chatLog.scrollHeight;
  return el;
}

chatForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text || busy) return;

  busy = true;
  chatSend.disabled = true;
  chatInput.value = '';
  addMsg('msg-user', text);
  history.push({ role: 'user', text });
  const pending = addMsg('msg-bot pending', t('chat.wait'));

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });
    const data = await res.json();
    if (!res.ok || !data.reply) throw new Error(data.error || 'error');
    pending.className = 'msg-bot';
    pending.textContent = data.reply;
    history.push({ role: 'model', text: data.reply });
  } catch (err) {
    pending.className = 'msg-bot error';
    pending.textContent = t('chat.err');
    history.pop(); // bỏ câu hỏi lỗi để lượt sau vẫn hợp lệ
  } finally {
    busy = false;
    chatSend.disabled = false;
    chatLog.scrollTop = chatLog.scrollHeight;
    chatInput.focus();
  }
});
