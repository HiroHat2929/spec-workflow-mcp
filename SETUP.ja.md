# Spec-Workflow セットアップ & 配布ガイド（初学者向け）

仕様駆動開発（**Requirements → Design → Tasks → Implementation**）を Claude Code 上で進めるツールです。
**MCP サーバーは使いません。** Claude Code の「スキル」「スラッシュコマンド」と、小さな CLI だけで動きます。

> なぜ MCP をやめたか：組織ポリシーで MCP サーバーが使えなくなったため。代わりに Claude Code 標準の
> スキル/コマンド（ただの Markdown ファイル）＋ローカル CLI に移行しました。

---

## 1. これだけ覚えればOK（クイックスタート）

```bash
# ① ツール本体を1回だけ用意（マシンごとに1回）
git clone <配布リポジトリのURL> spec-workflow
cd spec-workflow
npm ci
npm run build
npm install -g .          # `spec-workflow` コマンドが使えるようになる

# ② 自分のプロジェクトで初期化（プロジェクトごとに1回）
cd /path/to/あなたのプロジェクト
spec-workflow init

# ③ Claude Code を再起動／リロード（スキルとコマンドを読み込ませる）

# ④ 使ってみる（Claude Code のチャットで）
/spec-create my-first-feature
```

これで完了です。以下は各ステップの詳しい説明とトラブルシュートです。

---

## 2. 前提（必要なもの）

| 必要なもの | 用途 | 備考 |
|---|---|---|
| **Claude Code** | スキル/コマンドを動かす本体 | CLI・デスクトップ・IDE 拡張のいずれでも可 |
| **Node.js 18 以上** | CLI（`init` / 承認 / ダッシュボード）に必要 | `node -v` で確認 |
| **git** | 配布リポジトリの取得 | |

> ヒント：**チャット内承認（inline モード）だけ**で使うなら、初期化が終わった後は Node はほぼ不要です
> （スキル/コマンドはただの Markdown で、Claude が直接ファイルを読み書きするだけ）。
> 音声ダッシュボードを使うときだけ Node の CLI が要ります。

---

## 3. 配布する人向け（チームに配る側）

### 3-1. 配り方（推奨：git 経由）
1. このリポジトリを社内 / プライベートの git（GitHub など）に置く。
2. 利用者に **リポジトリの URL を共有**するだけ。
3. 利用者は「2. 前提」を満たしたうえで、上の **クイックスタート①** を実行する。

> npm レジストリ（npmjs.org / 社内レジストリ）が使える環境なら、そこに publish して
> `npm install -g @<org>/spec-workflow` でも配れます。レジストリが使えない環境では **git 経由が確実**です。

### 3-2. 更新を配るとき
- リポジトリを更新（`git push`）→ 利用者は `git pull && npm ci && npm run build` で反映。
- 利用者の各プロジェクトのスキル/コマンドを最新化したい場合は、各自で `spec-workflow init --force` を実行してもらう
  （`--force` は既存のスキル/コマンドを上書き。`.spec-workflow/` の spec データや承認は消えません）。

### 3-3. 同梱物（このリポジトリの中身）
- `assets/claude/skills/spec-workflow/SKILL.md` … ワークフロー本体（Claude が参照する手順書）
- `assets/claude/commands/spec-*.md` … `/spec-create` などのスラッシュコマンド
- `dist/index.js` … CLI（`init` / `approval` / `log` / `dashboard`）兼ダッシュボード
- `spec-workflow init` がこれらを利用者のプロジェクトへコピーします。

---

## 4. 利用開始する人向け（受け取る側・初学者）

### ステップ1：ツール本体を用意（マシンごとに1回だけ）
```bash
git clone <配布リポジトリのURL> spec-workflow
cd spec-workflow
npm ci          # 依存をインストール
npm run build   # CLI とダッシュボードをビルド
npm install -g .   # どこからでも `spec-workflow` と打てるようにする
```
うまくいけば `spec-workflow --help` でヘルプが出ます。

> `npm install -g .` が権限などで難しい場合は、グローバル化せず
> `node /path/to/spec-workflow/dist/index.js <コマンド>` の形でも全く同じように使えます。

### ステップ2：自分のプロジェクトで初期化（プロジェクトごとに1回）
```bash
cd /path/to/あなたのプロジェクト
spec-workflow init
```
これで次が作られます（既存のものは壊しません）：
- `.claude/skills/spec-workflow/` … ワークフローのスキル
- `.claude/commands/spec-*.md` … スラッシュコマンド
- `.spec-workflow/`（無ければ）… テンプレートと設定ファイル `config.toml`

### ステップ3：Claude Code を再起動／リロード
スキルとスラッシュコマンドは起動時に読み込まれます。一度 Claude Code を開き直してください。
チャットで `/spec-` と打って `/spec-create` などが候補に出れば成功です。

### ステップ4：承認のしかたを選ぶ（`/.spec-workflow/config.toml`）
各フェーズの最後に「人が承認する」ゲートがあります。やり方を1行で選べます。

```toml
# inline = チャット内で承認（手軽・追加ソフト不要）※初学者におすすめ
# dashboard = ブラウザ画面で承認（音声入力・差分レビューが使える）
approvalMode = "inline"
```

- **inline**：Claude が要点をチャットに出す → あなたが「承認」または「ここ直して」と返すだけ。
- **dashboard**：下の「ステップ6」でダッシュボードを開いて、画面上で承認（音声コメント可）。

### ステップ5：使ってみる
Claude Code のチャットで：
```
/spec-create my-first-feature
```
Claude が質問しながら Requirements → Design → Tasks を作り、各段階で承認を求めます。
そのほかのコマンド：

| コマンド | 何をする |
|---|---|
| `/spec-create <名前>` | 新しい spec を作る（要件→設計→タスク） |
| `/spec-status [名前]` | 進捗（タスクの消化状況）を見る |
| `/spec-list` | spec の一覧を見る |
| `/spec-execute <名前> <タスク番号>` | 指定タスクを実装する |
| `/spec-log <名前> <タスク番号>` | 実装ログを記録する |
| `/spec-steering` | プロジェクト方針ドキュメントを作る（任意） |

### ステップ6（任意）：ダッシュボードを開く（dashboard モードの人）
**別のターミナル**で、プロジェクトのルートから：
```bash
spec-workflow dashboard
```
- ブラウザで **http://localhost:5000** が開きます（自動で開かなければ手動で開く）。
- あなたのプロジェクトが自動で一覧に出て、Specs / Tasks / Logs / **Approvals** を確認できます。
- 承認画面のマイクボタンで音声入力も可能。停止は `Ctrl+C`。

> これは MCP サーバーではなく**ただの Web サーバー**なので、MCP の制限とは無関係に使えます。

---

## 5. 困ったとき（トラブルシュート）

| 症状 | 対処 |
|---|---|
| `/spec-create` などが候補に出ない | Claude Code を再起動。`.claude/skills/` と `.claude/commands/` にファイルがあるか確認。 |
| `spec-workflow: command not found` | `npm install -g .` をしていない。`node /path/to/spec-workflow/dist/index.js <コマンド>` で代用可。 |
| `spec-workflow init` が `.claude` を作れない/失敗する | 一部の特殊な実行環境では `.claude/skills` などが書き込み禁止のことがあります。その場合は**ユーザー共通**の場所に置けます：`spec-workflow init ~`（`~/.claude/` に展開され、全プロジェクトで有効）。 |
| ダッシュボードが「already running」と出る | すでに起動中。既存の画面を使うか、起動中のターミナルで `Ctrl+C` してから再起動。 |
| ダッシュボードのポート 5000 が使えない | `spec-workflow dashboard --port 8080` のように変更。 |
| ブラウザが自動で開かない | 手動で `http://localhost:5000` を開く（WSL の場合は Windows 側ブラウザで）。 |
| 既存の spec データはどうなる？ | `.spec-workflow/` の中身（specs・承認・テンプレート）は **init では消えません**。 |

---

## 6. しくみ（ざっくり）

- **スキル / コマンド**：`.claude/` 配下の Markdown ファイル。Claude がこれを読んで手順どおりに動く。
- **CLI（`spec-workflow`）**：
  - `init` … スキル/コマンドをプロジェクトへ展開
  - `approval` … （dashboard モード時）承認レコードの作成・確認・削除
  - `log` … 実装ログの記録
  - `dashboard` … 進捗・承認用の Web 画面を起動
- **データの置き場**：`.spec-workflow/`（spec 本文・タスク・承認・テンプレート）。git 管理してチームで共有できます。

以上です。まずは `approvalMode = "inline"` で `/spec-create` を試すのが、いちばん簡単な入り口です。
