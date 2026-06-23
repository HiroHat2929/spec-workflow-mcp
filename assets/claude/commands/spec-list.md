---
description: プロジェクト内の spec を一覧表示する
allowed-tools: Read, Glob, Grep
---

`.spec-workflow/specs/` 配下の spec ディレクトリを列挙し、各 spec について次を日本語の表で示す:

- spec 名
- 存在するドキュメント（requirements / design / tasks）
- tasks.md があればタスク進捗（完了 / 総数）
- 最終更新の目安（ファイル更新時刻など分かる範囲で）

`.spec-workflow/archive/` にアーカイブ済み spec があれば別枠で軽く触れる。
