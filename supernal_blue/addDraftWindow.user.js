// ==UserScript==
// @name         Supernal Blue 試遊会 / 戦闘設定画面に下書き窓を作る
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  titleが「戦闘設定」で始まっているページで動く
// @author       Yayau
// @match        https://soraniwa.428.st/sp/*
// @updateURL    https://github.com/yayau774/userscripts/raw/main/supernal_blue/addDraftWindow.user.js
// ==/UserScript==

(function () {
  'use strict';

  // Your code here...
  /**
 * 被ドロップ側のイベント制御がめんどくさい
 * 親に当てたいのに子に反応することへの対策がcss側にある
 * 以下の状況でspanに反応するせいでdivに落とせないなど
 * <div draftrow>
 *   <span> --- </span>
 * </div>
 * spanに対してpointer-event: none;　がとりあえず有効
 */


  if(document.title.startsWith("戦闘設定")){
    addStyle();
    setDraggable();
    addDraftContainer();
    addDraftShowButton();
  }

  /**********************************************************
   * DOM作製・操作用
   */
  /** cssつくって<head>の下に突っ込む */
  function addStyle() {
    const style =
      `<style>
  .yyfs {
    position: fixed;
    margin: 0;
    background-color: rgb(0 0 0 / 0.2);
    height: 75vh;
    width: 50vw;
    overflow: auto;
    z-index: 30;
  }
  .yyfs legend {
    background-color: pink;

  }
  .yyfs legend:hover {
    cursor: move;
  }

  .draftrow{
    display: flex;
    gap: 12px;
    height: 40px;
    align-items: center;
  }
  .draftrow:nth-child(odd) {
    background-color: #ffc;
  }
  .draftrow:nth-child(even) {
    background-color: #dda;
  }
  /* .draftrow span[setno, sno, name, desc]  */
  .draftrow > span {
    pointer-events: none;
  }
  .draftrow > span:nth-of-type(1) {
    width: 30px;
  }
  .draftrow > span:nth-of-type(2) {
    width: 40px;
  }
  .draftrow > span:nth-of-type(3) {
    width: 130px;
    font-size: smaller;
    align-self: flex-start;
  }
  .draftrow > span:nth-of-type(4) {
    scale: 0.9;
  }

  .ondrag {
    background-color: yellow !important;
  }

  .yyfs.hidden {
    display: none;
  }
  </style>`;

    document.querySelector("head").insertAdjacentHTML("beforeend", style);
  }
  /** スキル一覧の各スキルにdraggable属性とイベントリスナの設置 */
  function setDraggable() {
    const trs = document.querySelector("table#skill tbody").querySelectorAll("tr");
    trs.forEach(tr => {
      tr.setAttribute("draggable", true);
      tr.addEventListener("dragstart", dragStart);
      tr.addEventListener("dragend", dragEnd);
    });
  }
  /**
   * 下書き窓
   * メインから呼ばれるのは addDraftContainer, addDraftShowButton
   */
  function addDraftContainer() {
    const parser = new DOMParser();
    const container = document.createElement("fieldset");
    container.classList.add("yyfs", "hidden")
    const length = document.querySelector("select#skill1")?.closest("div.divp").querySelectorAll("select.selskill").length;

    container.append(createDraftLegend(parser));
    container.append(createDraftDesc(parser));
    for (let i = 1; i <= length ?? 12; i++) {
      container.append(createDraftRow(parser, i));
    }

    // 位置はどうでもいいと思ってbody直下に置いたらz-indexで埋まった
    document.querySelector("input#searchBox").insertAdjacentElement("afterend", container);
  }
  function createDraftLegend(parser) {
    const leghtml = `<legend draggable="true">ここをドラッグで動く<button type="button">閉じる</button></legend>`;
    const legend = parser.parseFromString(leghtml, "text/html").querySelector("legend");
    legend.querySelector("button").addEventListener("click", toggleDraftContainer);

    // legendをつかんだらcontainerごと動かす
    // 変数スコープの関係上、外で関数宣言をしないことにした
    legend.addEventListener("dragstart", e => e.preventDefault());
    legend.addEventListener("pointerdown", e => {
      const container = legend.closest("fieldset");

      const rect = container.getBoundingClientRect();
      const startX = e.clientX - rect.left;
      const startY = e.clientY - rect.top;

      const moveContainer = (e) => {
        container.style.left = (e.clientX - startX) + "px";
        container.style.top = (e.clientY - startY) + "px";
      }

      const releaseContainer = (e) => {
        //  リリースされたら不要なイベントリスナーを消す
        document.removeEventListener("pointerup", releaseContainer);
        document.removeEventListener("pointermove", moveContainer);
      }

      document.addEventListener("pointermove", moveContainer);
      document.addEventListener("pointerup", releaseContainer);
    });

    return legend;
  }
  function createDraftDesc(parser) {
    const deschtml =
      `<div class="draftdesc">
  1. スキル一覧からドロップして下書きに入れる（クリックで消す）<br>
  2. <button type=button>戦闘設定に流し込むボタン</button>
  </div>`;
    const div = parser.parseFromString(deschtml, "text/html").querySelector("div");
    div.style.marginBottom = "16px";

    const btn = div.querySelector("button");
    btn.addEventListener("click", finishDraft);

    return div;
  }
  function createDraftRow(parser, num) {
    const rowhtml =
      `<div class="draftrow">
  <span>${num}枠</span>
  <span></span>
  <span></span>
  <span></span>
  </div>`;
    const div = parser.parseFromString(rowhtml, "text/html").querySelector("div");

    // drop
    div.addEventListener("dragenter", dzEnter);
    div.addEventListener("dragover", dzOver);
    div.addEventListener("dragleave", dzLeave);
    div.addEventListener("drop", dzDrop);
    // click(reset)
    div.addEventListener("click", dzClick);

    // りせっとしてから完成したdivを返す
    div.dispatchEvent(new Event("click"));
    return div;
  }
  /** 下書きウィンドウを表示するボタン */
  function addDraftShowButton() {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "下書きウィンドウを出す";
    button.addEventListener("click", e => {
      const container = document.querySelector("fieldset.yyfs");
      container.classList.remove("hidden");
      const rect = button.getBoundingClientRect();
      container.style.left = (rect.right + 16) + "px";
      container.style.top = rect.top + "px";
    })
    document.querySelector("input#searchBox").insertAdjacentElement("afterend", button);
  }


  /******************************************************
   * いべんとはんどら
   */
  /**
   * draggable側 
   * dragstart/endでcssいじって強調する　必要あるかわからん
   */
  function dragStart(e) {
    //  ドラッグするデータを持たせる  thisはイベント発生元=tr
    e.dataTransfer.setData("sd", getSkillData(this));
    this.classList.add("ondrag");
  }
  function dragEnd(e) {
    this.classList.remove("ondrag");
  }
  /**
   * div.draftrowをdropzoneとする　流れとしては 1 > 2 > 3or4
   * 1 dragenter:持ったまま入ってきた
   * 2 dragover: 持ったまま中にいる
   * 3 dragleave:持ったまま外に行った
   * 4 drop:     持ってるのを落とした
   * - click:    その行をリセット
   */
  function dzEnter(e) {
    if (hasSD(e)) {
      e.target.classList.add("ondrag");
    }
  }
  function dzOver(e) {
    if (hasSD(e)) {
      //  落としていいよ宣言
      e.preventDefault();
    }
  }
  function dzLeave(e) {
    if (hasSD(e)) {
      e.target.classList.remove("ondrag");
    }
  }
  function dzDrop(e) {
    const sd = JSON.parse(e.dataTransfer.getData("sd"));
    rowFill(this, sd);
    e.target.classList.remove("ondrag");
  }
  function dzClick(e) {
    rowFill(this);
  }
  /** draft内の反映ボタン */
  function finishDraft(e) {
    // 戦闘設定までスクロール
    document.querySelector("h4#section_skill").previousElementSibling.scrollIntoView({ behavior: "smooth" });

    // inputに入れる
    document.querySelectorAll("div.draftrow").forEach((row, i) => {
      const id = "skill" + ++i;
      document.querySelector(".selskill#" + id).value = row.getAttribute("sno");
    })

    //  jQueryのためにchangeイベントを発火させる
    document.querySelector(".selskill#skill1").dispatchEvent(new Event('change'));
  }
  /** 下書き窓を隠したり出したり */
  function toggleDraftContainer(e) {
    const container = e.target.closest("fieldset");
    container.classList.toggle("hidden");
  }

  /******************************************************
   * その他
   */
  /** drag開始時、DataTransferに持たせるデータの成型につかう */
  function getSkillData(tr) {
    const desc = tr.querySelector("td:nth-of-type(3) .skillhoverdesc").cloneNode(true);
    desc.querySelector("small.c5").remove();
    return JSON.stringify({
      sno: tr.querySelector("td:first-child").getAttribute("data-sno"),
      shown: tr.querySelector("td:first-child").textContent.trim(),
      name: tr.querySelector("td:nth-of-type(2)").textContent.trim().split(" ").join("<br>"),
      desc: desc.innerHTML.trim(),
    });
  }
  /** dragover中につかう　いま持ち上げてるのはスキルデータあるやつかどうか？ */
  function hasSD(e) {
    return e.dataTransfer.getData("sd") != "";
  }
  /** div.draftrowにデータを流し込む　sdが未指定なら初期化 */
  function rowFill(row, sd = null) {
    if (sd == null) {
      sd = {
        sno: "0",
        shown: "SNo",
        name: "設定なし",
        desc: "この辺にドロップする"
      }
    }

    row.setAttribute("sno", sd.sno);
    row.querySelector("span:nth-of-type(2)").textContent = sd.shown;
    row.querySelector("span:nth-of-type(3)").innerHTML = sd.name;
    row.querySelector("span:nth-of-type(4)").innerHTML = sd.desc;
  }
})();