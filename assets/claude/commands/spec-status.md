---
description: spec の進捗（tasks.md のチェックボックス集計）を表示する
argument-hint: [spec-name]
allowed-tools: Read, Glob, Grep
---

spec の進捗を表示する。

対象: $ARGUMENTS（未指定なら全 spec）

進め方:
1. 対象 spec が指定されていれば `.spec-workflow/specs/<spec-name>/`、未指定なら `.spec-workflow/specs/` 配下の全 spec を対象にする。
2. 各 spec で `requirements.md` / `design.md` / `tasks.md` の有無からフェーズを判定する。
3. `tasks.md` のチェックボックスを集計する:
   - `- [ ]` 未着手 / `- [-]` 進行中 / `- [x]` 完了 / `- [~]` ブロック
   - 完了数 / 総数、進捗率、進行中・ブロック中のタスクを一覧する。
4. 結果を簡潔な表で日本語提示する。次に着手すべきタスクがあれば併せて示す。
