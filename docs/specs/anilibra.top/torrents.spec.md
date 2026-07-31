# Хелпер для быстрого сохранения торрента


* Урл для скрипта https://www.aniliberty.top/anime/catalog/

- на typescrtipt без зависимостей
- не забудь определения типов (any запрещен)
- сборка уже есть
- учесть бесконечный скроллинг
- учесть что кнопка находится внутри a и нужно запретить всплытие события (иначе переходит на страницу)
- при ошибке или успехе - нотификация в правом нижнем углу
- kiss dry 

Заготовка:

```ts
// ==UserScript==
// @name         AniLibria torrents
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds some QoL helpers to civitai.red
// @author       UserScript
// @match        https://www.aniliberty.top/anime/catalog/
// ==/UserScript==

(() => {
  //code here
})()

```


## Логика

- получаем список тайтлов в dom
`div.v-list > a[role="listitem"]` c href начинающийся на `/anime/releases/release/`
- из href получаем alias - `/anime/releases/release/{alias}/episodes`
 Например  `/anime/releases/release/hibike-euphonium-3-specials/episodes` -> `hibike-euphonium-3-specials`
- внутри a находим -  `div.v-layout` (контейнер для кнопок), создаем кнопки рядом:
- `hevc magnet` 
- `hevc torrent`

Образец верстки кнопки ниже
```html
<div class="d-flex">
  <button type="button" class="v-btn v-btn--flat v-theme--dark v-btn--density-null v-btn--size-default v-btn--variant-flat px-3 br-root" style="background-color: rgba(255, 255, 255, 0.1); height: 36px; min-width: 40px; width: 40px;"><span class="v-btn__overlay"></span><span class="v-btn__underlay"></span><!----><span class="v-btn__content" data-no-activator=""><i class="v-icon notranslate v-theme--dark text-white" aria-hidden="true" style="font-size: 20px; height: 20px; width: 20px;">
    <svg class="v-icon__svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" role="img" aria-hidden="true">
      ... 
  </svg></i><!----><!----><!----></span><!----><!----></button>
</div>
```

При клике на кнопку:

- получаем текущий список из внутреннего состояния nuxt

```js
// Функция получения стейта мб общая для всех, типа getNuxtState()
const state = document.querySelector('#__nuxt').__vue_app__._context.config.globalProperties.$pinia.state._rawValue
const catalog = state['anime.catalog'].releases._rawValue.data
```

содержимое catalog:

```json
[
  {
      "id": 10222,
      "alias": "hibike-euphonium-3-specials",
  }
]
```

На этом этапе надо построить или обновить обратный хеш карту алиас -> id

- загружаем список торрентов, фильтруем по codec.label == 'HEVC'
`GET https://www.aniliberty.top/api/v1/anime/torrents/release/10222`

Я оставил только те ключи которые нужны
```json
[
  {
    "hash": "d32d6213ca6a89d62f981b27da36e24ac354ede0",
    "codec": {
      "label": "HEVC",
    },
    "magnet": "magnet:?xt=urn:btih:e486614be928dcefad2b09701df67a6cb956c10f&dn=Boku+no+Tsuma+wa+Kanjou+ga+Nai+-+AniLibria+%5BWEBRip+1080p+HEVC%5D&xl=2651689708&tr=http://tr.libria.fun:2710/announce?pk=GIM...XS&tr=http://retracker.local/announce",
  }
]
```

- если кнопка была `hevc magnet` - открываем магнет 
- иначе загружаем следующий урл (как файл):
`https://www.aniliberty.top/api/v1/anime/torrents/<hash>/file?pk=<passkey>`

Пасскей получаем так
```js
const passkey = state["me.account"].profile._rawValue.torrents.passkey
```

пример

`https://www.aniliberty.top/api/v2/anime/torrents/e486614be928dcefad2b09701df67a6cb956c10f/file?pk=GIM...HXS`
