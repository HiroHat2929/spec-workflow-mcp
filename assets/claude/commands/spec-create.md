---
description: 新しい spec を作成し Requirements→Design→Tasks を承認ゲート付きで進める
argument-hint: <spec-name(kebab-case)> [機能の概要]
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

`spec-workflow` スキルに従って、新しい spec を作成する。

対象 spec / 概要: $ARGUMENTS

進め方:
1. まず `.spec-workflow/config.toml` の `approvalMode` を確認する（無ければ inline）。
2. spec 名は kebab-case。指定が概要のみなら適切な kebab-case 名を提案して合意を取る。**一度に 1 spec のみ**。
3. `spec-workflow` スキルの **Phase 1 → 2 → 3** を順に実施する。各フェーズの最後に必ず
   「承認ゲート・プロトコル」を実行し、承認されるまで次フェーズに進まない。
4. Phase 1 の必須ディスカバリ（Q1〜Q8）は**省略せず 1 問ずつ**。requirements には「運用フロー」章、
   design には「UX/UI レビュー観点」章を必ず含める。
5. Tasks 承認後に「実装に進みますか？」と確認する（実装は `/spec-execute`）。
