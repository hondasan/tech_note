# AI Agent Instructions for Tech Notebook

このドキュメントは、AIアシスタント（私）がユーザーからの「〜について調べて」という指示を受けて技術調査ノート（記事）を追加・更新する際のルールと手順を定めたものです。

## 1. 記事作成の基本フロー

ユーザーがチャットで調査を依頼した場合、AIは以下の手順を実行します：

1. **最新状態の取得 (コンフリクト回避)**:
   - 処理を開始する前に、必ず `git pull origin main` を実行してリモート（クラウド上のIssueから追加された記事など）の最新の変更をローカルに反映します。

2. **調査とまとめの作成**:
   - 依頼された内容について、Web検索や手元のドキュメント等を用いて正確な情報を調査します。
   - 一次情報（公式ドキュメントや信頼できるソース）を参考にします。

3. **新規HTMLファイルの作成**:
   - 記事を `notes/[カテゴリ名]/[記事スラッグ].html` に配置します。
     - カテゴリ名は、`git`, `html`, `js`, `ts`, `ai`, `react`, `nextjs`, `node`, `ops`, `security`, `tool` など、関連する技術分野を選択します。適当なものがなければ新規に英語の小文字で作成します。
     - 記事スラッグは英語の小文字とハイフンのみ（例: `git-cherry-pick.html`）とします。
   - `notes/template.html` をコピーしてベースとし、タイトル、説明、日付、カテゴリを適切に書き換えます。
   - 共通CSSファイル (`../../styles/site.css`) が正しく読み込まれるよう、相対パスが正しいことを確認します。

4. **`notes/index.json` の更新**:
   - 新しく追加した記事のメタデータを `notes/index.json` に追記します。
   - 追記するJSONオブジェクトの形式：
     ```json
     {
       "title": "記事のタイトル",
       "excerpt": "記事の簡単な概要（100文字〜150文字程度）",
       "category": "カテゴリID（小文字、例: git）",
       "date": "YYYY-MM-DD",
       "path": "notes/[カテゴリ名]/[記事スラッグ].html"
     }
     ```

5. **`sitemap.xml` の更新**:
   - ルートにある `sitemap.xml` の `</urlset>` の直前に、新しく追加した記事のURLブロックを追記します。
     ```xml
     <url>
       <loc>https://hondasan.github.io/tech_note/notes/[カテゴリ名]/[記事スラッグ].html</loc>
       <lastmod>YYYY-MM-DD</lastmod>
       <changefreq>monthly</changefreq>
       <priority>0.8</priority>
     </url>
     ```

6. **Gitへの追加・コミット**:
   - 追加・変更したすべてのファイル（記事HTML、`notes/index.json`、`sitemap.xml`）をGitに追加します。
   - 日本語のコミットメッセージでコミットを作成します（例: `feat: [カテゴリ] [タイトル] の調査ノートを追加`）。

## 2. 記事（HTML）の品質ガイドライン

- **見出し構造**: `<h1>` はタイトルのみ。本文は `<h2>`、`<h3>` で構造化します。
- **読みやすさ**: `p`, `ul`, `ol`, `blockquote` をバランスよく使用し、重要な箇所は太字（`<strong>`）にします。
- **コードブロック**: ソースコードを記載する場合は `<pre><code>` で囲み、適切なマークアップを行います。
- **参考リンク**: 記事の最後には、必ず調査の参考にした一次情報（URL）を「参考URL」としてリンク付き（`target="_blank" rel="noopener noreferrer"`）で記載します。
- **SEO対策の徹底**:
  - **タイトルタグ & 説明文**: `<title>` に適切な検索キーワードを含め、`<meta name="description">` に120〜160文字程度の魅力的な記事概要を設定します。
  - **OGP設定**: `og:title`, `og:description`, `og:url` 等のメタタグを適切に設定します。`og:url` は公開用URL（例: `https://hondasan.github.io/tech_note/notes/[カテゴリ名]/[記事スラッグ].html`）に置き換えます。
  - **構造化データ (JSON-LD)**: 検索エンジンに記事構造を伝えるため、`<head>` 内に `TechArticle` スキーマのJSON-LDを必ず埋め込みます。`headline` (タイトル), `description` (概要), `datePublished` (作成日), `dateModified` (更新日) は実際の値で埋め、`author.name` は `hondasan` に設定します。

## 3. セキュリティと注意点

- **機密情報の除外**: APIキー、アクセスコード、プライベートなプロジェクト名など、公開されてはならない機密情報は絶対に記事やリポジトリに含めないでください。
- **外部ファイルの許容**: Git管理下には静的HTML/CSS/JS、画像（`.svg`, `.png`, `.jpg` など）のみを許可します。
