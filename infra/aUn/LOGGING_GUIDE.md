# 📊 Руководство по централизованному логированию

## 🚀 Быстрый старт

### 1. Запуск системы логирования

```bash
# Из папки infra
docker compose -f docker-compose.logging.yml up -d
```

### 2. Запуск ваших микросервисов

```bash
docker compose -f docker-compose.dev.yml up -d
```

### 3. Открыть Grafana

Откройте в браузере: http://localhost:3001

- **Логин:** admin
- **Пароль:** admin

---

## 🔍 Как искать логи

### В Grafana:

1. Перейдите в **Explore** (иконка компаса слева)
2. Выберите источник данных **Loki**
3. Используйте запросы:

#### Все логи конкретного сервиса:

```logql
{service="app-dev"}
```

#### Логи всех микросервисов:

```logql
{service=~".*-app-dev"}
```

#### Только ошибки:

```logql
{service=~".*-app-dev"} |~ "(?i)error|exception|failed"
```

#### Логи конкретного пользователя (если логируете userId):

```logql
{service=~".*-app-dev"} |~ "userId.*123"
```

#### Логи за последние 5 минут с фильтром:

```logql
{service="cart-app-dev"} |= "gRPC" | json
```

---

## 🎯 Продвинутые возможности

### Trace ID для отслеживания запросов

Чтобы проследить запрос через все сервисы, добавьте в код:

```typescript
// В Gateway создайте middleware
import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { randomUUID } from "crypto";

@Injectable()
export class TraceIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const traceId = req.headers["x-trace-id"] || randomUUID();
    req.headers["x-trace-id"] = traceId;
    res.setHeader("x-trace-id", traceId);
    next();
  }
}

// В каждом сервисе логируйте с traceId
console.log(
  JSON.stringify({
    level: "info",
    traceId: req.headers["x-trace-id"],
    service: "user-service",
    message: "User created",
    userId: user.id,
  })
);
```

Теперь можно искать все логи одного запроса:

```logql
{service=~".*-app-dev"} |~ "traceId.*abc-123-def"
```

---

## 📈 Создание дашбордов

### Пример дашборда для мониторинга ошибок:

1. В Grafana: **Dashboards → New Dashboard → Add visualization**
2. Выберите **Loki** как источник
3. Запрос:

```logql
sum(count_over_time({service=~".*-app-dev"} |~ "(?i)error" [5m])) by (service)
```

Это покажет количество ошибок по каждому сервису за последние 5 минут.

---

## 🛠️ Структурированное логирование

### Плохо (текущий подход):

```typescript
console.log("✅ Найден пользователь:", user.email);
```

### Хорошо (структурированный JSON):

```typescript
import { Logger } from "@nestjs/common";

const logger = new Logger("UsersService");

logger.log({
  event: "user_found",
  userId: user.id,
  email: user.email,
  timestamp: new Date().toISOString(),
});
```

### Отлично (с контекстом и уровнями):

```typescript
// Создайте custom logger
export class StructuredLogger {
  private logger: Logger;

  constructor(context: string) {
    this.logger = new Logger(context);
  }

  info(message: string, data?: any) {
    this.logger.log(
      JSON.stringify({
        level: "info",
        message,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  }

  error(message: string, error?: Error, data?: any) {
    this.logger.error(
      JSON.stringify({
        level: "error",
        message,
        error: error?.message,
        stack: error?.stack,
        ...data,
        timestamp: new Date().toISOString(),
      })
    );
  }
}

// Использование
const logger = new StructuredLogger("UsersService");
logger.info("User created", { userId: user.id, email: user.email });
```

---

## 🔧 Альтернативные решения

### 1. ELK Stack (для больших проектов)

```yaml
# docker-compose.elk.yml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
    ports:
      - "9200:9200"

  logstash:
    image: docker.elastic.co/logstash/logstash:8.11.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

### 2. Winston + Elasticsearch (программный подход)

```bash
npm install winston winston-elasticsearch
```

```typescript
import winston from "winston";
import { ElasticsearchTransport } from "winston-elasticsearch";

const logger = winston.createLogger({
  transports: [
    new ElasticsearchTransport({
      level: "info",
      clientOpts: { node: "http://elasticsearch:9200" },
      index: "logs",
    }),
  ],
});
```

### 3. Облачные решения (для production)

- **Datadog** - платный, но очень мощный
- **New Relic** - отличная интеграция с Node.js
- **AWS CloudWatch** - если используете AWS
- **Google Cloud Logging** - если используете GCP
- **Grafana Cloud** - бесплатный tier для малых проектов

---

## 📊 Что логировать

### ✅ Обязательно:

- Начало и конец обработки запроса
- Ошибки и исключения
- Важные бизнес-события (создание пользователя, заказа)
- Вызовы внешних сервисов (gRPC, Kafka)

### ⚠️ С осторожностью:

- Параметры запросов (могут содержать чувствительные данные)
- Результаты запросов (могут быть большими)

### ❌ Никогда:

- Пароли
- Токены
- Номера кредитных карт
- Персональные данные (если не требуется по закону)

---

## 🎓 Best Practices

1. **Используйте уровни логирования:**

   - `DEBUG` - детальная информация для отладки
   - `INFO` - важные события
   - `WARN` - предупреждения
   - `ERROR` - ошибки

2. **Добавляйте контекст:**

   ```typescript
   logger.error("Failed to create user", {
     email: dto.email,
     error: error.message,
     stack: error.stack,
     traceId: req.traceId,
   });
   ```

3. **Используйте correlation ID (trace ID):**

   - Позволяет отследить запрос через все сервисы

4. **Структурированные логи в JSON:**

   - Легко парсить и фильтровать

5. **Не логируйте в production то же, что в dev:**
   ```typescript
   if (process.env.NODE_ENV === "development") {
     logger.debug("Detailed debug info", data);
   }
   ```

---

## 🚨 Troubleshooting

### Логи не появляются в Grafana

1. Проверьте, что Promtail запущен:

   ```bash
   docker logs promtail
   ```

2. Проверьте, что Loki доступен:

   ```bash
   curl http://localhost:3100/ready
   ```

3. Проверьте, что Docker socket доступен:
   ```bash
   docker ps
   ```

### Слишком много логов

Добавьте фильтры в `promtail-config.yml`:

```yaml
- source_labels: ["__meta_docker_container_label_com_docker_compose_service"]
  regex: "(gateway-app-dev|app-dev)"
  action: keep
```

---

## 📚 Дополнительные ресурсы

- [Grafana Loki Documentation](https://grafana.com/docs/loki/latest/)
- [LogQL Query Language](https://grafana.com/docs/loki/latest/logql/)
- [Best Practices for Logging](https://www.datadoghq.com/blog/log-management-best-practices/)

---

## 🎯 Следующие шаги

1. ✅ Запустите Loki + Grafana
2. ✅ Откройте Grafana и изучите интерфейс
3. ✅ Создайте тестовую ошибку и найдите её в логах
4. 🔄 Добавьте структурированное логирование в код
5. 🔄 Добавьте trace ID для отслеживания запросов
6. 🔄 Создайте дашборды для мониторинга
