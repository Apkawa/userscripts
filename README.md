# Коллекция юзерскриптов

## Юзерскрипты

### Актуальные скрипты


* [pikabu.ru/video_url.user.ts](dist/pikabu.ru/video_url.user.js) - добавление под видео ссылок на скачивание [mp4] и [gif] [[greasyfork]](https://greasyfork.org/scripts/433361) [[raw]](https://github.com/Apkawa/userscripts/raw/master/dist/pikabu.ru/video_url.user.js)
* [danbooru/sd-helper-danbooru.user.ts](dist/danbooru/sd-helper-danbooru.user.js) - копирование тегов и промпта из данбур для Stable Diffusion
* [huggingface.co/copy-download-link-as-aria2c.user.js](dist/huggingface.co/copy-download-link-as-aria2c.user.js) - копирование ссылки для aria2c для обниморды


### Заброшенные

* `src/hd.kinopoisk.ru/kp_subtitle_petition.user.ts` - для петиций по добавлению в КП субтитров и оригинальной озвучки. Давно не обновлялось, уже не работает
* [pikabu.ru/hide_watermark.user.ts](src/pikabu.ru/hide_watermark.user.ts) - скрытие ватермарки. \
вместо этого удобнее юзать правило в uBlock ` pikabu.ru##img[data-watermarked='1']`
* [ozon.ru/best_price_calculator.user.ts](src/ozon.ru/best_price_calculator.user.ts) -  неактуальное, см [best_price](src/best_price)

## Установка юзерскриптов

1. Установите [Tampermonkey](https://www.tampermonkey.net/) (GreaseMonkey не тестировался, не уверен что работает)
2. Откройте https://github.com/Apkawa/userscripts/tree/master/dist выберите файл скрипта *.user.js
3. Нажмите кнопку `raw`
4. Предложат установить юзерскрипт, соглашайтесь


## Разработка

По вопросам самостоятельной сборки и доработок см в [CONTRIBUTING](./CONTRIBUTING.md)
