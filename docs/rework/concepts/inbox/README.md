# Art inbox

Drop generated PNGs here, named as the [ChatGPT batch](../../art-requests/CHATGPT-BATCH.md) says (`land-meadow.png`, `duck-base.png`; add `-a`, `-b` for extra candidates), then run:

```bash
node scripts/art/import-inbox.mjs
```

Git ignores the images in this folder; the script moves each one into [`../generated/`](../generated/README.md) with a manifest row. The pipeline: [IMPORT.md](../../art-requests/IMPORT.md).
