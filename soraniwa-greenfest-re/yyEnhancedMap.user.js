// ==UserScript==
// @name        yyEnhancedMap
// @namespace   Violentmonkey Scripts
// @match       https://soraniwa.428.st/gf/*
// @grant       none
// @version     2.0
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
      /** 旧バージョン Map<"x,y", string[]> */
    },
    droplistK: {
      remove: () => window.localStorage.removeItem("yy-emap-droplist-k"),
      save: (data) => window.localStorage.setItem("yy-emap-droplist-k", JSON.stringify([...data])),
      load: () => new Map(JSON.parse(window.localStorage.getItem("yy-emap-droplist-k"))),
      get: () => window.localStorage.getItem("yy-emap-droplist-k"),
      /** Known 新バージョン Map<"x,y", [timestamp(number), string[]]>  */
    },
    droplistU: {
      remove: () => window.localStorage.removeItem("yy-emap-droplist-u"),
      save: (data) => window.localStorage.setItem("yy-emap-droplist-u", JSON.stringify([...data])),
      load: () => new Map(JSON.parse(window.localStorage.getItem("yy-emap-droplist-u"))),
      get: () => window.localStorage.getItem("yy-emap-droplist-u"),
      /** Unknown 新バージョン Map<"x,y", [timestamp(number), string[]]>  */
    },
    worldmap: {
      remove: () => window.localStorage.removeItem("yy-emap-worldmap"),
      save: (data) => window.localStorage.setItem("yy-emap-worldmap", JSON.stringify([...data])),
      load: () => new Map(JSON.parse(window.localStorage.getItem("yy-emap-worldmap"))),
      get: () => window.localStorage.getItem("yy-emap-worldmap"),
      /** Map<"x,y", {colorCode:string, terrain:string, isShining:boolean} */
    },
  }

  // configのロード
  /**
   * config
   * @type {{ isWorldmapSaveEnabled?: boolean, isDroplistUSaveEnabled?: boolean, isDroplistKSaveEnabled?: boolean }}
   */
  let config = YyLocalStorage.config.load();
  /**
   * どんなオプションをつけるかって話よ
   * isAutoMuteEnabled: boolean　行動画面開いたときにiconmuteを押すかどうか　いらなくなった
   * isWorldmapSaveEnabled: boolean　周辺地図を全体マップに新たに取り込むかどうか　負荷がかかりそうだから……
   * isDroplistUSaveEnabled: boolean
   * isDroplistKSaveEnabled: boolean ドロップリストU/Kを保存するかどうか
   * 
   * 
   * 各種LocalStorage情報はオプション画面から消せるようにしておきたい
   * オプション画面作るのめんどくさいよーーーーっ　だだをこねるな
   */

  // localStorageからのロード
  let searched = YyLocalStorage.searched.load();
  let droplistK = YyLocalStorage.droplistK.load();
  let droplistU = YyLocalStorage.droplistU.load();
  let worldmap = YyLocalStorage.worldmap.load();

  // droplist引継ぎ
  if(droplistK.size + droplistU.size === 0){
    droplistRenewal();
  }

  // ミュートボタンを押す必要はもうない　なぜなら公式で対応してくれたから
  //if(config.isAutoMuteEnabled){ $("#iconmute").trigger('click'); }

  // configを開いたりするボタンを設置
  appendDialog();

  //  ajax終了時にもろもろの処理を行う　おそらくマップ表示のときになるはず
  $(document).ajaxComplete((event, xhr, settings) => {
    // 動いてるか確認する
    //console.log('Ajax 完了:', settings.url, xhr.status);
    const json = JSON.parse(xhr.responseText);
    //console.log("json", json)

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
    // todo 変えろ　droplistK/Uのタイムスタンプを見て処理
    /*
    if(!droplist.get(selfInfo.coor) || selfInfo.isSearched){
      // 別タブを警戒してのちょっとした手間
      droplist = YyLocalStorage.droplist.load();
      droplist.set(selfInfo.coor, selfInfo.droplist)
      YyLocalStorage.droplist.save(droplist)
      console.log(`ここのドロップリストを取得: ${selfInfo.coor} (${selfInfo.droplist[0]}、ほか)`);
    }
    */
    // ドロップリストの更新をする　タイムスタンプにエポック分を使う
    const timestamp = Math.floor(Date.now() / 60000)
    if(config.isDroplistUSaveEnabled && isUnknownDroplist(selfInfo.droplist)){
      // 現在地のドロップリストに未判明素材があるとき
      droplistU = YyLocalStorage.droplistU.load();
      droplistU.set(selfInfo.coor, [timestamp, selfInfo.droplist])
      YyLocalStorage.droplistU.save(droplistU)
      console.log(`ドロップリスト(未判明)に登録: ${selfInfo.coor} (${selfInfo.droplist[0]}、ほか)`);
    }else if(config.isDroplistKSaveEnabled ){
      // 未判明素材がないならKnownなドロップリストへ
      droplistK = YyLocalStorage.droplistK.load();
      droplistK.set(selfInfo.coor, [timestamp, selfInfo.droplist])
      YyLocalStorage.droplistK.save(droplistK)
      console.log(`ドロップリスト(判明済み)に登録: ${selfInfo.coor} (${selfInfo.droplist[0]}、ほか)`);
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
      }else if(droplistU.has(coor)){
        // 未判明ドロップリストにある？　使用アイテムを含むなら●、そうでないなら〇
        cell.dom.innerText = droplistU.get(coor)?.[1].includes("使用アイテム") ? "●" : "〇"
      }else if(droplistK.has(coor)){
        // todo 判明済みで使用アイテムのものをどうする？
        cell.dom.innerText = droplistU.get(coor)?.[1].includes("使用アイテム") ? "★" : "☆"
      }else{
        // 探索済みでないうえにドロップリストにもないならここで終わる
        return;
      }

      // クリックしたらアイテムを表示するように
      cell.dom.addEventListener("click", e => {
        const k = droplistK.get(coor)
        const u = droplistU.get(coor)
        const timestamp = (t) => new Date(t*60000).toLocaleString("ja-JP");
        const known = k ? `判明済みでの登録日時 (${timestamp(k[0])}) \n ${k[1].join("\n")}` : "判明済みでの登録なし";
        const unknown = u ? `未判明での登録日時 (${timestamp(u[0])}) \n ${u[1].join("\n")}` : "未判明での登録なし";
        alert(`探索リスト(${coor})\n\n${known}\n\n${unknown}`)
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
    // ボタンをつける場所の基準になるボタン6を探す
    const btn6 = document.querySelector("#btn6");
    if(!btn6){ return; }

    const dialog = document.createElement("dialog")
    dialog.id = "yy-dialog";
    dialog.innerHTML = `
    <h3>yy-Enhanced-Map config</h3>
    <form id="yy-config" method="dialog">
    <label>
      <input type="checkbox" name="isWorldmapSaveEnabled" ${config.isWorldmapSaveEnabled ? "checked" : ""}>
      周辺地図を全体マップに取り込むかどうか
    </label><br>
    <label>
      <input type="checkbox" name="isDroplistUSaveEnabled" ${config.isDroplistUSaveEnabled ? "checked" : ""}>
      現在地に未判明の探索アイテム（花の種アイテムなど）があるときに記録するかどうか
    </label><br>
    <label>
      <input type="checkbox" name="isDroplistKSaveEnabled" ${config.isDroplistKSaveEnabled ? "checked" : ""}>
      現在地に判明済みの探索アイテム（○○の種など）があるときに記録するかどうか
    </label><br>
    <button type="submit">決定</button>
    </form>
    <h3>API</h3>
    <div>
      ボタン押したらアラートが出るまで待ってほしい（ローディングを作るのが手間）<br>
      <br>
      <button id="yy-receiveWorldmap">全体マップのデータを受け取る</button><br>
      <button id="yy-receiveDroplist">各地の未判明/判明済み探索データを受け取る</button><br>
      <br>
      処理の都合上、全体マップのデータを送信してからじゃないと失敗することがある……。<br>
      <button id="yy-sendWorldmap">全体マップのデータを送信する</button><br>
      <button id="yy-sendUnknown">各地の未判明探索データを送信する</button><br>
      <button id="yy-sendKnown">各地の判明済み探索データを送信する</button><br>
    </div>
    <hr>
    <button id="yy-closeDialog">とじる</button>
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

    // とじる
    dialog.querySelector("#yy-closeDialog").addEventListener("click", e => {
      dialog.close()
    })

    /** fetch簡略化 */
    //const apiUrl = "http://localhost:5173/api"
    const apiUrl = "https://soraniwa-gf-re-tool.yayau4dev.workers.dev/api"
    const getFn = async (path) => {
      return await fetch(apiUrl + path).then(r => r.json())
    }
    const postFn = async (path, body) => {
      return await fetch(apiUrl + path, {
        method: "post",
        headers: { "Content-type": "application/json" },
        body
      })
      .then(r => r.text())
      .catch(e => e)
    }


    // 受信系　受け取ってまーーーーーじ
    dialog.querySelector("#yy-receiveWorldmap").addEventListener("click", async (e) => {
      const wm = await getFn("/worldmap")
      worldmap = YyLocalStorage.worldmap.load()
      wm.forEach(([key, val]) => worldmap.set(key, val))
      YyLocalStorage.worldmap.save(worldmap)
      alert(`${wm.length}件の情報を受け取り、現在${worldmap.size}地点の全体マップ情報を持っています。`)
    })
    dialog.querySelector("#yy-receiveDroplist").addEventListener("click", async (e) => {
      const {known, unknown} = await getFn("/droplist")
      droplistK = YyLocalStorage.droplistK.load()
      known.forEach(([key, val]) => droplistK.set(key, val));
      YyLocalStorage.droplistK.save(droplistK)

      droplistU = YyLocalStorage.droplistU.load()
      unknown.forEach(([key, val]) => droplistU.set(key, val));
      YyLocalStorage.droplistU.save(droplistU)

      alert(`判明済み${known.length}件、未判明${unknown.length}件の情報を受け取り、\nそれぞれ現在${droplistK.size}件、${droplistU.size}件の情報を持っています。`)
    })

    // 送信系
    dialog.querySelector("#yy-sendWorldmap").addEventListener("click", async (e) => {
      const result = await postFn("/worldmap", YyLocalStorage.worldmap.get())
      alert(result)
    })
    dialog.querySelector("#yy-sendKnown").addEventListener("click", async (e) => {
      const result = await postFn("/droplist/known", YyLocalStorage.droplistK.get());
      alert(result)
    })
    dialog.querySelector("#yy-sendUnknown").addEventListener("click", async (e) => {
      const result = await postFn("/droplist/unknown", YyLocalStorage.droplistU.get());
      alert(result)
    })

    // dialogとかのDOMを設置したり
    const dialogButton = document.createElement("button")
    dialogButton.textContent = "yy-Enhanced-Map"
    dialogButton.addEventListener("click", e => {
      dialog.showModal()
    })
    btn6.insertAdjacentElement("afterend", dialogButton)
    document.body.appendChild(dialog)
  }

  /** 仕様変更にともなうdroplistの改造 */
  function droplistRenewal(){
    // サイズ0なら処理は不要
    const droplist = YyLocalStorage.droplist.load();
    if(droplist.size == 0){ return; }

    // droplistをひとつずつ見てknown/unknownに振り分ける　このときタイムスタンプは0にする
    [...droplist.entries()].forEach(([coor, drops]) => {
      if(isUnknownDroplist(drops)){
        droplistU.set(coor, [0, drops])
      }else{
        droplistK.set(coor, [0, drops])
      }
    })

    YyLocalStorage.droplistK.save(droplistK)
    YyLocalStorage.droplistU.save(droplistU)
  }

  /** 与えられた配列に一つでも未判明の代替名が入っていればunknown扱いだぞ */
  function isUnknownDroplist(drops){
    const listOfUnknown = ["素材アイテム", "食べ物アイテム", "花の種アイテム", "使用アイテム", "条件アイテム"]
    return drops.some(drop => listOfUnknown.includes(drop))
  }

})();

