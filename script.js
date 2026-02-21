const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('.menu');
const menuLinks = document.querySelectorAll('.menu a');
const reveals = document.querySelectorAll('.reveal');
const year = document.getElementById('year');

if (year) {
  year.textContent = new Date().getFullYear();
}

if (menuToggle && menu) {
  menuToggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
  });

  menuLinks.forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  reveals.forEach((element) => observer.observe(element));
} else {
  reveals.forEach((element) => element.classList.add('visible'));
}

const sectionLinks = [...menuLinks].filter((link) =>
  link.getAttribute('href')?.startsWith('#')
);

const navById = new Map(
  sectionLinks.map((link) => [link.getAttribute('href')?.slice(1), link])
);

const sections = sectionLinks
  .map((link) => link.getAttribute('href'))
  .map((target) => (target ? document.querySelector(target) : null))
  .filter(Boolean);

if (sections.length > 0 && 'IntersectionObserver' in window) {
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        const targetId = entry.target.getAttribute('id');
        sectionLinks.forEach((link) => link.classList.remove('active'));
        navById.get(targetId)?.classList.add('active');
      });
    },
    { threshold: 0.4 }
  );

  sections.forEach((section) => sectionObserver.observe(section));
}
