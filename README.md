# Tech Notebook

AIと育てる、日々の学びや疑問を調査してまとめた技術ノートです。
本リポジトリは GitHub Pages で公開できます。

## 運用の流れ

1. **ユーザーからの依頼**: 「〇〇について調べて」とチャットでAIに依頼する。
2. **AIによる調査と更新**: AIが調査を行い、`notes/` ディレクトリ配下に新しいHTMLファイルを生成。同時に `notes/index.json` に記事のメタデータを追記。
3. **デプロイ**: Gitにコミット＆プッシュされ、GitHub Actionsによって自動的に GitHub Pages へデプロイされる。

## AIへの指示ルール

AIは [/AGENTS.md](file:///Users/honda/tech_note/AGENTS.md) に記載されているルールに従って記事の作成とデータベースの更新を行います。
