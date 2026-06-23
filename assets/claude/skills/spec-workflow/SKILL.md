---
name: spec-workflow
description: >
  仕様駆動開発（Requirements → Design → Tasks → Implementation）を進めるときに使用する。
  ユーザーが新機能の spec 作成・要件定義・設計・タスク分割・実装ログ記録を依頼したとき、
  または .spec-workflow/ 配下の spec を扱うときに必ず参照する。MCP サーバーは使わず、
  このスキル＋ /spec-* スラッシュコマンド＋ spec-workflow CLI で運用する。
allowed-tools: Read, Write, Edit, Bash, Glob, Grep
---

# Spec Workflow（仕様駆動開発）

ラフなアイデアを **Requirements → Design → Tasks → Implementation** の順に詳細化していく。
かつては MCP サーバーのツールで実現していたが、現在は **MCP を使わず**、このスキルの指示に従って
`.spec-workflow/` のファイルを直接操作し、承認とログだけ `spec-workflow` CLI（任意でダッシュボード）を使う。

- spec 名は kebab-case（例 `user-authentication`）。**一度に 1 spec だけ**進める。
- すべての成果物・応答は**日本語**で記述する（コード識別子・技術用語は英語可）。
- フェーズは順番どおり。スキップしない。各フェーズの最後に**承認ゲート**を挟む。

## 0. 最初に承認モードを確認する

`.spec-workflow/config.toml` を読み、`approvalMode` を確認する（無ければ `inline` 扱い）。

- `approvalMode = "inline"`（既定）— **チャット内承認**。ダッシュボード/Node 不要。
- `approvalMode = "dashboard"` — **ダッシュボード承認**（音声入力・差分レビュー UI が使える）。

承認ゲートの具体手順は本文末尾「承認ゲート・プロトコル」を参照。

## ワークフロー図

```mermaid
flowchart TD
    Start([開始: 機能リクエスト]) --> CheckSteering{steering docs ある?}
    CheckSteering -->|Yes| P1_Load[steering を読む:<br/>.spec-workflow/steering/*.md]
    CheckSteering -->|No| P1_Template

    P1_Load --> P1_Template[user-templates を優先確認→<br/>requirements-template.md を読む]
    P1_Template --> P1_Concept[Step1: コンセプト発掘 Q1-Q5<br/>1問ずつ<br/>+Q4 後に市場トレンド検索<br/>+Q5 で KGI/KPI 提案<br/>+Q5 後に類似事例検索]
    P1_Concept --> P1_Confirm{Step2: コンセプト確認<br/>ユーザー OK?}
    P1_Confirm -->|修正| P1_Concept
    P1_Confirm -->|OK| P1_Detail[Step3: 詳細詰め Q6-Q8<br/>1問ずつ]
    P1_Detail --> P1_Create[作成:<br/>.spec-workflow/specs/{name}/requirements.md]
    P1_Create --> P1_Gate[承認ゲート]
    P1_Gate -->|修正要| P1_Create
    P1_Gate -->|承認| P2_Template

    P2_Template[user-templates 優先→ design-template.md] --> P2_Analyze[既存コードのパターン分析]
    P2_Analyze --> P2_Create[作成: design.md]
    P2_Create --> P2_Gate[承認ゲート]
    P2_Gate -->|修正要| P2_Create
    P2_Gate -->|承認| P3_Template

    P3_Template[user-templates 優先→ tasks-template.md] --> P3_Break[design をアトミックなタスクへ分解]
    P3_Break --> P3_Create[作成: tasks.md]
    P3_Create --> P3_Gate[承認ゲート]
    P3_Gate -->|修正要| P3_Create
    P3_Gate -->|承認| P4_Ready[spec 完成。実装へ?]

    P4_Ready -->|Yes| P4_Task[tasks.md: [ ]→[-]]
    P4_Task --> P4_Code[実装]
    P4_Code --> P4_Log[実装ログ記録<br/>/spec-log または spec-workflow log]
    P4_Log --> P4_Complete[tasks.md: [-]→[x]]
    P4_Complete --> P4_More{タスク残ってる?}
    P4_More -->|Yes| P4_Task
    P4_More -->|No| End([実装完了])

    style Start fill:#e1f5e1
    style End fill:#e1f5e1
    style P1_Gate fill:#ffe6e6
    style P2_Gate fill:#ffe6e6
    style P3_Gate fill:#ffe6e6
```

## Phase 1: Requirements（要件定義）

**目的**: ユーザーのニーズに基づき「何を作るか」を定義する。IPA「ユーザのための要件定義ガイド」
（BR.1 / RM.1 / DD.1〜DD.3）の流れ — まずコンセプト、次に詳細。

**ファイル操作**:
- steering があれば読む: `.spec-workflow/steering/*.md`
- カスタムテンプレート確認: `.spec-workflow/user-templates/requirements-template.md`（あれば優先）
- 既定テンプレート: `.spec-workflow/templates/requirements-template.md`
- 作成: `.spec-workflow/specs/{spec-name}/requirements.md`

**手順**:
1. `.spec-workflow/steering/` があれば product.md / tech.md / structure.md を読む。
2. テンプレートを確認（user-templates 優先）。最終ドキュメントの形を把握する。
3. **必須ディスカバリ（省略禁止 — これを終える前に requirements.md を書き始めない）。**
   ユーザーの言語（既定 日本語）で、**1 問ずつ**聞き、回答を待ってから次へ進む。

   **Step 1: コンセプト発掘（Q1〜Q5, 1問ずつ）**
   - Q1. ざっくり、どんなシステム/プロダクトを作りたいですか？ 2〜3 文でイメージを。
   - Q2. 主にどんな人が、どんな場面で使う想定ですか？
   - Q3. その人たちにどんな価値や体験を届けたいですか？
   - Q4. なぜ今これを作るのですか？ 市場・業務・規制で動きがありますか？
     - **Q4 の後**: Web 検索が使えるなら関連する市場/業界/規制トレンドを検索し、3〜5 点に要約
       （可能なら出典リンク付き）して「他に踏まえたいトレンドは？」と確認。使えなければその旨伝えてスキップ。
   - Q5. リリース後どうなれば「うまくいった」と言えますか？ 測れる KGI/KPI があれば一緒に。
     - **Q5 の時点**: Q1〜Q4 ＋トレンドから **KGI/KPI 候補を 3〜5 個提案**し、採用/修正/差し替えを確認。
   - **Q5 の後・Step2 の前**: Web 検索が使えるなら同領域の類似プロダクト/事例を 2〜3 件提示（用途と差別化を添えて）。
4. **Step 2: コンセプト確認** — Q1〜Q5＋トレンド＋類似事例を Markdown 表で要約し、
   「この理解で合ってますか？」と確認。修正があれば更新して再確認。**合意するまでループ**。
5. **Step 3: 詳細詰め（Q6〜Q8, 1問ずつ）**
   - Q6. 利用者以外で巻き込む関係者は？（決裁者・運用・連携先・外部窓口など）
   - Q7. 第一版に「入れること」と「入れないこと」を分けて。
   - Q8. 守るべき制約は？（予算・期限・規制・技術縛り・性能/セキュリティ）
6. Q1〜Q8 ＋確定コンセプト ＋ steering を踏まえ requirements を生成。ユーザーストーリー＋ EARS 受け入れ基準で。
   各要件がどの Q 由来か自然に対応づける。**「運用フロー」章を必ず含める**（利用者ロール・タイミング・
   インプット/アウトプット・関係者の動き）。
7. `.spec-workflow/specs/{spec-name}/requirements.md` を作成。
8. **承認ゲート**（末尾プロトコル参照）。承認されるまで次フェーズに進まない。

## Phase 2: Design（設計）

**目的**: 全要件を満たす技術設計。

**ファイル操作**: user-templates 優先 → `.spec-workflow/templates/design-template.md` →
作成 `.spec-workflow/specs/{spec-name}/design.md`

**手順**:
1. テンプレート確認（user-templates 優先）。
2. 既存コードベースを分析し、再利用できるパターンを探す（Grep/Glob で実コードを確認）。
3. 技術選定の調査（Web 検索が使えれば最新ベストプラクティスを確認）。
4. テンプレートの全セクションを埋めて design を生成。**「UX/UI レビュー観点」章を必ず含める**
   （情報設計・主要フロー・空状態/エラー状態・タイポグラフィ・アクセシビリティ・モバイル対応・MVP で省く判断の根拠）。
5. design.md を作成 → **承認ゲート**。

## Phase 3: Tasks（タスク分割）

**目的**: design をアトミックな実装タスクへ分解。

**ファイル操作**: user-templates 優先 → `.spec-workflow/templates/tasks-template.md` →
作成 `.spec-workflow/specs/{spec-name}/tasks.md`

**手順**:
1. テンプレート確認（user-templates 優先）。
2. design を 1〜3 ファイル単位のアトミックなタスクへ分解。ファイルパスと要件参照を含める。
3. **各タスクに `_Prompt` フィールドを生成**（Role / Task / Restrictions / _Leverage / _Requirements / Success）。
   末尾に「tasks.md で進行中にし、完了後に実装ログを記録し、その後に完了印を付ける」旨の指示を含める。
   プロンプト冒頭は "Implement the task for spec {spec-name}: ..." の形で。
4. tasks.md を作成 → **承認ゲート**。
5. 承認後: 「spec 完成。実装に進みますか？」と確認。

**tasks.md のチェックボックスが進捗の単一の真実**:
- `- [ ]` 未着手 / `- [-]` 進行中 / `- [x]` 完了 / `- [~]` ブロック
- ブロック理由は子要素で: `- _Blocked: 理由_`

## Phase 4: Implementation（実装）

**ツール/操作**: `/spec-status`（進捗確認）、Grep/ripgrep（**実装前に既存コード＆ログを必ず検索**）、
Read（実装ログ閲覧）、Edit（tasks.md の状態更新）、`/spec-log`（実装ログ記録）。

**手順**:
1. `/spec-status {spec-name}` で現状確認。
2. tasks.md を読み、全タスクを把握。
3. 各タスクについて:
   - tasks.md: 着手するタスクを `[ ]`→`[-]` に。
   - **実装前に既存の実装ログを必ず検索**（重複実装の防止）:
     - 置き場: `.spec-workflow/specs/{spec-name}/Implementation Logs/`
     - 例: `grep -r "api\|endpoint\|component\|function\|integration" .spec-workflow/specs/{spec-name}/"Implementation Logs"/`
     - 2〜3 種類の語で検索し、再利用できるコードを探す。
   - `_Prompt` の Role/方針/Success を読み、`_Leverage` の既存コードを活用して実装。
   - テストする。
   - **完了印の前に必ず実装ログを記録**（`/spec-log` または `spec-workflow log`）。
     - ⚠️ ログが成功するまで `[-]`→`[x]` にしない。ログ無しのタスクは未完了扱い。
     - taskId・要約・変更/作成ファイル・統計・**artifacts（API/コンポーネント/関数/クラス/連携）** を含める。
   - ログ成功後に tasks.md: `[-]`→`[x]`。
4. 全タスクが `[x]` になるまで継続。

## Steering ドキュメント（任意）

ユーザーが明示的に依頼したときだけ作成する（標準ワークフローの一部ではない）。
`/spec-steering` を使い、product.md → tech.md → structure.md の順に作成し、各々で承認ゲートを通す。
テンプレートは user-templates 優先 → `.spec-workflow/templates/{product,tech,structure}-template.md`。

---

## 承認ゲート・プロトコル

各フェーズのドキュメント作成/更新後、`approvalMode` に応じて次を行う。

### inline モード（既定・Node 不要）
1. 作成したドキュメントの要点（主要な決定事項）と**ファイルパス**をチャットに簡潔に提示する。
2. ユーザーに「承認」か「修正指示」を求める（音声入力したい場合は端末で Win+H を案内）。
3. 修正指示があればドキュメントを更新し、再提示。**合意するまでループ**。
4. 明示的に承認されたら、監査用に 1 行追記して次フェーズへ進む:
   ```bash
   echo "$(date -Iseconds)  {phase}  approved (inline)  {任意メモ}" >> .spec-workflow/specs/{spec-name}/approvals.log
   ```
   （steering の場合は `.spec-workflow/steering/approvals.log`）

### dashboard モード（音声・差分レビュー UI を使う）
ダッシュボードを起動しておく: `spec-workflow dashboard`（= 素の Web サーバー。MCP ではない）。
1. 承認リクエストを作成（出力 JSON の `data.approvalId` を控える）:
   ```bash
   spec-workflow approval request --title "{spec-name} Requirements" \
     --file ".spec-workflow/specs/{spec-name}/requirements.md" \
     --type document --category spec --category-name "{spec-name}"
   ```
2. ユーザーにダッシュボードでのレビュー/承認（音声コメント可）を依頼する。
3. ステータスを polling（ユーザーが対応したと言ったら確認する。**口頭の「承認」では進まない**）:
   ```bash
   spec-workflow approval status --id "{approvalId}"
   ```
   - `needs-revision` / `rejected` → コメントを反映して修正 → **新しい**リクエストを作成。
   - `approved` → 後始末してから次フェーズへ:
     ```bash
     spec-workflow approval delete --id "{approvalId}"
     ```

> CLI の起動方法: パッケージをインストール済みなら `spec-workflow ...`。未インストールの開発リポジトリ内では
> `node <repo>/spec-workflow-mcp/dist/index.js ...` で代替する（このワークスペースの正確なパスは CLAUDE.md 参照）。
> `--project <path>` 省略時はカレントディレクトリをプロジェクトルートとして扱う。

## 関連スラッシュコマンド
- `/spec-create <name>` — Requirements→Design→Tasks を承認ゲート付きで進める
- `/spec-steering` — steering ドキュメント作成
- `/spec-status [name]` — 進捗サマリ
- `/spec-list` — spec 一覧
- `/spec-execute <name> <taskId>` — 指定タスクを実装
- `/spec-log <name> <taskId>` — 実装ログを記録

## ファイル構成
```
.spec-workflow/
├── config.toml          # approvalMode / lang / port
├── templates/           # 既定テンプレート
├── user-templates/      # カスタム（こちらが優先）
├── specs/
│   └── {spec-name}/
│       ├── requirements.md
│       ├── design.md
│       ├── tasks.md
│       ├── approvals.log          # inline 承認の監査ログ
│       └── Implementation Logs/   # 実装ログ（自動生成）
├── steering/            # product.md / tech.md / structure.md
├── approvals/           # dashboard モードの承認レコード（CLI が生成）
└── archive/
```
