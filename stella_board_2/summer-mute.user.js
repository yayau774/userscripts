// ==UserScript==
// @name        StellaBoardV1.0-summer- 戦闘結果検索から指定ENoの参加した結果を見えなくするやつ
// @namespace   Violentmonkey Scripts
// @match       https://soraniwa.428.st/stb/*
// @grant       none
// @version     1.0
// @author      -
// @description 2024/7/18 19:50:32
// ==/UserScript==

// ["eno", "eno", "eno", ...] という感じで複数入れる　半角数字
let muteENos = [""];

// 実行
mute(muteENos);


//------------------------------------------------------------------------------------
// ミュート実行部
function mute(muteEnos){
  // profileが含まれるURLを探して
  const anchors = document.querySelectorAll("a[href*=profile]");
  anchors.forEach(anchor => {
    const url = new URL(anchor.href);
    // みゅーとenoに登録されてるやつがいたらその行を見えなくする
    if( muteENos.includes(url.searchParams.get("eno")) ){
      const tr = anchor.closest("tr");
      tr.style.display = "none";
      console.log(anchor.href)
    }
  })
}
