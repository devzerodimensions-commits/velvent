import { Link } from 'react-router-dom';
import Logo from './Logo';
import Newsletter from './Newsletter';
import { Clock, Facebook, Instagram, Mail, Phone, Whatsapp } from './Icons';
import { useContent } from '../store/content';


export default function Footer() {
  const brand = useContent('brand');
  const { columns, newsletterTitle, newsletterNote, payments } = useContent('footer');

  return (
    <footer className="mt-20 bg-navy text-cream">
      <div className="shell grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5 lg:gap-8">
        <div className="lg:col-span-2">
          <Logo variant="stacked" withTagline className="items-start text-cream [&>span:last-child]:w-[190px]" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-cream/70">
            {brand.tagline}
          </p>

          <div className="mt-6 space-y-2.5 text-sm text-cream/80">
            <a href={`tel:${brand.phoneRaw}`} className="flex items-center gap-2.5 transition hover:text-cream">
              <Phone size={17} /> {brand.phone}
            </a>
            <a href={`mailto:${brand.email}`} className="flex items-center gap-2.5 transition hover:text-cream">
              <Mail size={17} /> {brand.email}
            </a>
            <p className="flex items-start gap-2.5">
              <Clock size={17} className="mt-0.5 shrink-0" />
              <span>
                {brand.hours.map((h) => `${h.label} ${h.value}`).join(' · ')}
                <span className="mt-0.5 block text-cream/50">{brand.hoursDays}</span>
              </span>
            </p>
          </div>

          <div className="mt-6 flex gap-2.5">
            {[
              { href: `https://wa.me/${brand.whatsapp}`, Icon: Whatsapp, label: 'WhatsApp' },
              { href: brand.social.instagram, Icon: Instagram, label: 'Instagram' },
              { href: brand.social.facebook, Icon: Facebook, label: 'Facebook' },
            ].map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer noopener"
                aria-label={label}
                className="grid h-10 w-10 place-items-center border border-cream/25 transition hover:border-cream hover:bg-cream hover:text-navy"
              >
                <Icon size={18} />
              </a>
            ))}
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.title}>
            <h3 className="text-[11px] font-semibold uppercase tracking-brand text-cream">{col.title}</h3>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.to + l.label}>
                  <Link to={l.to} className="text-sm text-cream/65 transition hover:text-cream">{l.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        <div>
          <h3 className="text-[11px] font-semibold uppercase tracking-brand text-cream">{newsletterTitle}</h3>
          <Newsletter
            id="footer-newsletter"
            note={newsletterNote}
          />
        </div>
      </div>

      <div className="border-t border-cream/15">
        <div className="shell flex flex-col items-center justify-between gap-4 py-6 sm:flex-row">
          <p className="text-[11px] uppercase tracking-wider2 text-cream/50">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <p className="text-[11px] font-medium uppercase tracking-brand text-cream/70">{brand.motto}</p>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider2 text-cream/50">
            {payments.map((m) => (
              <span key={m} className="border border-cream/20 px-2 py-1">{m}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
