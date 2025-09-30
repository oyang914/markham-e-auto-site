// 年份自动更新
document.getElementById('year').textContent = new Date().getFullYear();

// === Formspree 提交 ===
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/XXXXYYYY'; 
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
function copyWeChat() {
  const text = "MarkhamEAuto"; 
  navigator.clipboard.writeText(text).then(() => {
    const statusEl = document.getElementById("copyStatus");
    if (statusEl) {
      statusEl.textContent = " ✅ 已复制";
      // 2 秒后清空提示
      setTimeout(() => {
        statusEl.textContent = "";
      }, 2000);
    }
  }).catch(err => {
    alert("复制失败，请手动复制: " + text);
  });
}
/*** Reviews: Google Sheet CSV -> render ***/
const REVIEW_SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfhNxFjr7jRmkwTyFh8WDh-aFmul2m1m0wB1M3NOEYanlQa9kksAde_9nO6zoczDERaBMNqwZV0VZE/pub?output=csv'; // <- CSV 地址
const REVIEW_FORM_URL      = 'https://docs.google.com/forms/d/e/1FAIpQLSdiJWbiq6RCAyqvLOn4WBMuQIJuibc3OrTUOKSG_RegndSpbA/viewform?usp=dialog';             // <- 表单地址

/*** Reviews:兼容中英文与变体 ***/

const reviewUsBtn = document.getElementById('reviewUsBtn');
if (reviewUsBtn) reviewUsBtn.href = REVIEW_FORM_URL;

// CSV 解析
function parseCSV(text){
  const rows = []; let i=0, field='', row=[], inQ=false;
  while(i<text.length){ const c=text[i];
    if(inQ){ if(c==='"' && text[i+1]==='"'){field+='"';i+=2;continue;}
      if(c=== '"'){inQ=false;i++;continue;} field+=c;i++;continue; }
    if(c=== '"'){inQ=true;i++;continue;}
    if(c=== ','){row.push(field);field='';i++;continue;}
    if(c=== '\r'){i++;continue;}
    if(c=== '\n'){row.push(field);rows.push(row);field='';row=[];i++;continue;}
    field+=c;i++;
  } row.push(field); rows.push(row); return rows;
}

function renderStars(n){
  n = Math.max(0, Math.min(5, Number(n)||0));
  return `<span style="color:#f59e0b">${'★'.repeat(Math.floor(n))}${'☆'.repeat(5-Math.floor(n))}</span>`;
}

// 根据关键字集合在表头中找列索引（不区分大小写）
function findIdx(headerLower, keywords){
  return headerLower.findIndex(col => keywords.some(k => col.includes(k)));
}

async function loadReviews(){
  try{
    const res = await fetch(REVIEW_SHEET_CSV_URL, { cache: 'no-store' });
    if(!res.ok) throw new Error('fetch csv failed');
    const csv = await res.text();
    const rows = parseCSV(csv).filter(r => r.some(x => (x||'').trim() !== ''));
    if (rows.length < 2) return; // 没有数据

    // 1) 取表头（全部转小写，去空格）
    const headerRaw = rows[0];
    const headerLower = headerRaw.map(h => (h||'').toString().trim().toLowerCase());

    // 2) 尝试匹配各列（中英文/变体）
    const idx = {
      time:   findIdx(headerLower, ['timestamp','时间','时间戳','提交时间','日期']),
      rating: findIdx(headerLower, ['rating','评分','打分','星','rate','score','星级','分数']),
      city:   findIdx(headerLower, ['city','城市']),
      service:findIdx(headerLower, ['service','服务','服务类型','项目','维修项目']),
      exp:    findIdx(headerLower, ['experience','review','评价','评论','体验','内容','文字','反馈','说明','备注']),
      name:   findIdx(headerLower, ['name','昵称','姓名','车主','contact','名字'])
    };

    // 3) 生成条目
    const items = rows.slice(1).map(r => {
      const safe = i => (i>=0 && i<r.length) ? (r[i]||'').toString().trim() : '';
      return {
        time:   safe(idx.time),
        rating: Number(safe(idx.rating)) || 0,
        city:   safe(idx.city),
        service:safe(idx.service),
        exp:    safe(idx.exp),
        name:   safe(idx.name) || '车主'
      };
    })
    // 至少要有评分或正文才算有效
    .filter(x => x.rating > 0 || x.exp);

    // 4) 新→旧排序
    items.sort((a,b) => new Date(b.time) - new Date(a.time));

    // 5) 聚合评分
    const agg = items.length ? (items.reduce((s,x)=>s+(x.rating||0),0) / items.length) : 0;
    const aggScoreEl = document.getElementById('aggScore');
    const aggCountEl = document.getElementById('aggCount');
    if (aggScoreEl) aggScoreEl.textContent = `${agg.toFixed(1)}/5`;
    if (aggCountEl) aggCountEl.textContent = items.length ? `共 ${items.length} 条评价` : '欢迎留下你的第一条评价';

    // 6) 渲染列表
    const wrap = document.getElementById('reviewsList');
    const moreWrap = document.getElementById('reviewsMoreWrap');
    const showAllBtn = document.getElementById('showAllReviews');
    if (!wrap) return;

    const renderRange = (arr) => {
      wrap.innerHTML = arr.map(x => {
        const body = x.exp ? `<p>${x.exp.replace(/\n/g,'<br>')}</p>`
                           : `<p class="muted">(无文字评价)</p>`;
        const city = x.city || 'GTA';
        const svc  = x.service || 'Service';
        const date = x.time ? new Date(x.time).toLocaleDateString() : '';
        return `
          <blockquote>
            <div class="stars small" aria-hidden="true">${renderStars(x.rating)}</div>
            ${body}
            <div class="review-meta">
              ${x.name ? `<span>${x.name}</span>` : ''} · ${city}
              <span class="badge-inline">${svc}</span>
              ${date ? `<span class="muted" style="margin-left:6px">${date}</span>` : ''}
            </div>
          </blockquote>
        `;
      }).join('');
    };

    const INITIAL = 6;
    renderRange(items.slice(0, INITIAL));

    if (items.length > INITIAL && moreWrap && showAllBtn){
      moreWrap.style.display = 'block';
      showAllBtn.onclick = () => { renderRange(items); moreWrap.style.display = 'none'; };
    }
  }catch(err){
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', loadReviews);
