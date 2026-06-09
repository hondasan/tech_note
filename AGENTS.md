# AI Agent Instructions for Knowledge Notebook

このドキュメントは、AIアシスタント（私）がユーザーからの「〜について調べて」という指示を受けて知識調査ノート（記事）を追加・更新する際のルールと手順を定めたものです。

## 1. 記事作成の基本フロー

ユーザーがチャットで調査を依頼した場合、AIは以下の手順を実行します：

1. **最新状態の取得 (コンフリクト回避)**:
   - 処理を開始する前に、必ず `git pull origin main` を実行してリモート（クラウド上のIssueから追加された記事など）の最新の変更をローカルに反映します。

2. **調査とまとめの作成**:
   - 依頼された内容について、Web検索や手元のドキュメント等を用いて正確な情報を調査します。
   - 一次情報（公式ドキュメントや信頼できるニュースソース、オフィシャルサイト等）を参考にします。

3. **新規HTMLファイルの作成**:
   - 記事を `notes/[カテゴリ名]/[記事スラッグ].html` に配置します。
     - カテゴリ名は、`news`, `sports`, `general`, `science`, `culture`, `git`, `html`, `js`, `ts`, `ai`, `react`, `nextjs`, `node`, `ops`, `security`, `tool` など、関連する分野を選択します。適当なものがなければテーマに最適な新規カテゴリ（例: `soccer`, `history` など英小文字のみ）を自律的に命名・作成します。
     - 記事スラッグは英語の小文字とハイフンのみ（例: `worldcup-new-rules.html`）とします。
   - `notes/template.html` をコピーしてベースとし、タイトル、説明、日付、カテゴリ、構造化データのタイプ（`TechArticle` / `NewsArticle` / `Article`）を適切に書き換えます。
   - 共通CSSファイル (`../../styles/site.css`) が正しく読み込まれるよう、相対パスが正しいことを確認します。

4. **`notes/index.json` の更新**:
   - 新しく追加した記事のメタデータを `notes/index.json` に追記します。
   - 追記するJSONオブジェクトの形式：
     ```json
     {
       "title": "記事のタイトル",
       "excerpt": "記事の簡単な概要（100文字〜150文字程度）",
       "category": "カテゴリID（小文字、例: sports）",
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
   - 日本語のコミットメッセージでコミットを作成します（例: `feat: [カテゴリ] [タイトル] の解説ノートを追加`）。

## 2. 記事（HTML）の品質ガイドライン

- **見出し構造**: `<h1>` はタイトルのみ。本文は `<h2>`、`<h3>` で構造化します。
- **読みやすさ**: `p`, `ul`, `ol`, `table`, `blockquote` をバランスよく使用し、重要な箇所は太字（`<strong>`）にします。
- **コードブロック**: ソースコードや設定ファイルを記載する場合は `<pre><code>` で囲み、適切なマークアップを行います。
- **参考リンク**: 記事の最後には、必ず調査の参考にした一次情報（URL）を「参考URL」としてリンク付き（`target="_blank" rel="noopener noreferrer"`）で記載します。設定するURLは、必ず正しいURLであること、リンク切れがないことを事前に確認・検証してください。
- **Amazonリンク（アソシエイト）の挿入**:
  - ユーザーからAmazonの商品URL（`https://amzn.to/...` や `https://www.amazon.co.jp/...` などのアソシエイトリンク）が提示された場合は、記事の最後（「参考URL」の直前）に、テキストとボタンで構成されるアソシエイト枠を挿入します。
  - **埋め込みコード（iframeなど）が提示された場合**:
    Amazon側の仕様変更によりiframeでの画像表示は行わない方針です。もし提供された場合は、そこからリンク先URLを抽出し、下記の「URLのみが提示された場合」と同じテキスト紹介カード形式に変換して配置してください。
  - **URLのみが提示された場合**:
    ```html
    <div class="amazon-embed-container">
      <div class="amazon-text-card-content">
        <span class="product-badge">紹介書籍</span> <!-- 必要に応じて「おすすめ商品」などに変更可能 -->
        <h4 class="product-title">[商品タイトル]</h4> <!-- 記事の文脈やURL情報から商品の正式名称等を設定 -->
        <p class="product-desc">[商品の紹介文]</p> <!-- 本書や商品の簡潔な見どころ・紹介文（1〜2文）をAIが生成して記載 -->
        <a href="[提供されたURL]" class="amazon-text-link-btn" target="_blank" rel="noopener noreferrer">
          Amazonで詳細を見る
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-left: 0.25rem;"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3"/></svg>
        </a>
      </div>
    </div>
    ```
    のように、`amazon-text-card-content` クラスを用いて、商品の解説文および `amazon-text-link-btn` クラスのボタンを囲んで配置してください。
  - **Amazonリンクの提示がない場合**:
    従来通り、アソシエイト枠は一切作成せず、追加のHTMLも記述しないでください。
- **SEO対策の徹底**:
  - **タイトルタグ & 説明文**: `<title>` に適切な検索キーワードを含め、`<meta name="description">` に120〜160文字程度の魅力的な記事概要を設定します。
  - **OGP設定**: `og:title`, `og:description`, `og:url` 等のメタタグを適切に設定します。`og:url` は公開用URL（例: `https://hondasan.github.io/tech_note/notes/[カテゴリ名]/[記事スラッグ].html`）に置き換えます。
  - **構造化データ (JSON-LD)**: 検索エンジンに記事構造を伝えるため、`<head>` 内に適切なスキーマのJSON-LDを必ず埋め込みます。
    - **スキーマの選択**: 技術解説は `TechArticle`、ニュース記事は `NewsArticle`、それ以外（一般トピック、スポーツのルール、雑学など）は `Article` を指定します。
    - `headline` (タイトル), `description` (概要), `datePublished` (作成日), `dateModified` (更新日) は実際の値で埋め、`author.name` は `hondasan` に設定します。

## 3. セキュリティと注意点

- **機密情報の除外**: APIキー、アクセスコード、プライベートなプロジェクト名など、公開されてはならない機密情報は絶対に記事やリポジトリに含めないでください。
- **外部ファイルの許容**: Git管理下には静的HTML/CSS/JS、画像（`.svg`, `.png`, `.jpg` など）のみを許可します。
