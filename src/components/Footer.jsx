import React from 'react';
import { Code2, Mail, ExternalLink } from 'lucide-react';
import './Footer.css';

const NAV_LINKS = [
  { label: 'Как это работает', href: '#engine' },
  { label: 'Проблемы и решения', href: '#ps-body-time' },
  { label: 'Метрики', href: '#metrics' },
  { label: 'Технологии', href: '#tech' },
];

const CONTACT_LINKS = [
  { icon: Mail, label: 'hello@ane-agency.io', href: 'mailto:hello@ane-agency.io' },
  { icon: Code2, label: 'github.com/ane-agency', href: 'https://github.com' },
  { icon: ExternalLink, label: 'Портфолио агентства', href: '#' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  const handleNavClick = (e, href) => {
    if (href.startsWith('#')) {
      e.preventDefault();
      const id = href.slice(1);
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer id="footer" className="footer" aria-label="Footer">
      {/* Top row */}
      <div className="container footer__top">
        {/* Brand */}
        <div className="footer__brand">
          <div className="footer__logo">
            <div className="footer__logo-icon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path
                  d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                  stroke="url(#footer-gradient)"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient id="footer-gradient" x1="2" y1="2" x2="22" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#00f5a0" />
                    <stop offset="1" stopColor="#00d4ff" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <span className="footer__logo-text gradient-text">ANE</span>
          </div>
          <p className="footer__tagline">
            Adaptive Nutrition Engine — интеллектуальная система персонализированного питания.
            Разработано с данными, инженерной строгостью и заботой о пользователе.
          </p>

          {/* Contact */}
          <div className="footer__contacts">
            {CONTACT_LINKS.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href}
                className="footer__contact-link"
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
              >
                <Icon size={14} />
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <nav className="footer__nav" aria-label="Footer navigation">
          <div className="footer__nav-group">
            <div className="footer__nav-title">Продукт</div>
            <ul className="footer__nav-list">
              {NAV_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a
                    href={href}
                    className="footer__nav-link"
                    onClick={(e) => handleNavClick(e, href)}
                  >
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="footer__nav-group">
            <div className="footer__nav-title">Агентство</div>
            <ul className="footer__nav-list">
              {['Кейсы', 'Команда', 'Блог', 'Карьера'].map((item) => (
                <li key={item}>
                  <a href="#" className="footer__nav-link">{item}</a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* CTA */}
        <div className="footer__cta">
          <div className="footer__cta-label">Хотите такой же продукт?</div>
          <p className="footer__cta-desc">
            Обсудим требования и предложим техническое решение — бесплатная
            консультация архитектора.
          </p>
          <button
            id="footer-cta-btn"
            className="btn-primary footer__cta-btn"
            onClick={() => window.open('mailto:hello@ane-agency.io', '_blank')}
          >
            <Mail size={16} />
            Написать нам
          </button>
        </div>
      </div>

      {/* Divider */}
      <div className="section-divider" />

      {/* Bottom row */}
      <div className="container footer__bottom">
        <p className="footer__copyright">
          © {year} Adaptive Nutrition Engine. Все права защищены.
        </p>
        <div className="footer__legal">
          <a href="#" className="footer__legal-link">Конфиденциальность</a>
          <a href="#" className="footer__legal-link">Условия использования</a>
          <a href="#" className="footer__legal-link">Cookies</a>
        </div>
        <div className="footer__built">
          Разработано агентством{' '}
          <span className="gradient-text">WebCraft Studio</span>
        </div>
      </div>
    </footer>
  );
}
