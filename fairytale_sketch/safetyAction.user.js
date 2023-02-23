// ==UserScript==
// @name         【童話画廊】間違って突っ込みにくくするやつ
// @namespace    https://github.com/yayau774/userscripts
// @version      0.8
// @description  「5人そろってないときにsubmitを止める」「待ち時間を表示」
// @author       Yayau
// @match        http://soraniwa.428.st/fs/*
// @updateURL    https://github.com/yayau774/userscripts/raw/main/fairytale_sketch/safetyAction.user.js
// ==/UserScript==

(function() {
  'use strict';

  // 基本的に何秒待たされるか　画廊ロビーで行動を送信した時にこの待ち時間を設定する
  // 待ち時間が緩和されたときはここをいじる
  const defaultWait = 120;

  ///////////////////////////////////////////////////
  // ここから下はいじってはいけない
  //
  const LOCAL_STRAGE_KEY = "yy-fs-wait";
  const LOCAL_STRAGE_KEY_FLAG_SUBMIT = "yy-fs-submit-battle";
  const fullmember = document.querySelector("input[name=fullmember]");
  const form = fullmember?.closest("form");

  safetyMemberSelect();
  setWaitAfterJumpOnSubmit();
  safetyWait();
  setSubmitFlagTrueWhenAction();

  /**
   * 人数が揃ってるかどうか、フォーム送信前に確認させる
   */
  function safetyMemberSelect(){
    // 行動画面以外なら去る
    if(!fullmember){return;}

    let members = Array.from(document.querySelectorAll("input[name=d1], input[name=d2], input[name=d3], input[name=d4]"));

    // jQueryによるイベントの止め方がわからない　フォームと無関係にどっか触るたびに人数判定をする苦肉の策
    document.addEventListener("click", checkFullmember);
    document.addEventListener("DOMContentLoaded", checkFullmember);

    function checkFullmember(){
      if(members.find(e=>e.value=="")
      && fullmember.closest("#selectmember").style.display != "none"
      && fullmember.checked){
        form.submit.disabled = true;
      }else{
        form.submit.disabled = false;
      }
    }
  }

  /**
   * 待ち時間が発生した時、ローカルストレージに待ち時間後のタイムスタンプを入れて残り時間を表示するように
   */
  function safetyWait(){

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

    // formを取得　失敗したら（たぶん）待ち時間関係ないページなのでおわり
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
      diff = Math.floor(diff/1000);
      timer.textContent = `あと${diff}秒`;
      form.submit.disabled = true;

      if(diff <= 0){
        form.submit.disabled = false;
        timer.remove();
        clearInterval(intervalID);
        unsetWait();
      }
    }, 1000);


  }

  /**
   * 行動ページで送信しページ遷移を確認したらタイマーをセット
   */
  function setWaitAfterJumpOnSubmit(){
    // submitによるページ遷移直後かどうかを確認する
    const trueIfSubmit = !!window.localStorage.getItem(LOCAL_STRAGE_KEY_FLAG_SUBMIT);
    if(trueIfSubmit){
      setWait(defaultWait);
      window.localStorage.removeItem(LOCAL_STRAGE_KEY_FLAG_SUBMIT);
    }
  }

  /**
   * 行動ページで送信したらフラグを立てる
   */
  function setSubmitFlagTrueWhenAction(){
    // 行動ページじゃなければ抜ける
    if(!fullmember){return;}

    form.addEventListener("submit", e=>{
      // submitしたことを表すフラグを立てる
      window.localStorage.setItem(LOCAL_STRAGE_KEY_FLAG_SUBMIT, "1");
    });
  }

  // ローカルストレージ操作するやつら
  function setWait(w){
    window.localStorage.setItem(LOCAL_STRAGE_KEY, JSON.stringify(Date.now() + w * 1000));
  }
  function getWait(){
    return JSON.parse(window.localStorage.getItem(LOCAL_STRAGE_KEY));
  }
  function unsetWait(){
    window.localStorage.removeItem(LOCAL_STRAGE_KEY);
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

