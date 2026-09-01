# ポートフォリオ公開 設計書

- 作成日: 2026-09-01
- ステータス: 承認待ち（ユーザーレビュー前）

## 背景・目的

Curious City（`japan-travel-guide`）は当初、広告・アフィリエイト収益を狙う旅行ガイドサイトとして開発していたが、収益化は現実的でないと判断し、転職活動用ポートフォリオへ方針転換した（アフィリエイトリンク削除、About/Privacyページの実名化とAI活用アピールへの書き換え、Contactフォーム追加は完了済み）。

本設計は、この方針転換後のサイトを実際に人へ見せられる状態まで公開する作業を対象とする。

## 現状

- 静的HTML/CSS/JSサイト。`site/data/activities.json`（1025件）から `npm run build` でスポットページとsitemap.xmlを生成し、生成済みファイルをそのままGitにコミットしている（デプロイ時のビルドステップ不要）
- GitHubに非公開リポジトリ `ytakakura0103-hash/japan-travel-guide` が存在し、ここまでの作業はすべてpush済み
- 未公開（デプロイ先未設定）
- サイト内の複数箇所（canonical URL、og:url、JSON-LD、`sitemap.xml`、`robots.txt`）に `REPLACE_WITH_YOUR_DOMAIN` のプレースホルダーが残っている
- リポジトリ直下に `README.md` が存在しない
- Gitコミットの作者メールが本名（`REDACTED_EMAIL`）のまま

## 決定事項

### 1. リポジトリ公開範囲

GitHubリポジトリをPrivateからPublicに変更する。コミット履歴・テストコード・スクリプトを採用担当者が直接閲覧できるようにし、「Claude Codeを使ってAI主導で1000件超のデータ・テスト付きサイトを構築した」というAboutページの主張を実際の作業証跡で裏付ける。

### 2. コミット作者情報

Public化に伴い、今後のコミットの作者メールをGitHub提供のnoreplyアドレスに切り替える（`git config user.email` の変更）。過去のコミットの作者情報は書き換えない（履歴の書き換えは行わない）。

### 3. ホスティング

GitHub Pagesを使用する。既にGitHubにリポジトリがあるため追加のアカウント登録が不要。

GitHub Pagesはリポジトリ直下または `/docs` フォルダしか配信元に指定できない仕様のため、`site/` フォルダを配信物として書き出す最小限のGitHub Actionsワークフローを追加する（`actions/upload-pages-artifact` + `actions/deploy-pages` を使用）。mainブランチへのpush（またはmerge）をトリガーに自動で再公開される。

リポジトリのPages設定（Settings > Pages）で配信元を「GitHub Actions」に切り替える一回限りの手動設定が必要。

### 4. ドメイン

独自ドメインは購入せず、GitHub Pagesが無料で発行するURLをそのまま使う。

公開URL: `https://ytakakura0103-hash.github.io/japan-travel-guide/`

### 5. ドメインプレースホルダーの解消

サイト全体に残る `REPLACE_WITH_YOUR_DOMAIN` を上記の実URLに一括置換する。対象:

- `site/index.html`、`site/about.html`、`site/contact.html`、`site/privacy.html` の canonical URL・og:url・JSON-LD
- `site/robots.txt` のSitemap行
- `site/src/spot-page.js` の `siteUrl` デフォルト値（スポットページ生成時に使われる）
- 上記スクリプト修正後に `npm run build` を再実行し、生成済みの1025スポットページと `sitemap.xml` に反映させる

GitHub Pagesのプロジェクトページはリポジトリ名がURLのサブパスになる（`/japan-travel-guide/` 部分）。サイト内のリンクは既にすべて相対パス（`about.html`、`spots/xxx.html` など、先頭スラッシュなし）で書かれているため、サブパス配信でも追加修正なしに動作する。

### 6. README.md新規作成

リポジトリ直下に `README.md` を新規作成する。Public化した際に採用担当者がまず目にするページになるため、以下を含める:

- プロジェクト概要（Curious Cityとは何か、10都市1025スポットの日本旅行ガイド）
- 使用技術（Vanilla HTML/CSS/JS、Node.js + Vitest、データ駆動のページ生成）
- 公開URL
- このサイトがClaude Codeとの協働によりAI主導で構築されたものである旨（Aboutページと一貫した説明）

### 7. 対象外（今回のスコープに含めない）

- 独自ドメインの購入
- About/Contactページへの外部リンク（LinkedIn・GitHubプロフィール・レジュメ等）追加

## 影響範囲

- `.github/workflows/` 配下に新規ワークフローファイル1つ
- `site/index.html`、`site/about.html`、`site/contact.html`、`site/privacy.html`、`site/robots.txt`
- `site/src/spot-page.js`（デフォルト値変更）とそれに伴う `site/spots/*.html`（1025件）・`site/sitemap.xml` の再生成
- リポジトリ直下 `README.md`（新規）
- GitHubリポジトリ設定（Public化、Pages配信元設定）— コード変更ではなく手動/CLI操作
- ローカルGit設定（`user.email`）— コード変更ではなくローカル環境設定

## テスト方針

既存のVitestスイート（`activities-data-integrity.test.js` 等）は `REPLACE_WITH_YOUR_DOMAIN` の文字列そのものを検証していないため、置換後も既存テストは無修正でパスする想定。置換後に `npm run build && npm test` を実行し、全テストがパスすることを確認する。

デプロイ後の最終確認は、GitHub Pages公開URLをブラウザで開き、トップページ・About・Contact・Privacy・スポットページ数点のリンク切れがないことを目視確認する。
