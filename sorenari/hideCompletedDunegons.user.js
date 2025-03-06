// ==UserScript==
// @name        Discoveryで完了したダンジョンをMoveの行き先から隠す
// @namespace   Violentmonkey Scripts
// @match       https://ermk.xsrv.jp/discovery.php
// @match       https://ermk.xsrv.jp/map.php
// @grant       none
// @version     1.1
// @author      -
// @description 2025/3/7 3:47:03
// @updateURL   https://github.com/yayau774/userscripts/raw/main/sorenari/hideCompletedDunegons.user.js
// ==/UserScript==

// ダンジョン名の配列JSONを置くLocalStorageのキー
const LOCAL_STORAGE_KEY = "yy-sorenari-completeddungeons";

// url
const UrlDiscovery = "https://ermk.xsrv.jp/discovery.php";
const urlMove = "https://ermk.xsrv.jp/map.php";

if(document.URL === UrlDiscovery){
  save(findCompletedDungeons());
}

if(document.URL === urlMove){
  addHiddenStyle();
  hideCompletedDungeons()
}


///////////////////////////////////////////////////////////////////////////////////////////
// ここから下は関数だけ

// localstorageにダンジョン名のArray<string>を渡して保存
function save(dungeons){
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(dungeons));
}
// localstorageからダンジョン名を取得してSet<string>として返す
function load(){
  return new Set(JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)))
}

/**
 * 完了済みのダンジョン名を取得してArray<string>で返す　Discoveryのページでつかう
 */
function findCompletedDungeons(){
  const pickDungeon = /(.+)\s\d+\s\/\s\d+/;
  const dungeonSet = new Set()
  document.querySelectorAll("table#discoverylist tr").forEach(row => {
    if(row.querySelector("a")){
      const dungeon = row.querySelector("td:nth-of-type(5)")?.innerText;
      if(pickDungeon.test(dungeon)){
        dungeonSet.add(pickDungeon.exec(dungeon)[1])
      }
    }
  })

  return [...dungeonSet.keys()];
}

/**
 * 隠蔽用スタイルの追加
 */
function addHiddenStyle(){
  const style = document.createElement("style")
  style.innerHTML = ".yy-hidden {display: none;}";
  document.querySelector("head").insertAdjacentElement("beforeend", style);
}

/**
 * 完了済みダンジョンを隠す
 */
function hideCompletedDungeons(){
  const dungeons = load();
  document.querySelectorAll("label").forEach(label => {
    if(dungeons.has(label.textContent)){
      label.closest("tr").style.display = "none";
    }
  })
}