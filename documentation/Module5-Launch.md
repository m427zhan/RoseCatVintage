# Module 5 — Test & Launch

**Goal:** Check everything works, then put the site live on Cloudflare.

---

## 5.1 Quick Test

- [ ] Every marketplace and social link opens the right page
- [ ] Email link opens a new message
- [ ] Looks right on a phone, a tablet and a desktop
- [ ] Works in Chrome, Safari and Edge
- [ ] All images load
- [ ] Spelling checked
- [ ] Lighthouse check in Chrome DevTools (aim for 90+)

---

## 5.2 Deploy to Cloudflare Pages

Pick **one** option:

**Option A: Drag & drop (simplest)**
1. Log in to the Cloudflare dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**
2. Name the project (e.g. `rosecatvintage`)
3. Drag in the contents of the `code/` folder
4. The site goes live at `rosecatvintage.pages.dev`
5. To update the site later, upload a new version the same way

**Option B: Connect GitHub (updates automatically)**
1. Push the `code/` folder to a GitHub repository
2. In Cloudflare go to **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
3. Select the repo. Leave the build command empty and set the output directory to `/` (or `code` if the repo root is the whole project)
4. Every push to `main` now updates the site

---

## 5.3 Custom Domain

1. In the Pages project → **Custom domains** → **Set up a custom domain**
2. Enter `rosecatvintage.com` (and `www.rosecatvintage.com`)
3. If the domain is on Cloudflare, DNS and HTTPS are set up automatically

---

## 5.4 After Launch

- [ ] Turn on **Cloudflare Web Analytics** (free, no cookie banner needed)
- [ ] Add the website link to your eBay, Etsy and social bios
- [ ] Announce it on social media

### Ongoing upkeep
| Task | How often |
|------|-----------|
| Refresh gallery photos | Every month or two |
| Check all links still work | Every few months |
| Renew domain | Yearly (turn on auto-renew) |

---

## ✅ Module 5 Checklist
- [ ] Testing done
- [ ] Site live on Cloudflare Pages
- [ ] Custom domain connected
- [ ] Analytics on
- [ ] Link shared everywhere

**Previous:** [Module 4 — Content](Module4-Content.md) · **Back to start:** [Module 1 — Planning](Module1-Planning.md)
