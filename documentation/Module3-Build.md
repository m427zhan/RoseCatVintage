# Module 3 — Build

**Goal:** Build the site with plain HTML and CSS. It needs no framework, no build step and no database.

---

## 3.1 Tools

- [ ] VS Code (with the **Live Server** extension for previewing)
- [ ] Git + GitHub account (optional, but makes Cloudflare deploys automatic)

---

## 3.2 Folder Structure (`code/`)

```
code/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js        (optional: mobile menu, small effects)
└── images/
    ├── logo.png
    ├── hero.jpg
    └── gallery/
```

---

## 3.3 Build Steps

1. **Base styles:** set up the colors and fonts from Module 2 as CSS variables
2. **Header:** logo and simple navigation (anchor links to each section)
3. **Hero:** tagline and "Shop on eBay" / "Shop on Etsy" buttons
4. **About section**
5. **Shop section:** a card per marketplace that opens in a new tab
6. **Gallery section** (optional)
7. **Footer:** email link (`mailto:`), social icons, © year

Marketplace link example:

```html
<a href="https://www.etsy.com/shop/YOURSHOP" target="_blank" rel="noopener">
  Shop on Etsy
</a>
```

---

## 3.4 Must-haves

- [ ] Works on phones (mobile-first CSS)
- [ ] Every image has `alt` text
- [ ] Images compressed (WebP, under ~300 KB each)
- [ ] Page `<title>` and meta description set
- [ ] Favicon

---

## ✅ Module 3 Checklist
- [ ] All sections built
- [ ] All links point to the right shops
- [ ] Looks good on phone and desktop

**Previous:** [Module 2 — Design](Module2-Design.md) · **Next:** [Module 4 — Content](Module4-Content.md)
