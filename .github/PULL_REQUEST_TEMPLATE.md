## Summary

Brief description of what this PR changes and why.

## Type of Change

- [ ] 🐛 Bug fix
- [ ] ✨ New detection (CMS / Framework / Analytics / CDN / Cloud)
- [ ] 🎨 UI improvement
- [ ] 📝 Documentation update
- [ ] ♻️ Refactor / code cleanup
- [ ] 🔧 Configuration change

## What was changed?

<!-- List the files changed and what was done in each -->
- `services/xxx-detector.js` — added YYY detection
- `popup/popup.js` — wired new detector into analyzeAll()
- `README.md` — documented new detection

## Testing

**Sites where the new/fixed detection works:**
1. https://example.com — correctly shows [Technology]
2. https://example2.com — correctly shows [Technology]

**Sites where existing detections are unaffected:**
- [ ] Tested on a known WordPress site
- [ ] Tested on a known React site
- [ ] Tested on a known Shopify site

## Screenshots (if UI changed)

<!-- Add before/after screenshots if the popup appearance changed -->

## Checklist

- [ ] My code follows the project's coding guidelines (vanilla ES6, plain objects, no deps)
- [ ] I tested on at least 2–3 real websites
- [ ] Existing detections still work correctly
- [ ] Confidence scores are justified with comments
- [ ] I've updated the README if I added a new technology to the detection list
- [ ] I've added an entry to CHANGELOG.md under [Unreleased]
