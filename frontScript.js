const MDMC_Nodes = class{
    // 補正（補正時と倍率）を記憶するリストのクラス宣言
    constructor(used=0, ID="", faze=0, revice=0, name=""){
        this.used = used; // 有効判定（使用中：1/未使用：0）
        this.ID = ID; // "A00"などのID
        this.faze = faze; // 補正時（例外の場合は-1）
        this.revice = revice; // 補正値/4096
        this.name = name; //補正名
    }
}

const ZERO_DAMAGE = Array(16).fill(0);
const MDMC_Turns = class{
    // ターンごとのダメージを記憶するクラス宣言
    constructor(
        used=0,
        damages=ZERO_DAMAGE,
        damagesC=ZERO_DAMAGE,
        pwr=80,
        cat=[0,0],
        rank=[0,0],
        criticalRank=0,
        continuation=1,
        modeHalf=false,
        RL=[new MDMC_Nodes()
        ]){
        this.used = used // 有効判定（使用中：1/未使用：0）
        //this.isDM = isDM; // ダイマックス判定：削除
        this.damages = damages; // ダメージ配列（最大→最小）
        this.damagesC = damagesC; // 急所ダメージ配列（最大→最小）
        this.pwr = pwr; // 威力
        this.cat = cat; // 攻撃分類（[攻め分類,受け分類]）
        this.rank = rank; // 能力ランク
        this.criticalRank = criticalRank; //急所ランク
        this.continuation = continuation; //追加：連続回数
        this.modeHalf = modeHalf; //HPを半分にする攻撃
        this.RL = RL; // 補正群
    }
}

//const MDMC_POKEMAX = 1038 +1; //PHPで補完
//const MDMC_MODEALL = 0; //PHPで補完
const MDMC_RNUM = [7, 10, 14, 20, 20, 4, 9, 3, 5, 3, 4, 3, 12, 4, 5, 4];

const inData = {
    //攻側ポケモンデータ ポケモン名[0] id:#dm_in_1_0
    pokeA : ["けつばん",55,90,80,50,105,96], // index対応：0:名前, 1~6:種族値
    pokeAID : -1,
    pokeAR : 142, //A実数値（id:#dm_in_1_2）
    pokeAI : 31, //A個体値（id:#dm_in_1_4）
    pokeAE : 252, //A努力値（id:#dm_in_1_3）
    pokeAN : 1, //性格補正（0.9,1,1.1 / id:#dm_in_1_5)
    pokeCR : 102, //C実数値（id:#dm_in_1_7）
    pokeCI : 31, //C個体値（id:#dm_in_1_9）
    pokeCE : 252, //C努力値（id:#dm_in_1_8）
    pokeCN : 1, //性格補正（0.9,1,1.1 / id:#dm_in_1_10)
    //被弾側ポケモンデータ ポケモン名[0] id:#dm_in_2_0
    pokeB : ["けつばん",90,90,85,125,90,100],
    pokeBID : -1,
    pokeBR : 105, //BD実数値（id:#dm_in_2_2）
    pokeBI : 31, //BD個体値（id:#dm_in_2_4）
    pokeBE : 0, //BD努力値（id:#dm_in_2_3）
    pokeBN : 1, //性格補正（0.9,1,1.1 / id:#dm_in_2_5)
    pokeDR : 110, //C実数値（id:#dm_in_2_7）
    pokeDI : 31, //C個体値（id:#dm_in_2_9）
    pokeDE : 0, //C努力値（id:#dm_in_2_8）
    pokeDN : 1, //性格補正（0.9,1,1.1 / id:#dm_in_2_10)
    pokeBHR : 165, //H実数値（id:#dm_in_2_12）
    pokeBHI : 31, //H個体値（id:#dm_in_2_14）
    pokeBHE : 0, //H努力値（id:#dm_in_2_13）
    // 定数ダメージに関するデータ
    HPoption : {
        menuOpen: false, //メニューの開閉
        useNum: 0, //使用中のオプションの数
        Stero: {use: false, index: -1, DAMAGE:[32, 16, 8, 4, 2], log:"ステロ"}, //ステルスロック
        Makibishi: {use: false, index: -1, DAMAGE:[8, 6, 4], log:"まきびし"}, //まきびし
        Weather: {use: false, RATE:-16, log:"天候ダメージ"}, //天候ダメージ（砂嵐・あられ）
        GF : {use: false, RATE:16, log:"GF回復"}, //グラスフィールド回復
        Leftovers : {use: false, RATE:16, log:"残飯回復"}, //食べ残し
        MoveRejene : {use: false, RATE:16, log:"1/16回復"}, //根を張る・アクアリング
        Yadorigi : {use: false, ENEMYRATE:8, enemyHP: 0, healValue: 0, log:"宿り木回復"}, //宿り木のタネ
        PoisonHeal : {use: false, RATE:8, log:"ポイヒ回復"}, //ポイヒ
        Poison : {use: false, RATE:-8, log:"毒ダメージ"}, //毒
        BadPoison : {use: false, BASERATE:-16, log:"猛毒ダメージ"}, //猛毒
        Burn : {use: false, RATE:-16, log:"火傷ダメージ"}, //やけど
        Bind : {use: false, RATE:-16, log:"バインドダメージ"}, //しめつける・炎の渦などのバインドダメージ
        Salt1 : {use: false, RATE:-8, log:"塩漬けダメージ"}, //等倍塩漬け
        Salt2 : {use: false, RATE:-4, log:"塩漬けダメージ"}, //弱点塩漬け
        Obon : {use: false, EATRATE:4, THRESHOLD:2, log:"オボン発動 回復"}, //オボン
        Berry : {use: false, EATRATE:3, THRESHOLD:4, log:"ピンチベリー発動 回復"}, //ピンチベリー
    },
    //UI上で選択中の技の分類を記録する
    catMode : 0, //分類 0:物理/1:特殊/2:両面（id:#dm_button_cat）
    //レベルデータ
    levelA : 50, //レベル（id:#dm_in_1_1）
    levelB : 50, //レベル（id:#dm_in_2_1）
}

let dmTurns = [new MDMC_Turns(used=1), new MDMC_Turns(), new MDMC_Turns(), new MDMC_Turns(), new MDMC_Turns()];
let dmTurnNum = 1; //現在の追加済みターン数
let dmTurnRandlist = [0, 0, 0, 0, 0]; //ターンのダメージ表示（0:通常, 1:乱数表示）
let dmStatusRef = [[0,0], [0,0]]; //ステータスの表示状況
let openTurn = -1; //現在の変更参照ターン
const TURN_MAX = 5; //追加できる最大ターン数

let Revices = {
    // 補正の有効判定
    isA : Array(MDMC_RNUM[0]).fill(0), //タイプ一致・タイプ相性
    isB : Array(MDMC_RNUM[1]).fill(0), //環境補正
    isC : Array(MDMC_RNUM[2]).fill(0), //主補正
    isD : Array(MDMC_RNUM[3]).fill(0), //×2
    isE : Array(MDMC_RNUM[4]).fill(0), //×1.5
    isF : Array(MDMC_RNUM[5]).fill(0), //×1.33
    isG : Array(MDMC_RNUM[6]).fill(0), //×1.3
    isH : Array(MDMC_RNUM[7]).fill(0), //×1.25
    isI : Array(MDMC_RNUM[8]).fill(0), //×1.2
    isJ : Array(MDMC_RNUM[9]).fill(0), //×1.1
    isK : Array(MDMC_RNUM[10]).fill(0), //×0.75
    isL : Array(MDMC_RNUM[11]).fill(0), //×0.67
    isM : Array(MDMC_RNUM[12]).fill(0), //×0.5
    isN : Array(MDMC_RNUM[13]).fill(0), //×その他補正
    isO : Array(MDMC_RNUM[14]).fill(0), //メトロノーム
    isP : Array(MDMC_RNUM[15]).fill(0), //そうだいしょう
    recetAll : function(){
        //有効補正のリセット
        const BOX = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P"];
        const ISs = [this.isA, this.isB, this.isC, this.isD, this.isE, this.isF
            , this.isG, this.isH, this.isI, this.isJ, this.isK, this.isL, this.isM, this.isN, this.isO, this.isP];
        let ID;
        for( let i=0; i<16; i++ ){
            for( let j=0; j<MDMC_RNUM[i]; j++ ){
                if( ISs[i][j] ){
                    ISs[i][j] = 0;
                    ID = ((j<10)? "0"+j:j);
                    document.getElementById("MDMC_Rbt_"+BOX[i]+ID).style.background = "#ffffff";
                }
            }
        }
    },
    renewRevices: function(turn){
        //補正リスト開閉時、有効リストの更新を行う
        this.recetAll();
        let refList = dmTurns[turn].RL;
        const ListEND = refList.length;
        let ID, IDbox, IDnum;
        for( let i=0; i<ListEND; i++ ){
            if( refList[i].used == 0 ) continue;
            ID = refList[i].ID;
            IDbox = ID[0];
            IDnum = +ID.slice(1,3);
            switch( IDbox ){
                case "A": this.isA[IDnum] = 1; break;
                case "B": this.isB[IDnum] = 1; break;
                case "C": this.isC[IDnum] = 1; break;
                case "D": this.isD[IDnum] = 1; break;
                case "E": this.isE[IDnum] = 1; break;
                case "F": this.isF[IDnum] = 1; break;
                case "G": this.isG[IDnum] = 1; break;
                case "H": this.isH[IDnum] = 1; break;
                case "I": this.isI[IDnum] = 1; break;
                case "J": this.isJ[IDnum] = 1; break;
                case "K": this.isK[IDnum] = 1; break;
                case "L": this.isL[IDnum] = 1; break;
                case "M": this.isM[IDnum] = 1; break;
                case "N": this.isN[IDnum] = 1; break;
                case "O": this.isO[IDnum] = 1; break;
                case "P": this.isP[IDnum] = 1; break;
                default: MDMC.dmError("補正リスト作成エラー"); break;
            }
            document.getElementById("MDMC_Rbt_" + ID).style.background = "#ffc000";
        }
    },
}

let ReList = {
    // 有効補正リストの操作
    ListMAX : 7, //同時補正の最大数
    returnList : function(){
        //参照リストを返す
        return dmTurns[openTurn].RL;
    },
    enterList : function(IDname, faze, revice, name="noname"){
        // リストへの追加
        let refList = this.returnList(); //リスト参照
        const ListEND = refList.length;
        let index;
        // リストの空きを探す
        for( index=0; index<ListEND; index++ ){
            if( refList[index].used == 0 ) break;
        }
        if( index >= this.ListMAX ) return -1;//追加不可
        // リストにノードを追加
        refList[index] = new MDMC_Nodes(1,IDname,faze,revice, name);
        return index;//追加完了
    },
    isListFull : function(){
        const refList = this.returnList(); //リスト参照追加修正：消去予定
        const ListEND = refList.length;
        if( ListEND < ReList.ListMAX ) return 0;
        let index;
        for( index=0; index<ListEND; index++ ){
            if( refList[index].used == 0 ) break;
        }
        return ( index == ListEND );
    },
    deleteList : function(IDname){
        // ノードの消去
        let refList = this.returnList(); //リスト参照
        List = dmTurns[openTurn].RL; //リスト参照
        const ListEND = refList.length;
        let index;
        for( index=0; index<ListEND; index++ ){
            if( refList[index].ID === IDname ) break;
        }
        if( index == ListEND ) return -1;//リストの状態エラー
        refList[index].used = 0;
        return index;//消去完了
    },
    changeSwiches : function(ID){
        //対応ボタンの切り替え
        if( Revices.isA[+ID] ) return 0;
        //タイプ系
        if( +ID == -1 ){
            //テラス適応力
            for( let i=0; i<=2; i++ ){
                Revices.isA[i] = 0;
                document.getElementById("MDMC_Rbt_A0" + i).style.background = "#ffffff";
                this.deleteList("A0" + i);
            }
        }else if( +ID<=2 ){
            //タイプ一致
            for( let i=0; i<=2; i++ ){
                if ( i == +ID ) continue;
                Revices.isA[i] = 0;
                document.getElementById("MDMC_Rbt_A0" + i).style.background = "#ffffff";
                this.deleteList("A0" + i);
            }
            Revices.isN[0] = 0;
            document.getElementById("MDMC_Rbt_N00").style.background = "#ffffff";
            this.deleteList("N00");
        }else{
            //タイプ相性
            for( let i=3; i<=6; i++ ){
                if( i==+ID ) continue;
                if( Revices.isA[i] ){
                    Revices.isA[i] = 0;
                    document.getElementById("MDMC_Rbt_A0" + i).style.background = "#ffffff";
                    this.deleteList("A0"+i);
                }
            }
        }
        return 1;
    },
    pushRevices : function(BOX, ID, faze, revice, name="noname"){
        //onclick: 補正ボタン
        if( openTurn == -1 ) return -1;
        const IDname = BOX + ID;
        let of = 0;
        switch(BOX){
            case "A" : of=+Revices.isA[+ID]; break;
            case "B" : of=+Revices.isB[+ID]; break;
            case "C" : of=+Revices.isC[+ID]; break;
            case "D" : of=+Revices.isD[+ID]; break;
            case "E" : of=+Revices.isE[+ID]; break;
            case "F" : of=+Revices.isF[+ID]; break;
            case "G" : of=+Revices.isG[+ID]; break;
            case "H" : of=+Revices.isH[+ID]; break;
            case "I" : of=+Revices.isI[+ID]; break;
            case "J" : of=+Revices.isJ[+ID]; break;
            case "K" : of=+Revices.isK[+ID]; break;
            case "L" : of=+Revices.isL[+ID]; break;
            case "M" : of=+Revices.isM[+ID]; break;
            case "N" : of=+Revices.isN[+ID]; break;
            case "O" : of=+Revices.isO[+ID]; break;
            case "P" : of=+Revices.isP[+ID]; break;
            default: MDMC.dmError("補正ボタンエラーA"); break;
        }
        if( of ){
            //オン→オフ
            let index = this.deleteList(IDname);
            document.getElementById("MDMC_Rbt_" + IDname).style.background = "#ffffff";
            document.getElementById("MDMC_inrevs" + openTurn + "_" + index).style.display = "none";
        }else{
            // オフ→オン
            if( BOX === "A" ) this.changeSwiches(ID);
            else if( BOX+ID == "N00" ) this.changeSwiches(-1);
            let index = this.enterList(IDname, faze, revice, name);
            if(index == -1){
                alert("同時に選択可能な補正の数は"+this.ListMAX+"個までです");
                return 0;
            }else {
                document.getElementById("MDMC_inrevs" + openTurn + "_" + index).style.display = "flex";
                document.getElementById("MDMC_inrevs" + openTurn + "_" + index).innerText = name;
            }
            document.getElementById("MDMC_Rbt_" + IDname).style.background = "#ffc000";
        }
        switch(BOX){
            case "A" : Revices.isA[+ID]^=1; break;
            case "B" : Revices.isB[+ID]^=1; break;
            case "C" : Revices.isC[+ID]^=1; break;
            case "D" : Revices.isD[+ID]^=1; break;
            case "E" : Revices.isE[+ID]^=1; break;
            case "F" : Revices.isF[+ID]^=1; break;
            case "G" : Revices.isG[+ID]^=1; break;
            case "H" : Revices.isH[+ID]^=1; break;
            case "I" : Revices.isI[+ID]^=1; break;
            case "J" : Revices.isJ[+ID]^=1; break;
            case "K" : Revices.isK[+ID]^=1; break;
            case "L" : Revices.isL[+ID]^=1; break;
            case "M" : Revices.isM[+ID]^=1; break;
            case "N" : Revices.isN[+ID]^=1; break;
            case "O" : Revices.isO[+ID]^=1; break;
            case "P" : Revices.isP[+ID]^=1; break;
            default: MDMC.dmError("補正ボタンエラーB"); break;
        }
        doCalculate.reCalculate(openTurn); //計算
        return 1;
    },
    makeCopy(orgTurn){
        //補正リストのコピーを作成する
        let refList = dmTurns[orgTurn].RL;
        let returnList = [-1];
        const ListEND = refList.length;
        for( let i=0; i<ListEND; i++ ){
            returnList[i] = new MDMC_Nodes(refList[i].used, refList[i].ID, refList[i].faze, refList[i].revice,  refList[i].name);
        }
        return returnList;
    }
}

let doCalculate = {
    refList : [new MDMC_Nodes()], //：dmTurns[openTurn].RL
    round : (x) => {
        //x>0において五捨五超入処理となる
        return -1*Math.round(-1*x);
    },
    forRound : (dms, fn) => {
        for (let i=0; i<16; i++){
            dms[i] = fn(+dms[i]);
        }
        return dms;
    },
    doReviceByFaze(faze){
        let rev = 1;
        const ListEND = this.refList.length;
        for( let i=0; i<ListEND; i++ ){
            if( this.refList[i].used == 0 ) continue;
            if( this.refList[i].faze == faze ){
                rev *= this.refList[i].revice;
                rev /= 4096;
            }
        }
        return rev;
    },
    makeHPber : function(Max, Min, elementId = "MDMC_FRber0"){
        const HPBElement = document.getElementById(elementId);
        const BerColor  = [["#f03535", "#e19b9b"], ["#f0bc12", "#f2e09d"], ["#78bb58", "#b5d9a4"]];
        const White = "#eee";
        let Grad = "linear-gradient(to left, ";
        if( Min >= 100 ){
            Grad = White;
        }else if( Max >= 100 ){
            // 白--白
            Grad += White + " " + Min + "%," + BerColor[0][1] + " " + Min + "%)";
        }else if( Min >= 80 ){
            // 赤--赤 Max 赤R--赤R Min 白--白
            Grad += White + " " + Min + "%";
            Grad += ", " + BerColor[0][1] + " " + Min + "%, " + BerColor[0][1] + " " + Max + "%";
            Grad += ", " + BerColor[0][0] + " " + Max + "%, " + BerColor[0][0] + " 100%";
            Grad += ")";
        }else if( Max > 80 ){
            // 赤--赤 Max 赤R--赤R 80 黄R--黄R Min 白--白
            Grad += White + " " + Min + "%";
            Grad += ", " + BerColor[1][1] + " " + Min + "%, " + BerColor[1][1] + " 80%";
            Grad += ", " + BerColor[0][1] + " 80%, " + BerColor[0][1] + " " + Max + "%";
            Grad += ", " + BerColor[0][0] + " " + Max + "%, " + BerColor[0][0] + " 100%";
            Grad += ")";
        }else if( Min >= 50 ){
            // 黄--黄 Max 黄R--黄R Min 白--白
            Grad += White + " " + Min + "%";
            Grad += ", " + BerColor[1][1] + " " + Min + "%, " + BerColor[1][1] + " " + Max + "%";
            Grad += ", " + BerColor[1][0] + " " + Max + "%, " + BerColor[1][0] + " 100%";
            Grad += ")";
        }else if( Max > 50 ){
            // 黄--黄 Max 黄R--黄R 50 緑R--緑R Min 白--白
            Grad += White + " " + Min + "%";
            Grad += ", " + BerColor[2][1] + " " + Min + "%, " + BerColor[2][1] + " 50%";
            Grad += ", " + BerColor[1][1] + " 50%, " + BerColor[1][1] + " " + Max + "%";
            Grad += ", " + BerColor[1][0] + " " + Max + "%, " + BerColor[1][0] + " 100%";
            Grad += ")";
        }else{
            // 緑--緑 Max 緑R--緑R Min 白--白
            Grad += White + " " + Min + "%";
            Grad += ", " + BerColor[2][1] + " " + Min + "%, " + BerColor[2][1] + " " + Max + "%";
            Grad += ", " + BerColor[2][0] + " " + Max + "%, " + BerColor[2][0] + " 100%";
            Grad += ")";
        }
        HPBElement.style.background = Grad;
    },
    calculate : function(tn){
        //1ターンのダメージ計算
        let refTurn = dmTurns[tn];
        this.refList = refTurn.RL;
        //変数宣言
        let damage; //乱数前ダメージ
        let damageC; //急所ダメージ
        let damages = []; //乱数後ダメージ
        let damagesC = []; //急所ダメージ
        let t; //一時変数
        //データ参照
        let at, df; //実数値参照
        if( refTurn.cat[0] ){
            at = +inData.pokeCR; //特殊
            df = ((refTurn.cat[1])? +inData.pokeBR:+inData.pokeDR);
        }else{
            at = +inData.pokeAR; //物理
            df = ((refTurn.cat[1])? +inData.pokeDR:+inData.pokeBR);
        }
        let Ranks, pwr;
        Ranks = refTurn.rank;
        pwr = refTurn.pwr;
        let atC = at; //急所用
        let dfC = df; //急所用
        // 素値計算
        damage = inData.levelA * 2 / 5 + 2;
        damage = Math.floor(damage);
        //Faze1:威力計算
        pwr *= this.doReviceByFaze(11);
        pwr *= this.doReviceByFaze(10);
        pwr = this.round(pwr);
        if( pwr <= 0 ) pwr = 1;
        //Faze3:攻撃力計算
        //ACランク補正
        if( Ranks[0] >= 0 ){
            t = (2+Ranks[0])/2;
            at = Math.floor(at*t);
            atC = Math.floor(atC*t);
        }else{
            at = Math.floor( at*2/(2+(-1)*Ranks[0]) );
        }
        //はりきり補正
        t = this.doReviceByFaze(31);
        at = Math.floor(at*t);
        atC = Math.floor(atC*t);
        //通常補正
        t = this.doReviceByFaze(30);
        at = this.round(at*t);
        atC = this.round(atC*t);
        if( at <= 0 ) at = 1;
        if( atC <= 0 ) atC = 1;
        //Faze5:防御力計算
        //BDランク補正
        if( Ranks[1] >= 0 ){
            df = Math.floor( df*(2+Ranks[1])/2 );
        }else{
            t = 2/(2+(-1)*Ranks[1]);
            df = Math.floor(df*t);
            dfC = Math.floor(dfC*t);
        }
        //砂嵐補正
        t = this.doReviceByFaze(51);
        df = Math.floor(df*t);
        dfC = Math.floor(dfC*t);
        //通常補正
        t = this.doReviceByFaze(50);
        df = this.round(df*t);
        dfC = this.round(dfC*t);
        if( df <= 0 ) df = 1;
        if( dfC <= 0 ) dfC = 1;
        //faze6:ダメージ計算
        damageC = Math.floor((damage*pwr*atC)/dfC);
        damageC = Math.floor(damageC/50)+2;
        damage = Math.floor((damage*pwr*at)/df);
        damage = Math.floor(damage/50)+2;
        for ( let i=61; i<=64; i++ ){
            if ( (t = this.doReviceByFaze(i)) != 1 ){
                damage = this.round(damage*t);
                damageC = this.round(damageC*t);
            }
        }
        damageC = this.round(damageC*1.5);
        //乱数生成
        for ( let i=0; i<16; i++ ){
            damages[i] = Math.floor(damage*(1-0.01*i));
            damagesC[i] = Math.floor(damageC*(1-0.01*i));
        }
        //諸補正
        for ( let i=65; i<=67; i++ ){
            if ( (t = this.doReviceByFaze(i)) != 1 ){
                damages = this.forRound(damages, function(x){
                    return doCalculate.round(x*t);
                });
                damagesC = this.forRound(damagesC, function(x){
                    return doCalculate.round(x*t);
                });
            }
        }
        //faze7:ダメージ値補正
        if ( (t = this.doReviceByFaze(70)) != 1 ){
            damages = this.forRound(damages, function(x){
                return doCalculate.round(x*t);
            });
            damagesC = this.forRound(damagesC, function(x){
                return doCalculate.round(x*t);
            });
        }
        //スナイパー
        if ( (t = this.doReviceByFaze(72)) != 1 ){
            damagesC = this.forRound(damagesC, function(x){
                return doCalculate.round(x*t);
            });
        }
        //守る貫通
        if ( (t = this.doReviceByFaze(71)) != 1 ){
            damages = this.forRound(damages, function(x){
                return doCalculate.round(x*t);
            });
            damagesC = this.forRound(damagesC, function(x){
                return doCalculate.round(x*t);
            });
        }
        //ゼロ判定
        for( i=15; i>=0; i-- ){
            if( damages[i] > 0 ) break;
            damages[i] = 1;
        }
        for( i=15; i>=0; i-- ){
            if( damagesC[i] > 0 ) break;
            damagesC[i] = 1;
        }
        return [damages, damagesC];
    },
    calculateTurn: function(tn, isReCal=1){
        //ターンの計算
        let refTurn = dmTurns[tn];
        if( MDMC.setted.pokeA == 1 && MDMC.setted.pokeB == 1 ){
            let damages = [];
            let damagesC = [];
            if( isReCal ){
                [damages, damagesC] = this.calculate(tn);
                refTurn.damages = damages;
                refTurn.damagesC = damagesC;
            }else{
                [damages, damagesC] = [refTurn.damages, refTurn.damagesC];
            }
            //ターン表示
            let range = "▷ " + damages[0] + "～" + damages[15];
            const maxHp = inData.pokeBHR;
            range += " (" + (Math.round(1000*damages[0]/maxHp)/10) + "～" + (Math.round(1000*damages[15]/maxHp)/10) + "%)";
            document.getElementById("MDMC_ttrs"+tn).innerText = range;
            //乱数
            let randN = "乱数▷";
            let randC = "急所▷";
            for( let i=0; i<16; i++ ){
                randN += " " + damages[i];
                randC += " " + damagesC[i];
            }
            document.getElementById("MDMC_ttrsR"+tn).innerText = randN + "\n" + randC;
        }else{
            document.getElementById("MDMC_ttrs"+tn).innerText = "▷ 0～0 (0～0%)";
            refTurn.damages = ZERO_DAMAGE;
            refTurn.damagesC = ZERO_DAMAGE;
        }
    },
    makeReList : function(node, write){
        //ノードの内容を補正リストに表示
        const refTurn = dmTurns[node];
        const refList = refTurn.RL;
        const ElName = "MDMC_inrevs" + write;
        let t; //一時変数
        //威力
        document.getElementById("dm_in_"+(10+write)+"_20").value = refTurn.pwr;
        //分類
        if( refTurn.cat[0] == 0 ){
            //物理
            document.getElementById(ElName + "_c").innerText = "物理";
            if( refTurn.cat[1] == 1 ){
                //分類反転
                document.getElementById(ElName + "_cr").style.display = "flex";
                document.getElementById(ElName + "_cr").innerText = "→特防";
            }else{
                document.getElementById(ElName + "_cr").style.display = "none";
            }
        }else{
            //特殊
            document.getElementById(ElName + "_c").innerText = "特殊";
            if( refTurn.cat[1] == 1 ){
                //分類反転
                document.getElementById(ElName + "_cr").style.display = "flex";
                document.getElementById(ElName + "_cr").innerText = "→防御";
            }else{
                document.getElementById(ElName + "_cr").style.display = "none";
            }
        }
        //ランク補正
        for ( let i=0; i<2; i++ ){
            if( (t = refTurn.rank[0]) == 0 ){
                document.getElementById(ElName + "_r"+i).style.display = "none";
            }else{
                if( t > 0 ) t = "+" + t;
                document.getElementById(ElName + "_r"+i).style.display = "flex";
                document.getElementById(ElName + "_r"+i).innerText = ((i==0)? "攻":"受") +"ランク" + t;    
            }
        }
        //急所ランク
        if( (t = refTurn.criticalRank) == 0 ){
            document.getElementById(ElName + "_r2").style.display = "none";
        }else{
            if( t > 0 ) t = "急所ランク+" + t;
            else t = "急所無効";
            document.getElementById(ElName + "_r2").style.display = "flex";
            document.getElementById(ElName + "_r2").innerText = t;
        }
        //その他補正
        const listLen = refList.length;
        const revsMax = ReList.ListMAX;
        let idNum = 0;
        for ( idNum=0; idNum<listLen; idNum++ ){
            if( refList[idNum].used == 0 ){
                document.getElementById(ElName + "_" + idNum).style.display = "none";
                continue;
            }else {
                document.getElementById(ElName + "_" + idNum).style.display = "flex";
                document.getElementById(ElName + "_" + idNum).innerText = refList[idNum].name;
            }
        }
        for ( idNum=idNum; idNum<revsMax; idNum++ ){
            document.getElementById(ElName + "_" + idNum).style.display = "none";
        }
    },
    plus : function(copyOrg=-1){
        //onclick:入力内容を追加ボタン
        const tn = dmTurnNum;
        if( tn >= TURN_MAX-1 ){
            if( tn == TURN_MAX ){
                //登録上限
                alert("攻撃の登録上限数は"+TURN_MAX+"個です");
                return 0;
            }else{
                //追修正：プラスボタンの消去
                document.getElementById("MDMC_ttLast").style.display = "none";
            }
        }
        //ノード追加
        document.getElementById("MDMC_tt"+tn).style.display = "flex";
        document.getElementById("MDMC_ttResult"+tn).style.display = "flex";
        dmTurnNum += 1;
        if( copyOrg == -1 ){
            //通常追加
            dmTurns[tn] = new MDMC_Turns();
            dmTurns[tn].used = 1;
            dmTurns[tn].power = document.getElementById("dm_in_"+(10+tn)+"_20").value;
            dmTurns[tn].cat = [((inData.catMode==1)? 1:0), 0];
            this.makeReList(tn,tn);
            doCalculate.reCalculate(tn); //計算
            //ダメージリストの調整
            dmTurnRandlist[tn] = 0;
            document.getElementById("MDMC_ttrs" + tn).style.display = "flex";
            document.getElementById("MDMC_ttrsR" + tn).style.display = "none";
            document.getElementById("dm_in_4_box" + tn).style.display = "none";
            //定数攻撃の調整
            document.getElementById("MDMC_ttCR_N" + tn).style.display = "flex";
            document.getElementById("MDMC_ttCR_S" + tn).style.display = "none";
        }else{
            //コピー追加
            let ORG = dmTurns[copyOrg];
            dmTurns[tn] = new MDMC_Turns(1, ORG.damages.slice(), ORG.damagesC.slice(),
                +ORG.pwr, ORG.cat.slice(), ORG.rank.slice(), +ORG.criticalRank, +ORG.continuation, +ORG.modeHalf, ReList.makeCopy(copyOrg));
            this.makeReList(copyOrg,tn);
            doCalculate.reCalculate(-2); //計算
            //ダメージ幅のコピー
            dmTurnRandlist[tn] = 0;
            document.getElementById("MDMC_ttrs" + tn).style.display = "flex";
            document.getElementById("MDMC_ttrsR" + tn).style.display = "none";
            document.getElementById("MDMC_ttrs"+tn).innerText = document.getElementById("MDMC_ttrs"+copyOrg).innerText;
            //乱数
            const dmgs = ORG.damages;
            const dmgsC = ORG.damagesC;
            let randN = "乱数▷";
            let randC = "急所▷";
            for( let i=0; i<16; i++ ){
                randN += " " + dmgs[i];
                randC += " " + dmgsC[i];
            }
            document.getElementById("MDMC_ttrsR"+tn).innerText = randN + "\n" + randC;
            //攻撃弾数
            if ( ORG.continuation > 1 ){
                document.getElementById("dm_in_4_box" + tn).style.display = "flex";
                document.getElementById("dm_in_4_" + tn).innerText = "×" + ORG.continuation;
            }else {
                document.getElementById("dm_in_4_box" + tn).style.display = "none";
            }
            //定数攻撃の調整
            const normalCardElement = document.getElementById("MDMC_ttCR_N" + tn);
            const specialCardElement = document.getElementById("MDMC_ttCR_S" + tn);
            if ( dmTurns[tn].modeHalf ){
                // 定数攻撃
                normalCardElement.style.display = "none";
                specialCardElement.style.display = "flex";
            }else{
                // 通常攻撃
                normalCardElement.style.display = "flex";
                specialCardElement.style.display = "none";
            }
        }
        return 1;
    },
    copy : function(org){
        //onclick:コピーボタン
        if (openTurn != -1) return -1;
        else return this.plus(org);
    },
    minus : function(t){
        //onclick:ターンの消去
        if (openTurn != -1) return -1;
        let preRandlist = dmTurnRandlist[t];
        for ( let i=t; i<dmTurnNum-1; i++ ){
            dmTurns[i] = dmTurns[i+1];
            //弾数の調整
            if ( dmTurns[i].continuation > 1 ){
                document.getElementById("dm_in_4_box" + i).style.display = "flex";
                document.getElementById("dm_in_4_" + i).innerText = "×" + dmTurns[i].continuation;
            }else {
                document.getElementById("dm_in_4_box" + i).style.display = "none";
                document.getElementById("dm_in_4_" + i).innerText = "×1";
            }
            //表示の変更
            this.makeReList(i,i);
            document.getElementById("MDMC_ttrs"+i).innerText = document.getElementById("MDMC_ttrs"+(i+1)).innerText;
            //乱数列表示
            const dmgs = dmTurns[i].damages;
            const dmgsC = dmTurns[i].damagesC;
            let randN = "乱数▷";
            let randC = "急所▷";
            for( let i=0; i<16; i++ ){
                randN += " " + dmgs[i];
                randC += " " + dmgsC[i];
            }
            document.getElementById("MDMC_ttrsR"+i).innerText = randN + "\n" + randC;
            if( preRandlist != dmTurnRandlist[i+1] ){
                if( preRandlist ){
                    //乱数列→通常
                    document.getElementById("MDMC_ttrs" + i).style.display = "flex";
                    document.getElementById("MDMC_ttrsR" + i).style.display = "none";
                }else{
                    //通常→乱数列
                    document.getElementById("MDMC_ttrs" + i).style.display = "none";
                    document.getElementById("MDMC_ttrsR" + i).style.display = "flex";
                }
                preRandlist = dmTurnRandlist[i+1];
                dmTurnRandlist[i] = preRandlist;
            }
            //定数攻撃の調整
            const normalCardElement = document.getElementById("MDMC_ttCR_N" + i);
            const specialCardElement = document.getElementById("MDMC_ttCR_S" + i);
            if ( dmTurns[i].modeHalf ){
                // 定数攻撃
                normalCardElement.style.display = "none";
                specialCardElement.style.display = "flex";
            }else{
                // 通常攻撃
                normalCardElement.style.display = "flex";
                specialCardElement.style.display = "none";
            }
        }
        dmTurns[dmTurnNum-1] = new MDMC_Turns();
        document.getElementById("MDMC_tt"+(dmTurnNum-1)).style.display = "none";
        document.getElementById("MDMC_ttResult"+(dmTurnNum-1)).style.display = "none";
        dmTurnNum -= 1;
        document.getElementById("MDMC_ttLast").style.display = "flex";
        //ステータス表示の変更
        MDMC.changeStatusCat();
        doCalculate.reCalculate(-2); //計算
        return 1;
    },
    sumEffortValue : function(){
        // 努力値の表示
        let AEsum, BEsum;
        const catStatus = dmStatusRef;
        const cat = inData.catMode;
        if( cat == 0 ){
            //物理
            AEsum = +inData.pokeAE + +((catStatus[0][1])? inData.pokeCE:0);
            BEsum = +inData.pokeBE + +inData.pokeBHE + +((catStatus[1][1])? inData.pokeDE:0);
        }else if( cat == 1 ){
            //特殊
            AEsum = +inData.pokeCE + +((catStatus[0][0])? inData.pokeAE:0);
            BEsum = +inData.pokeDE + +inData.pokeBHE + +((catStatus[1][0])? inData.pokeBE:0);
        }else{
            AEsum = +inData.pokeAE + +inData.pokeCE;
            BEsum = +inData.pokeBE + +inData.pokeDE + +inData.pokeBHE;
        }
        document.getElementById("MDMC_FREF0a").innerText = AEsum;
        document.getElementById("MDMC_FREF0b").innerText = BEsum;
    },
    reCalculate : function(tn=-1, isReCal=1){
        //結果の上書き
        if( tn == -1 ){
            //全ターンの上書き
            for( let i=0; i<dmTurnNum; i++ ){
                this.calculateTurn(i, isReCal);
            }
        }else if( tn >= 0 ){
            this.calculateTurn(tn, isReCal);
        }
        if( dmTurnNum != 0 ){
            this.makeResult();
        }else{
            this.makeHPber(0, 0)
            document.getElementById("MDMC_FR0").innerText = "0～0（0～0%）0% / 0%";
        }
        this.sumEffortValue();
    },
    eatBerry : (HP, optionBerry) => {
        //木のみを食べるかどうかの判定
        const { use, threshold, healValue } = optionBerry;
        if ( use ){
            for ( i=1; i<=threshold; i++ ){
                if ( HP.n[i] == 0 ) continue;
                HP.be[i+healValue] += HP.n[i];
                HP.n[i] = 0
            }
            if ( optionBerry.ateBerry == 0 ){
                const HPLEN = HP.n.length;
                let ate = 1;
                for ( i=threshold+1; i<HPLEN; i++ ){
                    if ( HP.n[i] != 0 ){
                        ate = 0;
                        break;
                    }
                }
                optionBerry.ateBerry = ate;
            }
        }
        return HP;
    },
    takeSlip : (HP, change) => {
        //定数ダメージ・回復の計算
        if ( change>0 ){
            const HPMAX = HP.n.length;
            HP.n = [HP.n[0]].concat(Array(change).fill(0), HP.n.slice(1, -change-1), [HP.n.slice(HPMAX-change-1).reduce((a, x) => a + x)]);
            HP.be = [HP.be[0]].concat(Array(change).fill(0), HP.be.slice(1, -change-1), [HP.be.slice(HPMAX-change-1).reduce((a, x) => a + x)]);
        }else {
            change *= -1;
            HP.n = [HP.n.slice(0, change+1).reduce((a, x) => a + x)].concat(HP.n.slice(change+1), Array(change).fill(0));
            HP.be = [HP.be.slice(0, change+1).reduce((a, x) => a + x)].concat(HP.be.slice(change+1), Array(change).fill(0));
        }
        return HP;
    },
    makeResult : function(){
        //瀕死率計算
        let percent = {n: [], be: []};
        let percentC = {n: [], be: []};
        let totalDamage = [0,0]; //暫定ダメージ
        let totalDamageP = [0,0]; //暫定割合ダメージ
        const plusTotalDamage = (damage, damage2=damage) => {
            totalDamage[0] += damage;
            if ( totalDamage[0] < 0 ) totalDamage[0] = 0;
            totalDamage[1] += damage2;
            if ( totalDamage[1] < 0 ) totalDamage[1] = 0;
        };
        let printResult = "";
        let dead; //瀕死率
        let deadC; //急所込み瀕死率
        let resultLog = "";
        let resultDead = false;
        const HPMAX = +inData.pokeBHR;
        if(HPMAX > 1000){
            MDMC.dmError("HPの上限は1000です");
            return -1;
        }

        // 回復木の実の準備
        const optionBerry = {
            use : false,
            threshold : 0,
            healValue : 0,
            log : "",
            ateBerry : 0, //0:未発動, 1:発動, 2:発動済み
        };
        if ( inData.HPoption.Obon.use ){
            optionBerry.use = true;
            optionBerry.threshold = ~~( HPMAX/inData.HPoption.Obon.THRESHOLD )
            optionBerry.healValue = ~~( HPMAX/inData.HPoption.Obon.EATRATE )
            optionBerry.log = "\n▷ " + inData.HPoption.Obon.log;
        }else if ( inData.HPoption.Berry.use ){
            optionBerry.use = true;
            optionBerry.threshold = ~~( HPMAX/inData.HPoption.Berry.THRESHOLD )
            optionBerry.healValue = ~~( HPMAX/inData.HPoption.Berry.EATRATE )
            optionBerry.log = "\n▷ " + inData.HPoption.Berry.log;
        }else {
            optionBerry.use = false;
        }

        // 定数ダメージ配列の準備
        const optionSlip = {
            use : false,
            table : [0, 0, 0, 0],
            useBatPoison : false,
            badPoison : [0, 0, 0, 0, 0],
            slipTotal : 0,
            slipLogBase : ["", ""],
            slipLog : function(turn){
                if (this.use) return "\n▷" + this.slipLogBase[0] + ((this.useBatPoison)? (" " + inData.HPoption.BadPoison.log + ": " + this.badPoison[turn]): "") + this.slipLogBase[1];
                else return ""
            }
        };
        if ( inData.HPoption.Weather.use ){
            optionSlip.use = true;
            optionSlip.table[0] = ~~( HPMAX/inData.HPoption.Weather.RATE );
            optionSlip.slipLogBase[0] += " " + inData.HPoption.Weather.log + ": " + optionSlip.table[0];
        }
        [ inData.HPoption.GF,
          inData.HPoption.Leftovers,
          inData.HPoption.MoveRejene,
          inData.HPoption.PoisonHeal,
        ].forEach( (slip) => {
            if ( slip.use ){
                optionSlip.use = true;
                let d = ~~( HPMAX/slip.RATE )
                optionSlip.table[1] += d;
                optionSlip.slipLogBase[0] += " " + slip.log + ": " + d;
            }
        });
        if ( inData.HPoption.Yadorigi.use ){
            optionSlip.use = true;
            let d = inData.HPoption.Yadorigi.healValue
            optionSlip.table[1] += d;
            optionSlip.slipLogBase[0] += " " + inData.HPoption.Yadorigi.log + ": " + d;
        }
        [ inData.HPoption.Poison,
            inData.HPoption.Burn,
          ].forEach( (slip) => {
              if ( slip.use ){
                  optionSlip.use = true;
                  let d = ~~( HPMAX/slip.RATE );
                  optionSlip.table[2] += d;
                  optionSlip.slipLogBase[0] += " " + slip.log + ": " + d;
              }
          });
        if ( inData.HPoption.BadPoison.use ){
            const BPRATE = inData.HPoption.BadPoison.BASERATE;
            optionSlip.use = true;
            optionSlip.useBatPoison = true;
            optionSlip.badPoison = [~~(HPMAX/BPRATE), ~~(2*HPMAX/BPRATE), ~~(3*HPMAX/BPRATE), ~~(4*HPMAX/BPRATE), ~~(5*HPMAX/BPRATE)];
        }
        [ inData.HPoption.Bind,
          inData.HPoption.Salt1,
          inData.HPoption.Salt2,
          ].forEach( (slip) => {
            if ( slip.use ){
                optionSlip.use = true;
                let d = ~~( HPMAX/slip.RATE );
                optionSlip.table[3] += d;
                optionSlip.slipLogBase[1] += " " + slip.log + ": " + d;
            }
        });

        optionSlip.table.forEach( (d) => optionSlip.slipTotal += d );

        // ステロダメージ
        let steroDamage = 0;
        if( inData.HPoption.Stero.use ){
            const d = ~~( HPMAX / inData.HPoption.Stero.DAMAGE[inData.HPoption.Stero.index] );
            steroDamage += d;
            resultLog += "\n▷ ステロダメージ: " + d;
        }
        // まきびしダメージ
        if( inData.HPoption.Makibishi.use ){
            const d = ~~( HPMAX / inData.HPoption.Makibishi.DAMAGE[inData.HPoption.Makibishi.index] );
            steroDamage += d;
            resultLog += "\n▷ まきびしダメージ: " + d;
        }
        plusTotalDamage(steroDamage);

        // HPゲージの準備
        percent.n = Array(HPMAX+1).fill(0);
        percent.be = Array(HPMAX+1).fill(0);
        percent.n[HPMAX-steroDamage] = 100;
        percentC.n = Array(HPMAX+1).fill(0);
        percentC.be = Array(HPMAX+1).fill(0);
        percentC.n[HPMAX-steroDamage] = 100;

        // 毎ターンの計算
        for ( let turn=0; turn<dmTurnNum; turn++ ){
            let dmgs = dmTurns[turn].damages;
            let dmgsC = dmTurns[turn].damagesC;
            let CR = 1/24; // 急所確率
            switch( dmTurns[turn].criticalRank ){
                case 0 : CR = 1/24; break;
                case 1 : CR = 1/8; break;
                case 2 : CR = 1/2; break;
                case 3 : CR = 1; break;
                case -1 : CR = 0; break;
                default: break;
            }
            // 確定急所の時、急所ダメージを計算に適用する
            if ( CR == 1 ){
                dmgs = dmgsC;
            }

            let ContinueNum = 1;
            if ( dmTurns[turn].modeHalf ){
                //相手のHPを半分にする
                dmgs = [10000, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                let pro = {n:Array(HPMAX+1).fill(0), be:Array(HPMAX+1).fill(0)};
                let proC = {n:Array(HPMAX+1).fill(0), be:Array(HPMAX+1).fill(0)};
                let hpD;
                //ダメージ畳み込み
                for ( let hp=0; hp<=HPMAX; hp++ ){
                    if( percent.n[hp] != 0 ) {
                        hpD = ~~(hp/2);
                        pro.n[hp-hpD] += percent.n[hp];
                        if ( dmgs[15] < hpD ){
                            dmgs[15] = hpD;
                            totalDamage[1] = HPMAX - hp + hpD;
                        }
                        if( dmgs[0] > hpD ){
                            dmgs[0] = hpD;
                            totalDamage[0] = HPMAX - hp + hpD;
                        }
                    }
                    if( percent.be[hp] != 0 ) {
                        hpD = ~~(hp/2);
                        pro.be[hp-hpD] += percent.be[hp];
                        if ( optionBerry.ateBerry ){
                            if ( dmgs[15] < hpD ){
                                dmgs[15] = hpD;
                                totalDamage[1] = HPMAX - hp + hpD;
                            }
                            if( dmgs[0] > hpD ){
                                dmgs[0] = hpD;
                                totalDamage[0] = HPMAX - hp + hpD;
                            }
                        }
                    }
                    //急所込みダメージ
                    if( percentC.n[hp] != 0 ) {
                        hpD = ~~(hp/2);
                        proC.n[hp-hpD] += percentC.n[hp];
                    }
                    if( percentC.be[hp] != 0 ) {
                        hpD = ~~(hp/2);
                        proC.be[hp-hpD] += percentC.be[hp];
                    }
                }
                percent = this.eatBerry(pro, optionBerry);
                percentC = this.eatBerry(proC, optionBerry);
                // ログの更新
                resultLog += "\n▶ 攻撃" + (turn+1) + " HPを半分にする：" + dmgs[0] + "～" + dmgs[15] + " / " + HPMAX;

            }else {
                //通常攻撃
                ContinueNum = dmTurns[turn].continuation;
                for ( let tj=0; tj<ContinueNum; tj++ ){
                    let pro = {n:Array(HPMAX+1).fill(0), be:Array(HPMAX+1).fill(0)};
                    let proC = {n:Array(HPMAX+1).fill(0), be:Array(HPMAX+1).fill(0)};
                    let hpR;

                    //木の実発動判定
                    if ( optionBerry.ateBerry == 1 ){
                        optionBerry.ateBerry = 2;
                        resultLog += optionBerry.log + ":" + optionBerry.healValue;
                        plusTotalDamage( -optionBerry.healValue );
                    }

                    //ダメージ畳み込み
                    for ( let hp=0; hp<=HPMAX; hp++ ){
                        if( percent.n[hp] != 0 ) {
                            for( let j=0; j<16; j++ ){
                                hpR = hp - dmgs[j];
                                if( hpR < 0 ) hpR = 0;
                                pro.n[hpR] += percent.n[hp] / 16;
                            }
                        }
                        if( percent.be[hp] != 0 ) {
                            for( let j=0; j<16; j++ ){
                                hpR = hp - dmgs[j];
                                if( hpR < 0 ) hpR = 0;
                                pro.be[hpR] += percent.be[hp] / 16;
                            }
                        }
                    }
                    percent = this.eatBerry(pro, optionBerry);
                    //急所込みダメージ畳み込み
                    if( CR == 0 ){
                        percentC = percent;
                    }else{
                        for ( let hp=0; hp<=HPMAX; hp++ ){
                            if( percentC.n[hp] != 0 ){
                                for( let j=0; j<16; j++ ){
                                    //通常
                                    hpR = hp - dmgs[j];
                                    if( hpR < 0 ) hpR = 0;
                                    proC.n[hpR] += (1-CR) * percentC.n[hp] / 16;
                                    //急所
                                    hpR = hp - dmgsC[j];
                                    if( hpR < 0 ) hpR = 0;
                                    proC.n[hpR] += CR * percentC.n[hp] / 16;
                                }
                            }
                            if( percentC.be[hp] != 0 ){
                                for( let j=0; j<16; j++ ){
                                    //通常
                                    hpR = hp - dmgs[j];
                                    if( hpR < 0 ) hpR = 0;
                                    proC.be[hpR] += (1-CR) * percentC.be[hp] / 16;
                                    //急所
                                    hpR = hp - dmgsC[j];
                                    if( hpR < 0 ) hpR = 0;
                                    proC.be[hpR] += CR * percentC.be[hp] / 16;
                                }
                            }
                        }
                        percentC = this.eatBerry(proC, optionBerry);
                    }
                    // ログの更新
                    resultLog += "\n▶ 攻撃" + (turn+1) + " ダメージ：" + dmgs[0] + "～" + dmgs[15] + " / " + HPMAX;
                }
                //ダメージ適用
                plusTotalDamage(dmgs[0]*ContinueNum, dmgs[15]*ContinueNum);
            }

            // 暫定ダメージ表示
            totalDamageP[0] = Math.round(1000*totalDamage[0]/HPMAX)/10;
            totalDamageP[1] = Math.round(1000*totalDamage[1]/HPMAX)/10;
            this.makeHPber( ...totalDamageP, "MDMC_FRber_t"+turn );
            dead = Math.round(10*(percent.n[0] + percent.be[0]))/10;
            deadC = Math.round(10*(percentC.n[0] + percentC.be[0]))/10;
            document.getElementById("MDMC_FR_t"+turn).innerText = 
                totalDamage[0] + "～" + totalDamage[1] + "（" + totalDamageP[0] + "～" + totalDamageP[1] + "%）" + dead + "% / " + deadC + "%";

            // 被弾直後のデータ処理
            if ( turn == dmTurnNum-1 ){
                printResult = totalDamage[0] + "～" + totalDamage[1] + "（" + totalDamageP[0] + "～" + totalDamageP[1] + "%）" + dead + "% / " + deadC + "%";
                // ログの更新
                resultLog += "\n最終ターン被弾直後\n  " + totalDamage[0] + "～" + totalDamage[1] + " / " + HPMAX +
                    "（" + totalDamageP[0] + "～" + totalDamageP[1] + "%）\n  瀕死率:" + dead + "%（実質瀕死率:" + deadC + "%）";
                // 死亡時のダメージ補正
                if ( totalDamage[0] >= HPMAX && totalDamage[1] < HPMAX ){
                    totalDamage[0] = HPMAX - 1;
                    resultDead = true;
                }else if ( totalDamage[1] >= HPMAX ){
                    resultLog += "\n  瀕死確定";
                    break;
                }
            }

            //木の実発動判定
            if ( optionBerry.ateBerry == 1 ){
                optionBerry.ateBerry = 2;
                resultLog += optionBerry.log + ":" + optionBerry.healValue;
                plusTotalDamage( -optionBerry.healValue );
            }

            // HP配列に定数ダメージ・回復を適用
            if ( optionSlip.use ){
                if ( optionSlip.table[0] != 0 ){
                    //天候ダメージ
                    percent = this.eatBerry( this.takeSlip(percent, optionSlip.table[0]), optionBerry);
                    percentC = this.eatBerry( this.takeSlip(percentC, optionSlip.table[0]), optionBerry);
                }
                if ( optionSlip.table[1] != 0 ){
                    //回復
                    percent = this.takeSlip(percent, optionSlip.table[1]), optionBerry;
                    percentC = this.takeSlip(percentC, optionSlip.table[1]), optionBerry;
                }
                if ( optionSlip.table[2] != 0 ){
                    //状態異常ダメージ
                    percent = this.eatBerry( this.takeSlip(percent, optionSlip.table[2]), optionBerry);
                    percentC = this.eatBerry( this.takeSlip(percentC, optionSlip.table[2]), optionBerry);
                }else if ( optionSlip.useBatPoison ){
                    //猛毒ダメージ
                    percent = this.eatBerry( this.takeSlip(percent, optionSlip.badPoison[turn]), optionBerry);
                    percentC = this.eatBerry( this.takeSlip(percentC, optionSlip.badPoison[turn]), optionBerry);
                }
                if ( optionSlip.table[3] != 0 ){
                    //バインド・塩漬けダメージ
                    percent = this.eatBerry( this.takeSlip(percent, optionSlip.table[3]), optionBerry);
                    percentC = this.eatBerry( this.takeSlip(percentC, optionSlip.table[3]), optionBerry);
                }
            }

            // ログの更新
            resultLog += optionSlip.slipLog(turn);

            //木の実発動判定
            if ( optionBerry.ateBerry == 1 ){
                optionBerry.ateBerry = 2;
                resultLog += optionBerry.log + ":" + optionBerry.healValue;
                plusTotalDamage( -optionBerry.healValue );
            }

            // 暫定ダメージに定数ダメージ・回復を適用
            plusTotalDamage( -(optionSlip.slipTotal + optionSlip.badPoison[turn]) );
        }

        //HPバー更新
        this.makeHPber(...totalDamageP);
        document.getElementById("MDMC_FR0").innerText = printResult;
        // 計算結果の整理
        totalDamageP[0] = Math.round(1000*totalDamage[0]/HPMAX)/10;
        totalDamageP[1] = Math.round(1000*totalDamage[1]/HPMAX)/10;
        dead = Math.round(10*(percent.n[0] + percent.be[0]))/10;
        deadC = Math.round(10*(percentC.n[0] + percentC.be[0]))/10;
        //ログの表示
        resultLog += "\n最終ターン終了時\n  " + ((resultDead)? HPMAX + " or " : "") + totalDamage[0] + "～" + totalDamage[1] + " / " + HPMAX + 
            "（" + ((resultDead)? "100% or " : "") + totalDamageP[0] + "～" + totalDamageP[1] + "%）\n  瀕死率:" + dead + "%（実質瀕死率:" + deadC + "%）";
        document.getElementById("MDMC_resultLog").innerText = "計算結果\n" + printResult + resultLog;
        percent = null;
        percentC = null;
        return 1;
    },
    resetTurns : function(){
        //ターンノードの全消去
        const TURNMAX = this.turn;
        for( let i=0; i<TURNMAX; i++ ){
            this.Turns[i].used = 0;
            document.getElementById("MDMC_tt"+i).style.display = "none";
            document.getElementById("MDMC_ttResult"+i).style.display = "none";
        }
        this.turn = 0;
    }
}

let MDMC = {
    setted : {
        pokeA : 0, //入力済み判定
        pokeB : 0, //入力済み判定
    },
    selectionId : -1,
    nowSelecting : {
        pn : -1,
        idn : -1
    },
    dmError : function(str){
        alert(str+"\n制作者までご連絡いただければ幸いです");
    },
    dmInputLimit : function(pn, idn, min, max){
        //入力数値の範囲調整
        const inputId = document.getElementById("dm_in_" + pn + "_" + idn);
        if( inputId.value < min ){
            inputId.value = min;
        }else if( inputId.value > max){
            inputId.value = max;
        }
    },
    removeList : function(pn){
        //ポケモン名入力候補の位置移動
        const textBox = document.getElementById("dm_in_" + pn + "_0");
        const boxPoint = textBox.getBoundingClientRect();
        const topPoint = Math.ceil(window.pageYOffset + boxPoint.bottom);
        const searchList = document.getElementById("dmList0");
        const leftPoint = window.pageXOffset + boxPoint.left;
        searchList.style.top = topPoint + "px";
        searchList.style.left = leftPoint + "px";
    },
    inputHelp : function(pn){
        //ポケモン名入力候補の表示
        //const inputText = document.getElementById("dm_in_" + pn + "_0");
        const inputText = document.getElementById("dm_in_" + pn + "_0").value.slice();
        if( inputText === "" ){
            document.getElementById("dmList0").style.display = "none";
        }else{
            document.getElementById("dmList0").style.display = "block";
            this.removeList(pn);
        }
        let selectBoxes = 0;
        let listing;
        let i;
        let perfect = -1; // 完全一致判定
        // 平仮名参照検索
        for( i=0; i<MDMC_POKEMAX; i++ ){
            listing = document.getElementById("dmList0_" + i);
            if(listing.getAttribute("name").startsWith(inputText)){
                listing.style.display = "block";
                selectBoxes++;
                this.selectingId = +listing.value;
                if( selectBoxes > 5 ) break;
            }else{
                listing.style.display = "none";
            }
        }
        if( selectBoxes == 0 ){
            // 汎参照検索
            for( i=0; i<MDMC_POKEMAX; i++ ){
                listing = document.getElementById("dmList0_" + i);
                if(listing.innerText.startsWith(inputText)){
                    listing.style.display = "block";
                    selectBoxes++;
                    this.selectingId = +listing.value;
                    if( listing.innerText === inputText ){
                        perfect = +listing.value;
                    }
                    if( selectBoxes > 5 ) break;
                }else{
                    listing.style.display = "none";
                }
            }
        }
        for( ; i<MDMC_POKEMAX; i++) document.getElementById("dmList0_" + i).style.display = "none";
        if( perfect != -1 ){
            // 完全一致
            this.selectingId = perfect;
        }else if( selectBoxes != 1 ){
            this.selectingId = -1;
        }
    },
    killLists : function(){
        //入力候補リストの全消去
        document.getElementById("dmList0").style.display = "none"; //ポケモン名
    },
    calculateRe : function(pn, reIdn ,status, ef){
        //実数値計算
        let Re;
        if( reIdn == 2 ){
            //AB実数値
            Re = +status*2 + ((pn==1)? +inData.pokeAI:+inData.pokeBI) + +ef/4 ;
            Re = Math.floor( Re *((pn==1)? +inData.levelA:+inData.levelB) /100 +5 );
            Re = Math.floor( Re *((pn==1)? +inData.pokeAN:+inData.pokeBN) );
        }else if( reIdn == 7 ){
            //CD実数値
            Re = +status*2 + ((pn==1)? +inData.pokeCI:+inData.pokeDI) + +ef/4 ;
            Re = Math.floor( Re *((pn==1)? +inData.levelA:+inData.levelB) /100 +5 );
            Re = Math.floor( Re *((pn==1)? +inData.pokeCN:+inData.pokeDN) );
        }else {
            //H実数値
            Re = Math.floor( +status*2 + +inData.pokeBHI + +ef/4 );
            Re = Math.floor( Re * +inData.levelB / 100 + +inData.levelB + 10 );
        }
        return Re;
    },
    changeRe2St : function(pn, idn){
        //実数値→努力値の値補完(変数変更・表示値変更)
        let oldRe = 0;
        if( idn < 10 ){ //AB実数値
            let status = 0;
            let nowRe = 0;
            if( pn==1 ){
                status = ((idn == 7)? inData.pokeA[4]:inData.pokeA[2]);
                nowRe = ((idn == 7)? inData.pokeCR:inData.pokeAR);
            }else {
                status = ((idn == 7)? inData.pokeB[5]:inData.pokeB[3]);
                nowRe = ((idn == 7)? inData.pokeDR:inData.pokeBR);
            }
            let ef = 0;
            for( ef=0; ef<=252; ef+=4 ){
                oldRe = this.calculateRe(pn, idn ,status, ef);
                if(oldRe == nowRe){
                    break;
                }else if( oldRe > nowRe ){
                    ef = 0;
                    break;
                }
            }
            if( ef==256 ) ef = 0;
            document.getElementById("dm_in_" + pn + "_" + (idn+1)).value = ef;
            if( pn==1 ){
                if( idn == 7 ) inData.pokeCE=ef
                else inData.pokeAE=ef
            }else {
                if( idn == 7 ) inData.pokeDE=ef
                else inData.pokeBE=ef
            }
        }else { //H実数値
            let ef = 0;
            const nowRe = inData.pokeBHR;
            for( ef=0; ef<=252; ef+=4 ){
                oldRe = this.calculateRe(pn, idn ,+inData.pokeB[1], ef);
                if(oldRe == nowRe){
                    break;
                }else if( oldRe > nowRe ){
                    ef = 0;
                    break;
                }
            }
            if( ef==256 ) ef = 0;
            document.getElementById("dm_in_2_13").value = ef;
            inData.pokeBHE = ef;
        }
    },
    changeSt2Re : function(pn, idn){
        //レベル/努力値/個体値/性格補正→実数値の値補完(変数変更・表示値変更)
        let newRe = 0;
        if( idn<=10 ){ //ABCD実数値
            const reIdn = (( idn > 6 )? 7:2);
            let status = 0;
            let ef = 0;
            if( pn==1 ){
                status = (( idn > 6 )? inData.pokeA[4]:inData.pokeA[2]);
                ef = (( idn > 6 )? inData.pokeCE:inData.pokeAE);
            }else {
                status = (( idn > 6 )? inData.pokeB[5]:inData.pokeB[3]);
                ef = (( idn > 6 )? inData.pokeDE:inData.pokeBE);
            }
            newRe = this.calculateRe(pn, reIdn ,status, ef);
            if( pn==1 ){
                if( idn > 6 ) inData.pokeCR = newRe;
                else inData.pokeAR = newRe;
            }else {
                if( idn > 6 ) inData.pokeDR = newRe;
                else inData.pokeBR = newRe;
            }
            document.getElementById("dm_in_" + pn + "_" + reIdn).value = newRe;
        }else { //H実数値
            newRe = this.calculateRe(pn, 12 ,+inData.pokeB[1], inData.pokeBHE);
            inData.pokeBHR = newRe;
            document.getElementById("dm_in_2_12").value = newRe;
        }
    },
    setInformation : async function(pn, idn, setId){
        //変数の代入等
        const select = document.getElementById("dmList" + idn + "_" + setId);
        const textBox = document.getElementById("dm_in_" + pn + "_" + idn);
        switch(idn){
            case 1: //レベル
                ((pn==1)? inData.levelA=textBox.value : inData.levelB=textBox.value);
                this.changeSt2Re(pn, idn);
                if(pn==2) this.changeSt2Re(pn, 12);
                doCalculate.reCalculate(-1); //計算
                break;
            case 2: //AB実数値
                ((pn==1)? inData.pokeAR=textBox.value : inData.pokeBR=textBox.value);
                this.changeRe2St(pn, idn);
                doCalculate.reCalculate(-1); //計算
                break;
            case 7: //CD実数値
                ((pn==1)? inData.pokeCR=textBox.value : inData.pokeDR=textBox.value);
                this.changeRe2St(pn, idn);
                doCalculate.reCalculate(-1); //計算
                break;
            case 12: //H実数値
                inData.pokeBHR = textBox.value;
                this.changeRe2St(pn, idn);
                doCalculate.reCalculate(-1, 0); //計算
                break;
            case 3: //AB努力値
                ((pn==1)? inData.pokeAE=textBox.value : inData.pokeBE=textBox.value);
                this.changeSt2Re(pn, idn);
                doCalculate.reCalculate(-1); //計算
                break;
            case 8: //CD努力値
                ((pn==1)? inData.pokeCE=textBox.value : inData.pokeDE=textBox.value);
                this.changeSt2Re(pn, idn);
                doCalculate.reCalculate(-1); //計算
                break;
            case 13: //H努力値
                inData.pokeBHE = textBox.value;
                this.changeSt2Re(pn, idn);
                doCalculate.reCalculate(-1, 0); //計算
                break;
            case 4: //AB個体値
                ((pn==1)? inData.pokeAI=textBox.value : inData.pokeBI=textBox.value);
                this.changeSt2Re(pn, idn);
                doCalculate.reCalculate(-1); //計算
                break;
            case 9: //CD個体値
                ((pn==1)? inData.pokeCI=textBox.value : inData.pokeDI=textBox.value);
                this.changeSt2Re(pn, idn);
                doCalculate.reCalculate(-1); //計算
                break;
            case 14: //H個体値
                inData.pokeBHI = textBox.value;
                this.changeSt2Re(pn, idn);
                doCalculate.reCalculate(-1, 0); //計算
                break;
            case 20: //技威力
                dmTurns[pn-10].pwr = +textBox.value;
                doCalculate.reCalculate(pn-10); //計算
                break;
            case 15: //宿り木の相手HP（旧：回復量）
                const enemyHP = textBox.value
                inData.HPoption.Yadorigi.enemyHP = enemyHP;
                const healValue = Math.floor( enemyHP/inData.HPoption.Yadorigi.ENEMYRATE );
                inData.HPoption.Yadorigi.healValue = healValue;
                document.getElementById("dm_in_2_15_hv").innerHTML = healValue;
                doCalculate.reCalculate(-2, 0); //計算
                break;
            case 0: //ポケモン名
                if(pn==1) inData.pokeA[0] = select.innerText;
                else inData.pokeB[0] = select.innerText;
                document.getElementById("dm_in_" + pn + "_0").value = select.innerText;
                if(pn==1) inData.pokeA = await this.requestData(setId);
                else inData.pokeB = await this.requestData(setId);
                document.getElementById("dm_in_" + pn + "_0").value = ((pn==1)? inData.pokeA[0]:inData.pokeB[0]);
                ((pn==1)? MDMC.setted.pokeA=1 : MDMC.setted.pokeB=1 );//初期調整
                this.changeSt2Re(pn, 2);
                this.changeSt2Re(pn, 7);
                if(pn==2) this.changeSt2Re(pn, 12);
                doCalculate.reCalculate(-1); //計算
                break;
            default: this.dmError("入力候補エラー"); break;
        }
        this.killLists();
    },
    selectList : function(setId){
        //onclick:リスト選択時の実行関数（ポケモン名）
        this.setInformation(this.nowSelecting.pn, 0, setId);
        this.selectingId = -1;
        this.nowSelecting.pn = -1;
        this.nowSelecting.idn = -1;
        this.killLists();
        return 0;
    },
    finishSelect : function(pn, idn){
        //onchange:入力完了関数
        if( idn != 0 ){
            //数値入力
            const textBox = document.getElementById("dm_in_" + pn + "_" + idn);
            if( isNaN(textBox.value) || /*textBox.value === "" ||*/ !Number.isInteger(+textBox.value) ){
                // 無効なテキストボックス内の値を補完し、数値更新を行わない
                switch(idn){
                    case 1: //レベル
                        textBox.value =  ((pn==1)? inData.levelA:inData.levelB);
                        break;
                    case 2: //AB実数値
                        textBox.value = ((pn==1)? inData.pokeAR:inData.pokeBR);
                        break;
                    case 3: //AB努力値
                        textBox.value = ((pn==1)? inData.pokeAE:inData.pokeBE);
                        break;
                    case 4: //AB個体値
                        textBox.value = ((pn==1)? inData.pokeAI:inData.pokeBI);
                        break;
                    case 7: //CD実数値
                        textBox.value = ((pn==1)? inData.pokeCR:inData.pokeDR);
                        break;
                    case 8: //CD努力値
                        textBox.value = ((pn==1)? inData.pokeCE:inData.pokeDE);
                        break;
                    case 9: //CD個体値
                        textBox.value = ((pn==1)? inData.pokeCI:inData.pokeDI);
                        break;
                    case 20: //威力
                        textBox.value = dmTurns[pn-10].pwr;
                        break;
                    case 12: //H実数値
                        textBox.value = inData.pokeBHR;
                        break;
                    case 13: //H努力値
                        textBox.value = inData.pokeBHE;
                        break;
                    case 14: //H個体値
                        textBox.value = inData.pokeBHI;
                        break;
                    case 15: //宿り木の相手HP（旧：回復量）
                        textBox.value = inData.HPoption.Yadorigi.enemyHP;
                        break;
                    default:
                        this.dmError("入力値修正エラー");
                        break;
                }
            }else {
                switch(idn){
                    case 20: //威力
                        if( textBox.value == 0){
                            textBox.value = 1;
                        }
                        break;
                    case 1: //レベル
                    case 2: //AB実数値
                    case 7: //CD実数値
                    case 12: //H実数値
                        if(textBox.value == 0) textBox.value = 1;
                        break;
                    case 3: //AB努力値
                    case 4: //AB個体値
                    case 8: //CD努力値
                    case 9: //CD個体値
                    case 13: //H努力値
                    case 14: //H個体値
                    case 15: //宿り木の相手HP（旧：回復量）
                        if( textBox.value === "" ) textBox.value = 0;
                        break;
                    default:
                        this.dmError("入力値異常検出エラー");
                        break;
                }
                this.setInformation(pn, idn, 0);
            }
        }else { //ポケモン選択入力
            let nowId = -1;
            const textBox = document.getElementById("dm_in_" + pn + "_" + idn);
            nowId = ((pn==1)? inData.pokeAID:inData.pokeBID);
            if( (this.selectingId != -1) && (this.selectingId != nowId) ){
                //入力候補が一つの場合、選択
                this.setInformation(pn, idn, this.selectingId);
            }else {
                //異常な入力内容に対する補完
                if( ((pn==1)? MDMC.setted.pokeA:MDMC.setted.pokeB ) ){
                    textBox.value = ((pn==1)? inData.pokeA[0]:inData.pokeB[0]);
                }else{
                    textBox.value = "";
                }
            }
            //未入力状態に
            this.selectingId = -1
            this.nowSelecting.pn = -1;
            this.nowSelecting.idn = -1;
        }
        this.killLists();
    },
    dmInput : function(pn, idn){
        //oninput:入力途中関数
        MDMC.nowSelecting.pn = pn;
        MDMC.nowSelecting.idn = idn;
        switch(idn){
            case 1: //レベル
                MDMC.dmInputLimit(pn, idn, 0, 100); break;
            case 2: //AB実数値
            case 7: //CD実数値
            case 12: //H実数値
                MDMC.dmInputLimit(pn, idn, 0, 1500); break;
            case 20: //技威力
                MDMC.dmInputLimit(pn, idn, 0, 500); break;
            case 15: //宿り木の相手HP（旧：回復量）
                MDMC.dmInputLimit(pn, idn, 0, 1000); break;
            case 3: //努力値
            case 8:
            case 13:
                MDMC.dmInputLimit(pn, idn, 0, 252); break;
            case 4: //個体値
            case 9:
            case 14:
                MDMC.dmInputLimit(pn, idn, 0, 31); break;
            case 0: //ポケモン名
                MDMC.inputHelp(pn);
                if( this.selectingId == ((pn==1)? inData.pokeAID:inData.pokeBID )) this.selectingId = -1;
                break;
            default: MDMC.dmError("入力候補エラー"); break;
        }
    },
    dmOpenRev : function(idn){
        //補正リストを開く
        openTurn = idn;
        const refTurn = dmTurns[idn];
        const TURN_CARD = document.getElementById("MDMC_tt" + idn);
        const BASE_ID = document.getElementById("MDMC_RLbase");
        const PARENT_ID = document.getElementById("MDMC_RLpage");
        PARENT_ID.style.display = "flex";
        PARENT_ID.insertBefore(TURN_CARD, BASE_ID);
        //補正リストの調整
        Revices.renewRevices(idn);
        //ランク
        let ranks;
        ranks = refTurn.rank[0];
        document.getElementById("dm_in_3_0").innerText = ((ranks>0)? "+"+ranks:ranks);
        ranks = refTurn.rank[1];
        document.getElementById("dm_in_3_1").innerText = ((ranks>0)? "+"+ranks:ranks);
        ranks = refTurn.criticalRank;
        if( ranks > 0 ) ranks = "+" + ranks;
        else if ( ranks < 0 ) ranks = "急所無効";
        document.getElementById("dm_in_3_2").innerText = ranks;
        //分類
        const CATB_A = document.getElementById("dm_button_RLcat_a");
        const CATB_B = document.getElementById("dm_button_RLcat_b");
        if( refTurn.cat[0] ){
            //特殊
            CATB_A.style.borderColor = "#ddd";
            CATB_B.style.borderColor = "#2a72dd";
        }else{
            //物理
            CATB_A.style.borderColor = "#ff0000";
            CATB_B.style.borderColor = "#ddd";
        }
        //分類反転
        if( refTurn.cat[1] ){
            //反転
            document.getElementById("dm_button_RLcat_c").style.background = "#ffC000";
        }else{
            //通常
            document.getElementById("dm_button_RLcat_c").style.background = "#ffffff";
        }

        //弾数制御
        document.getElementById("dm_in_4_Revs").innerText = dmTurns[idn].continuation;

        //定数攻撃判定
        const guardHeight = document.getElementById("MDMC_RScrollWindow").scrollHeight;
        const guardElement = document.getElementById("MDMC_RLspecialGuard");
        const buttonElement = document.getElementById("dm_button_RLspecial");
        if ( dmTurns[idn].modeHalf ){
            // 定数攻撃
            guardElement.style.display = "block";
            buttonElement.style.backgroundColor = "#ffc000";
            guardElement.style.height = guardHeight + "px";
        }else{
            // 通常攻撃
            guardElement.style.display = "none";
            buttonElement.style.backgroundColor = "#ffffff";
        }
    },
    dmCloseRev : function(){
        const idn = +openTurn;
        const TURN_CARD = document.getElementById("MDMC_tt" + idn);
        const PARENT_ID = document.getElementById("MDMC_ttBox");
        const NEXT_ID = document.getElementById("MDMC_ttResult" + idn);
        PARENT_ID.insertBefore(TURN_CARD, NEXT_ID);
        document.getElementById("MDMC_RLpage").style.display = "none";
        openTurn = -1;
        //追加修正：瀕死率計算の実行:いらない？
    },
    changeStatusCat : function(){
        //状況に応じてステータス表示を変更する
        let nowCat = inData.catMode;
        if ( nowCat == 2 ) return 1;
        let catStatus = [[0, 0], [0, 0]];
        let refCat;
        for ( let i=0; i<dmTurnNum; i++ ){
            refCat = dmTurns[i].cat;
            catStatus[0][refCat[0]] = 1;
            catStatus[1][refCat[0]^refCat[1]] = 1;
        }
        dmStatusRef = catStatus;
        const ST_ID = "MDMC_status";
        let stdy;
        switch( nowCat ){
            case 0: //物理
                stdy = ((catStatus[0][1])? "flex":"none");
                document.getElementById(ST_ID + "C1").style.display = stdy;
                document.getElementById(ST_ID + "C2").style.display = stdy;
                stdy = ((catStatus[1][1])? "flex":"none");
                document.getElementById(ST_ID + "D1").style.display = stdy;
                document.getElementById(ST_ID + "D2").style.display = stdy;
                break;
            case 1: //特殊
                stdy = ((catStatus[0][0])? "flex":"none");
                document.getElementById(ST_ID + "A1").style.display = stdy;
                document.getElementById(ST_ID + "A2").style.display = stdy;
                stdy = ((catStatus[1][0])? "flex":"none");
                document.getElementById(ST_ID + "B1").style.display = stdy;
                document.getElementById(ST_ID + "B2").style.display = stdy;
                break;
            case 2: //両面
            default:
                MDMC.dmError("ステータス変更");
                break;
        }
        return 0;
    },
    changeCatForce : function(cat){
        //全ての技の分類をどちらかに変える
        if ( cat == 2 ){
            this.dmError("分類上書きエラー");
            return -1;
        }
        for ( let turn = 0; turn < dmTurnNum; turn++ ){
            if ( dmTurns[turn].cat[0] == cat ) continue;
            dmTurns[turn].cat[0] ^= 1;
            document.getElementById("MDMC_inrevs" + turn + "_c").innerHTML = (cat == 0)? "物理":"特殊";
            if ( dmTurns[turn].cat[1] == 1 ){
                document.getElementById("MDMC_inrevs" + turn + "_cr").innerHTML = "→" + ((cat == 0)? "特防":"防御");
            } 
        }
        doCalculate.reCalculate(-1);
    },
    dmPushCatTop : function(cat){
        //onclick:全体分類ボタン
        const CATB_A = document.getElementById("dm_button_cat_a");
        const CATB_B = document.getElementById("dm_button_cat_b");
        const CATB_C = document.getElementById("dm_button_cat_c");
        const ST_ID = "MDMC_status";
        if( cat == 1 ){
            //特殊
            CATB_A.style.borderColor = "#ddd";
            CATB_B.style.borderColor = "#2a72dd";
            CATB_C.style.borderColor = "#ddd";
            inData.catMode = cat;
            this.changeCatForce(cat);
        }else if( cat == 0 ){
            //物理
            CATB_A.style.borderColor = "#ff0000";
            CATB_B.style.borderColor = "#ddd";
            CATB_C.style.borderColor = "#ddd";
            inData.catMode = cat;
            this.changeCatForce(cat);
        }else{
            //両側調整
            CATB_A.style.borderColor = "#ddd";
            CATB_B.style.borderColor = "#ddd";
            CATB_C.style.borderColor = "#87b145";
            inData.catMode = cat;
        }
        if( cat != 1 ){
            document.getElementById(ST_ID + "A1").style.display = "flex";
            document.getElementById(ST_ID + "A2").style.display = "flex";
            document.getElementById(ST_ID + "B1").style.display = "flex";
            document.getElementById(ST_ID + "B2").style.display = "flex";
        }
        if( cat != 0 ){
            document.getElementById(ST_ID + "C1").style.display = "flex";
            document.getElementById(ST_ID + "C2").style.display = "flex";
            document.getElementById(ST_ID + "D1").style.display = "flex";
            document.getElementById(ST_ID + "D2").style.display = "flex";
        }
        this.changeStatusCat();
        this.killLists();
        doCalculate.sumEffortValue();
    },
    dmPushCat : function(cat){
        //onclick:補正リスト中の分類ボタン選択時
        if( openTurn == -1 ) return -1;
        let refTurn = dmTurns[openTurn];
        const CATB_A = document.getElementById("dm_button_RLcat_a");
        const CATB_B = document.getElementById("dm_button_RLcat_b");
        if(cat){
            //特殊
            CATB_A.style.borderColor = "#ddd";
            CATB_B.style.borderColor = "#2a72dd";
            document.getElementById("MDMC_inrevs"+openTurn+"_c").innerText = "特殊";
        }else{
            //物理
            CATB_A.style.borderColor = "#ff0000";
            CATB_B.style.borderColor = "#ddd";
            document.getElementById("MDMC_inrevs"+openTurn+"_c").innerText = "物理";
        }
        dmTurns[openTurn].cat[0] = cat;
        if( refTurn.cat[1] == 1 ){
            document.getElementById("MDMC_inrevs"+openTurn+"_cr").innerText = "→" + ((cat==0)? "特防":"防御");
        }
        //ステータス表示変更
        this.changeStatusCat();

        doCalculate.reCalculate(openTurn); //計算
    },
    dmPushRv : function(){
        //onclick:分類判定ボタン
        if( openTurn == -1 ) return -1;
        let refTurn = dmTurns[openTurn];
        if( refTurn.cat[1] == 1 ){
            //反転→通常
            refTurn.cat[1] = 0;
            document.getElementById("MDMC_inrevs"+openTurn+"_cr").style.display = "none";
            document.getElementById("dm_button_RLcat_c").style.background = "#ffffff";
        }else{
            //通常→反転
            refTurn.cat[1] = 1;
            document.getElementById("MDMC_inrevs"+openTurn+"_cr").style.display = "flex";
            document.getElementById("MDMC_inrevs"+openTurn+"_cr").innerText = "→" + ((refTurn.cat[0]==0)? "特防":"防御");
            document.getElementById("dm_button_RLcat_c").style.background = "#ffC000";
        }
        //ステータスの表示調整
        this.changeStatusCat();
        doCalculate.reCalculate(openTurn); //計算
    },
    dmPushNat : function(pn, isCD){
        let nat;
        if( isCD ) nat = +((pn==1)? inData.pokeCN:inData.pokeDN);
        else nat = +((pn==1)? inData.pokeAN:inData.pokeBN);
        //性格値変換
        if( nat == 1 ) nat = 1.1;
        else if( nat < 1 ) nat = 1;
        else nat = 0.9;
        //データ適用
        if( isCD ) ((pn==1)? inData.pokeCN = nat : inData.pokeDN = nat);
        else ((pn==1)? inData.pokeAN = nat : inData.pokeBN = nat);
        //実数値計算
        const lookIdn = 5*(isCD+1);
        this.changeSt2Re(pn,lookIdn);
        document.getElementById("dm_in_"+pn+"_"+lookIdn).value = "×" + ((nat==1)? "1.0":nat);
        doCalculate.reCalculate(-1); //計算
    },
    dmPushPM0 : function(idn, pm){
        //技威力の上下
        const textBox = document.getElementById("dm_in_"+idn+"_20");
        let refTurn = dmTurns[idn-10];
        let power = refTurn.pwr;
        if( power%5 == 0 ) power += 5*pm;
        else if( pm > 0 ) power += 5-(power%5);
        else power -= power%5;
        if( power <= 0 ) power = 1;
        else if( power > 500 ) power = 500;
        refTurn.pwr = power;
        textBox.value = power;
        doCalculate.reCalculate(idn-10); //計算
    },
    dmPushPM3 : function(idn, pm){
        //ランクの上下
        if( openTurn == -1 ) return -1;
        const textBox = document.getElementById("dm_in_3_" + idn);
        const revsBox = document.getElementById("MDMC_inrevs" + openTurn + "_r" + idn);
        let refTurn = dmTurns[openTurn];
        if(idn!=2){
            //攻撃・防御ランク
            let ranks = refTurn.rank[idn];
            ranks += pm;
            if( ranks < -6 ) ranks = -6;
            else if( ranks > 6 ) ranks = 6;
            refTurn.rank[idn] = ranks;
            if( ranks == 0 ) revsBox.style.display = "none";
            else revsBox.style.display = "flex";
            if( ranks > 0 ) ranks = "+" + ranks;
            revsBox.innerText = ((idn==0)? "攻":"受") + "ランク" + ranks;
            textBox.innerText = ranks;
        }else{
            //急所ランク
            let ranks = refTurn.criticalRank;
            ranks += pm;
            if( ranks < -1 ) ranks = -1;
            else if( ranks > 3 ) ranks = 3;
            refTurn.criticalRank = ranks;
            if( ranks == 0 ) revsBox.style.display = "none";
            else revsBox.style.display = "flex";
            if( ranks == 3 ){
                ranks = "確定急所";
                textBox.innerText = ranks;
            }else if( ranks > 0 ){
                ranks = "+" + ranks;
                textBox.innerText = ranks;
                ranks = "急所ランク" + ranks;
            }else if( ranks < 0 ){
                ranks = "急所無効";
                textBox.innerText = ranks;
            }else{
                textBox.innerText = 0;
            }
            revsBox.innerText = ranks;
        }
        doCalculate.reCalculate(openTurn); //計算
    },
    dmPushPM4 : function(turn, pm){
        //弾数の設定
        const refTurn = (turn == -1)? openTurn: turn;

        let continueNum = dmTurns[refTurn].continuation;
        continueNum += pm;
        if ( continueNum < 1 ){
            document.getElementById("dm_in_4_box" + refTurn).style.display = "none";
            dmTurns[refTurn].continuation = 1;
        }else {
            if ( continueNum > 1 ) document.getElementById("dm_in_4_box" + refTurn).style.display = "flex";
            if ( continueNum > 5 ) continueNum = 5;
            dmTurns[refTurn].continuation = continueNum;
            document.getElementById("dm_in_4_" + refTurn).innerText = "×" + continueNum;
            document.getElementById("dm_in_4_Revs").innerText = continueNum;
        }
        doCalculate.reCalculate(-1); //計算
    },
    dmPushPM : function(pn, idn, pm){
        //onclick:数字上下
        if( pn!=1 && pn!=2 ){
            MDMC.dmError("上下ボタン関数エラー");
            return -1;
        }
        const textBox = document.getElementById("dm_in_" + pn + "_" + idn);
        let num = 0;
        switch(idn){
            case 2: //AB実数値
                num = +((pn==1)? inData.pokeAR:inData.pokeBR);
                num += pm;
                if(pm < 1) pm = 1;
                ((pn==1)? inData.pokeAR=num : inData.pokeBR=num);
                textBox.value = +num;
                this.changeRe2St(pn, idn);
                doCalculate.reCalculate(-1); //計算
                break;
            case 7: //CD実数値
                num = +((pn==1)? inData.pokeCR:inData.pokeDR);
                num += pm;
                if(pm < 1) pm = 1;
                ((pn==1)? inData.pokeCR=num : inData.pokeDR=num);
                textBox.value = +num;
                this.changeRe2St(pn, idn);
                doCalculate.reCalculate(-1); //計算
                break;
            case 12: //H実数値
                num = +inData.pokeBHR;
                num += pm;
                if(pm < 1) pm = 1;
                inData.pokeBHR = num;
                textBox.value = num;
                this.changeRe2St(pn, idn);
                doCalculate.reCalculate(-1, 0); //計算
                break;
            default:
                this.dmError("上下ボタンエラー"); break;
        }
    },
    dmPushHPoptionOpen : function(){
        //HPオプション開閉
        if ( inData.HPoption.menuOpen ){
            // 開いている→ 閉じる
            inData.HPoption.menuOpen = false;
            document.getElementById("dm_in_2_16").value = ( inData.HPoption.useNum == 0 )? "Option∨":"Option∨*";
            document.getElementById("MDMC_hpOption").style.display = "none";
        }else{
            // 閉じている→ 開く
            inData.HPoption.menuOpen = true;
            document.getElementById("dm_in_2_16").value = "Option∧";
            document.getElementById("MDMC_hpOption").style.display = "flex";
        }
    },
    dmPushHPoption : function(slip, slipId, reverceSlips = []){
        //各種HPオプションボタン押下時
        const slipElement = document.getElementById("MDMC_ho_box_"+slipId);
        if( slip.use ){
            // 適用している→ 外す
            slip.use = false;
            inData.HPoption.useNum -= 1;
            slipElement.style.color = "#aaa";
            slipElement.style.backgroundColor = "#ffffff";
        }else {
            // 外れている→ 適用する
            slip.use = true;
            inData.HPoption.useNum += 1;
            slipElement.style.color = "#912e00";
            slipElement.style.backgroundColor = "#ffC000";
            // 競合の他補正を外す
            if ( reverceSlips != [] ){
                reverceSlips.forEach( (rslip) => {
                    if ( rslip[0].use ){
                        this.dmPushHPoption(...rslip);
                    }
                });
            }
        }
        doCalculate.reCalculate(-2, 0); //計算
    },
    dmPushSpecial : function(){
        //HPを半分にする攻撃
        const turn = openTurn;
        const guardHeight = document.getElementById("MDMC_RScrollWindow").scrollHeight;
        const guardElement = document.getElementById("MDMC_RLspecialGuard");
        const buttonElement = document.getElementById("dm_button_RLspecial");
        const normalCardElement = document.getElementById("MDMC_ttCR_N" + turn);
        const specialCardElement = document.getElementById("MDMC_ttCR_S" + turn);
        if ( dmTurns[turn].modeHalf ){
            // 定数攻撃→ 通常攻撃
            dmTurns[turn].modeHalf = false;
            guardElement.style.display = "none";
            buttonElement.style.backgroundColor = "#ffffff";
            normalCardElement.style.display = "flex";
            specialCardElement.style.display = "none";
        }else{
            // 通常攻撃→ 定数攻撃
            dmTurns[turn].modeHalf = true;
            guardElement.style.display = "block";
            buttonElement.style.backgroundColor = "#ffc000";
            guardElement.style.height = guardHeight + "px";
            normalCardElement.style.display = "none";
            specialCardElement.style.display = "flex";
        }
        doCalculate.reCalculate(turn);
    },
    dmPushYadorigi : function(slip, slipId){
        //宿り木ボタン押下時
        const enemyElement = document.getElementById("MDMC_hpOption_YadorigiEnemy");
        if( slip.use ){
            // 適用している→ 外す
            enemyElement.style.display = "none";
        }else {
            // 外れている→ 適用する
            enemyElement.style.display = "flex";
            let enemyHP = 0;
            enemyHP = Math.floor( inData.pokeA[1]*2 + 31 );
            enemyHP = Math.floor( enemyHP * +inData.levelA / 100 + +inData.levelA + 10 );
            document.getElementById("dm_in_2_15").value = enemyHP;
            this.setInformation(2, 15, -1);
        }
        this.dmPushHPoption(slip, slipId);
    },
    dmPushStero : function(newIndex, slip, slipId){
        //ステロボタン・まきびしボタン押下時
        if ( newIndex == -1 || slip.index == newIndex ){
            // オフにする
            if ( slip.use ){
                slip.use = false;
                inData.HPoption.useNum -= 1;
                const oldElement = document.getElementById("MDMC_ho_box_" + slipId + "_" + slip.index);
                oldElement.style.color = "#aaa";
                oldElement.style.backgroundColor = "#ffffff";
                slip.index = -1;
            }
        }else {
            // ダメージ切り替え
            if ( !slip.use ){
                slip.use = true;
                inData.HPoption.useNum += 1;
            }else {
                const oldElement = document.getElementById("MDMC_ho_box_" + slipId + "_" + slip.index);
                oldElement.style.color = "#aaa";
                oldElement.style.backgroundColor = "#ffffff";
            }
            const newElement = document.getElementById("MDMC_ho_box_" + slipId + "_" + newIndex);
            newElement.style.color = "#912e00";
            newElement.style.backgroundColor = "#ffC000";
            slip.index = newIndex;
        }
        doCalculate.reCalculate(-1, 0); //計算
    },
    dmChangeDm: function(tn){
        //ダメージ表示の切り替え
        let isRand = dmTurnRandlist[tn];
        if( isRand ){
            //乱数→通常
            document.getElementById("MDMC_ttrs" + tn).style.display = "flex";
            document.getElementById("MDMC_ttrsR" + tn).style.display = "none";
            dmTurnRandlist[tn] = 0;
        }else{
            //通常→乱数
            document.getElementById("MDMC_ttrs" + tn).style.display = "none";
            document.getElementById("MDMC_ttrsR" + tn).style.display = "flex";
            dmTurnRandlist[tn] = 1;
        }
    },
    popupStatus: {
        resultLog: false,
        turnCard: false,
        turn: 0
    },
    closePopup: function(){
        //ポップアップメニューを閉じる
        document.getElementById("MDMC_closeTab").style.display = "none";
        if ( this.popupStatus.turnCard ){
            document.getElementById("MDMC_turnEdit" + this.popupStatus.turn).style.display = "none";
            this.popupStatus.turnCard = false;
        }else if ( this.popupStatus.resultLog ){
            document.getElementById("MDMC_resultLog").style.display = "none";
            this.popupStatus.resultLog = false;
        }
    },
    openResultLog: function(){
        //詳細結果を見る
        document.getElementById("MDMC_closeTab").style.display = "block";
        document.getElementById("MDMC_resultLog").style.display = "block";
        this.popupStatus.resultLog = true;
    },
    turncardEdit: function(turn){
        //ターンのカードを操作する
        if (openTurn != -1) return -1;
        document.getElementById("MDMC_closeTab").style.display = "block";
        document.getElementById("MDMC_turnEdit" + turn).style.display = "flex";
        this.popupStatus.turnCard = true;
        this.popupStatus.turn = turn;
        return 0;
    },
    resultMemo: function(){
        //計算結果のコピー
        document.getElementById("MDMC_fixedResult1").style.display = "flex";
        document.getElementById("MDMC_FRber1").style.background = document.getElementById("MDMC_FRber0").style.background;
        document.getElementById("MDMC_FR1").innerText = document.getElementById("MDMC_FR0").innerText;
        document.getElementById("MDMC_FREF1a").innerText = document.getElementById("MDMC_FREF0a").innerText;
        document.getElementById("MDMC_FREF1b").innerText = document.getElementById("MDMC_FREF0b").innerText;
    },
    closeMemo: function(){
        //計算結果メモを閉じる
        document.getElementById("MDMC_fixedResult1").style.display = "none";
    },
    requestData : async function(listId){
        return new Promise((resolve, reject) => {
        let reData = [];
        //データリクエスト
        let json = {
            "modeAll" : +MDMC_MODEALL,
            "id" : +listId
        };
        //resolve(["けつばん",90,90,85,125,90,100]); /*テスト用
        let json_text = JSON.stringify(json);
        //データを送信
        xhr = new XMLHttpRequest;       //インスタンス作成
        xhr.onload = function(){        //レスポンスを受け取った時の処理（非同期）
            let res = xhr.responseText;
            let data = JSON.parse(res);
            let returnError = (data['id']==-1);
            if(returnError){
                reData = ["データ取得失敗",90,90,85,125,90,100];
            }else{
                if( MDMC.nowSelecting.pn == 1 ) inData.pokeAID = +data['id'];
                else inData.pokeBID = +data['id'];
                reData = [data['name'],  +data['base_h'], +data['base_a'], +data['base_b'],
                        +data['base_c'], +data['base_d'], +data['base_s']];
            }
            if(returnError) alert("データベースからのデータ取得に失敗しました");
            resolve(reData);
            reData = null;
            res = null;
            data = null;
            json = null;
            json_text = null;
            returnError = null;
            xhr = null;
        };
        xhr.onerror = function(){       //エラーが起きた時の処理（非同期）
            reData = ["データ取得失敗",90,90,85,125,90,100];
            resolve(reData);
            reData = null;
            json = null;
            json_text = null;
            xhr = null;
        }
        xhr.open('post', "https://pokedesiaf.com/post-method/return-mdmc.php", true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(json_text);    //送信実行*/
        });
    }
}