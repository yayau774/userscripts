// ==UserScript==
// @name        yyEnhancedMap
// @namespace   Violentmonkey Scripts
// @match       https://soraniwa.428.st/gf/*
// @grant       none
// @version     1.3
// @author      -
// @description 2025/8/18 3:47:03
// @updateURL   https://github.com/yayau774/userscripts/raw/main/soraniwa-greenfest-re/yyEnhancedMap.user.js
// ==/UserScript==

// 実際の処理はここから
(function(){
  // jQuery使ってるからそれを利用させていただく
  const $ = window.jQuery;
  if(!$){ return; }

  /** LocalStorageを使うためのいろいろ */
  const YyLocalStorage = {
    config: {
      remove: () => window.localStorage.removeItem("yy-emap-config"),
      save: (data) => window.localStorage.setItem("yy-emap-config", JSON.stringify(data)),
      load: () => JSON.parse(window.localStorage.getItem("yy-emap-config")) ?? {},
    },
    searched: {
      remove: () => window.localStorage.removeItem("yy-emap-searched"),
      save: (data) => window.localStorage.setItem("yy-emap-searched", JSON.stringify([...data])),
      load: () => new Set(JSON.parse(window.localStorage.getItem("yy-emap-searched"))),
      /** Set<"x,y"> カンマの後にスペースをつけない */
    },
    droplist: {
      remove: () => window.localStorage.removeItem("yy-emap-droplist"),
      save: (data) => window.localStorage.setItem("yy-emap-droplist", JSON.stringify([...data])),
      load: () => new Map(JSON.parse(window.localStorage.getItem("yy-emap-droplist"))),
      /** Map<"x,y", string[]> */
    },
    worldmap: {
      remove: () => window.localStorage.removeItem("yy-emap-worldmap"),
      save: (data) => window.localStorage.setItem("yy-emap-worldmap", JSON.stringify([...data])),
      load: () => new Map(JSON.parse(window.localStorage.getItem("yy-emap-worldmap"))),
      /** Map<"x,y", {colorCode:string, terrain:string, isShining:boolean} */
    },
  }

  // configのロード
  let config = YyLocalStorage.config.load();
  /**
   * どんなオプションをつけるかって話よ
   * isAutoMuteEnabled: boolean　行動画面開いたときにiconmuteを押すかどうか
   * isWorldmapSaveEnabled: boolean　周辺地図を全体マップに新たに取り込むかどうか　負荷がかかりそうだから……
   * 
   * showUploadButton: boolean　外部のサーバにデータを上げるボタンをつけるかどうか
   * isAutomateEnabled: boolean　そしてアップロードを自動化するかどうか
   * 
   * showFetchButton: boolean　外部のサーバーからダウンロードするボタンをつけるかどうか
   * 
   * 各種LocalStorage情報はオプション画面から消せるようにしておきたい
   * オプション画面作るのめんどくさいよーーーーっ　だだをこねるな
   */

  // localStorageからのロード
  let searched = YyLocalStorage.searched.load();
  let droplist = YyLocalStorage.droplist.load();
  let worldmap = YyLocalStorage.worldmap.load();

  // ミュートボタンを押す
  if(config.isAutoMuteEnabled){
     $("#iconmute").trigger('click');
  }

  // configを開いたりするボタンを設置
  appendDialog();

  //  ajax終了時にもろもろの処理を行う　おそらくマップ表示のときになるはず
  $(document).ajaxComplete((event, xhr, settings) => {
    // 動いてるか確認する
    //console.log('Ajax 完了:', settings.url, xhr.status);
    const json = JSON.parse(xhr.responseText);
    console.log("json", json)

    // 地図情報が送られてきてるわけじゃないならやめる
    if(json.maptipname === undefined){ return; }

    // JSONから情報を取得
    const selfInfo = getSelfInfo(json)
    const localMap = getLocalMap(json)

    // 現在地が探索済み、なおかつ探索済み地点リストに現在地の座標がないとき、現在地を探索済みとして追加する
    if(selfInfo.isSearched && !searched.has(selfInfo.coor)){
      // 別タブで探索進んだりしてたら変な上書きをするので念のためにロードしなおして処理
      searched = YyLocalStorage.searched.load()
      searched.add(selfInfo.coor)
      YyLocalStorage.searched.save(searched);
      console.log(`ここを探索済みと判定する: ${selfInfo.coor}`);
    }

    // ドロップリストが存在しないor探索済みの地点ならドロップリストへの登録
    if(!droplist.get(selfInfo.coor) || selfInfo.isSearched){
      // 別タブを警戒してのちょっとした手間
      droplist = YyLocalStorage.droplist.load();
      droplist.set(selfInfo.coor, selfInfo.droplist)
      YyLocalStorage.droplist.save(droplist)
      console.log(`ここのドロップリストを取得: ${selfInfo.coor} (${selfInfo.droplist[0]}、ほか)`);
    }

    // 周辺地図の外延部のうち、全体マップにのっていないものが一つでもあれば登録
    // 地形変更に対応できてないのでどうにかせよ　負荷高くない？　はい
    // configを見て全体マップの登録がonでなければ触らないぞ
    const edge = [...localMap.values()].filter(cell => cell.isEdge)
    if(config.isWorldmapSaveEnabled && !edge.every(edge => worldmap.has(edge.coor))){
      // 別タブを警戒しての手間
      worldmap = YyLocalStorage.worldmap.load();
      localMap.forEach(cell => worldmap.set(cell.coor, {colorCode: cell.colorCode, terrain: cell.terrain, isShining: cell.isShining}))
      YyLocalStorage.worldmap.save(worldmap);
      console.log(`全体マップが更新され、現在は${worldmap.size}エリアが見えている`)
    }

    // 周辺地図への書き込みを行う。探索済みとかそういうやつ。
    localMap.forEach((cell, coor) => {
      if(searched.has(coor)){
        // 探索済み？　→　きらきらなら色を変える、そうでないならチェックマーク
        if(cell.isShining){
          cell.dom.querySelector("span").style.color = "purple"
        }else{
          cell.dom.innerText = "✔"
        }
      }else if(droplist.has(coor)){
        // ドロップリストにある？　使用アイテムを含むなら●、そうでないなら〇
        cell.dom.innerText = droplist.get(coor).includes("使用アイテム") ? "●" : "〇"
      }else{
        // 探索済みでないうえにドロップリストにもないならここで終わる
        return;
      }

      // クリックしたらアイテムを表示するように
      cell.dom.addEventListener("click", e => {
        alert(`探索リスト(${coor})\n\n${droplist.get(coor).join("\n")}`)
      })
      cell.dom.style.cursor = "help";
    })


  });

  ///////////////////////////////////////////////
  //  ここから下は関数

  /** 
   * 地形の取得　周辺地図は自分を中心に15x15
   * 自分が画面端にいるときの挙動は不明なので、spanが15x15=225と一致するときだけ処理をする　ひとまずはそれが安牌かな
   * 返り値はMap<座標, {土地データ}>　DOMとかisEdge(外縁部かどうか)とかの保存しなくていいデータもある
   * 保存対象は座標
   */
  // 　
  function getLocalMap(json){
    // セルの数を取得する。15x15=225セルが存在するはずなので、不一致の時は中断する。マップの端に行ったときの挙動が分からないので……。
    const cellSpans = document.querySelectorAll("div.strollmaparea_close > span");
    if(cellSpans.length != 225){ return; }

    let idx = 0;
    let localmap = new Map();
    for(let y = -7; y <= 7; y++){
      for(let x = -7; x <= 7; x++){
        // 
        const celldata = {
          ...cell(json.map_x, json.map_y, x, y, cellSpans[idx]),
          dom: cellSpans[idx],
          isEdge: Math.abs(y)==7 || Math.abs(x)==7,
          isShining: cellSpans[idx].querySelector("span") != null,
        };
        localmap.set(celldata.coor, celldata)
        idx++;
      }
    }
    return localmap;
  }

  /** 現在地の情報を取得 isSearchedの検出が微妙な気がする……
   * 探索済みだとカテゴリじゃなくて実際のアイテムが表示される　素材アイテム→砥石とか
   */
  function getSelfInfo(json){
    return {
      x: json.map_x,
      y: json.map_y,
      coor: `${json.map_x},${json.map_y}`,
      terrain: json.maptipname,
      droplist: document.querySelector("span#drop").innerText.split("\n").filter(str => str),
      isSearched: document.querySelector("span#drop").querySelector("span") ? true : false,
    }
  }

  /** 絶対座標にして地形情報を得る */
  function cell(basex, basey, diffx, diffy, span){
    const x = parseInt(basex) + diffx;
    const y = parseInt(basey) + diffy;
    return {
      x,
      y,
      coor: `${x},${y}`,
      ...terrain(span.style.backgroundColor),
    }
  }

  /** カラーコードをもらって地形情報を返す
   *  なんてこった　style.colorで出てくるのがrgb形式だなんて
   */
  function terrain(colorCode){
    // スポット　1?　現在地表記では「スポット」だがマップ画面の説明では「ワープポイント」　どっちでもいい
    // 歩道・平地　小　1
    // 草地・花畑・浅瀬　中　3
    // 森林　大　9
    switch(colorCode){
      case "rgb(255, 0, 255)":
        return { colorCode, terrain: "スポット"};
      case "rgb(187, 187, 187)":
        return { colorCode, terrain: "歩道"}
      case "rgb(238, 221, 153)":
        return { colorCode, terrain: "平地"};
      case "rgb(136, 221, 119)": // explanation
      case "rgb(85, 187, 85)":   // map
        return { colorCode, terrain: "草地"}
      case "rgb(255, 238, 68)":
        return { colorCode, terrain: "花畑"};
      case "rgb(85, 204, 238)":  // explanation
      case "rgb(68, 170, 238)":  // map
        return { colorCode, terrain: "浅瀬"}
      case "rgb(51, 170, 51)":  // explanation
      case "rgb(34, 139, 34)":  // map
        return { colorCode, terrain: "森林"};
      case "rgb(48, 80, 32)":
        return { colorCode, terrain: "制限"};
      default:
        return { colorCode, terrain: "不可"}
    }
  }

  /** 地形の名前から調子コストを返す　コスト0は通行不可　スポットはとりあえずコスト1っぽい */
  function cost(terrain){
    switch(terrain){
      case "スポット":
      case "歩道":
      case "平地":
        return 1;
      case "草地":
      case "花畑":
      case "浅瀬":
        return 3;
      case "森林":
        return 9;
      default:
        return 0;
    }
  }

  /** <dialog>を利用してconfigなどを設定できるようにする */
  function appendDialog(){
    const dialog = document.createElement("dialog")
    dialog.id = "yy-dialog";
    dialog.innerHTML = `
    <h3>yy-Enhanced-Map config</h3>
    <form id="yy-config" method="dialog">
    <label>
      <input type="checkbox" name="isAutoMuteEnabled" ${config.isAutoMuteEnabled ? "checked" : ""}>
      行動画面を開いたときに自動で「アイコンを隠す」ボタンを押す
    </label><br>
    <label>
      <input type="checkbox" name="isWorldmapSaveEnabled" ${config.isWorldmapSaveEnabled ? "checked" : ""}>
      周辺地図を全体マップに取り込むかどうか
    </label><br>
    <button type="submit">決定</button>
    </form>
    `
    // ダイアログフォームのsubmitに版のしてconfigを保存
    dialog.addEventListener("submit", e => {
      const fd = new FormData(e.target)
      config = {}
      fd.entries().forEach(([k, v]) => {
        config[k] = v;
      })
      YyLocalStorage.config.save(config)
    })

    // dialogとかのDOMを設置したり
    const dialogButton = document.createElement("button")
    dialogButton.textContent = "yy-Enhanced-Map"
    dialogButton.addEventListener("click", e => {
      dialog.showModal()
    })
    document.querySelector("#btn6").insertAdjacentElement("afterend", dialogButton)
    document.body.appendChild(dialog)
  }

})();

