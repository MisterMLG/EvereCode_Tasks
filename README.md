# Crypto Tracker API

REST API сервис для мониторинга курсов криптовалют с фоновой синхронизацией данных Binance. Стек: Node.js, Express, SQLite.

## Возможности

- Управление списком валют (CRUD) с авторизацией по Bearer-токену.
- Фоновое обновление курсов с Binance каждую минуту и сохранение в SQLite.
- Получение текущих курсов и истории изменений по валюте.
- Дополнительно: баланс BTC-адресов и высота блока сети (Blockstream).

## Запуск

```
npm install
npm run dev
```

## Пример вывода

Старт сервиса и работа планировщика:

```
[INFO] application started
[INFO] task "price-update" registered with interval 60000 ms
[INFO] server started on port 3000
[INFO] price update completed: 2 currencies, 807 prices
```

Запрос курсов валюты:

```
$ curl -H "Authorization: Bearer $TOKEN" "localhost:3000/price?currency=BTC"
{"currency":"BTC","prices":[{"symbol":"BTCUSDT","price":"59776.01000000"}, ...]}
```
