import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUp,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Grid3X3,
  Heart,
  Loader2,
  MessageCircle,
  Search,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import {
  PLACEHOLDER_IMAGE,
  cleanText,
  createWhatsAppUrl,
  normalizeCatalog,
  searchCatalog,
} from '@/services/catalogBookService';
import '@/styles/catalog-book.css';

function CatalogImage({ src, alt, className = '', eager = false }) {
  return (
    <img
      src={src || PLACEHOLDER_IMAGE}
      alt={alt || ''}
      className={className}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={(event) => {
        event.currentTarget.src = PLACEHOLDER_IMAGE;
      }}
    />
  );
}

function ProductTile({ product, index, onOpen, isFavorite, onToggleFavorite }) {
  const featured = index % 9 === 0;
  const tall = index % 7 === 3;

  return (
    <motion.article
      className={`catalog-product ${featured ? 'is-featured' : ''} ${tall ? 'is-tall' : ''}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      onClick={() => onOpen(product)}
    >
      <button
        type="button"
        className={`catalog-icon-button catalog-favorite ${isFavorite ? 'active' : ''}`}
        aria-label={isFavorite ? 'Remove favorite' : 'Add favorite'}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(product.id);
        }}
      >
        <Heart size={17} fill={isFavorite ? 'currentColor' : 'none'} />
      </button>
      <div className="catalog-product-media">
        <CatalogImage src={product.mainImage} alt={product.title} />
      </div>
      <div className="catalog-product-body">
        <div className="catalog-product-kicker">
          <span>{product.priceLabel}</span>
          {product.images.length > 1 ? <small>{product.images.length} images</small> : null}
        </div>
        <h3>{product.title}</h3>
        <p>{product.description || 'A personalized Messibella gift ready for custom details.'}</p>
        <div className="catalog-tags">
          {product.tags.slice(0, featured ? 4 : 3).map((tag) => <span key={tag}>{tag}</span>)}
        </div>
        <div className="catalog-product-actions">
          <a
            href={createWhatsAppUrl(product)}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => event.stopPropagation()}
          >
            <MessageCircle size={16} />
            Send on WhatsApp
          </a>
        </div>
      </div>
    </motion.article>
  );
}

function ProductModal({ product, onClose, onToggleFavorite, isFavorite }) {
  const [activeImage, setActiveImage] = useState(0);
  const images = product?.images?.length ? product.images : [product?.mainImage || PLACEHOLDER_IMAGE];
  const designs = Array.isArray(product?.designs) ? product.designs.filter((design) => design?.label || design?.name || design?.design_label) : [];

  useEffect(() => {
    if (!product) return undefined;
    setActiveImage(0);
    document.body.classList.add('catalog-modal-open');
    return () => document.body.classList.remove('catalog-modal-open');
  }, [product]);

  useEffect(() => {
    if (!product) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowLeft') setActiveImage((value) => Math.min(images.length - 1, value + 1));
      if (event.key === 'ArrowRight') setActiveImage((value) => Math.max(0, value - 1));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [images.length, onClose, product]);

  if (!product) return null;

  const shareProduct = async () => {
    const url = `${window.location.origin}${window.location.pathname}?product=${product.slug}`;
    if (navigator.share) {
      await navigator.share({ title: product.title, url });
      return;
    }
    await navigator.clipboard?.writeText(url);
  };

  return (
    <AnimatePresence>
      <motion.div
        className="catalog-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={onClose}
      >
        <motion.article
          className="catalog-modal"
          dir="rtl"
          initial={{ opacity: 0, y: 36, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button type="button" className="catalog-modal-close" aria-label="Close product" onClick={onClose}>
            <X size={22} />
          </button>

          <div className="catalog-modal-gallery">
            <motion.div
              className="catalog-modal-image"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              onDragEnd={(_, info) => {
                if (info.offset.x < -60) setActiveImage((value) => Math.min(images.length - 1, value + 1));
                if (info.offset.x > 60) setActiveImage((value) => Math.max(0, value - 1));
              }}
            >
              <CatalogImage src={images[activeImage]} alt={product.title} eager />
              {images.length > 1 && (
                <>
                  <button type="button" className="catalog-gallery-arrow prev" onClick={() => setActiveImage((value) => Math.max(0, value - 1))}>
                    <ChevronRight size={20} />
                  </button>
                  <button type="button" className="catalog-gallery-arrow next" onClick={() => setActiveImage((value) => Math.min(images.length - 1, value + 1))}>
                    <ChevronLeft size={20} />
                  </button>
                </>
              )}
            </motion.div>
            {images.length > 1 && (
              <div className="catalog-thumbs">
                {images.slice(0, 10).map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={index === activeImage ? 'active' : ''}
                    onClick={() => setActiveImage(index)}
                  >
                    <CatalogImage src={image} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="catalog-modal-copy">
            <div className="catalog-modal-topline">
              <span>{product.categoryName}</span>
              <strong>{product.priceLabel}</strong>
            </div>
            <h2>{product.title}</h2>
            <p>{product.longDescription || product.description || 'Contact Messibella for customization details and ordering options.'}</p>

            <div className="catalog-modal-tags">
              {product.tags.slice(0, 8).map((tag) => <span key={tag}>{tag}</span>)}
            </div>

            {designs.length > 0 && (
              <div className="catalog-designs">
                <h3>Designs and variants</h3>
                <div>
                  {designs.slice(0, 16).map((design, index) => (
                    <span key={`${design.label || design.name || design.design_label}-${index}`}>
                      {cleanText(design.label || design.name || design.design_label, 32)}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="catalog-modal-actions">
              <a href={createWhatsAppUrl(product)} target="_blank" rel="noreferrer">
                <MessageCircle size={18} />
                Send on WhatsApp
              </a>
              <button type="button" onClick={() => onToggleFavorite(product.id)} className={isFavorite ? 'active' : ''}>
                <Heart size={18} fill={isFavorite ? 'currentColor' : 'none'} />
                Save
              </button>
              <button type="button" onClick={shareProduct}>
                <Share2 size={18} />
                Share
              </button>
            </div>
          </div>
        </motion.article>
      </motion.div>
    </AnimatePresence>
  );
}

export default function Catalog() {
  const [catalog, setCatalog] = useState(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [activeChapter, setActiveChapter] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [favorites, setFavorites] = useState(() => new Set(JSON.parse(localStorage.getItem('messibella:favorites') || '[]')));
  const [recentIds, setRecentIds] = useState(() => JSON.parse(localStorage.getItem('messibella:recent') || '[]'));
  const observerRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    fetch('/data/catalog.json')
      .then((response) => {
        if (!response.ok) throw new Error(`catalog.json returned ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (cancelled) return;
        const normalized = normalizeCatalog(data);
        setCatalog(normalized);
        setActiveChapter(normalized.chapters[0]?.id || '');
      })
      .catch((fetchError) => {
        console.error(fetchError);
        if (!cancelled) setError('The local catalog data could not be loaded.');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const chapters = catalog?.chapters || [];
  const visibleChapters = useMemo(() => searchCatalog(chapters, query), [chapters, query]);
  const allProducts = catalog?.products || [];
  const favoriteProducts = useMemo(() => allProducts.filter((product) => favorites.has(product.id)).slice(0, 8), [allProducts, favorites]);
  const recentProducts = useMemo(() => recentIds.map((id) => allProducts.find((product) => product.id === id)).filter(Boolean).slice(0, 8), [allProducts, recentIds]);
  const inspirationProducts = useMemo(() => {
    const seen = new Set();
    return [...favoriteProducts, ...recentProducts].filter((product) => {
      if (seen.has(product.id)) return false;
      seen.add(product.id);
      return true;
    }).slice(0, 10);
  }, [favoriteProducts, recentProducts]);
  const coverProducts = catalog?.featured?.slice(0, 5) || [];

  useEffect(() => {
    if (!chapters.length) return undefined;

    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (active?.target?.id) setActiveChapter(active.target.id);
      },
      { rootMargin: '-35% 0px -45% 0px', threshold: [0.08, 0.2, 0.35] }
    );

    chapters.forEach((chapter) => {
      const element = document.getElementById(chapter.id);
      if (element) observerRef.current.observe(element);
    });

    return () => observerRef.current?.disconnect();
  }, [chapters]);

  useEffect(() => {
    if (!catalog) return;
    const productSlug = new URLSearchParams(window.location.search).get('product');
    if (!productSlug) return;
    const product = catalog.products.find((item) => item.slug === productSlug || item.id === productSlug);
    if (product) openProduct(product, false);
  }, [catalog]);

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleFavorite = (id) => {
    setFavorites((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      localStorage.setItem('messibella:favorites', JSON.stringify(Array.from(next)));
      return next;
    });
  };

  const openProduct = (product, updateUrl = true) => {
    setSelectedProduct(product);
    setRecentIds((current) => {
      const next = [product.id, ...current.filter((id) => id !== product.id)].slice(0, 12);
      localStorage.setItem('messibella:recent', JSON.stringify(next));
      return next;
    });

    if (updateUrl) {
      const nextUrl = `${window.location.pathname}?product=${product.slug}`;
      window.history.replaceState(null, '', nextUrl);
    }
  };

  const closeProduct = () => {
    setSelectedProduct(null);
    window.history.replaceState(null, '', window.location.pathname);
  };

  if (error) {
    return (
      <div className="catalog-state" dir="rtl">
        <BookOpen size={42} />
        <h1>Catalog unavailable</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!catalog) {
    return (
      <div className="catalog-state" dir="rtl">
        <Loader2 className="catalog-spin" size={38} />
        <h1>Loading the catalog</h1>
      </div>
    );
  }

  return (
    <div className="catalog-book" dir="rtl">
      <header className="catalog-book-bar">
        <button type="button" onClick={() => scrollTo('catalog-cover')} aria-label="Back to cover">
          <BookOpen size={18} />
        </button>
        <button type="button" onClick={() => scrollTo('catalog-contents')} aria-label="Open table of contents">
          <Grid3X3 size={18} />
        </button>
        <label>
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products, tags, categories..."
          />
        </label>
      </header>

      <section id="catalog-cover" className="catalog-cover">
        <div className="catalog-cover-bg" />
        <motion.div className="catalog-cover-copy" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}>
          <span><Sparkles size={16} /> Digital gift catalog</span>
          <h1>Messibella</h1>
          <p>
            A soft, visual catalog book for personal gifts, custom designs and seasonal inspiration.
          </p>
          <div>
            <button type="button" onClick={() => scrollTo('catalog-contents')}>
              Enter Catalog
              <ChevronLeft size={19} />
            </button>
            <a href={`https://wa.me/972559891243`} target="_blank" rel="noreferrer">
              <MessageCircle size={18} />
              WhatsApp
            </a>
          </div>
        </motion.div>

        <motion.div className="catalog-cover-book" initial={{ opacity: 0, rotate: -2, y: 26 }} animate={{ opacity: 1, rotate: 0, y: 0 }}>
          <div className="catalog-cover-page">
            <strong>2026</strong>
            <h2>Personalized gifts, arranged like a book</h2>
            <p>{catalog.products.length.toLocaleString('he-IL')} products across {chapters.length} chapters</p>
            <div>
              {coverProducts.map((product, index) => (
                <CatalogImage key={product.id} src={product.mainImage} alt={product.title} eager={index < 2} />
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      <section id="catalog-contents" className="catalog-contents">
        <div className="catalog-section-shell">
          <div className="catalog-section-heading">
            <span>Table of contents</span>
            <h2>Choose a chapter</h2>
            <p>Jump into a category, browse visually, and open any product for gallery and ordering details.</p>
          </div>
          <div className="catalog-toc-list">
            {chapters.map((chapter) => (
              <button type="button" key={chapter.id} onClick={() => scrollTo(chapter.id)}>
                <strong>{chapter.title}</strong>
                <i />
                <span>p. {chapter.page}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {inspirationProducts.length > 0 && (
        <section className="catalog-inspiration">
          <div className="catalog-section-shell">
            <div className="catalog-section-heading compact">
              <span>Inspiration pages</span>
              <h2>Your saved and recent ideas</h2>
            </div>
            <div className="catalog-mini-strip">
              {inspirationProducts.map((product) => (
                <button type="button" key={`${product.id}-mini`} onClick={() => openProduct(product)}>
                  <CatalogImage src={product.mainImage} alt={product.title} />
                  <span>{product.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      <aside className="catalog-floating">
        <button type="button" onClick={() => scrollTo('catalog-contents')} aria-label="Back to table of contents">
          <Grid3X3 size={18} />
        </button>
        <div>
          {chapters.slice(0, 18).map((chapter) => (
            <button
              type="button"
              key={chapter.id}
              className={activeChapter === chapter.id ? 'active' : ''}
              title={chapter.title}
              onClick={() => scrollTo(chapter.id)}
            />
          ))}
        </div>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top">
          <ArrowUp size={18} />
        </button>
      </aside>

      {visibleChapters.length === 0 ? (
        <div className="catalog-empty">
          <Search size={32} />
          <h2>No products found</h2>
          <p>Try another product name, description, tag or category.</p>
        </div>
      ) : (
        visibleChapters.map((chapter, chapterIndex) => (
          <section key={chapter.id} id={chapter.id} className={`catalog-chapter theme-${chapter.theme}`}>
            <div className="catalog-section-shell">
              <div className="catalog-chapter-title">
                <div>
                  <span>Chapter {chapterIndex + 1}</span>
                  <h2>{chapter.title}</h2>
                  <p>{chapter.subtitle}</p>
                </div>
                <b>p. {chapter.page}</b>
              </div>

              <div className="catalog-editorial-grid">
                {chapter.products.map((product, index) => (
                  <ProductTile
                    key={product.id}
                    product={product}
                    index={index}
                    onOpen={openProduct}
                    isFavorite={favorites.has(product.id)}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>

              <div className="catalog-page-number">
                <i />
                <span>{chapter.page}</span>
                <i />
              </div>
            </div>
          </section>
        ))
      )}

      <ProductModal
        product={selectedProduct}
        onClose={closeProduct}
        onToggleFavorite={toggleFavorite}
        isFavorite={selectedProduct ? favorites.has(selectedProduct.id) : false}
      />
    </div>
  );
}
