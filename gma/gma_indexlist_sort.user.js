// ==UserScript==
// @name         ごま学 - アイテムの一覧をソートした状態で表示
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://blacktea.sakura.ne.jp/GMA/_LOGIN/login.cgi
// @updateURL    https://github.com/yayau774/userscripts/raw/main/gma/gma_indexlist_sort.user.js
// ==/UserScript==

(function() {
  'use strict';

  ////////////////////
  //  前準備
  ////////////////////

  // ソートに使う基準にする配列　配列のなかでヒットした値のインデックスをつかってソートする
  const typelist = [
    "頭部",
    "レーダー",
    "腕部",
    "操縦棺",
    "二脚",
    "逆関節",
    "多脚",
    "タンク",
    "車輪",
    "飛行",
    "エンジン",
    "レーダー",
    "FCS",
    "射撃武器",
    "格闘武器",
    "装甲",
    "ブースター",
    "培養装置",
  ];
  const weightlist = [
    "軽",
    "中",
    "重",
  ]
  // 対象の値が何番目にあるか（見つからなかったらInfinity）を返す関数
  function getOrder(list, target){
    let order = list.indexOf(target);
    return order != -1 ? order : Infinity ;
  }


  ////////////////////
  //  実行
  ////////////////////

  // 必要なDOMを採取
  const tbl = document.getElementById("id_item_index_list").querySelector("table.CNT");
  const tbody = Array.from(tbl.querySelectorAll("tr")).slice(1)
    .map(v => ({
      DOM: v,
      type: v.querySelectorAll("td")[0].innerText,
      weight: v.querySelectorAll("td")[3].innerText,
      skill: v.querySelectorAll("td")[5].innerText,
    }));

  // まず並び順だけを計算する
  tbody.sort((a, b) => {
    // 種類で比較
    let typeCompare = getOrder(typelist, a.type) - getOrder(typelist, b.type);
    switch(true){
      case typeCompare < 0:
        return -1;
      case typeCompare > 0:
        return 1;
      default:
        break;
    }

    // 種類が同じだったら重量で比較
    let weightCompare = getOrder(weightlist, a.weight) - getOrder(weightlist, b.weight);
    switch(true){
      case weightCompare < 0:
        return -1;
      case weightCompare > 0:
        return 1;
      default:
        break;
    }

    // それでも同じだったら葬列スキルで比較　日本語の文字列ソートなのでlocaleCompareを使う必要がある
    let skillCompare = a.skill.localeCompare(b.skill);
    switch(true){
      case skillCompare < 0:
        return -1;
      case skillCompare > 0:
        return 1;
      default:
        return 0;
    }
  });

  // 実際にDOMを並び替える
  tbody.forEach(v => {
    tbl.insertAdjacentElement('beforeend', v.DOM);
  });

})();

