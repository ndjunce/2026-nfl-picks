# Player photos

Drop each player's photo in THIS folder, named exactly (all lowercase, `.jpg`):

```
players/nick.jpg
players/clyde.jpg
players/chet.jpg
players/henry.jpg
players/riley.jpg
players/bobby.jpg
```

Rules so it "just works":
- **Lowercase filename = the player's name** exactly as in the app (Nick → `nick.jpg`, etc.).
- **`.jpg`** extension (if yours are `.png`, either convert them or tell me and I'll switch the
  code to `.png`). Pick ONE extension for all.
- Square-ish photos look best (they're shown in a circle, ~34px). Any size works; keep them
  reasonably small (a few hundred KB each) so the page stays fast.

Then commit + push so GitHub Pages serves them:
```
git add players/
git commit -m "Add player photos"
git push
```

If a photo is missing or misnamed, that player just shows their initial in a circle (graceful
fallback) — the site still works. So you can add photos whenever; nothing breaks meanwhile.
