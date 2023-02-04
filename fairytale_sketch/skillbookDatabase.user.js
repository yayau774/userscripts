// ==UserScript==
// @name         New Userscript
// @namespace    https://github.com/yayau774/userscripts
// @version      0.1
// @description  try to take over the world!
// @author       Yayau
// @match        http://soraniwa.428.st/fs/?mode=skill
// @updateURL    https://github.com/yayau774/userscripts/raw/main/fairytale_sketch/skillbookDatabase.user.js
// ==/UserScript==

(function() {
  'use strict';

  const LOCAL_STORAGE_KEY = "yy-fs-storedSkillbook";


  // LocalStorageから保存したスキルブックDBを取得　不在なら空配列
  /** @type {Array} */
  let stored = JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) ?? "[]");

  // 表示されているすきるぶっくを読み込んでtmpに保存
  let tmp = [];
  let skills = document.querySelectorAll("span.btnSkill");
  skills.forEach(e => {
    // data-で始まる属性を取得していく
    let skill = {};
    e.getAttributeNames().filter(attr => {
      return attr.startsWith("data-");
    }).forEach(attr => {
      skill[attr.split("data-")[1]] = e.getAttribute(attr);
    });
    tmp.push(skill);
  });

  // すきるぶっくとの差異を比べる・違うならすきるdbから読み込んだデータを書き換え
  let newSkill = [];
  let modifiedSkill = [];
  tmp.forEach(skill => {
    // 既存ならstored内indexが、初出なら-1がfindに入る
    let find = stored.findIndex(s => s.id == skill.id);
    if(find == -1){
      stored.push(skill);
      newSkill.push(skill);
    }else{
      // 既存のものと比較して違いがあれば上書き
      const skillstr = JSON.stringify(Object.entries(skill).sort());
      const storedstr = JSON.stringify(Object.entries(stored[find]).sort());
      if(skillstr !== storedstr){
        stored[find] = skill;
        modifiedSkill.push(skill);
      }
    }

  });

  // すきるdbに変更があれば保存
  stored.sort((a, b) => parseInt(a.id) - parseInt(b.id));
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stored));

  // 表示
  if(stored.length > 0){
    console.log("now skill: " + stored.length);
    console.log(stored);
  }

  if(newSkill.length > 0){
    console.log("new skill: " + newSkill.length);
    console.log(newSkill);
  }
  if(modifiedSkill.length > 0){
    console.log("modified skill: " + modifiedSkill.length);
    console.log(modifiedSkill);
  }



})();

