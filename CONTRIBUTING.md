Сборка основана на [bun](https://bun.com/)

Все исходники на typescript

## Установка

1. git clone 
2. `bun i`
3. `bun build:watch`
4. Включить для Tampermonkey доступ к локальным урлам. [Инструкция на SO](https://stackoverflow.com/questions/41212558/develop-tampermonkey-scripts-in-a-real-ide-with-automatic-deployment-to-openuser)
5. Добавить в Tampermonkey содержимое `./debug.js` отредактиров `@require` на актуальный абсолютный путь скрипта из `./dist`


## Тесты

Для юнит тестов используется bun

```bash 
bun test
```

Для запуска линтера

```bash
bun lint
```
