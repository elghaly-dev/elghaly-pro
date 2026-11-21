# elghaly.pro

Static page for Wyndham Heaven, builder at Elghaly LLC. Same look as
elghaly.dev (fonts and colours copied from it). No scripts, no tracking, no
phone number.

- `index.html`: name, role, links (elghaly.dev, GitHub, X), the contact email,
  and the company address in the contact block, the footer and the JSON-LD.
- `css/site.css`, `fonts/` (Outfit, Cinzel, Cormorant Garamond, SIL OFL; the
  licence files sit beside the fonts), icons from elghaly.dev.
- `tools/check-site.mjs`: run `node tools/check-site.mjs`; CI runs it on every
  push and pull request.

## Going live (owner only)

The domain is registered at WordPress.com and today points to a Gravatar
profile. Nothing in this repository changes DNS. To switch: enable GitHub
Pages for this repository (branch `main`, folder `/`), set the custom domain
`elghaly.pro` in the Pages settings (GitHub then adds a `CNAME` file, and the
check must be updated to expect it), and point the domain's DNS at GitHub
Pages from WordPress.com.
