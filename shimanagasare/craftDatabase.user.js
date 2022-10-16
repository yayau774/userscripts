// ==UserScript==
// @name         作成レシピをLocalStorageに保存してコンソールに表示する
// @namespace    https://github.com/yayau774/userscripts
// @version      0.1
// @description  try to take over the world!
// @author       Yayau
// @match        https://wdrb.work/shima/item.php*
// @updateURL    https://github.com/yayau774/userscripts/raw/main/shimanagasare/craftDatabase.user.js
// ==/UserScript==

(function() {
    'use strict';
  
    // レシピの含まれたdivを取得してrecipes配列へ
    let commands = document.querySelectorAll("div.craft_command:not(#unselected)");
    let recipes = [];
    commands.forEach(div => {
        recipes.push(getRecipe(div));
    });

    /** @type {Object[]} stored LocalStorageから引っ張り出した記録済みのレシピ */
    let stored = JSON.parse(localStorage.getItem("storedRecipe") ?? "[]");
    let newRecipe = [];
    let modifiedRecipe = [];
    recipes.forEach(r => {
        // idを基準に重複サーチ
        let i = stored.findIndex(s => s.id == r.id);
        if(i == -1){
            // 新規レシピを記録
            stored.push(r);
            newRecipe.push(r);
        }else{
            // 変化のあったレシピを上書き
            const rstr = JSON.stringify(Object.entries(r).sort());
            const sstr = JSON.stringify(Object.entries(stored[i]).sort());
            if(rstr !== sstr){
                stored[i] = r;
                modifiedRecipe.push(r);
            }
        }
    });

    // idでソートしたのちにLocalStorageに保存
    stored.sort((a,b)=>parseInt(a.id) - parseInt(b.id));
    localStorage.setItem("storedRecipe", JSON.stringify(stored));
    
    // consoleに表示
    console.log("stored recipe -> " + stored.length);
    console.log(stored);
    if(newRecipe.length > 0){
        console.log("new recipe! -> " + newRecipe.length);
        newRecipe.forEach(r => console.log(r));
    }
    if(modifiedRecipe.length > 0){
        console.log("modified recipe! -> " + modifiedRecipe.length);
        modifiedRecipe.forEach(r => console.log(r));
    }

    /**
     * divからレシピオブジェクトを作って返す
     * 
     * @param {HTMLDivElement} div 
     */
    function getRecipe(div)
    {
        let rcp = {};
        rcp.id = div.id;
        rcp.name = div.querySelector("b").textContent.replace(/^・/, "");
        rcp.time = div.querySelector("small").textContent.match(/\d+/)[0];
        rcp.detail = div.querySelector("p i").textContent.replace(/\"/g, "");

        // テキストノードから引っ張らないといけない必要アイテム・必要ツール部分
        let text = "";
        div.childNodes.forEach(n=>{
            if(n.nodeType == 3){
                text += n.textContent;
            }
        });
        // 繋げたテキストノードを改行で分割→空行を削除→トリム
        let lines = text.split("\n").filter(l=>l.trim() !="").map(l=>l.trim());
        // 必要アイテムと必要ツールの入力
        rcp.rawReqItem = "";
        rcp.rawReqTool = "";
        lines.forEach(l => {
            if(/^必要アイテム/.test(l)){
                rcp.rawReqItem = l;
            }else if(/^必要ツール/.test(l)){
                rcp.rawReqTool = l;
            };
        });

        return rcp;
    }
  
})();
