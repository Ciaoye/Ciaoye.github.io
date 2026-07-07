# wiki-public

`wiki-public/` is the semi-public clean knowledge layer generated from `LLM wiki/wiki/`.

Do not maintain this directory by hand. Update `LLM wiki/wiki/`, `LLM wiki/public/DESENSITIZATION.md`, or the sync script rules, then rerun `LLM wiki/public/scripts/sync_public_knowledge.cmd`.

The public sync excludes source-only folders such as `people/` and `templates/`; templates are not runtime knowledge.

Desensitization and sync rules: `LLM wiki/public/DESENSITIZATION.md`.
