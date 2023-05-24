## アプリ概要
#### タイトル  
マルチダメージ計算機
#### 機能  
ポケットモンスターのダメージシミュレーションを行うアプリ
#### 公開URL  
https://pokedesiaf.com/mdmc/
#### アプリ紹介ページ  
https://pokedesiaf.com/damage-calculatorm/ 
#### 公開環境  
レンタルサーバーにてWordpressサイトの固定ページとして公開

## ファイル内容
#### frontScript.js  
入力受付・操作補助・計算・結果表示を行うJavascriptファイル
#### appPage.php(private)  
アプリページを動的出力するPHPファイル
#### appPage.html  
アプリを表示するHTMLファイル（主にPHPファイルの出力結果を使用し、参考のため公開）
#### design.css  
appPageの出力に用いるスタイルシート
#### return-mdmc.php(private)  
ポケモンのステータスデータをHTTP POSTで返す

データベースの参照を行うPHPファイルは現在非公開にしています。

## 開発経緯
ポケモンのダメージシミュレーションを行うアプリは本アプリ以外にも多数公開されており、一般的なものとなっています。しかしそれらはどれも単体の攻撃に対する計算を行うものばかりであり、複数回の攻撃に対する計算の実施はほとんど未開拓な分野となっていました。そこでこの機能を有したアプリを作成することで、需要の獲得およびプレイヤー全体に対する選択肢の充実につながると考え、制作に至りました。  

複数回の攻撃を登録する都合上どうしても機能が複雑になり、特にスマートフォンでの操作性が開発をする上での課題となりました。結果として主要な要素のみをトップページに配置し、詳細な設定はページ遷移を経て行うことで複雑な機能を分かりやすいUIに落とし込めたと考えています。  

計画・設計・コーディング・デザインは全て一人で行いました。使用者の感想や要望などを参考に、少しずつ機能をアップデートしています。

## GitHubページについて
公開済みアプリについて、コードを陳列し公開する目的で当ページを作成しました。今後、より実務的な開発・コーディングを目指して以下の更新を検討しています。
* 仕様書および構成図の整理・公開
* テスト結果の公開・テストの再実施
* より実務的な形へのJavascriptコードの修正（又はTypeScriptでの再構成）
* CSSファイルおよびid属性名の整理
* phpファイル・データベースを調整し、ローカル環境で動作する形での公開
