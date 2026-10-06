# Mudae Toolkit

Small tools for the [Mudae](https://mudae.net) Discord bot.

## Tools

### Embed Color Generator

Picks embed colors for your harem based on each character's image. Based on the colors tool from
[mudae-tools](https://mudae-tools.gustavbylund.se/colors/).

1. Send `$mmysi-c-` in your Mudae channel, Mudae will DM you a list of your characters
2. Paste the list into the page
3. Pick a color option from the sidebar
4. Copy the `$ec` commands one by one, or download the AutoHotkey script to send them all

The AutoHotkey script needs AutoHotkey v2. It sends one command every 2 seconds and stops if you
move the mouse or press a key.

## Development

You need Node 20+.

```
npm install
npm start
```

That opens the site at http://localhost:8765. It has to be served over http since ES modules
don't work from `file://`.

Other scripts:

- `npm test` runs the tests
- `npm run lint` runs ESLint
- `npm run format` formats everything with Prettier
- `npm run check` runs all of the above (same as CI)

### Layout

The site is in `src/` and has no build step.

- `src/index.html` is the toolkit home page, each tool gets its own folder (`src/embed-color/`)
- `src/js/lib/` and `src/js/utils/` are shared between tools, `src/js/<tool>/` is tool specific
- `src/css/base.css` is shared, each tool also has its own stylesheet in `src/css/`
- `tests/` mirrors `src/js/`

To add a tool, create `src/<tool>/index.html`, put its code in `src/js/<tool>/` and link it from
the home page.

To add a color option to the embed color generator, add it to `CHOICE_GROUPS` in
`src/js/embed-color/choices.js`.

### Why no proxy?

The original colors tool sends images through a CORS proxy. That turned out to be unnecessary:
mudae.net allows cross-origin requests, it just blocks requests that come with a referrer from
another site. The page sets `<meta name="referrer" content="no-referrer">` so the images load
and can be drawn to a canvas.

## Deploying

Pushes to `main` run the checks and then deploy `src/` to GitHub Pages. To enable it, go to
Settings > Pages in the repo and set the source to GitHub Actions.
