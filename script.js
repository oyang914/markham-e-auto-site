// 年份自动更新
document.getElementById('year').textContent = new Date().getFullYear();

// === Formspree 提交 ===
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xpwjnqqe';

const form = document.getElementById('bookingForm');
const statusEl = document.getElementById('formStatus');
const submitBtn = form?.querySelector('button[type="submit"]');

function setSubmitting(isSubmitting) {
  if (!submitBtn) return;
  submitBtn.disabled = isSubmitting;
  submitBtn.style.opacity = isSubmitting ? '0.7' : '1';
  submitBtn.style.pointerEvents = isSubmitting ? 'none' : 'auto';
}

function isValidPhone(v = '') {
  return /^[0-9+()\-\s]{7,}$/.test(v.trim());
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setSubmitting(true);
    if (statusEl) statusEl.textContent = '正在提交…';

    // 必填校验
    const data = Object.fromEntries(new FormData(form).entries());
    if (!data.name || !data.phone || !data.car || !data.service || !data.date) {
      if (statusEl) statusEl.textContent = '请完整填写必填项。';
      setSubmitting(false);
      return;
    }
    if (!isValidPhone(data.phone)) {
      if (statusEl) statusEl.textContent = '请填写有效的联系电话。';
      setSubmitting(false);
      return;
    }

    try {
      // 提交到 Formspree
      const resp = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });

      if (resp.ok) {
        form.reset();
        if (statusEl) statusEl.textContent = '预约已提交，我们会尽快联系你确认。';
      } else {
        // 尝试解析错误信息
        let msg = '提交失败，请稍后重试或直接拨打电话。';
        try {
          const err = await resp.json();
          if (err && err.errors && err.errors[0]?.message) {
            msg = `提交失败：${err.errors[0].message}`;
          }
        } catch(_) {}
        if (statusEl) statusEl.textContent = msg;
      }
    } catch (err) {
      if (statusEl) statusEl.textContent = '网络异常，请稍后再试或直接拨打电话。';
    } finally {
      setSubmitting(false);
    }
  });
}

