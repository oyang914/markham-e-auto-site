// =====================
// Mobile Navigation
// =====================
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.querySelector('.nav-menu');

if (navToggle && navMenu) {
  navToggle.addEventListener('click', () => {
    navMenu.classList.toggle('active');
  });
}

// =====================
// Smooth Scroll (anchor links)
// =====================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth'
      });
    }

    // close mobile menu after click
    if (navMenu) {
      navMenu.classList.remove('active');
    }
  });
});

// =====================
// Header scroll effect
// =====================
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  if (!header) return;

  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// =====================
// Booking form status (NO submit interception!)
// =====================
const form = document.getElementById('bookingForm');
const status = document.getElementById('formStatus');

if (form && status) {
  form.addEventListener('submit', () => {
    // 不拦截提交！！！
    status.textContent = "提交中，请稍等...";
  });
}
