# Синхронизация и отображение статуса в shikimori

Путь к скрипту `src/aniliberty.top/shikimori.user.ts`

## Требования к скрипту

- на typescrtipt без зависимостей (кроме тех которые указаны отдельно)
- используй определения типов (any запрещен)
- сборка уже есть
- учесть бесконечный скроллинг и spa
- учесть что кнопка находится внутри a и нужно запретить всплытие события (иначе переходит на страницу)
- при ошибке или успехе - нотификация в правом нижнем углу
- kiss dry solid

### Заготовка скрипта 
```ts
// ==UserScript==
// @name         AniLibria shikimori status sync
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Sync and display shikimori status
// @author       UserScript
// @match        https://www.aniliberty.top/
// @match        https://aniliberty.top/
// ==/UserScript==

(() => {
  //code here
})();
```

## Логика

### 1. настройки

Нужна какая то логика по предварительной настройке юзерскрипта.

Нам необходимо сохранить shikimori логин.

Я думаю так:

1. отслеживаем что страница открыта на `https://www.aniliberty.top/app/settings/account`
2. внутри `div.d-flex > div.w-100` создаем html

Ниже пример формы, я скопировал существующую форму сайта, нужно только адаптировать текст

```html
<div class="v-card-text py-0 mt-12">
  <div class="fz-100 ff-heading font-weight-bold">Настройки аккаунта</div>
  <div class="fz-75 ff-body text-grey lh-150">
    В этом разделе настроек вы можете изменить данные вашего аккаунта
  </div>
  <div class="fz-75 ff-body text-grey lh-150">
    Будьте внимательны, т.к. некоторые изменения могут нести необратимый характер
  </div>
</div>
<div
  class="v-card v-theme--dark v-card--density-default v-card--variant-elevated mt-2"
  isloadable="true"
>
  <!---->
  <div class="v-card__loader">
    <div
      class="v-progress-linear v-theme--dark v-locale--is-ltr"
      role="progressbar"
      aria-hidden="true"
      aria-valuemin="0"
      aria-valuemax="100"
      style="top: 0px; height: 0px; --v-progress-linear-height: 2px;"
    >
      <!---->
      <div class="v-progress-linear__background"></div>
      <div class="v-progress-linear__buffer" style="width: 0%;"></div>
      <div class="v-progress-linear__indeterminate">
        <div class="v-progress-linear__indeterminate long"></div>
        <div class="v-progress-linear__indeterminate short"></div>
      </div>
      <!---->
    </div>
  </div>
  <!----><!----><!---->
  <div
    class="v-list-item v-theme--dark v-list-item--density-default rounded-0 v-list-item--variant-text py-4"
  >
    <!----><span class="v-list-item__underlay"></span
    ><!---->
    <div class="v-list-item__content" data-no-activator="">
      <!----><!---->
      <div class="d-flex align-center flex-wrap justify-space-between">
        <div class="">
          <div class="v-list-item-title fz-80 ff-heading font-weight-bold text-wrap lh-120">
            Логин
          </div>
          <div class="v-list-item-subtitle pt-1">
            <div class="fz-70 ff-body lh-150 text-grey-lighten-1">Изменить ваш логин</div>
            <div class="fz-70 ff-body lh-150 text-grey-lighten-1">
              Ваш логин не отображается другим пользователям и используется для авторизации в вашей
              учетной записи
            </div>
          </div>
          <!---->
          <div class="v-layout mt-2" style="z-index: 900; position: relative; overflow: hidden;">
            <div
              class="v-input v-input--horizontal v-input--center-affix v-input--density-comfortable v-theme--dark v-locale--is-ltr v-input--dirty v-text-field"
              style="max-width: 350px;"
            >
              <!---->
              <div class="v-input__control">
                <div
                  class="v-field v-field--active v-field--center-affix v-field--dirty v-field--no-label v-field--variant-outlined v-theme--dark v-locale--is-ltr"
                >
                  <div class="v-field__overlay"></div>
                  <div class="v-field__loader">
                    <div
                      class="v-progress-linear v-theme--dark v-locale--is-ltr"
                      role="progressbar"
                      aria-hidden="true"
                      aria-valuemin="0"
                      aria-valuemax="100"
                      style="top: 0px; height: 0px; --v-progress-linear-height: 2px;"
                    >
                      <!---->
                      <div class="v-progress-linear__background"></div>
                      <div class="v-progress-linear__buffer" style="width: 0%;"></div>
                      <div class="v-progress-linear__indeterminate">
                        <div class="v-progress-linear__indeterminate long"></div>
                        <div class="v-progress-linear__indeterminate short"></div>
                      </div>
                      <!---->
                    </div>
                  </div>
                  <!---->
                  <div class="v-field__field" data-no-activator="">
                    <!----><!----><!----><input
                      size="1"
                      type="text"
                      id="input-v-0-0-513"
                      class="v-field__input"
                      value="google:user:118353143366443526186"
                    /><!---->
                  </div>
                  <!----><!---->
                  <div class="v-field__outline">
                    <div class="v-field__outline__start"></div>
                    <!---->
                    <div class="v-field__outline__end"></div>
                    <!---->
                  </div>
                </div>
              </div>
              <!----><!---->
            </div>
            <button
              type="button"
              class="v-btn v-btn--flat v-theme--dark v-btn--density-default v-btn--size-default v-btn--variant-flat px-3 br-root ml-2"
              style="background-color: rgba(255, 255, 255, 0.1); height: 48px;"
            >
              <span class="v-btn__overlay"></span><span class="v-btn__underlay"></span
              ><!----><span class="v-btn__content" data-no-activator=""
                ><!---->
                <div class="mx-1 ff-heading fz-70 text-white">Обновить</div></span
              ><!----><!---->
            </button>
          </div>
          <!----><!---->
        </div>
        <div class="mt-2"></div>
      </div>
    </div>
    <div class="v-list-item__append"><div class="v-list-item__spacer"></div></div>
  </div>
  <!----><!----><!----><span class="v-card__underlay"></span>
</div>
```

3. Логин сохраняется куда нибудь в постоянное хранилище, думаю localStorage пойдет

4. При сохранении логина скачиваем список просмотренного, используем `GM_xmlhttpRequest` т.к. fetch не даст скачать из за cors

`https://shikimori.io/<shikimori_login>/list_export/animes.json`

содержимое файла представляет собой:

```json
[
 {
    "target_title": "Initial D First Stage",
    "target_title_ru": "Инициал Ди: Стадия первая",
    "target_id": 185,
    "target_type": "Anime",
    "score": 8,
    "status": "completed",
    "rewatches": 0,
    "episodes": 26,
    "text": ""
  },
]
]
```

Впринципе все понятно, а статус можно выводить как есть

Кстати в форме + еще добавить кнопку синхронизации. Только в этих двух местах будет синхронизация списка (ну мб еще подумать о том чтобы раз в день синхронизировать при открытии сайта aniliberty)

### Сопоставление

Впринципе можем использовать `target_title` и делать точное сравнение по en (но могут быть различия в знаках пунктации и т.д.)
Скорее всего нужна будет функция которая уберет все лишнее из имени тайтла и приведет к нижнему регистру. т.е. `[\w\s]`. `saintiseTitle(string)`. спецсимволы меняем на пробелы, потом убираем лишние пробелы, и в нижний регистр.

Скорее всего имеет смысл сделать хеш таблицу по `saintiseTitle(target_title)`: list_item_info

## 2. Отображение статуса

### https://www.aniliberty.top/anime/catalog/

- получаем список тайтлов в dom
  `div.v-list > a[role="listitem"]` c href начинающийся на `/anime/releases/release/`

- внутри a ищем `div.v-list-item__content div.ff-heading.text-grey-darken-2`. Это будет en имя тайтла на aniliberty
- сопоставляем с хештаблицей в памяти, например `hashmap[saintiseTitle(title)]`.
- выводим статус после `div.my-2.text-grey-darken-1` (sibling), например `shikimori: ${raw_status}`

### Детальная страница https://www.aniliberty.top/anime/releases/release/*

- получаем en имя тайтла `div.v-col-md-8.v-col-12.align-self-end > div.fz-70.ff-heading.text-grey-darken-2.mb-3`
- сопоставляем
- добавляем html в `div.v-col-md-8.v-col-12.align-self-end > .fz-80.ff-body.mb-3`

```html
<div class="d-flex align-center">
  <div class="text-grey-darken-1 mr-1">Shikimori:</div>
  <div class="text-truncate">${raw_status}</div>
</div>
```

### В поиске (любая страница)

- Отслеживаем режим модального окна  `div.search__modal`
- получаем список `div.search__modal div.v-overlay__content .v-list > a[role="listitem"]` 
Кстати, список может обновляться т.к. это окно поиска.
- внутри a находим en `.ff-body > div.v-list-item-subtitle.fz-70.text-grey.text-pre-wrap`
- сопоставляем
- добавляем html в `.ff-body` 

```html
<div class="v-list-item-subtitle fz-70 text-grey">Shikimori: ${raw status}</div>
```
