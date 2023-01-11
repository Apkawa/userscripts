Базируется на [userscript-typescript-webpack](https://github.com/vannhi/userscript-typescript-webpack) плюс доработка сборки

Все исходники на typescript

## Установка

1. git clone
2. `npm i`
3. `npm run build:watch`
4. Включить для Tampermonkey доступ к локальным урлам. [Инструкция на SO](https://stackoverflow.com/questions/41212558/develop-tampermonkey-scripts-in-a-real-ide-with-automatic-deployment-to-openuser)
5. Добавить в Tampermonkey содержимое `./debug.js` отредактиров `@require` на актуальный абсолютный путь скрипта из `./dist`


## Тесты

Для юнит тестов используется jest

```bash 
npm run test
```

Для запуска линтера

```bash
npm run lint
```



