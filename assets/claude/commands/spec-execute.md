---
description: 指定した spec のタスクを実装する（実装ログ記録まで）
argument-hint: <spec-name> <task-id>
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

`spec-workflow` スキルの **Phase 4: Implementation** に従って、指定タスクを実装する。

対象: $ARGUMENTS（`<spec-name> <task-id>` の順。task-id 例: 1, 1.2, 3.1.4）

進め方:
1. `.spec-workflow/specs/<spec-name>/tasks.md` を読み、対象タスクと `_Prompt` / `_Leverage` / `_Requirements` を把握する。
2. tasks.md: 対象タスクを `[ ]`→`[-]`（進行中）に更新する。
3. **実装前に既存実装ログを検索**する: `grep -r ... .spec-workflow/specs/<spec-name>/"Implementation Logs"/`。再利用できるコードを優先する。
4. `_Prompt` の方針に沿って実装し、テストする。
5. **完了印の前に実装ログを記録**する（`/spec-log <spec-name> <task-id>` または `spec-workflow log --input <json>`）。artifacts は必須。
6. ログ成功後、tasks.md: `[-]`→`[x]`（完了）に更新する。
7. ブロックされたら `[~]` にし、`- _Blocked: 理由_` を子要素で添える。
