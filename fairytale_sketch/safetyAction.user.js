// ==UserScript==
// @name         【童話画廊】間違って突っ込んでもうちょっと待ってねって言われるのを防ぐやつ
// @namespace    https://github.com/yayau774/userscripts
// @version      0.3
// @description  「5人そろってないときにsubmitそのものを止める」「待ち時間をローカルストレージに記録して表示」
// @author       Yayau
// @match        http://soraniwa.428.st/fs/*
// @updateURL    https://github.com/yayau774/userscripts/raw/main/fairytale_sketch/safetyAction.user.js
// ==/UserScript==

(function() {
  'use strict';

  // Your code here...
  safetyMemberSelect();
  safetyWait();

  /**
   * 人数が揃ってるかどうか、フォーム送信前に確認させる
   */
  function safetyMemberSelect(){
    // 行動画面以外なら去る
    const fullmemberCheck = document.querySelector("input[name=fullmember]");
    if(!fullmemberCheck){return;}

    const form = fullmemberCheck.closest("form");
    let members = Array.from(document.querySelectorAll("input[name=d1], input[name=d2], input[name=d3], input[name=d4]"));


    // jQueryによるイベントの止め方がわからない　フォームと無関係にどっか触るたびに人数判定をする苦肉の策
    document.addEventListener("click", e => {
      if(members.find(e=>e.value=="")
      && fullmemberCheck.closest("#selectmember").style.display != "none"
      && fullmemberCheck.checked){
        form.submit.disabled = true;
      }else{
        form.submit.disabled = false;
      }
    });
  }

  /**
   * 待ち時間が発生した時、ローカルストレージに待ち時間後のタイムスタンプを入れて残り時間を表示するように
   */
  function safetyWait(){
    const LOCAL_STRAGE_KEY = "yy-fs-wait";

    // 待ち時間表示があったら取得して記録
    const caution = Array.from(document.querySelectorAll("header div"))?.find(e=>e.textContent.includes("しばらくお待ちください…。"));
    if(caution){
      setWait(caution.textContent.match(/\d+/)[0]);
    }

    // 記録された待ち時間を読みだして、既に過ぎていたら削除して終了
    const wait = getWait();
    if(wait < Date.now()){
      unsetWait();
      return;
    }

    // formを取得　失敗したら（たぶん）タイマー関係ないページなのでおわり
    const form = document.querySelector("input[name=fullmember]")?.closest("form");
    if(!form){return;}

    // たいまー表示を追加し、submitをdisabledに
    const timer = document.createElement("span");
    timer.id = "timer";
    timer.style.backgroundColor = "brown";
    timer.style.color = "white";
    timer.style.padding = "10px";
    timer.style.margin = "10px";
    form.submit.insertAdjacentElement("afterend", timer);
    form.submit.disabled = true;

    // 1000msごとの判定
    const intervalID = setInterval(() => {
      let diff = wait - Date.now();
      if(diff <= 0){
        form.submit.disabled = false;
        timer.remove();
        clearInterval(intervalID);
        unsetWait();
      }

      diff = Math.floor(diff/1000);
      timer.textContent = `あと${diff}秒`;
    }, 1000);


    function setWait(w){
      window.localStorage.setItem(LOCAL_STRAGE_KEY, JSON.stringify(Date.now() + w * 1000));
    }
    function getWait(){
      return JSON.parse(window.localStorage.getItem(LOCAL_STRAGE_KEY));
    }
    function unsetWait(){
      window.localStorage.removeItem(LOCAL_STRAGE_KEY);
    }
  }

  //  head最後にスタイルシートを追加
  document.querySelector('head').insertAdjacentHTML('beforeend', `
  <style>
  input[type="submit"]:disabled {
    background-color: gray;
    cursor: not-allowed;
  }
  </style>`);
})();





