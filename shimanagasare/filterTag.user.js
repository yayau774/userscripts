// ==UserScript==
// @name         シマナガサレの島リストにフィルタを追加する
// @namespace    https://github.com/yayau774/userscripts
// @version      0.1
// @description  try to take over the world!
// @author       Yayau
// @match        https://wdrb.work/shima/islandlist.php*
// @updateURL    https://github.com/yayau774/userscripts/raw/main/ふぉるだ/ふぁいる.user.js
// ==/UserScript==

(function() {
    'use strict';
  
    // Your code here...
	let ulSort = document.querySelector("ul.island_sort");
    let liFilter = document.createElement("li");
    liFilter.style.flexFlow = "column";
    liFilter.style.alignItems = "start";
    liFilter.style.height = "4em";
    ulSort.appendChild(liFilter);

    // パス付きフィルタ　初期状態on
    let checkboxPass = document.createElement("input");
    checkboxPass.setAttribute("type", "checkbox");
    checkboxPass.setAttribute("checked", "true");
    checkboxPass.addEventListener("change", changeCheckBoxPass);
    let lblPass = document.createElement("label");
    lblPass.textContent = "パス付き";
    lblPass.prepend(checkboxPass);
    liFilter.appendChild(lblPass);

    // 非公開フィルタ　初期状態off
    let checkboxPrivate = document.createElement("input");
    checkboxPrivate.setAttribute("type", "checkbox");
    checkboxPrivate.setAttribute("checked", "true");
    checkboxPrivate.addEventListener("change", changeCheckBoxPrivate);
    let lblPrivate = document.createElement("label");
    lblPrivate.textContent = "非公開";
    lblPrivate.prepend(checkboxPrivate);
    liFilter.appendChild(lblPrivate);


    //  head最後にスタイルシートを追加
    document.querySelector('head').insertAdjacentHTML('beforeend', `
<style>
.yy-hidden {display: none;}
</style>`);

    /**
     * checkboxPassの状態が変化したとき、チェックされていればdisplayを初期指定状態、されていなければnone
     * 
     * @param {Event} e
     */
    function changeCheckBoxPass(e){
        let p = document.querySelectorAll("p.pass");
        console.log(e.target.checked);
        p.forEach(e.target.checked == true
            ? p=>{ p.closest("ul").style.display = null }
            : p=>{ p.closest("ul").style.display = "none" }
        );
    }

    function changeCheckBoxPrivate(e){
        let p = document.querySelectorAll("p.prive");
        console.log(e.target.checked);
        p.forEach(e.target.checked == true
            ? p=>{ p.closest("ul").style.display = null }
            : p=>{ p.closest("ul").style.display = "none" }
        );
    }

})();
  