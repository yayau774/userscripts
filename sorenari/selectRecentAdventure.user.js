// ==UserScript==
// @name        直前の行き先と連れ出しを再現するボタンを追加する
// @namespace   Violentmonkey Scripts
// @match       https://ermk.xsrv.jp/map.php
// @grant       none
// @version     1.0
// @author      -
// @description 2025/3/13 5:38
// @updateURL   https://github.com/yayau774/userscripts/raw/main/sorenari/selectRecentAdventure.user.js
// ==/UserScript==


// 連れ出しの配列JSONを置くLocalStorageのキー
const LOCAL_STORAGE_KEY = "yy-sorenari-recently";

// 直近の連れ出し情報
const recently = load();

// フォーム送信時に起動する関数を登録
const form = document.querySelector("#moveform");
form.addEventListener("submit", e => {
  const party = getParty(form)
  if(party.goto){
    save(party);
  }
})

// 保存されたデータをほんとに使っていいのか？
const destination = getDestination(recently.goto)
const members = recently.members.map(id => getCharactor(id))
if([destination, ...members].every(elem => elem !== false)){
  settleButton(destination, members)
}

///////////////////////////////////////////////////////////////////////////////////////////
// ここから下は関数だけ

// localstorageに連れ出し情報を渡して保存
function save(party){
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(party));
}
// localstorageから連れ出し情報を取得して返す
function load(){
  return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY))
}

// formから行き先とパーティメンバーの情報を得て、{goto: string, members: string[]}として返す
function getParty(form){
  const fd = new FormData(form);
  return {
    goto: fd.get("goto"),
    members: fd.getAll("member[]")
  };
}

// recently.gotoをもとにラジオボタンと行き先のラベルを取得する　見つからないor不可視ならfalse
function getDestination(goto){
  const destination = document.querySelector(`input[name=goto][value='${goto}']`);
  if(destination?.checkVisibility({visibilityProperty: true})){
    return {
      input: destination,
      label: destination.labels[0].textContent
    }
  }else{
    return false;
  }
}

// idをもとにチェックボックスとidと名前を取得　見つからないor不可視ならfalse
function getCharactor(id){
  const chara =  document.querySelector(`input[name='member[]'][value='${id}']`);
  if(chara?.checkVisibility({visibilityProperty: true})){
    return {
      input: chara,
      id,
      name: chara.closest("tr").querySelector("td:nth-of-type(3)").textContent
    }
  }else{
    return false;
  }
}

// 保存された情報を呼び出すボタンを設置
function settleButton(destination, members){
  const btn = document.createElement("button")
  btn.textContent = "直近の連れ出しと行き先"
  btn.type = "button"
  btn.addEventListener("click", e => {
    [destination, ...members].forEach(elem => elem.input.checked = true)
  })

  const text = document.createElement("div")
  text.innerText = `${destination.label}\n` + members.map(member => `(${member.id}) ${member.name}`).join("\n");

  const div = document.createElement("div")
  div.append(btn, text)

  document.querySelector("div#movemenu p").insertAdjacentElement("afterend", div);
}

