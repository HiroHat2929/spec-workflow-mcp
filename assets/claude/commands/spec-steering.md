---
description: steering ドキュメント（product/tech/structure）を作成・更新する
argument-hint: [product|tech|structure|all]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

`spec-workflow` スキルの「Steering ドキュメント」節に従って steering を作成・更新する。

対象: $ARGUMENTS（未指定なら product → tech → structure の順に all）

進め方:
1. `.spec-workflow/config.toml` の `approvalMode` を確認する。
2. テンプレートは user-templates 優先 → `.spec-workflow/templates/{product,tech,structure}-template.md`。
3. 既存コードベースを分析して内容を埋め、`.spec-workflow/steering/{name}.md` に作成する。
4. 各ドキュメントごとに「承認ゲート・プロトコル」を実行し、承認されてから次へ進む。
