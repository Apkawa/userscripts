# Хелпер для копирования ссылки на скачивание только для репозитория 


* Урл для скрипта https://github.com/zed-industries/zed/releases/

на typescrtipt без зависимостей, сборка уже есть

Заготовка:

```ts
// ==UserScript==
// @name         Zed download helpers
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds some QoL helpers to civitai.red
// @author       UserScript
// @match        https://github.com/zed-industries/zed/releases/*
// ==/UserScript==

(() => {
  //code here
})()

```

## Логика

0) Добавляем иконку копирования рядом с ссылками вида:
```html
<a href="/zed-industries/zed/releases/download/v1.12.0/zed-linux-aarch64.tar.gz" rel="nofollow" data-turbo="false" data-view-component="true" class="Truncate">
    <span data-view-component="true" class="Truncate-text text-bold">zed-linux-aarch64.tar.gz</span>
    <span data-view-component="true" class="Truncate-text"></span>
</a>
```
Ссылки начинаются с `/zed-industries/zed/releases/download/`

во время копирования:

1) Поднимаемся по родителям вверх до section

```html
<section id="release-v1.12.0" aria-labelledby="hd-a1e7f9f7" data-release-anchor="release-v1.12.0" style="scroll-margin-top: 24px;">
```

2) Берем версию из `section[id]` отрезав `release-v`, нам нужна версия без v
3) и sha коммита из ссылки в релизе

```html
<a data-hovercard-type="commit" href="/zed-industries/zed/commit/f96212f2c50f54d93712fa130d6226b1ce7d76b5">...</a>
```
4) Ищем build_number

fetch

`https://api.github.com/repos/zed-industries/zed/actions/workflows/release.yml/runs?head_sha=<commit_sha>&per_page=5&status=completed`

В ответе нас интересует `run_number`
```json
{
  "total_count": 1,
  "workflow_runs": [
    {
      ...
      "run_number": 328,
      ...
    }
  ]
}
```

## Формируем текст для копирования ссылки для aria2c:

Для всех файлов кроме zed-remote-server-*:
```
https://github.com/zed-industries/zed/releases/download/v1.12.0/zed-linux-x86_64.tar.gz
    out=zed-linux-x86_64-v<version>.tar.gz
```

Для файлов вида `zed-remote-server` формируем такую ссылку
```
https://github.com/zed-industries/zed/releases/download/v1.12.0/zed-remote-server-linux-x86_64.gz
    out=zed-remote-server-stable-<version>+stable.<build_number>.<commit_sha>.tar.gz 
```
