// 年份自动更新
document.getElementById('year').textContent = new Date().getFullYear();

// 简单表单校验 + 假提交演示（生产可接 Formspree / 自建 API）
const form = document.getElementById('bookingForm');
const statusEl = document.getElementById('formStatus');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  statusEl.textContent = '正在提交…';

  // 简单校验
  const data = Object.fromEntries(new FormData(form).entries());
  if(!data.name || !data.phone || !data.car || !data.service || !data.date){
    statusEl.textContent = '请完整填写必填项。';
    return;
  }

  try {
    // 示例：提交到 Formspree（将下面的URL替换为你自己的）
    // const resp = await fetch('https://formspree.io/f/xxxxxx', { method:'POST', headers:{'Accept':'application/json'}, body:new FormData(form) });
    // if(resp.ok){ form.reset(); statusEl.textContent = '预约已提交，我们会尽快联系你确认。'; }
    // else { statusEl.textContent = '提交失败，请稍后重试或改用电话。'; }

    // 演示模式（无后端）：
    await new Promise(r => setTimeout(r, 800));
    form.reset();
    statusEl.textContent = '预约已提交，我们会尽快联系你确认。';
  } catch(err){
    statusEl.textContent = '网络异常，请稍后再试或直接拨打电话。';
  }
});

