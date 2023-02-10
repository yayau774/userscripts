// ==UserScript==
// @name        【童話画廊】画廊ロビー（各種行動）ページを改変するなど
// @namespace    https://github.com/yayau774/userscripts
// @version      0.4
// @description  ほかの改変とたぶん喧嘩する　プロフィールページで戦闘設定をキャッシュしたりもする
// @author       Yayau
// @match        http://soraniwa.428.st/fs/*
// @updateURL    https://github.com/yayau774/userscripts/raw/main/fairytale_sketch/improveActionPage.user.js
// ==/UserScript==

(function() {
  'use strict';

  // Your code here...
  const LOCAL_STORAGE_KEY = "yy-fs-storedStrategy";

  // 行動画面以外の処理
  if(new URL(window.location).searchParams.get("mode") != "action"){
    // 戦闘設定が存在すればそれをキャッシュする
    if(getStrategyDiv(document)){
      let strategies = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "{}");
      let eno = document.title.split("ENo.")[1].match(/\d+/)[0]; // 自分のページだとurlからenoが取れない　タイトルを見る
      let html = getStrategyDiv(document);
      strategies[eno] = [Date.now(), html];
      saveStrategy(strategies);
    }

    return;
  }

  // ここから下は行動画面での処理
  let strategies = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "{}");

  //  これが操作対象
  const form = document.querySelector(".mainarea form");

  //  submit部のpをいじる
  //  不要なbrを消し、「メンバー選択」のテキストを消し、見目のためにbrを追加する
  const submitArea = form.querySelector("input[type=submit").closest("p");
  submitArea.querySelectorAll("br").forEach(e=>e.remove());
  Array.from(submitArea.childNodes).filter(e=>e.nodeType == Node.TEXT_NODE).forEach(e=>e.remove());
  submitArea.querySelector("#fullmember").insertAdjacentHTML("beforebegin", "<br><br>");

  //  キャラ情報表示部をいじる
  //  不要なclear付きの改行を消す　これがあるとfloatで自作divを置けない
  form.querySelectorAll("br[clear=all]").forEach(e=>e.remove());
  //  キャラ情報の幅を狭くして自作divを置く場所を作る
  const divs = form.querySelectorAll("div.charaframe, div.charaframe2");
  divs.forEach(e => {
    e.style.float = "unset";
    e.style.width = "480px";
    
    for(let i of [2, 5]){
      e.querySelectorAll("span.status3")[i].insertAdjacentHTML("afterend", '<hr class="dashline">');
    }

    e.addEventListener('mouseenter', callbackShowStrategyButton);
    e.querySelector("img").closest("div").addEventListener('click', callbackShowStrategyButton);
  });

  /**
   * improveArea
   *   - submitArea
   *   - informationArea
   *     - キャッシュ日時・リロードボタン
   *     - 戦闘設定をinnerHTMLで貼り付けさせるためのコンテナ
   */

  //  各種表示用の窓として自作divを用意
  const improveArea = document.createElement("div");
  form.querySelector("div.charaframeself").insertAdjacentElement("beforebegin", improveArea);
  improveArea.id = "yy-improveArea";
  improveArea.style.float = "right";
  improveArea.style.width = "500px";
  improveArea.style.position = "sticky";
  improveArea.style.top = "20px";
  improveArea.insertAdjacentElement("afterbegin", submitArea);

  //  戦闘設定表示用のdiv
  const informationArea = document.createElement("div");
  improveArea.insertAdjacentElement("beforeend", informationArea);
  informationArea.id = "yy-strategyArea";
  informationArea.style.border = "solid 1px gray";
  informationArea.style.borderRadius = "2px";
  informationArea.style.backgroundColor = "rgba(0, 0, 0, 0.5)";

  const informationTextArea = document.createElement("div");
  informationArea.insertAdjacentElement("beforeend", informationTextArea);
  informationTextArea.style.margin = "16px";
  informationTextArea.innerText = "キャラクター情報にマウスを乗せたり、タイプアイコン周辺をクリックすると、ここに情報が出てくる";

  const informationStrategyArea = document.createElement("div");
  informationArea.insertAdjacentElement("beforeend", informationStrategyArea);


  


  
  //  ここから下は各関数
  /**
   * JSON文字列化してローカルストレージに保存
   * @param {*} strategies 
   */
  function saveStrategy(strategies)
  {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(strategies));
  }

  /**
   * @param {number} from - Date.now()で記録された時間
   * @returns {Date}
   */
  function calcElapsed(from)
  {
    return new Date(Date.now() - from);
  }
  /**
   * @param {*} from 
   * @returns {string} n日前とかm分前とかを返す
   */
  function showElapsed(from)
  {
    let elapsed = calcElapsed(from).getTime();
    let day = Math.floor(elapsed/(1000*60*60*24));
    let hour = Math.floor(elapsed/(1000*60*60));
    let minute = Math.floor(elapsed/(1000*60));
    if(day > 20){
      return "20日以上前";
    }else if(day > 0){
      return `${day}日前`; 
    }else if(hour > 0){
      return `${hour}時間前`;
    }else{
      return `${minute}分前`;
    }
  }

  /**
   * 戦闘設定部分のdiv.outerHTMLを取得する
   * @param {Document} doc ajaxで取得するときに親の指定が必要かもしれないのでいちおう指定できるように
   * @returns {string | nullish}
   */
  function getStrategyDiv(doc)
  {
    return doc.querySelector("#modal3 div.framearea div:nth-of-type(2)")?.outerHTML;
  }

  /**
   * 右に戦闘設定を表示するためのこーるばっく
   * @param {*} e 
   */
  function callbackShowStrategyButton(e)
  {
    e.stopPropagation(); // 伝播を防がないと連れ出しとして選択される
    showStrategy(e.target);
  }

  /**
   * 戦闘設定を表示する部分
   * @param {*} target 
   */
  function showStrategy(target)
  {
    let eno = target.closest("div[data-eno]").getAttribute("data-eno");
    let name = target.closest("div[data-eno]").querySelector("b.tname").innerText;
    let button = document.createElement("button");
    button.type = "button";
    button.addEventListener('click', fetchStrategy.bind({eno, target}));

    if(!strategies[eno]){
      informationTextArea.innerHTML = name + " - 未取得<br>";
      informationTextArea.insertAdjacentElement("beforeend", button);
      button.textContent = "取得";
      informationStrategyArea.innerHTML = "";
    }else{
      informationTextArea.innerHTML = `${name} - ` + showElapsed(strategies[eno][0]) + "<br>";
      informationTextArea.insertAdjacentElement("beforeend", button);
      button.textContent = "再取得";
      informationStrategyArea.innerHTML = strategies[eno][1];
    }

    //  アイコン表示の際にfloatしてるからbr clearを最後に入れておく
    let icon = target.closest("div[data-eno]").querySelector("img.icon").cloneNode();
    icon.style.float = "left";
    informationTextArea.insertAdjacentElement("afterbegin", icon);
    informationTextArea.insertAdjacentHTML("beforeend", '<br clear="all">');
  }

  /**
   * 行動画面から取得ボタンで起動する　対象のenoのプロフィールを見に行って戦闘設定をもらってくる
   * bindでthis={eno:eno, target:target}になってる
   * 
   * @param {*} eno 
   */
  function fetchStrategy()
  {
    informationStrategyArea.innerHTML = "取得中……";
    console.log(this.eno, "fetching");
    let url = `http://soraniwa.428.st/fs/?mode=profile&eno=${this.eno}`;
    fetch(url)
    .then(r=>r.text())
    .then(r=>{
      let doc = new DOMParser().parseFromString(r, "text/html");
      strategies[this.eno] = [Date.now(), doc.querySelector("#modal3 div.framearea div:nth-of-type(2)")?.outerHTML];
      saveStrategy(strategies);
    }).finally(()=>{
      showStrategy(this.target);
    });
  }


})();
