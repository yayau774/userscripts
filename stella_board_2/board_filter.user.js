// ==UserScript==
// @name         stella board 2 / board filter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  すてらぼーど２）募集ボードにフィルターをつける
// @author       Yayau
// @match        http://stella2.428.st/?mode=board
// @updateURL    https://github.com/yayau774/userscripts/raw/main/stella_board_2/board_filter.user.js
// ==/UserScript==

(function() {
    'use strict';
  
    //  head最後にスタイルシートを追加
    document.querySelector('head').insertAdjacentHTML('beforeend', `
    <style>
    #yy-filter {
        margin-left: 1em;
    }
    #yy-filter input,
    #yy-filter button {
        box-sizing: border-box;
        height: 2em;
        vertical-align: middle;
    }

    tr.yy-display-none {
        display: none;
    }
    em {
        background: yellow;
        color: brown;
        padding: 0 3px;
        font-style: normal;
    }
    </style>`);

    //  検索対象テーブルの取得
    const table = document.getElementById("bag");

    //  検索ターゲットのテキストノードをspanで包んで差し替え　テキストノードの操作がめんどくさいので
    table.querySelectorAll("tr td:nth-of-type(2)").forEach(td => {
        const span = document.createElement("span");
        span.textContent = td.firstChild.textContent;
        td.replaceChild(span, td.firstChild);
    });

    //  検索フォームの作成
    table.insertAdjacentHTML('beforebegin', `
        <form id="yy-filter">
        <input type="text" placeholder="フィルター">
        <button type="submit">🔍</button>
        </form>
        `);
    const form = document.getElementById("yy-filter");
    const input = form.querySelector("input");

    //  検索フォームのsubmitイベントを設定
    form.addEventListener("submit", e => {
        //  おまじないと検索の初期化
        e.preventDefault();
        initializeFilter();

        //  空白だけっぽかったらスルー
        const filter = input.value;
        if(filter.match(/^\s?$/)){
            return false;
        }

        //  各tr内、2番目に登場するtdをそれぞれ見ていって…
        table.querySelectorAll("tr td:nth-of-type(2)").forEach(td => {
            //  ヒットしたらemで囲う
            let s = td.querySelector("span");
            let d = td.querySelector("div");
            if(s.textContent.includes(filter)){
                s.innerHTML = s.innerHTML.replace(filter, "<em>" + filter + "</em>");
            }else if(d.textContent.includes(filter)){
                d.innerHTML = d.innerHTML.replace(filter, "<em>" + filter + "</em>");
            }else{
                td.parentElement.classList.add("yy-display-none");
            }
        });
    });

    //  検索の初期化
    function initializeFilter(){
        table.innerHTML = table.innerHTML.replace(/<em>(.+?)<\/em>/gi, '$1');
        table.querySelectorAll("tr.yy-display-none").forEach(e=>e.classList.remove("yy-display-none"));
    }

  })();
  