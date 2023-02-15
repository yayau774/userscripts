// ==UserScript==
// @name         【童話画廊】スキルブックをちょっと見やすく
// @namespace    https://github.com/yayau774/userscripts
// @version      0.2
// @description  try to take over the world!
// @author       Yayau
// @match        http://soraniwa.428.st/fs/?mode=skill
// @updateURL    https://github.com/yayau774/userscripts/raw/main/fairytale_sketch/improveSkillbookPage.user.js
// ==/UserScript==

(function() {
  'use strict';

  // スキル表をスクロールできるようにする
  scrollableDiv();

  // スキル詳細を表示する
  showSkillDescription();

  ////////////////////////////////
  // ここから下をいじってはいけない
  //
  function scrollableDiv(){
    let div = document.querySelector("div.framearea");
    div.style.height = "600px";
    div.style.overflowY = "scroll";
    div.style.overflowX = "hidden";
    div.style.scrollbarWidth = "thin";
  }

  function showSkillDescription(){
    document.querySelectorAll(".itemlist tr").forEach(tr => {
      let span = tr.querySelector("span.btnSkill");
      if(!span) return;

      if(tr.querySelector("td:nth-of-type(2)").textContent == "スキル"){
          tr.querySelector("td:nth-of-type(3)").innerHTML += "<br>" + span.getAttribute("data-desc");
      }
    })
  }
})();
