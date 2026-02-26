import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Sidebar from '../components/SideBar.jsx';
import { getAllDocumentations, getDocumentationBySlug } from '../services/api';

/* ── Extract headings for ToC ── */
const extractHeadings = (markdown = '') =>
  markdown.split('\n')
    .filter((l) => /^#{2,3} /.test(l))
    .map((l) => {
      const level = l.match(/^(#{2,3})/)[1].length;
      const text  = l.replace(/^#{2,3} /, '');
      const id    = text.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return { level, text, id };
    });

const slugify = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-');

const headingRenderer = (level) => {
  const Tag = `h${level}`;
  return ({ children }) => {
    const text = typeof children === 'string' ? children : children?.toString?.() ?? '';
    return <Tag id={slugify(text)}>{children}</Tag>;
  };
};

/* ── Icons ── */
const SunIcon  = () => <span style={{ fontSize: '1rem', lineHeight: 1 }}>☀️</span>;
const MoonIcon = () => <span style={{ fontSize: '1rem', lineHeight: 1 }}>🌙</span>;

/* ── Language config ── */
const LANGUAGES = [
  { code: 'id', label: 'Indonesia', flag: 'ID' },
  { code: 'en', label: 'English',   flag: 'EN' },
];

/* ── Language Dropdown Component ── */
const LangDropdown = ({ lang, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="lang-dropdown" ref={ref}>
      <button
        className="lang-trigger"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="lang-flag">{current.flag}</span>
        <span className="lang-label">{current.label}</span>
        <span className={`lang-chevron${open ? ' open' : ''}`}>▾</span>
      </button>

      {open && (
        <ul className="lang-menu" role="listbox">
          {LANGUAGES.map((l) => (
            <li
              key={l.code}
              role="option"
              aria-selected={l.code === lang}
              className={`lang-option${l.code === lang ? ' lang-option--active' : ''}`}
              onClick={() => { onChange(l.code); setOpen(false); }}
            >
              <span className="lang-flag">{l.flag}</span>
              <span>{l.label}</span>
              {l.code === lang && <span className="lang-check">✓</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

/* ════════════════════════════════════
   MAIN PAGE
════════════════════════════════════ */
const DocsPage = () => {
  const { slug }   = useParams();
  const navigate   = useNavigate();

  const [allDocs,    setAllDocs]    = useState([]);
  const [currentDoc, setCurrentDoc] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [activeId,   setActiveId]   = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [theme, setTheme] = useState(
    () => localStorage.getItem('docs-theme') || 'dark'
  );
  const [lang, setLang] = useState(
    () => localStorage.getItem('docs-lang') || 'id'
  );

  const contentRef = useRef(null);

  /* ── Apply theme ── */
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('docs-theme', theme);
  }, [theme]);

  /* ── Fetch docs (re-runs on slug OR lang change) ── */
  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getAllDocumentations(lang);
        const docs = data.data || [];
        setAllDocs(docs);

        if (slug) {
          const docData = await getDocumentationBySlug(slug, lang);
          const found = (docData.data || [])[0];
          // If translation exists use it, otherwise fallback to first doc
          setCurrentDoc(found || docs[0] || null);
        } else if (docs.length > 0) {
          setCurrentDoc(docs[0]);
        } else {
          setCurrentDoc(null);
        }
      } catch (err) {
        setError('Gagal memuat dokumentasi.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchDocs();
  }, [slug, lang]);

  /* ── Scroll spy ── */
  useEffect(() => {
    if (!contentRef.current) return;
    const headings = contentRef.current.querySelectorAll('h2, h3');
    if (!headings.length) return;
    const obs = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setActiveId(e.target.id); }),
      { rootMargin: '-10% 0px -80% 0px' }
    );
    headings.forEach((h) => obs.observe(h));
    return () => obs.disconnect();
  }, [currentDoc]);

  /* ── Lock scroll when mobile menu open ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  /* ── Handle language change ── */
  const handleLangChange = (newLang) => {
    localStorage.setItem('docs-lang', newLang);
    setLang(newLang);
    // Keep current slug — useEffect will refetch with new lang
  };

  const toggleTheme = () => setTheme((t) => t === 'dark' ? 'light' : 'dark');

  const currentIndex = allDocs.findIndex((d) => d.slug === currentDoc?.slug);
  const prevDoc = currentIndex > 0 ? allDocs[currentIndex - 1] : null;
  const nextDoc = currentIndex < allDocs.length - 1 ? allDocs[currentIndex + 1] : null;
  const headings = extractHeadings(currentDoc?.content || '');

  /* ── UI States ── */
  if (loading) return (
    <div className="docs-loading">
      <div className="loading-spinner" />
      <span>Memuat dokumentasi...</span>
    </div>
  );

  if (error) return (
    <div className="docs-error"><span>⚠</span><p>{error}</p></div>
  );

  return (
    <div className="docs-root">

      {/* ── Topbar ── */}
      <header className="docs-topbar">
        <div className="topbar-left">
          <button className="mobile-menu-btn" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <span /><span /><span />
          </button>
          <a href="https://bintang.ai" className="topbar-logo" target="_blank" rel="noreferrer">
            Bintang.Ai
          </a>
          <span className="topbar-sep">/</span>
          <span className="topbar-section">Docs</span>
        </div>

        <div className="topbar-right">
          {/* Language switcher */}
          <LangDropdown lang={lang} onChange={handleLangChange} />

          {/* Theme toggle */}
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-sans)', fontWeight: 600, color: 'var(--text-muted)' }}>
              {theme === 'dark' ? 'Terang' : 'Gelap'}
            </span>
          </button>

          <a href="https://bintang.ai" className="topbar-btn" target="_blank" rel="noreferrer">
            Platform ↗
          </a>
        </div>
      </header>

      {/* ── Mobile overlay ── */}
      {mobileOpen && (
        <div className="mobile-overlay" onClick={() => setMobileOpen(false)}>
          <div className="mobile-sidebar-wrap" onClick={(e) => e.stopPropagation()}>
            <button className="mobile-close-btn" onClick={() => setMobileOpen(false)}>✕</button>
            <Sidebar docs={allDocs} />
          </div>
        </div>
      )}

      <div className="docs-body">
        {/* ── Sidebar ── */}
        <div className="docs-sidebar-wrap">
          <Sidebar docs={allDocs} />
        </div>

        {/* ── Main ── */}
        <div className='docs-main-wrap'>
            <main className="docs-main" ref={contentRef}>
          {currentDoc ? (
              <>
              <nav className="breadcrumb">
                <Link to="/docs" className="breadcrumb-link">Docs</Link>
                <span className="breadcrumb-sep">›</span>
                {currentDoc.category && (
                  <>
                    <span className="breadcrumb-link">{currentDoc.category}</span>
                    <span className="breadcrumb-sep">›</span>
                  </>
                )}
                <span className="breadcrumb-current">{currentDoc.title}</span>
              </nav>

              <article className="docs-article">
                {currentDoc.category && (
                    <span className="article-category">{currentDoc.category}</span>
                )}
                <h1 className="article-title">{currentDoc.title}</h1>
                {currentDoc.description && (
                    <p className="article-lead">{currentDoc.description}</p>
                )}
                <div className="article-divider" />

                <div className="article-body">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: headingRenderer(2),
                      h3: headingRenderer(3),
                      code({ inline, className, children }) {
                          if (inline) return <code className="inline-code">{children}</code>;
                          const lang = (className || '').replace('language-', '') || 'bash';
                          return (
                              <div className="code-block">
                            <div className="code-block-header">
                              <span className="code-lang">{lang}</span>
                              <button className="code-copy-btn" onClick={() => navigator.clipboard?.writeText(String(children))}>
                                Copy
                              </button>
                            </div>
                            <pre><code>{children}</code></pre>
                          </div>
                        );
                      },
                    }}
                  >
                    {currentDoc.content}
                  </ReactMarkdown>
                </div>

                <div className="article-pagination">
                  {prevDoc ? (
                    <Link to={`/docs/${prevDoc.slug}`} className="page-nav page-nav--prev">
                      <span className="page-nav-label">← Sebelumnya</span>
                      <span className="page-nav-title">{prevDoc.title}</span>
                    </Link>
                  ) : <div />}
                  {nextDoc ? (
                    <Link to={`/docs/${nextDoc.slug}`} className="page-nav page-nav--next">
                      <span className="page-nav-label">Selanjutnya →</span>
                      <span className="page-nav-title">{nextDoc.title}</span>
                    </Link>
                  ) : <div />}
                </div>
              </article>
            </>
          ) : (
            <div className="docs-empty">
              <div className="empty-icon">📭</div>
              <h2>{lang === 'id' ? 'Belum ada dokumentasi' : 'No documentation yet'}</h2>
              <p>{lang === 'id' ? 'Tambahkan konten melalui Strapi Admin Panel.' : 'Add content via the Strapi Admin Panel.'}</p>
              <a href="http://localhost:1337/admin" className="empty-cta" target="_blank" rel="noreferrer">
                {lang === 'id' ? 'Buka Admin Panel →' : 'Open Admin Panel →'}
              </a>
            </div>
          )}
        </main>
        </div>

        {/* ── ToC ── */}
        {headings.length > 0 && (
          <aside className="docs-toc">
            <p className="toc-title">{lang === 'id' ? 'Isi Halaman' : 'On this page'}</p>
            <ul className="toc-list">
              {headings.map((h) => (
                <li key={h.id} className={`toc-item toc-item--h${h.level}`}>
                  <a href={`#${h.id}`} className={`toc-link${activeId === h.id ? ' toc-link--active' : ''}`}>
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </div>
    </div>
  );
};

export default DocsPage;