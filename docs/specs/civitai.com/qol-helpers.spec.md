# Civitai QoL helpers

Улучшаем качество жизни в цивите

1) Добавляем кнопку быстрого копирования промпта не переходя на страницу детального изображения
2) Добавляем кнопку быстрого добавления картинки в коллекцию

## Заготовка

```ts
// ==UserScript==
// @name         Civitai QoL helpers
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Adds some QoL helpers to civitai.red
// @author       UserScript
// @match        https://civitai.com/*
// @match        https://civitai.red/*
// @grant        GM_xmlhttpRequest
// @connect      ://civitai.red
// @connect      ://civitai.com
// @connect      ://*.civitai.red
// @connect      ://*.civitai.com
// ==/UserScript==

(() => {
  //code
})()

```

## Логика


### 1. Быстрое копирование промпта

1) В контейнере извлечь id изображения, образец карточки изображения в каталоге
Ищем все карточки с вхождением типа 
`href="/images/<id>"`, например `href="/images/135533281"`

```html
<div
>
  <div
    class="relative flex overflow-hidden rounded-md border-gray-3 bg-gray-0 shadow-gray-4 dark:border-dark-4 dark:bg-dark-6 dark:shadow-dark-8 flex-col border"
  >
    <div class="relative flex-1">
      <a
        class="mantine-focus-auto m_849cf0da absolute inset-0 m_b6d8b162 mantine-Text-root mantine-Anchor-root"
        data-variant="text"
        data-underline="hover"
        href="/images/135533281"
        ><img
          class="EdgeImage-module-scss-module__q32jQG__image Cards-module__OuHqJW__image"
          src="https://image.civitai.com/xG1nkqKTMzGDvpLrqFT7WA/f8307e56-65ac-4041-b478-ebaab09e89bd/anim=false,width=450,optimized=true/135533281.jpeg"
          placeholder="empty"
          loading="lazy"
          style="max-width: 450px;"
      /></a>
      <div class="absolute left-2 top-2">
        <div class="flex flex-nowrap items-center gap-1"></div>
      </div>
      <div class="absolute right-2 top-2 flex flex-col gap-2">
        <button
          class="mantine-focus-auto mantine-active m_8d3f4000 mantine-ActionIcon-root m_87cf2631 mantine-UnstyledButton-root"
          data-variant="transparent"
          type="button"
          aria-label="More options"
          aria-haspopup="menu"
          aria-expanded="false"
          aria-controls="mantine-992hf8dq9-dropdown"
          id="mantine-992hf8dq9-target"
        >
          <span class="m_8d3afb97 mantine-ActionIcon-icon"
            >
              <svg>...</svg>
            </span>
        </button>
      </div>
      <div class="absolute bottom-1 right-1"></div>
    </div>
    <div>
      <div class="flex items-center justify-center gap-1 justify-between p-2">
        ... строка с реакциями
      </div>
    </div>
  </div>
</div>
```

2) Добавляем кнопку со значком копировать слева сверху изображения
3) при нажатии на кнопку делаем следующее:
  * показываем спиннер
  * Дергаем апи:
  ```js
  fetch("https://civitai.red/api/trpc/image.getGenerationData?input=%7B%22json%22%3A%7B%22id%22%3A135533281%2C%22authed%22%3Atrue%7D%7D");
  ```
  Где input - это url encoded json вида `{"json":{"id":<id>,"authed":true}}`
  * Получаем ответ где нас интеренсует поле `prompt`
  ```json
  {
      "result": {
          "data": {
              "json": {
                  // ...
                  "meta": {
                      "prompt": "A charismatic supervillain standing in the middle of a burning city street while laughing uncontrollably, explosions lighting the skyline behind him, playing cards flying through the air, expensive tailored suit flowing in the wind, chaotic energy, intense facial expression, dramatic comic splash page, bold inks, vivid colors, stylized smoke and fire, high contrast shadows highly detailed graphic novel art <lora:(kREA)Comic Book V2T2:1> <lora:krea2filterbypass3:1>",
                      // Остальное обрезал
                  }
                  // ...
              }
          }
      }
  }
  ```
  * `prompt` копируем в буфер 
  * Спиннер выключается и ненадолго кнопка загорается зеленым
  * В некоторых случаях промпта может не быть, или ошибка апи. просто хуйни alert вместо нотификации, я доработаю т.к. у меня уже есть функция нотификации.

### 2. Быстрое добавление в коллекцию

1) Аналогично разделу 1. выше
2) Добавляем кнопку со значком вкладки слева сверху изображения
3) при нажатии делаем следующее
  * показываем спиннер
  * Дергаем апи "все коллекции пользователя" :
  ```js
  fetch("https://civitai.red/api/trpc/collection.getAllUser?input=%7B%22json%22%3A%7B%22permissions%22%3A%5B%22ADD%22%2C%22ADD_REVIEW%22%5D%2C%22type%22%3A%22Image%22%2C%22authed%22%3Atrue%7D%7D");
  ```
  Ответ:
  ```json
  {
      "result": {
          "data": {
              "json": [
                  {
                      "id": 852190, // collection_id
                      "name": "ref",
                      "description": "",
                      "read": "Private",
                      "userId": 1095786,
                      "write": "Private",
                      "imageId": null,
                      "type": "Image",
                      "isOwner": true,
                      "image": null,
                      "tags": []
                  },
                  {
                      "id": 283193,
                      "name": "fap ref",
                      "description": "",
                      "read": "Private",
                      "userId": 1095786,
                      "write": "Private",
                      "imageId": null,
                      "type": "Image",
                      "isOwner": true,
                      "image": null,
                      "tags": []
                  }
              ],
              "meta": {
                  "values": {
                      "0.image": [
                          "undefined"
                      ],
                      "1.image": [
                          "undefined"
                      ]
                  },
                  "v": 1
              }
          }
      }
  }
  ```
  * берем первый `collection_id`, заодно `user_id`
  * Затем `POST` запрос
  ```js
  fetch("https://civitai.red/api/trpc/collection.saveItem", {
    "body": "{\"json\":{\"imageId\": <image_id>,\"type\":\"Image\",\"collections\":[{\"collectionId\":<collection_id>,\"userId\":<user_id>,\"read\":\"Private\"}],\"removeFromCollectionIds\":[],\"authed\":true}}",
    "method": "POST",
  });
  ```
  Ответ: 200 OK `{"result":{"data":{"json":{"status":"added","isOwner":false}}}}`

  * Спиннер выключается и ненадолго кнопка загорается зеленым
  * В некоторых случаях промпта может не быть, или ошибка апи. просто хуйни alert вместо нотификации, я доработаю т.к. у меня уже есть функция нотификации.
