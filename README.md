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
#### 作業工数
* 人数：１人
* 旧ダメージ計算機（単体ダメージ計算機）制作期間：3週間
* 旧マルチダメージ計算機への機能一新：2週間
* 2022/11の機能追加バージョンアップ：1週間
* 2023/09の機能追加バージョンアップ：3日

## ファイル内容
#### frontScript.js  
入力受付・操作補助・計算・結果表示を行うJavascriptファイル
#### appPage.php(private)  
アプリページを動的出力するPHPファイル
#### testPage.html  
編集・デバッグ用のHTMLファイル（PHPファイルに適宜変更を適用していく）
#### style.css  
testPage・appPageの出力に用いるスタイルシート
#### return-mdmc.php(private)  
ポケモンのステータスデータをHTTP POSTで返す

データベースの参照を行うPHPファイルは現在非公開にしています。

## 開発経緯
ポケモンのダメージシミュレーションを行うアプリは本アプリ以外にも多数公開されており、一般的なものとなっています。しかしそれらはどれも単体の攻撃に対する計算を行うものばかりであり、複数回の攻撃に対する計算の実施はほとんど未開拓な分野となっていました。そこでこの機能を有したアプリを作成することで、需要の獲得およびプレイヤー全体に対する選択肢の充実につながると考え、制作に至りました。  

複数回の攻撃を登録する都合上どうしても機能が複雑になり、特にスマートフォンでの操作性が開発をする上での課題となりました。結果として主要な要素のみをトップページに配置し、詳細な設定はページ遷移を経て行うことで複雑な機能を分かりやすいUIに落とし込めたと考えています。  

計画・設計・コーディング・デザインは全て一人で行いました。使用者の感想や要望などを参考に、少しずつ機能をアップデートしています。

## GitHubページについて
コードの公開及び、今後のアップデート内容の管理のため作成しました。
今後、テスト結果の整理や、仕様書および構成図の整理・公開も検討しています。

## 2023/09アップデート内容
* DLCに対応した新ポケモンの追加
* 計算結果を分割して見やすく表示するよう変更
* 計算結果をタップすることで、詳細な計算結果を開く機能の追加
* ボタンの大きさや操作方法など、UIを改善
* 木の実によるHP回復の実装
* そのほか定数ダメージ・回復効果を実装
* 相手のHPを半分にする特殊な攻撃に対応
* そのほか、一部計算の仕様や入力方法を調整しました
