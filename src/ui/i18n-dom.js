'use strict';
/**
 * Renderer-layer i18n: translates at the DOM boundary using English source strings as keys.
 *
 * Only display output is modified; logic checks, paths, package names, and
 * user data are unaffected. Skip regions (user data / logs / code) are marked
 * with `data-i18n-skip`.
 */
(function initI18nDom() {
  const api = (window.apkstart && window.apkstart.i18n)
    || (window.apkstartSplash && window.apkstartSplash.i18n);
  if (!api || typeof api.lookup !== 'function') return;

  const TEXT_ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'SVG']);

  const textOrigin = new WeakMap();
  const textApplied = new WeakMap();
  const attrOrigin = new WeakMap();
  const attrApplied = new WeakMap();
  const reported = new Set();

  const ALLOWED_CJK = new Set([
    '日本語',
    '繁體中文',
    'Douyin · 日常MIKU',
    'Douyin · @日常MIKU (contact the author)',
  ]);

  function reportMissing(text) {
    if (!api.collect) return;
    const langNow = api.getLanguage ? api.getLanguage() : 'en';
    if (langNow === 'en') {
      if (!/[\u4e00-\u9fff]/.test(text) || ALLOWED_CJK.has(text)) return;
    } else if (!/[A-Za-z]/.test(text)) {
      return;
    }
    if (reported.has(text)) return;
    reported.add(text);
    console.warn('[i18n-missing]', text);
  }

  function skipped(el) {
    for (let n = el; n && n.nodeType === 1; n = n.parentElement) {
      if (SKIP_TAGS.has(n.tagName)) return true;
      if (n.hasAttribute && n.hasAttribute('data-i18n-skip')) return true;
    }
    return false;
  }

  function splitEdge(s) {
    const lead = (s.match(/^\s*/) || [''])[0];
    const trail = (s.match(/\s*$/) || [''])[0];
    return { lead, core: s.slice(lead.length, s.length - trail.length), trail };
  }

  function translateText(node) {
    if (!node || node.nodeType !== 3) return;
    const parent = node.parentNode;
    if (!parent || parent.nodeType !== 1 || skipped(parent)) return;

    const value = node.nodeValue;
    if (value == null) return;

    let src = textOrigin.get(node);
    if (src === undefined) {
      src = value;
      textOrigin.set(node, src);
    } else if (textApplied.has(node) && value !== textApplied.get(node) && value !== src) {
      // Runtime updated this node with new source text: treat it as the new origin
      src = value;
      textOrigin.set(node, src);
    }

    const { lead, core, trail } = splitEdge(src);
    if (!core) return;
    const out = api.lookup(core);
    if (out === undefined) {
      reportMissing(core);
      if (value !== src) node.nodeValue = src;
      textApplied.delete(node);
      return;
    }
    const next = lead + out + trail;
    if (value !== next) node.nodeValue = next;
    textApplied.set(node, next);
  }

  function translateAttr(el, name) {
    if (!el || el.nodeType !== 1 || !el.hasAttribute(name)) return;
    if (skipped(el)) return;
    const value = el.getAttribute(name);
    if (!value || !value.trim()) return;

    let originMap = attrOrigin.get(el);
    if (!originMap) { originMap = new Map(); attrOrigin.set(el, originMap); }
    let appliedMap = attrApplied.get(el);
    if (!appliedMap) { appliedMap = new Map(); attrApplied.set(el, appliedMap); }

    let src = originMap.get(name);
    if (src === undefined) {
      src = value;
      originMap.set(name, src);
    } else if (appliedMap.has(name) && value !== appliedMap.get(name) && value !== src) {
      src = value;
      originMap.set(name, src);
    }

    const { lead, core, trail } = splitEdge(src);
    if (!core) return;
    const out = api.lookup(core);
    if (out === undefined) {
      if (name === 'title' || name === 'aria-label') reportMissing(core);
      if (value !== src) el.setAttribute(name, src);
      appliedMap.delete(name);
      return;
    }
    const next = lead + out + trail;
    if (value !== next) el.setAttribute(name, next);
    appliedMap.set(name, next);
  }

  function translateElement(el) {
    for (const name of TEXT_ATTRS) translateAttr(el, name);
  }

  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) { translateText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) {
      translateElement(root);
      if (skipped(root)) return;
    }
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (node.nodeType === 3) {
          const p = node.parentNode;
          return p && p.nodeType === 1 && !skipped(p) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
        if (SKIP_TAGS.has(node.tagName) || (node.hasAttribute && node.hasAttribute('data-i18n-skip'))) {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    });
    let node = walker.currentNode;
    while (node) {
      if (node.nodeType === 1) translateElement(node);
      else translateText(node);
      node = walker.nextNode();
    }
  }

  function retranslateAll() {
    walk(document.body);
  }

  const HTML_LANG = { zh: 'zh-CN', en: 'en', ru: 'ru', vi: 'vi', es: 'es', pt: 'pt-BR', ja: 'ja', ko: 'ko' };
  function setHtmlLang() {
    const lang = api.getLanguage ? api.getLanguage() : 'en';
    document.documentElement.lang = HTML_LANG[lang] || 'en';
  }

  function start() {
    setHtmlLang();
    retranslateAll();

    // Translate dynamically inserted toasts, list items, and dialogs.
    // translateText/Attr are idempotent, so writing translated values won't loop.
    const observer = new MutationObserver((records) => {
      for (const rec of records) {
        if (rec.type === 'childList') {
          for (const n of rec.addedNodes) walk(n);
        } else if (rec.type === 'characterData') {
          translateText(rec.target);
        } else if (rec.type === 'attributes') {
          if (TEXT_ATTRS.includes(rec.attributeName)) translateAttr(rec.target, rec.attributeName);
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: TEXT_ATTRS,
    });

    if (typeof api.onLanguageChange === 'function') {
      api.onLanguageChange(() => {
        setHtmlLang();
        retranslateAll();
      });
    }
  }

  window.ApkStartI18N = {
    t: (s, vars) => api.t(s, vars),
    apply: walk,
    retranslateAll,
    getLanguage: () => (api.getLanguage ? api.getLanguage() : 'en'),
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
