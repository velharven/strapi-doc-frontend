import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';

/* ── Chevron icon ── */
const ChevronIcon = ({ open }) => (
  <svg
    width="12" height="12" viewBox="0 0 12 12" fill="none"
    stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ transition: 'transform 0.2s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', flexShrink: 0 }}
  >
    <polyline points="4,2 8,6 4,10" />
  </svg>
);

/* ── Collapsible group ── */
const NavGroup = ({ label, items, slug, defaultOpen = false }) => {
  const isAnyActive = items.some((d) => d.slug === slug);
  const [open, setOpen] = useState(defaultOpen || isAnyActive);

  return (
    <div className="nav-sub-group">
      <button
        className={`nav-sub-trigger${isAnyActive ? ' nav-sub-trigger--active' : ''}`}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="nav-sub-trigger-dot" />
        <span className="nav-sub-trigger-label">{label}</span>
        <ChevronIcon open={open} />
      </button>

      {open && (
        <ul className="nav-sub-list">
          {items.map((doc) => (
            <li key={doc.id}>
              <Link
                to={`/docs/${doc.slug}`}
                className={`nav-sub-item${doc.slug === slug ? ' nav-sub-item--active' : ''}`}
              >
                {doc.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ════════════════════════════════════
   SIDEBAR
════════════════════════════════════ */
const Sidebar = ({ docs }) => {
  const { slug } = useParams();

  /* ── Group by category, then by parentTitle inside category ── */
  const grouped = docs.reduce((acc, doc) => {
    const cat    = doc.category || 'Umum';
    const parent = doc.parentTitle || null;

    if (!acc[cat]) acc[cat] = { flat: [], groups: {} };

    if (parent) {
      if (!acc[cat].groups[parent]) acc[cat].groups[parent] = [];
      acc[cat].groups[parent].push(doc);
    } else {
      acc[cat].flat.push(doc);
    }

    return acc;
  }, {});

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <a href="https://bintang.ai" target="_blank" rel="noreferrer" className="brand-link">
          <span className="brand-name">Bintang.Ai</span>
        </a>
        <span className="brand-badge">Docs</span>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {Object.entries(grouped).map(([category, { flat, groups }]) => (
          <div key={category} className="nav-group">
            <p className="nav-category-label">{category}</p>
            <ul className="nav-list">

              {/* Flat items (no parentTitle) */}
              {flat.map((doc) => (
                <li key={doc.id}>
                  <Link
                    to={`/docs/${doc.slug}`}
                    className={`nav-item${slug === doc.slug ? ' nav-item--active' : ''}`}
                  >
                    <span className="nav-item-indicator" />
                    {doc.title}
                  </Link>
                </li>
              ))}

              {/* Dropdown groups (has parentTitle) */}
              {Object.entries(groups).map(([parentLabel, items]) => (
                <li key={parentLabel}>
                  <NavGroup
                    label={parentLabel}
                    items={items}
                    slug={slug}
                    defaultOpen={false}
                  />
                </li>
              ))}

            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <a href="https://bintang.ai" target="_blank" rel="noreferrer" className="sidebar-footer-link">
          ↗ Kunjungi Bintang.Ai
        </a>
      </div>
    </aside>
  );
};

export default Sidebar;