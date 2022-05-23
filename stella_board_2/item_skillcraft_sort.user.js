// ==UserScript==
// @name         stella board 2 / item skillcraft sort
// @namespace    https://github.com/yayau774/userscripts
// @version      0.1
// @description  スキルを作るセレクトボックスにソートボタンを添える
// @author       Yayau
// @match        http://stella2.428.st/?mode=item
// @updateURL    https://github.com/yayau774/userscripts/raw/main/stella_board_2/item_skillcraft_sort.user.js
// ==/UserScript==

(function() {
    'use strict';
  
    // セレクトボックスとその中身を取得
    const sel  = document.querySelector("select[name=sno]");
    const selary = Array.from(sel.querySelectorAll("option"));

    //  通常順ボタン　ソートはvalueを見る　数値扱いするからparseIntする
    const btn_sno = document.createElement("button");
    btn_sno.type = "button";
    btn_sno.textContent = "通常順";
    btn_sno.addEventListener("click", e => {
        selary.sort((a, b) => parseInt(a.value) < parseInt(b.value) ? -1 : 1);
        selary.forEach(e => sel.appendChild(e));
    });
  
    //  50音順ボタン　ソートはtextContentを見る
    const btn_name = document.createElement("button");
    btn_name.type = "button";
    btn_name.textContent = "50音順";
    btn_name.addEventListener("click", e => {
        selary.sort((a, b) => a.textContent < b.textContent ? -1 : 1);
        selary.forEach(e => sel.appendChild(e));
    });

    //  ぼたん追加
    const f = sel.closest("form");
    const p = f.insertBefore(document.createElement("p"), f.firstChild);
    p.classList.add("yy-skillcraft-sort");
    p.appendChild(btn_sno);
    p.appendChild(btn_name);

    //  head最後にスタイルシートを追加
    document.querySelector('head').insertAdjacentHTML('beforeend', `
    <style>
    .yy-skillcraft-sort button {
        margin: 0 0.5em;
        padding: 0 0.5em;
    }
    </style>`);

})();
