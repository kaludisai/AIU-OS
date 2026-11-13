# AI University Second Brain

A local Markdown library with an interactive 3D knowledge graph. Every node is a note. Connections come from `[[wikilinks]]` and relative Markdown links in the notes you load.

## Open it

Download AIU-OS, then double-click `apps/second-brain/index.html`. Use a current desktop Chrome, Edge, Firefox or Safari. There is no server, account, package install or API key. The included 67-note library is fictional and visibly labeled.

- **Import notes:** choose a Markdown folder or individual files. Import replaces the current view; it never mixes your notes with the demo. A JSON library backup can also be imported.
- **Explore:** drag the graph to orbit, scroll to zoom, click a node to read it. The note list offers the same navigation with the keyboard. Search finds words in titles, paths and note bodies; folder filters narrow the list and highlight matching nodes.
- **Follow connections:** click a link inside a note, an outgoing link or a backlink to open the connected note. Ambiguous duplicate titles are not guessed: use a full relative path.
- **Write:** create a note or edit its Markdown and path. `[[Another note]]` connects it to an existing note with that title. Changes update the view without touching your original files.
- **Keep it:** Export library downloads a portable JSON backup; a note can be downloaded as Markdown. Save in browser keeps an explicit snapshot for the next visit. Exported files can contain personal information; keep them private.

## Local means local

The app makes no network requests, uploads nothing, scans no folders on its own and uses no external fonts, scripts or analytics. You deliberately select the files it reads. Imported HTML is displayed as text; imported URLs cannot run code. This viewer has no AI chat, embedding search or background synchronization.

Edits stay in memory until you export or save a browser snapshot. Browser storage can be unavailable, limited, cleared or readable by other users of the same browser profile. A browser snapshot is not a cross-device backup. Clear library removes the saved snapshot and clears the current view; it never deletes original files.

Use a focused set of up to **500 notes**, **256 KB per note**, **8 MB total**. Unsupported files, hidden folders, dependency folders, and folders named `private`, `personal` or `12_Private` are skipped. Review your selection yourself; folder names are not a complete privacy check. No attachments are imported. This is a Markdown viewer and editor; its minimal renderer does not implement every Markdown or Obsidian feature.

## Files

- `index.html` / `style.css`: standalone app shell and AIU design.
- `knowledge.js`: validation, literal search, link resolution and backup format.
- `graph.js`: seeded force layout and perspective canvas renderer.
- `app.js`: import, search, navigation, editing, export and local snapshots.
- `demo.js`: the fictional Markdown example library; all demo links are derived from it.
- `fonts/`: bundled fonts with their OFL license files.

The app uses readable JavaScript, CSS and HTML. No build step or npm dependency is required. Run its data-model checks from the repository root with `node tests/test_second_brain.cjs`.
