// 年份自动更新
document.getElementById('year').textContent = new Date().getFullYear();

// === Formspree 提交 ===
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/XXXXYYYY'; // 改成你的端点
const form = document.getElementById('bookingForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = form?.querySelector('button[type="submit"]');

function setSubmitting(b){
  if (!submitBtn) return;
  submitBtn.disabled = b;
  submitBtn.style.opacity = b ? '0.7' : '1';
  submitBtn.style.pointerEvents = b ? 'none' : 'auto';
}

function isValidPhone(v=''){ return /^[0-9+()\-\s]{7,}$/.test(v.trim()); }

if (form) {
  let replyto = form.querySelector('input[name="_replyto"]');
  if (!replyto) {
    replyto = document.createElement('input');
    replyto.type = 'hidden';
    replyto.name = '_replyto';
    form.appendChild(replyto);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (statusEl) statusEl.textContent = '正在提交…';

    const fd = new FormData(form);
    const data = Object.fromEntries(fd.entries());

    // 同步 _replyto
    replyto.value = data.email || '';

    // 简单校验
    if (!data.name || !data.phone || !data.car || !data.service || !data.date) {
      if (statusEl) statusEl.textContent = '请完整填写必填项。';
      setSubmitting(false); return;
    }
    if (!isValidPhone(data.phone)) {
      if (statusEl) statusEl.textContent = '请填写有效的联系电话。';
      setSubmitting(false); return;
    }

    try {
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      });

      if (resp.ok) {
        form.reset();
        if (statusEl) statusEl.textContent = '预约已提交，我们会尽快联系你确认。';
      } else {
        let msg = '提交失败，请稍后重试或直接拨打电话。';
        try {
          const err = await resp.json();
          if (err?.errors?.[0]?.message) msg = `提交失败：${err.errors[0].message}`;
        } catch {}
        if (statusEl) statusEl.textContent = msg;
      }
    } catch (e) {
      if (statusEl) statusEl.textContent = '网络异常，请稍后再试或直接拨打电话。';
    } finally {
      setSubmitting(false);
    }
  });
}
