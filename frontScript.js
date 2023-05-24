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
    constructor(used=0, damages=ZERO_DAMAGE, damagesC=ZERO_DAMAGE, pwr=80, cat=[0,0], rank=[0,0], criticalRank=0, RL=[new MDMC_Nodes()]){
        this.used = used // 有効判定（使用中：1/未使用：0）
        //this.isDM = isDM; // ダイマックス判定：削除
        this.damages = damages; // ダメージ配列（最大→最小）
        this.damagesC = damagesC; // 急所ダメージ配列（最大→最小）
        this.pwr = pwr; // 威力
        this.cat = cat; // 攻撃分類（[分類,反転判定？]）
        this.rank = rank; // 能力ランク
        this.criticalRank = criticalRank; //急所ランク
        this.RL = RL; // 補正群
    }
}

//const MDMC_POKEMAX = 1038 +1; //PHPで補完
//const MDMC_MODEALL = 0; //PHPで補完
const MDMC_RNUM = [6, 8, 12, 18, 20, 3, 8, 3, 5, 3, 4, 3, 12, 4, 5, 4];

let inData = {
    //攻側ポケモンデータ ポケモン名[0] id:#dm_in_1_0
    pokeA : ["けつばん",55,90,80,50,105,96], // index対応：0->0, 9~14->1~6
    pokeAID : -1,
    pokeAR : 142, //A実数値（id:#dm_in_1_2）
    pokeAI : 31, //A個体値（id:#dm_in_1_4）
    pokeAE : 252, //A努力値（id:#dm_in_1_3）
    pokeAN : 1, //性格補正（0.9,1,1.1 / id:#dm_in_1_5)
    pokeCR : 102, //C実数値（id:#dm_in_1_7）
    pokeCI : 31, //C個体値（id:#dm_in_1_9）
    pokeCE : 252, //C努力値（id:#dm_in_1_8）
    pokeCN : 1, //性格補正（0.9,1,1.1 / id:#dm_in_1_10)
    //pokeAsubs : [31, 252, 1], //サブステータス：廃止
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
    //pokeBsubs : [31, 0, 1], //サブステータス：廃止
    pokeBHR : 165, //H実数値（id:#dm_in_2_12）
    pokeBHI : 31, //H個体値（id:#dm_in_2_14）
    pokeBHE : 0, //H努力値（id:#dm_in_2_13）
    //pokeBDMS : 0, //被弾側DMスイッチ（id:#dm_button_dm※）：廃止
    HPrejene : 0, //回復量（id:#dm_in_2_15）
    Stero : 0, //ステロダメージ（id:#dm_button_stero）
    //技データ
    moveContinue: {
        used : 0, //使用スイッチ
        turn : -1, //適用ターン
        num : 1 //弾数（1-10）
    }, //攻撃の弾数制御
    //moveP : 90, //技威力（id:#dm_in_1_10）：廃止
    //moveC : 0, //分類 0:物理/1:特殊（id:#dm_button_cat）：廃止
    //moveRv : 0, //受け側の分類反転判定（id:dm_button_Rv）：廃止
    //criticalRank : 0, //急所ランク（id:#dm_in_1_16）：廃止
    catMode : 0, //分類 0:物理/1:特殊/2:両面（id:#dm_button_cat）：廃止
    //レベルデータ
    levelA : 50, //レベル（id:#dm_in_1_1）
    levelB : 50, //レベル（id:#dm_in_2_1）
    //ランクデータ：廃止
    //rankA : 0, //ランク（id:#dm_in_1_6）
    //rankB : 0, //ランク（id:#dm_in_2_6）
}

let dmTurns = [new MDMC_Turns(), new MDMC_Turns(), new MDMC_Turns(), new MDMC_Turns(), new MDMC_Turns()];
let dmTurnNum = 0; //現在の追加済みターン数
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
    //List : [new MDMC_Nodes()], //：廃止、各ターンノードに帰属
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
            Revices.isA[0] = 0;
            Revices.isA[1] = 0;
            document.getElementById("MDMC_Rbt_A00").style.background = "#ffffff";
            document.getElementById("MDMC_Rbt_A01").style.background = "#ffffff";
            this.deleteList("A00");
            this.deleteList("A01");
        }else if( +ID<=1 ){
            //タイプ一致
            const IDelse = "0" + (+ID^1);
            Revices.isA[+IDelse] = 0;
            Revices.isN[0] = 0;
            document.getElementById("MDMC_Rbt_A" + IDelse).style.background = "#ffffff";
            document.getElementById("MDMC_Rbt_N00").style.background = "#ffffff";
            this.deleteList("A"+IDelse);
            this.deleteList("N00");
        }else{
            //タイプ相性
            for( let i=2; i<=5; i++ ){
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
    round : function(x){
        //x>0において五捨五超入処理となる
        return -1*Math.round(-1*x);
    },
    forRound : function(dms, fn){
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
    makeHPber : function(Max, Min){
        const HPBElement = document.getElementById("MDMC_FRber0");
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
            range += " (" + (Math.round(1000*damages[0]/maxHp)/10) + "%～" + (Math.round(1000*damages[15]/maxHp)/10) + "%)";
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
            document.getElementById("MDMC_ttrs"+tn).innerText = "▷ 0～0 (0%～0%)";
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
        }else{
            //コピー追加
            let ORG = dmTurns[copyOrg];
            dmTurns[tn] = new MDMC_Turns(1, ORG.damages.slice(), ORG.damagesC.slice(),
                +ORG.pwr, ORG.cat.slice(), ORG.rank.slice(), +ORG.criticalRank, ReList.makeCopy(copyOrg));
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
        if(!window.confirm((t+1)+"個目の攻撃を消去しますか？")) return 0;
        //弾数制御の変更
        const continueBox = document.getElementById("dm_in_4");
        if ( inData.moveContinue.used ){
            if ( t == inData.moveContinue.turn ){
                continueBox.style.display = "none";
                inData.moveContinue.used = 0;
            }else if( t < inData.moveContinue.turn ){
                inData.moveContinue.turn -= 1;
                const newTurn = inData.moveContinue.turn;
                const turnBox = document.getElementById("MDMC_ttCR"+newTurn);
                const afterBox = document.getElementById("MDMC_rvCR"+newTurn);
                turnBox.insertBefore(continueBox, afterBox);
            }
        }
        let preRandlist = dmTurnRandlist[t]
        for ( let i=t; i<dmTurnNum-1; i++ ){
            dmTurns[i] = dmTurns[i+1];
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
        }
        dmTurns[dmTurnNum-1] = new MDMC_Turns();
        document.getElementById("MDMC_tt"+(dmTurnNum-1)).style.display = "none";
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
            document.getElementById("MDMC_rta").innerText = "";
            document.getElementById("MDMC_rtb").innerText = "";
            document.getElementById("MDMC_rtc").innerText = "";
            this.makeHPber(0, 0)
            document.getElementById("MDMC_FR0").innerText = "0%～0%：0% (0%)";
        }
        this.sumEffortValue();
    },
    makeResult : function(){
        //瀕死率計算
        let dRange = [0,0]; //ダメージ幅
        let dRangeP = [0,0]; //％ダメージ幅
        let percent = [];
        let percentC = [];
        let dead; //瀕死率
        let deadC; //急所込み瀕死率
        let HPMAX = +inData.pokeBHR;
        const Continue = ((inData.moveContinue.used)? inData.moveContinue.turn:-1); //弾数制御ターン
        if(HPMAX > 1000){
            MDMC.dmError("HPの上限は1000です");
            return -1;
        }
        //ステロダメージ
        let steroDamage = 0;
        if( inData.Stero!=0 ){
            steroDamage = Math.floor( HPMAX / +inData.Stero );
            HPMAX -= steroDamage;
        }
        percent = Array(HPMAX+1).fill(0);
        percent[HPMAX] = 100;
        percentC = Array(HPMAX+1).fill(0);
        percentC[HPMAX] = 100;
        for ( let i=0; i<dmTurnNum; i++ ){
            let dmgs = dmTurns[i].damages;
            let dmgsC = dmTurns[i].damagesC;
            let CR = 1/24; // 急所確率
            switch( dmTurns[i].criticalRank ){
                case 0 : CR = 1/24; break;
                case 1 : CR = 1/8; break;
                case 2 : CR = 1/2; break;
                case 3 : CR = 1; break;
                case -1 : CR = 0; break;
                default: break;
            }
            let ContinueNum = ((i==Continue)? +inData.moveContinue.num:1);
            for ( let tj=0; tj<ContinueNum; tj++ ){
                let pro = Array(HPMAX+1).fill(0);
                let proC = Array(HPMAX+1).fill(0);
                let hpR;
                //ダメージ畳み込み
                for ( let hp=0; hp<=HPMAX; hp++ ){
                    if( percent[hp] == 0 ) continue;
                    for( let j=0; j<16; j++ ){
                        hpR = hp - dmgs[j];
                        if( hpR < 0 ) hpR = 0;
                        pro[hpR] += percent[hp] / 16;
                    }
                }
                percent = pro;
                //急所込みダメージ畳み込み
                if( CR == 0 ){
                    percentC = pro;
                }else{
                    for ( let hp=0; hp<=HPMAX; hp++ ){
                        if( percentC[hp] == 0 ) continue;
                        for( let j=0; j<16; j++ ){
                            //通常
                            hpR = hp - dmgs[j];
                            if( hpR < 0 ) hpR = 0;
                            proC[hpR] += (1-CR) * percentC[hp] / 16;
                            //急所
                            hpR = hp - dmgsC[j];
                            if( hpR < 0 ) hpR = 0;
                            proC[hpR] += CR * percentC[hp] / 16;
                        }
                    }
                    percentC = proC;
                }
            }
            //回復適用
            if( inData.HPrejene != 0 ){
                if( inData.HPrejene > 0 ){
                    //回復
                    let rejene = +inData.HPrejene;
                    if( rejene >= HPMAX ) rejene = HPMAX-1;
                    const rejeneMax = HPMAX - rejene;
                    let hp;
                    for ( hp=HPMAX-1; hp>=rejeneMax; hp-- ){
                        percent[HPMAX] += +percent[hp];
                        percentC[HPMAX] += +percentC[hp];
                    }
                    for ( hp=rejeneMax-1; hp>0; hp--){
                        percent[hp+rejene] = +percent[hp];
                        percentC[hp+rejene] = +percentC[hp];
                    }
                    for ( hp=rejene; hp>=1; hp--){
                        percent[hp] = 0;
                        percentC[hp] = 0;
                    }
                }else{
                    //定数ダメージ
                    let dm = -1*inData.HPrejene;
                    console.log(percent);
                    if( dm > HPMAX ) dm = HPMAX;
                    const dmedHPMAX = HPMAX - dm;
                    let hp;
                    for ( hp=1; hp<=dm; hp++ ){
                        percent[0] += +percent[hp];
                        percentC[0] += +percentC[hp];
                    }
                    for ( hp=dm+1; hp<=HPMAX; hp++ ){
                        percent[hp-dm] = percent[hp];
                        percentC[hp-dm] = percentC[hp];
                    }
                    for ( hp=dmedHPMAX+1; hp<=HPMAX; hp++){
                        percent[hp] = 0;
                        percentC[hp] = 0;
                    }
                }
            }
            //最大・最小ダメージ計算
            dRange[0] += +dmgs[0]*ContinueNum;
            dRange[1] += +dmgs[15]*ContinueNum;
        }
        dRange[0] += steroDamage;
        dRange[1] += steroDamage;
        HPMAX += steroDamage //ステロダメージの再調整
        dead = Math.round(10*(percent[0]))/10;
        deadC = Math.round(10*(percentC[0]))/10;
        dRangeP[0] = Math.round(1000*dRange[0]/HPMAX)/10;
        dRangeP[1] = Math.round(1000*dRange[1]/HPMAX)/10;
        let name, rejene, hpr, hprP; //スリップダメージ
        rejene = inData.HPrejene;
        if( rejene<0 ){
            name = "slip.";
            hpr = -1*rejene
        }else{
            name = "reg.";
            hpr = rejene;
        }
        if( rejene == 0 ){
            hpr = "";
            hprP = "";
        }else{
            hprP = Math.round(1000*hpr/HPMAX)/10;
            if ( hpr > 0 ){
                hpr = " (" + name + hpr + ")";
                hprP = " (" + name + hprP + "%" + ")";
            }else{
                hpr = " (" + name + hpr + ")";
                hprP = " (" + name + hprP + "%" + ")";
            }
        }
        //結果表示：追加修正
        document.getElementById("MDMC_result").style.display = "block";
        const resultTx = dRange[0] + "～" + dRange[1] + hpr + " / " + HPMAX + "\n" + dRangeP[0] + "%～" + dRangeP[1] + "%" + hprP;
        document.getElementById("MDMC_rta").innerText = resultTx;
        document.getElementById("MDMC_rtb").innerText = dead + "%";
        document.getElementById("MDMC_rtc").innerText = deadC + "%";
        //HPバー更新
        let hpd = rejene*(dmTurnNum-1);
        dRangeP[0] = Math.round(1000*(dRange[0]-hpd)/HPMAX)/10;
        dRangeP[1] = Math.round(1000*(dRange[1]-hpd)/HPMAX)/10;
        this.makeHPber(dRangeP[0], dRangeP[1]);
        let hpresult = dRangeP[0] + "%～" + dRangeP[1] + "%：" + dead + "% (" + deadC + "%)";
        document.getElementById("MDMC_FR0").innerText = hpresult;
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
        }
        this.turn = 0;
    }
}

let MDMC = {
    setted : {
        pokeA : 0, //入力済み判定
        pokeB : 0, //入力済み判定
        //powor : 0, //入力済み判定
        //HowToUse : 0, //使い方の非表示判定
        //statusChange : 0 //分類変更時のステータス入れ替えを行うかどうかの判定
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
            if( inData.pokeBDMS ) Re *= 2;
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
            case 15: //回復量
                inData.HPrejene = textBox.value;
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
                    case 15: //回復量
                        textBox.value = inData.HPrejene;
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
                    case 15: //回復量
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
            case 15: //回復量
                MDMC.dmInputLimit(pn, idn, -1000, 1000); break;
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
        let continueNum = 1
        if( inData.moveContinue.used && inData.moveContinue.turn == idn ){
            continueNum = inData.moveContinue.num;
        }
        document.getElementById("dm_in_4_1").innerText = continueNum;
    },
    dmCloseRev : function(){
        const idn = +openTurn;
        const TURN_CARD = document.getElementById("MDMC_tt" + idn);
        const PARENT_ID = document.getElementById("MDMC_ttBox");
        if( idn < TURN_MAX-1 ){
            //最後以外のカード
            const NEXT_ID = document.getElementById("MDMC_tt" + (idn+1));
            PARENT_ID.insertBefore(TURN_CARD, NEXT_ID);
        }else{
            //最後のカード
            const BUTTON_ID = document.getElementById("MDMC_ttLast"); 
            PARENT_ID.insertBefore(TURN_CARD, BUTTON_ID);
        }
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
        }else if( cat == 0 ){
            //物理
            CATB_A.style.borderColor = "#ff0000";
            CATB_B.style.borderColor = "#ddd";
            CATB_C.style.borderColor = "#ddd";
            inData.catMode = cat;
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
            refTurn.cat[0] = 1;
        }else{
            //物理
            CATB_A.style.borderColor = "#ff0000";
            CATB_B.style.borderColor = "#ddd";
            document.getElementById("MDMC_inrevs"+openTurn+"_c").innerText = "物理";
            refTurn.cat[0] = 1;
        }
        dmTurns[openTurn].cat[0] = cat;
        if( refTurn.cat[1] == 1 ){
            document.getElementById("MDMC_inrevs"+openTurn+"_r2").innerText = "→" + ((refTurn.cat[0]==0)? "特防":"防御");
        }
        //両面調整化
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
            //ステータスの表示
            this.changeStatusCat();
        }
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
            if( ranks > 0 ){
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
    dmPushPM4 : function(pm){
        //弾数の設定
        const continueBox = document.getElementById("dm_in_4");
        const turn = ((openTurn == -1)? +inData.moveContinue.turn: +openTurn);
        const turnBox = document.getElementById("MDMC_ttCR"+turn);
        const afterBox = document.getElementById("MDMC_rvCR"+turn);
        console.log(inData.moveContinue)
        console.log(turn)
        if (inData.moveContinue.used){
            if (turn == inData.moveContinue.turn){
                //設定済みの攻撃弾数の制御
                let num = inData.moveContinue.num + pm;
                if (num > 10) num = 10;
                if (num <= 0){
                    if(window.confirm("攻撃弾数の設定を解除しますか？")){
                        continueBox.style.display = "none";
                        inData.moveContinue.used = 0;
                    }else{
                        num = 1;
                    }
                }
                inData.moveContinue.num = num;
                document.getElementById("dm_in_4_0").innerText = "×" + num;
                document.getElementById("dm_in_4_1").innerText = num;
                doCalculate.reCalculate(turn); //計算
            }else{
                //攻撃弾数の設定先変更
                if (inData.moveContinue.num==1 || window.confirm("弾数設定ができる技は1つのみです\n現在設定済みの技を解除して新たに設定を行いますか？")){
                    turnBox.insertBefore(continueBox, afterBox);
                    inData.moveContinue.turn = turn;
                    let num = ((pm>0)? 5:1);
                    inData.moveContinue.num = num;
                    document.getElementById("dm_in_4_0").innerText = "×" + num;
                    document.getElementById("dm_in_4_1").innerText = num;
                    doCalculate.reCalculate(-1); //計算
                }
            }
        }else{
            //攻撃弾数の新規追加
            continueBox.style.display = "block";
            inData.moveContinue.used = 1;
            inData.moveContinue.turn = turn;
            turnBox.insertBefore(continueBox, afterBox);
            let num = ((pm>0)? 5:1);
            inData.moveContinue.num = num;
            document.getElementById("dm_in_4_0").innerText = "×" + num;
            document.getElementById("dm_in_4_1").innerText = num;
            doCalculate.reCalculate(turn); //計算
        }
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
    dmPushStero : function(pm){
        //ステロボタン押下時
        let damage = +inData.Stero;
        let dmidx = 0;
        const damageList = [0, 32, 16, 8, 6, 4, 2];
        const LL = damageList.length;
        for ( dmidx=0; dmidx<LL; dmidx++ ){
            if( damage == damageList[dmidx] ) break;
        }
        //ダメージ変換
        if ( pm==0 ){
            //表示タップ
            if( damage != 0 ) damage = 0;
            else damage = 8;
        }else {
            //+-ボタン
            dmidx = (dmidx+pm)%LL;
            if( dmidx<0 ) dmidx = LL-1;
            damage = damageList[dmidx];
        }
        //データ適用
        inData.Stero = damage;
        //表示
        if( damage==0 ){
            document.getElementById("dm_button_stero").value = "OFF";
        }else{
            document.getElementById("dm_button_stero").value = "1/" + damage;
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
        //データリクエスト
        return new Promise((resolve, reject) => {
        let reData = [];
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
            //メモリリーク防止
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
            //メモリリーク防止
            reData = null;
            json = null;
            json_text = null;
            xhr = null;
        }
        xhr.open('post', "https://pokedesiaf.com/post-method/return-mdmc.php", true);
        //（https://pokedesiaf.com/post-method/return-mdmc.php：ポケモンのIDを受け取り、データベースからポケモンのステータスデータを参照して返す）
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(json_text);    //送信実行*/
        });
    }
}