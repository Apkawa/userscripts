Я хочу доработать получение имени файла.
Оказывается в cdn в гет параметрах хранится не то имя файла что указано на странице модели.

в самом начале сохраняем куда нибудь глобальную переменную buildId

`const buildId = __NEXT_DATA__?.buildId;`

перед вызовом HEAD в handleCopy нужно:

1) распарсить урл текущей страницы, он вида `https://civitai.red/models/<model_id>/<model_slug>`
пример: `https://civitai.red/models/2760803/dasiwa-krea2-or-turbo-or-raw`
и извлечь `model_id`, например 2760803

2) Распарсить урл ссылки, он вида `https://civitai.red/api/download/models/<submodel_id>?fileId=<file_id>` и извлечь 1) id sub модели 3151280 и fileId 3033461

3) дергаем ручку `https://civitai.red/_next/data/<buildId>/en/models/<model_id>/<model_slug>.json?id=<model_id>&slug=<model_slug>`

Пример `https://civitai.red/_next/data/fg45vSnnzjhxLI2cQ8w1c/en/models/2760803/dasiwa-krea2-or-turbo-or-raw.json?id=2760803&slug=dasiwa-krea2-or-turbo-or-raw`

Ищем modelVersions[].id==sub_model_id и file[].id==file_id

Путь такой `pageProps.trpcState.json.queries[].state.data.modelVersions[].files[]`


4) filename ==  files[].name
