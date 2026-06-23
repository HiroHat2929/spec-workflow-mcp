---
description: 完了タスクの実装ログを記録する（ダッシュボードの Logs と互換）
argument-hint: <spec-name> <task-id>
allowed-tools: Read, Write, Bash, Glob, Grep
---

完了したタスクの実装ログを `.spec-workflow/specs/<spec-name>/Implementation Logs/` に記録する。
これは将来の AI/自分が grep で再利用するための検索可能なナレッジベースになる。**artifacts は必須**。

対象: $ARGUMENTS（`<spec-name> <task-id>` の順）

進め方:
1. 直近の実装内容を振り返り、次の JSON を一時ファイル（例 `/tmp/spec-log.json`）に書き出す:
   ```json
   {
     "specName": "<spec-name>",
     "taskId": "<task-id>",
     "summary": "実装した内容の1〜2文の要約",
     "filesModified": ["変更したファイル"],
     "filesCreated": ["新規作成したファイル"],
     "statistics": { "linesAdded": 0, "linesRemoved": 0 },
     "artifacts": {
       "apiEndpoints": [{ "method": "GET", "path": "/...", "purpose": "", "location": "src/...:NN" }],
       "components":   [{ "name": "", "type": "React", "purpose": "", "location": "src/..." }],
       "functions":    [{ "name": "", "purpose": "", "location": "src/...:NN", "isExported": true }],
       "classes":      [{ "name": "", "purpose": "", "location": "src/...", "isExported": true }],
       "integrations": [{ "description": "", "frontendComponent": "", "backendEndpoint": "", "dataFlow": "" }]
     }
   }
   ```
   - 該当しない artifacts 種別は省略してよいが、**少なくとも 1 種類**は埋める（空 artifacts は不可）。
2. CLI で記録する（プロジェクトルートで実行。`--project` 省略時は cwd）:
   ```bash
   spec-workflow log --input /tmp/spec-log.json
   ```
   未インストールの開発リポジトリ内では `node <repo>/spec-workflow-mcp/dist/index.js log --input /tmp/spec-log.json`
   （このワークスペースの正確なパスは CLAUDE.md 参照）。
3. 成功 JSON を確認したら、tasks.md の該当タスクを `[-]`→`[x]` に更新する。失敗時は tasks.md を変更しない。
