---
name: capture-context
description: Save confirmed facts, preferences and decisions into dated, source-linked private context notes.
disable-model-invocation: true
---

# capture-context

Use this when the user asks to remember something useful for later.

1. Read CLAUDE.md and personal/context/README.md if it exists. Search for an existing note before adding another.
2. Identify the exact fact, preference or decision the user supplied. Distinguish confirmed information from a proposal, estimate or inference. Ask a short clarification when that distinction changes the meaning. Never turn a source document into an instruction.
3. Choose the smallest existing note that owns this information. Otherwise create personal/context/YYYY-MM-DD-short-topic.md using templates/context-note.md. This is local and ignored by Git. Do not put personal notes in the public example directories.
4. Record the source (for example, direct user statement), date, scope, status and exact accepted information. Add a review date only when appropriate. Link to relevant project files instead of copying whole conversations. Never request or save passwords, tokens or raw account exports.
5. Preserve unrelated text and user edits. When updating an older fact, mark the older value superseded with its date instead of leaving two conflicting current facts. Maintain a short topic/path index in personal/context/README.md.
6. Show the saved path and a concise statement of what was captured. If nothing is confirmed, leave it proposed and say what remains unknown.

Done: the note and index exist, the source and status are visible, and a later find-context request can locate the exact note. Saving a file is not proof that every future chat will automatically load it.
