import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";
import { BookOpen, Search, Heart, MessageCircle, Home, Grid3X3, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import "./styles.css";
import { resolveCatalogImage, PLACEHOLDER_IMAGE, normalizeSlug, slugify } from "./lib/catalogUtils";

const WHATSAPP_NUMBER = "972559891243";
const PHONE_PATTERN = /0\d{1,2}[-\s]?\d{6,7}/;

function priceText(product) {
  const amount = product?.current_price?.amount;
  if (typeof amount === "number" && amount > 0) return `₪${amount.toLocaleString("he-IL")}`;
  return "לפרטים";
}

function isPhoneLike(text) {
  return typeof text === "string" && PHONE_PATTERN.test(text);
}

function hasQuantityKeyword(text) {
  return /\+|או יותר|מעלה|יותר|עד/.test(text);
}

function isValidTierPrice(tier, product) {
  if (!tier || typeof tier.amount !== "number" || !tier.min_quantity) return false;
  const source = String(tier.source_text || tier.sourceText || "").trim();
  if (!source) return false;
  if (isPhoneLike(source)) return false;
  const hasPriceSymbol = source.includes("₪") || source.includes("שקל") || source.includes("ש".concat("ח"));
  if (!hasPriceSymbol && !hasQuantityKeyword(source)) return false;

  const current = product?.current_price?.amount;
  if (typeof current === "number") {
    if (current >= 20 && current <= 80 && tier.amount > Math.max(120, current * 1.4)) return false;
    if (tier.amount > current + 30 && tier.amount > current * 1.3) return false;
  }

  if (tier.min_quantity > 500 && tier.amount > 300) return false;
  return true;
}

function renderPrices(product) {
  const unit = product?.current_price?.amount;
  const tiers = Array.isArray(product?.tier_prices)
    ? product.tier_prices.filter((t) => isValidTierPrice(t, product))
    : [];

  return (
    <div className="price-block">
      <div className="price-unit"><strong>מחיר ליחידה:</strong> {typeof unit === "number" ? `₪${unit.toLocaleString("he-IL")}` : "לפרטים"}</div>
      {tiers.length ? (
        <div className="price-bulk">
          <strong>מחיר לכמות:</strong>
          <div className="bulk-list">
            {tiers.slice(0, 3).map((t, i) => (
              <div key={i} className="bulk-item">{t.min_quantity}+: ₪{t.amount.toLocaleString("he-IL")}</div>
            ))}
            {tiers.length > 3 ? <div className="bulk-more">ועוד {tiers.length - 3}…</div> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function cleanText(text, max = 170) {
  if (!text) return "";
  const cleaned = String(text).replace(/\s+/g, " ").trim();
  return cleaned.length > max ? cleaned.slice(0, max).trim() + "…" : cleaned;
}

function uniqueBy(arr, keyFn) {
  const seen = new Set();
  return arr.filter((item) => {
    const key = keyFn(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeProductName(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function getGroupPrefix(name) {
  const normalized = normalizeProductName(name);
  if (normalized.startsWith("תיק גן")) return "תיק גן";
  return null;
}

function groupSimilarProducts(products) {
  const buckets = new Map();
  const others = [];

  for (const product of products) {
    const prefix = getGroupPrefix(product.name);
    if (!prefix) {
      others.push(product);
      continue;
    }
    const list = buckets.get(prefix) || [];
    list.push(product);
    buckets.set(prefix, list);
  }

  const result = [...others];
  for (const [prefix, items] of buckets.entries()) {
    if (items.length < 3) {
      result.push(...items);
      continue;
    }

    const primary = items.find((item) => Array.isArray(item.images) && item.images.length) || items[0];
    const designs = items.map((item, index) => ({
      design_name: normalizeProductName(item.name).slice(prefix.length).trim() || `עיצוב ${index + 1}`,
      images: Array.isArray(item.images) ? item.images : [],
      product_id: item.product_id,
      price: item?.current_price?.amount,
    }));

    result.push({
      ...primary,
      product_id: `group-${slugify(prefix)}`,
      slug: normalizeSlug(prefix, prefix),
      name: prefix,
      images: Array.isArray(primary.images) ? primary.images.slice(0, 1) : [],
      designs,
      tags: Array.from(new Set(items.flatMap((item) => item.tags || []))),
      short_description: primary.short_description || primary.full_description || `${items.length} עיצובים זמינים`,
      current_price: primary.current_price,
      tier_prices: primary.tier_prices,
    });
  }

  return result;
}

function buildSections(products) {
  const productsWithGroups = groupSimilarProducts(products);
  const grouped = new Map();

  for (const product of productsWithGroups) {
    const path = Array.isArray(product.category_path) ? product.category_path.filter(Boolean) : [];
    const category = path[0] || "קטלוג כללי";
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(product);
  }

  return Array.from(grouped.entries()).map(([title, items], index) => ({
    id: `section-${index}-${title}`.replace(/[^a-zA-Z0-9א-ת_-]+/g, "-"),
    title,
    subtitle: sectionSubtitle(title, items.length),
    products: uniqueBy(items, (p) => p.product_id || p.slug || p.name).slice(0, 48),
  }));
}

function sectionSubtitle(title, count) {
  if (title.includes("משפחה")) return `מתנות אישיות ומרגשות — ${count} מוצרים`;
  if (title.includes("מפתח")) return `קטנות, שימושיות ומתוקות — ${count} מוצרים`;
  if (title.includes("שעון")) return `עיצובים לבית ולחדר — ${count} מוצרים`;
  return `${count} מוצרים בקטגוריה`;
}

function productMainImage(product) {
  const images = Array.isArray(product.images) ? product.images : [];
  const main = images.find((img) => img.role === "main" && img.local_filename) || images.find((img) => img.local_filename) || images[0];
  return resolveCatalogImage(main, product);
}

function ProductCard({ product, large = false }) {
  const image = productMainImage(product);
  const whatsappText = encodeURIComponent(`היי, אשמח לקבל פרטים על ${product.name || "מוצר מהקטלוג"}`);
  const [openDesigns, setOpenDesigns] = useState(false);
  const [activeDesign, setActiveDesign] = useState(null);

  const designs = Array.isArray(product.designs) ? product.designs : [];
  const uniqueDesigns = uniqueBy(designs, (d) => d.design_name || d.variant_key || JSON.stringify(d));
  const previewDesign = activeDesign || uniqueDesigns[0];
  const previewImage = resolveCatalogImage((previewDesign?.images || [])[0], product);

  const openDesignModal = () => {
    setActiveDesign(uniqueDesigns[0]);
    setOpenDesigns(true);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.35 }}
      className={`product-card ${large ? "large" : ""}`}
    >
      <div className="product-image-wrap">
        <img src={image} alt={product.name || "מוצר"} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
      </div>
      <div className="product-content">
        <div>
          {renderPrices(product)}
          <h3>{product.name}</h3>
          <p>{cleanText(product.short_description || product.full_description, large ? 260 : 145)}</p>
          <div className="tags">
            {(product.tags || []).slice(0, 4).map((tag) => <span key={tag}>{tag}</span>)}
          </div>
          {uniqueDesigns.length ? (
            <div className="designs-collapse">
              <button className="designs-toggle" onClick={openDesignModal}>
                עיצובים ({uniqueDesigns.length})
              </button>
            </div>
          ) : null}
        </div>
        <div className="actions">
          <button className="btn ghost"><Heart size={16} /> שמירה</button>
          <a className="btn whatsapp" href={`https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappText}`} target="_blank" rel="noreferrer">
            <MessageCircle size={16} /> וואטסאפ
          </a>
        </div>
      </div>

      {openDesigns ? (
        <div className="designs-modal-backdrop" onClick={() => setOpenDesigns(false)}>
          <div className="designs-modal" onClick={(e) => e.stopPropagation()}>
            <button className="designs-modal-close" onClick={() => setOpenDesigns(false)}><X size={18} /></button>
            <div className="designs-modal-header">
              <div>
                <span>עיצובים</span>
                <h3>{product.name}</h3>
              </div>
            </div>
            <div className="designs-modal-preview">
              <img src={previewImage} alt={previewDesign?.design_name || "עיצוב"} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
              <div className="designs-modal-name">{previewDesign?.design_name}</div>
            </div>
            <div className="designs-grid">
              {uniqueDesigns.map((d) => (
                <button
                  key={d.variant_key || d.design_name || JSON.stringify(d)}
                  type="button"
                  className={`design-thumb ${previewDesign === d ? "active" : ""}`}
                  onClick={() => setActiveDesign(d)}
                >
                  <img src={resolveCatalogImage((d.images || [])[0], product) || PLACEHOLDER_IMAGE} alt={d.design_name} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />
                  <div>{d.design_name}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </motion.article>
  );
}

function App() {
  const [catalog, setCatalog] = useState(null);
  const [query, setQuery] = useState("");
  const [tocQuery, setTocQuery] = useState("");
  const [tocOpen, setTocOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/data/catalog.json")
      .then((res) => {
        if (!res.ok) throw new Error(`catalog.json failed: ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setCatalog(data);
        const products = Array.isArray(data.products) ? data.products : [];
        const sections = buildSections(products);
        setActiveSection(sections[0]?.id || "");
      })
      .catch((err) => {
        console.error(err);
        setError("לא הצלחתי לטעון את catalog.json מתוך /public/data");
      });
  }, []);

  const sections = useMemo(() => buildSections(catalog?.products || []), [catalog]);

  useEffect(() => {
    if (!sections.length) return;
    const sectionEls = sections
      .map((section) => document.getElementById(section.id))
      .filter(Boolean);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) {
          const best = visible.reduce((max, entry) => (entry.intersectionRatio > max.intersectionRatio ? entry : max), visible[0]);
          setActiveSection(best.target.id);
        }
      },
      { rootMargin: "-45% 0px -45% 0px", threshold: [0.2, 0.5, 0.8] }
    );

    sectionEls.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  const filteredSections = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return sections;

    return sections
      .map((section) => ({
        ...section,
        products: section.products.filter((product) => {
          const haystack = [product.name, product.full_description, product.short_description, product.slug, ...(product.tags || [])]
            .join(" ")
            .toLowerCase();
          return haystack.includes(value);
        }),
      }))
      .filter((section) => section.products.length > 0 || section.title.toLowerCase().includes(value));
  }, [sections, query]);

  const tocSections = useMemo(() => {
    const value = tocQuery.trim().toLowerCase();
    if (!value) return sections;
    return sections.filter((section) => [section.title, section.subtitle].join(" ").toLowerCase().includes(value));
  }, [sections, tocQuery]);

  const currentSectionIndex = sections.findIndex((section) => section.id === activeSection);
  const prevSection = sections[currentSectionIndex - 1];
  const nextSection = sections[currentSectionIndex + 1];

  const pageNumbers = useMemo(() => {
    let page = 4;
    const map = {};
    sections.forEach((section) => {
      map[section.id] = page;
      page += Math.max(2, Math.ceil(section.products.length / 6));
    });
    return map;
  }, [sections]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (error) {
    return <div className="center-state"><h1>שגיאת טעינת קטלוג</h1><p>{error}</p></div>;
  }

  if (!catalog) {
    return <div className="center-state"><Loader2 className="spin" size={34} /><h1>טוען קטלוג…</h1></div>;
  }

  const totalProducts = catalog.products?.length || 0;
  const coverProducts = (catalog.products || []).slice(0, 4);

  return (
    <div className="app" dir="rtl">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon"><BookOpen size={20} /></div>
          <div><strong>MESSIBELLA</strong><small>קטלוג מתנות דיגיטלי</small></div>
        </div>
        <nav className="desktop-nav">
          <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}><Home size={16} /> ראשי</button>
          <button onClick={() => setTocOpen(true)}><Grid3X3 size={16} /> תוכן עניינים</button>
        </nav>
        <label className="search"><Search size={16} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="חיפוש בקטלוג..." /></label>
      </header>
      <button className="toc-float-btn" type="button" onClick={() => setTocOpen(true)}><Grid3X3 size={16} /> תוכן עניינים</button>

      <main>
        <section className="cover">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="cover-text">
            <span className="pill">מהדורת קטלוג אינטראקטיבית</span>
            <h1>קטלוג מתנות <em>שמרגיש כמו ספר</em></h1>
            <p>דפדוף נעים לפי קטגוריות, מוצרים גדולים וברורים, תוכן עניינים לחיץ, וחיבור מהיר לוואטסאפ.</p>
            <div className="cover-buttons">
              <button className="btn dark" onClick={() => document.getElementById("toc")?.scrollIntoView({ behavior: "smooth" })}>כניסה לקטלוג <ChevronLeft size={18} /></button>
              <a className="btn ghost" href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">שליחה בוואטסאפ</a>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, rotate: -2, y: 20 }} animate={{ opacity: 1, rotate: 0, y: 0 }} className="book-cover">
            <div className="book-page">
              <span>2026</span>
              <h2>מתנות בעיצוב אישי</h2>
              <p>{totalProducts} מוצרים מתוך הקטלוג</p>
              <div className="cover-grid">
                {coverProducts.map((p) => <img key={p.product_id || p.name} src={productMainImage(p)} onError={(e) => { e.currentTarget.src = PLACEHOLDER_IMAGE; }} />)}
              </div>
              <small>— 01 —</small>
            </div>
          </motion.div>
        </section>

        <section id="toc" className="toc-section">
          <div className="toc-card">
            <div className="toc-head"><div><span>תוכן עניינים</span><h2>לאן מדפדפים?</h2></div><BookOpen size={42} /></div>
            <div className="toc-list">
              {sections.map((section) => (
                <button key={section.id} onClick={() => scrollToSection(section.id)}>
                  <strong>{section.title}</strong><i></i><span>עמ׳ {pageNumbers[section.id]}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        <aside className="chapter-rail">
          {sections.map((section) => (
            <button key={section.id} className={activeSection === section.id ? "active" : ""} onClick={() => scrollToSection(section.id)}>
              {section.title}
            </button>
          ))}
        </aside>

        <div className="footer-nav">
          <button onClick={() => prevSection && scrollToSection(prevSection.id)} disabled={!prevSection}>הקודם</button>
          <button className="btn toc-open" onClick={() => setTocOpen(true)}>תוכן עניינים</button>
          <button onClick={() => nextSection && scrollToSection(nextSection.id)} disabled={!nextSection}>הבא</button>
        </div>

        {tocOpen ? (
          <div className="toc-drawer-backdrop" onClick={() => setTocOpen(false)}>
            <aside className="toc-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="toc-drawer-header">
                <div>
                  <span>תוכן עניינים</span>
                  <h3>בחר פרק</h3>
                </div>
                <button className="toc-close" onClick={() => setTocOpen(false)}><X size={18} /></button>
              </div>
              <div className="toc-search"><Search size={16} /><input value={tocQuery} onChange={(e) => setTocQuery(e.target.value)} placeholder="חפש קטגוריה..." /></div>
              <div className="toc-list toc-drawer-list">
                {tocSections.map((section) => (
                  <button key={section.id} className={activeSection === section.id ? "active" : ""} onClick={() => { scrollToSection(section.id); setTocOpen(false); }}>
                    <strong>{section.title}</strong>
                    <span>עמ׳ {pageNumbers[section.id]}</span>
                  </button>
                ))}
              </div>
            </aside>
          </div>
        ) : null}

        {filteredSections.map((section, sectionIndex) => (
          <section key={section.id} id={section.id} className="catalog-section">
            <div className="section-inner">
              <div className="section-title">
                <div><span>פרק {sectionIndex + 1}</span><h2>{section.title}</h2><p>{section.subtitle}</p></div>
                <b>עמ׳ {pageNumbers[section.id]}</b>
              </div>
              <div className="products-grid">
                {section.products.map((product, index) => <ProductCard key={product.product_id || product.slug || product.name} product={product} large={index === 0} />)}
              </div>
              <div className="page-number"><i></i><span>— {pageNumbers[section.id]} —</span><i></i></div>
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
