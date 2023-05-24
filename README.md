## アプリ概要
* タイトル ：マルチダメージ計算機
* 機能 ：ポケットモンスターのダメージシミュレーションを行うアプリ
* 公開URL ：https://pokedesiaf.com/mdmc/
* アプリ紹介ページ ：https://pokedesiaf.com/damage-calculatorm/ 
* 公開環境 ：レンタルサーバーにてWordpressサイトの固定ページとして公開

## ファイル内容
* frontScript.js ：入力受付・操作補助・計算・結果表示を行うJavascriptファイル
* appPage.php(private) ：アプリページを動的出力するPHPファイル
* appPage.html ：アプリを表示するHTMLファイル（主にPHPファイルの出力結果を使用し、参考のため公開）
* design.css ：appPageの出力に用いるスタイルシート
* return-mdmc.php(private) ：ポケモンのステータスデータをHTTP POSTで返す

データベースの参照を行うPHPファイルは現在非公開にしています。

## gitHubページについて
公開済みアプリについて、コードを陳列し公開する目的で当ページを作成しました。今後、より実務的な開発・コーディングを目指して以下の更新を検討しています。
* 仕様書および構成図の整理・公開
* テスト結果の公開・テストの再実施
* より実務的な形へのJavascriptコードの修正（又はTypeScriptでの再構成）
* CSSファイルおよびid属性名の整理
* phpファイル・データベースを調整し、gitHub上で動作する形での公開
