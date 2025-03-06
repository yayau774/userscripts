// ==UserScript==
// @name        Discoveryで完了したダンジョンをMoveの行き先から隠す
// @namespace   Violentmonkey Scripts
// @match       https://ermk.xsrv.jp/discovery.php
// @match       https://ermk.xsrv.jp/map.php
// @grant       none
// @version     1.0
// @author      -
// @description 2025/3/7 3:47:03
// @updateURL   https://github.com/yayau774/userscripts/raw/main/sorenari/hideDestination.user.js
// ==/UserScript==

// ダンジョン名の配列JSONを置くLocalStorageのキー
const LOCAL_STORAGE_KEY = "yy-sorenari-completeddungeons";

// url
const UrlDiscovery = "https://ermk.xsrv.jp/discovery.php";
const urlMove = "https://ermk.xsrv.jp/map.php";

if(document.URL === UrlDiscovery){
  save(findCompletedMaps());
}

if(document.URL === urlMove){
  const dungeons = load();
  console.log(dungeons);
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
function findCompletedMaps(){
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
