# Shop Microservices (dev)

## О проекте

Это учебно‑практический проект на **микросервисной архитектуре**. Вместо одного монолита приложение разделено на отдельные сервисы, каждый из которых:

- имеет свою зону ответственности
- запускается независимо
- использует свою базу данных

Сейчас в проекте есть как минимум:

- **user-service** — сервис пользователей (авторизация/роли/пользователи)
- **product-service** — сервис товаров/продуктов

## Технологии

- **Node.js + TypeScript**
- **NestJS**
- **PostgreSQL** (отдельная БД на сервис)
- **Redis** (кэш/быстрые данные)
- **Docker + Docker Compose** (инфраструктура и запуск)
- **pgAdmin** (UI для PostgreSQL)
- **RedisInsight** (UI для Redis)

ORM:

- **user-service**: Sequelize (`@nestjs/sequelize`, `sequelize-typescript`)
- **product-service**: TypeORM (`@nestjs/typeorm`, `typeorm`)

## Запуск (dev) через Docker Compose

Основной файл запуска: `infra/docker-compose.dev.yml`.

Из папки `infra`:

```bash
docker compose -f docker-compose.dev.yml up -d --build
```

Остановить:

```bash
docker compose -f docker-compose.dev.yml down
```

## Порты

- **user-service**: `http://localhost:5000`
- **product-service**: `http://localhost:5001`
- **pgAdmin**: `http://localhost:5050` (логин/пароль по compose)
- **RedisInsight**: `http://localhost:8002`
- **PostgreSQL (user-service)**: `localhost:5433`
- **PostgreSQL (product-service)**: `localhost:5434`
- **Redis**: `localhost:6380`

## Подключение к БД в DBeaver

**User DB** (users-service):

- Host: `localhost`
- Port: `5433`
- Database: `users-service`
- Username: `postgres`
- Password: `postgres`

**Product DB** (product-service):

- Host: `localhost`
- Port: `5434`
- Database: `product-service`
- Username: `postgres`
- Password: `postgres`
