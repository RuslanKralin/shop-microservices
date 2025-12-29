# 📊 Готовые дашборды для вашего проекта

## 🎯 Дашборд 1: Microservices Overview

### Описание
Общий обзор всех микросервисов: количество логов, ошибки, статус.

### Панели

#### 1. Total Logs per Service (Time Series)
```logql
sum(count_over_time({service=~".*-app-dev"} [1m])) by (service)
```
**Настройки:**
- Visualization: Time series
- Legend: {{service}}
- Unit: logs/sec

#### 2. Error Rate by Service (Bar Gauge)
```logql
sum(count_over_time({service=~".*-app-dev"} |~ "(?i)error|exception" [5m])) by (service)
```
**Настройки:**
- Visualization: Bar gauge
- Orientation: Horizontal
- Thresholds:
  - Green: 0-5
  - Yellow: 5-20
  - Red: >20

#### 3. Latest Errors (Logs)
```logql
{service=~".*-app-dev"} |~ "(?i)error|exception"
```
**Настройки:**
- Visualization: Logs
- Show time: Yes
- Wrap lines: Yes
- Limit: 50

#### 4. Service Status (Stat)
```logql
count(count_over_time({service=~".*-app-dev"} [1m])) by (service)
```
**Настройки:**
- Visualization: Stat
- Show: All values
- Color mode: Background
- Thresholds:
  - Red: 0 (service down)
  - Green: >0 (service up)

#### 5. Log Level Distribution (Pie Chart)
```logql
sum(count_over_time({service=~".*-app-dev"} | json | __error__="" [5m])) by (level)
```
**Настройки:**
- Visualization: Pie chart
- Legend: Bottom
- Display labels: Name and percent

---

## 🔍 Дашборд 2: Gateway Service Monitoring

### Описание
Детальный мониторинг API Gateway: запросы, ошибки, производительность.

### Панели

#### 1. Requests per Second (Time Series)
```logql
sum(rate({service="gateway-app-dev"} [1m]))
```
**Настройки:**
- Visualization: Time series
- Unit: reqps (requests per second)
- Fill opacity: 20

#### 2. HTTP Status Codes (Bar Chart)
```logql
sum(count_over_time({service="gateway-app-dev"} | regexp "status[=:]?\\s*(?P<status>\\d{3})" [5m])) by (status)
```
**Настройки:**
- Visualization: Bar chart
- Orientation: Horizontal
- Color by: Value

#### 3. Top 10 Endpoints (Table)
```logql
topk(10, sum(count_over_time({service="gateway-app-dev"} | regexp "(?P<method>GET|POST|PUT|DELETE)\\s+(?P<path>/[^\\s]+)" [5m])) by (method, path))
```
**Настройки:**
- Visualization: Table
- Columns: Method, Path, Count

#### 4. Error Rate (Stat)
```logql
sum(count_over_time({service="gateway-app-dev"} |~ "(?i)error" [5m])) / sum(count_over_time({service="gateway-app-dev"} [5m])) * 100
```
**Настройки:**
- Visualization: Stat
- Unit: percent (0-100)
- Thresholds:
  - Green: 0-1%
  - Yellow: 1-5%
  - Red: >5%

#### 5. Recent Requests (Logs)
```logql
{service="gateway-app-dev"} | json
```
**Настройки:**
- Visualization: Logs
- Deduplication: None
- Order: Time descending

---

## 🛒 Дашборд 3: E-commerce Business Metrics

### Описание
Бизнес-метрики: регистрации, заказы, добавления в корзину.

### Панели

#### 1. User Registrations (Time Series)
```logql
sum(count_over_time({service="app-dev"} |= "User created" | json [5m]))
```
**Настройки:**
- Visualization: Time series
- Unit: users
- Color: Green

#### 2. Orders Created (Time Series)
```logql
sum(count_over_time({service="order-app-dev"} |= "Order created" | json [5m]))
```
**Настройки:**
- Visualization: Time series
- Unit: orders
- Color: Blue

#### 3. Cart Operations (Bar Chart)
```logql
sum(count_over_time({service="cart-app-dev"} |= "Cart" | json [5m])) by (message)
```
**Настройки:**
- Visualization: Bar chart
- Stacking: Normal
- Legend: Bottom

#### 4. Product Views (Stat)
```logql
sum(count_over_time({service="product-app-dev"} |= "Product viewed" [1h]))
```
**Настройки:**
- Visualization: Stat
- Unit: short
- Graph mode: Area

#### 5. Failed Operations (Table)
```logql
{service=~".*-app-dev"} |~ "(?i)failed|error" | json | line_format "{{.service}} - {{.message}}"
```
**Настройки:**
- Visualization: Table
- Group by: service, message

---

## 🐛 Дашборд 4: Error Tracking & Debugging

### Описание
Отслеживание и анализ ошибок во всех сервисах.

### Панели

#### 1. Error Timeline (Time Series)
```logql
sum(count_over_time({service=~".*-app-dev"} |~ "(?i)error|exception" [1m])) by (service)
```
**Настройки:**
- Visualization: Time series
- Draw style: Bars
- Stack series: Normal

#### 2. Error Types Distribution (Pie Chart)
```logql
sum(count_over_time({service=~".*-app-dev"} | json | level="error" [5m])) by (error)
```
**Настройки:**
- Visualization: Pie chart
- Legend: Right
- Show percentages: Yes

#### 3. Errors by Service (Stat)
```logql
sum(count_over_time({service=~".*-app-dev"} |~ "(?i)error" [5m])) by (service)
```
**Настройки:**
- Visualization: Stat
- Layout: Auto
- Color mode: Background

#### 4. Error Details (Logs)
```logql
{service=~".*-app-dev"} |~ "(?i)error|exception" | json
```
**Настройки:**
- Visualization: Logs
- Show labels: service, level, message
- Wrap lines: Yes

#### 5. Error Rate Trend (Time Series)
```logql
sum(rate({service=~".*-app-dev"} |~ "(?i)error" [5m]))
```
**Настройки:**
- Visualization: Time series
- Unit: errors/sec
- Thresholds:
  - Green: 0-0.1
  - Yellow: 0.1-1
  - Red: >1

---

## 🔄 Дашборд 5: Kafka & Message Queue

### Описание
Мониторинг Kafka: отправка/получение сообщений, ошибки.

### Панели

#### 1. Messages Published (Time Series)
```logql
sum(count_over_time({service=~".*-app-dev"} |= "Kafka" |= "published" | json [1m])) by (service)
```
**Настройки:**
- Visualization: Time series
- Legend: {{service}}
- Color: Green

#### 2. Messages Consumed (Time Series)
```logql
sum(count_over_time({service=~".*-app-dev"} |= "Kafka" |= "consumed" | json [1m])) by (service)
```
**Настройки:**
- Visualization: Time series
- Legend: {{service}}
- Color: Blue

#### 3. Kafka Errors (Logs)
```logql
{service=~".*-app-dev"} |= "Kafka" |~ "(?i)error|failed"
```
**Настройки:**
- Visualization: Logs
- Show time: Yes
- Highlight: error, failed

#### 4. Message Processing Time (Time Series)
```logql
avg_over_time({service=~".*-app-dev"} |= "Kafka" | json | unwrap duration [5m])
```
**Настройки:**
- Visualization: Time series
- Unit: ms (milliseconds)
- Legend: Processing time

#### 5. Topics Activity (Table)
```logql
sum(count_over_time({service=~".*-app-dev"} |= "Kafka" | json [5m])) by (topic, service)
```
**Настройки:**
- Visualization: Table
- Columns: Topic, Service, Count
- Sort by: Count (descending)

---

## 🔌 Дашборд 6: gRPC Monitoring

### Описание
Мониторинг gRPC вызовов между сервисами.

### Панели

#### 1. gRPC Calls (Time Series)
```logql
sum(count_over_time({service=~".*-app-dev"} |= "gRPC" [1m])) by (service)
```
**Настройки:**
- Visualization: Time series
- Unit: calls/sec

#### 2. gRPC Success Rate (Gauge)
```logql
sum(count_over_time({service=~".*-app-dev"} |= "gRPC" != "error" [5m])) / sum(count_over_time({service=~".*-app-dev"} |= "gRPC" [5m])) * 100
```
**Настройки:**
- Visualization: Gauge
- Unit: percent (0-100)
- Thresholds:
  - Red: 0-90%
  - Yellow: 90-99%
  - Green: 99-100%

#### 3. gRPC Errors (Logs)
```logql
{service=~".*-app-dev"} |= "gRPC" |~ "(?i)error|failed"
```
**Настройки:**
- Visualization: Logs
- Highlight: error, failed, timeout

#### 4. gRPC Methods (Bar Chart)
```logql
sum(count_over_time({service=~".*-app-dev"} |= "gRPC" | json [5m])) by (method)
```
**Настройки:**
- Visualization: Bar chart
- Orientation: Horizontal

#### 5. gRPC Response Time (Time Series)
```logql
avg_over_time({service=~".*-app-dev"} |= "gRPC" | json | unwrap duration [5m])
```
**Настройки:**
- Visualization: Time series
- Unit: ms
- Thresholds:
  - Green: 0-100ms
  - Yellow: 100-500ms
  - Red: >500ms

---

## 🗄️ Дашборд 7: Database Monitoring

### Описание
Мониторинг запросов к PostgreSQL.

### Панели

#### 1. Database Queries (Time Series)
```logql
sum(count_over_time({service=~".*-app-dev"} |= "query" [1m])) by (service)
```
**Настройки:**
- Visualization: Time series
- Unit: queries/sec

#### 2. Slow Queries (Logs)
```logql
{service=~".*-app-dev"} |= "query" | json | duration > 1000
```
**Настройки:**
- Visualization: Logs
- Show: time, service, query, duration

#### 3. Database Errors (Table)
```logql
sum(count_over_time({service=~".*-app-dev"} |~ "(?i)database|postgres|sql" |~ "error" [5m])) by (service, error)
```
**Настройки:**
- Visualization: Table
- Columns: Service, Error, Count

#### 4. Query Types (Pie Chart)
```logql
sum(count_over_time({service=~".*-app-dev"} | regexp "(?P<query_type>SELECT|INSERT|UPDATE|DELETE)" [5m])) by (query_type)
```
**Настройки:**
- Visualization: Pie chart
- Legend: Bottom

#### 5. Connection Pool (Stat)
```logql
avg_over_time({service=~".*-app-dev"} |= "connection pool" | json | unwrap connections [5m])
```
**Настройки:**
- Visualization: Stat
- Unit: connections
- Graph mode: Area

---

## 🚀 Дашборд 8: Performance Monitoring

### Описание
Мониторинг производительности: время ответа, throughput.

### Панели

#### 1. Response Time (Time Series)
```logql
avg_over_time({service=~".*-app-dev"} | json | unwrap duration [5m]) by (service)
```
**Настройки:**
- Visualization: Time series
- Unit: ms
- Legend: {{service}}

#### 2. P95 Response Time (Stat)
```logql
quantile_over_time(0.95, {service="gateway-app-dev"} | json | unwrap duration [5m])
```
**Настройки:**
- Visualization: Stat
- Unit: ms
- Thresholds:
  - Green: 0-200ms
  - Yellow: 200-500ms
  - Red: >500ms

#### 3. Throughput (Time Series)
```logql
sum(rate({service=~".*-app-dev"} [1m])) by (service)
```
**Настройки:**
- Visualization: Time series
- Unit: reqps
- Stack: Normal

#### 4. Slow Requests (Table)
```logql
topk(20, max_over_time({service=~".*-app-dev"} | json | unwrap duration [5m]) by (service, path))
```
**Настройки:**
- Visualization: Table
- Columns: Service, Path, Duration
- Sort by: Duration (descending)

#### 5. Request Size (Time Series)
```logql
avg_over_time({service="gateway-app-dev"} | json | unwrap request_size [5m])
```
**Настройки:**
- Visualization: Time series
- Unit: bytes
- Fill opacity: 30

---

## 🔐 Дашборд 9: Security & Authentication

### Описание
Мониторинг безопасности: аутентификация, неудачные попытки входа.

### Панели

#### 1. Login Attempts (Time Series)
```logql
sum(count_over_time({service="app-dev"} |= "login" [1m])) by (status)
```
**Настройки:**
- Visualization: Time series
- Legend: {{status}}
- Colors:
  - Success: Green
  - Failed: Red

#### 2. Failed Login Attempts (Stat)
```logql
sum(count_over_time({service="app-dev"} |= "login" |= "failed" [1h]))
```
**Настройки:**
- Visualization: Stat
- Color: Red
- Thresholds:
  - Green: 0-10
  - Yellow: 10-50
  - Red: >50

#### 3. Unauthorized Access (Logs)
```logql
{service=~".*-app-dev"} |~ "(?i)unauthorized|forbidden|401|403"
```
**Настройки:**
- Visualization: Logs
- Highlight: unauthorized, forbidden

#### 4. Token Validation (Time Series)
```logql
sum(count_over_time({service="gateway-app-dev"} |= "token" [1m])) by (status)
```
**Настройки:**
- Visualization: Time series
- Stack: Normal

#### 5. Suspicious Activity (Table)
```logql
{service=~".*-app-dev"} |~ "(?i)suspicious|blocked|banned" | json
```
**Настройки:**
- Visualization: Table
- Columns: Time, Service, User, Action

---

## 📱 Дашборд 10: User Activity

### Описание
Мониторинг активности пользователей.

### Панели

#### 1. Active Users (Stat)
```logql
count(count_over_time({service=~".*-app-dev"} | json | userId != "" [5m]) by (userId))
```
**Настройки:**
- Visualization: Stat
- Unit: users
- Graph mode: Area

#### 2. User Actions (Time Series)
```logql
sum(count_over_time({service=~".*-app-dev"} | json | userId != "" [1m])) by (action)
```
**Настройки:**
- Visualization: Time series
- Legend: {{action}}
- Stack: Normal

#### 3. Top Active Users (Table)
```logql
topk(10, sum(count_over_time({service=~".*-app-dev"} | json [5m])) by (userId))
```
**Настройки:**
- Visualization: Table
- Columns: User ID, Actions Count

#### 4. User Journey (Logs)
```logql
{service=~".*-app-dev"} | json | userId="$userId"
```
**Настройки:**
- Visualization: Logs
- Variable: $userId (input)

#### 5. User Errors (Bar Chart)
```logql
sum(count_over_time({service=~".*-app-dev"} |~ "error" | json | userId != "" [5m])) by (service)
```
**Настройки:**
- Visualization: Bar chart
- Color: Red

---

## 🎨 Как импортировать дашборды

### Способ 1: Создать вручную

1. Откройте Grafana: http://localhost:3001
2. Dashboards → New Dashboard
3. Add visualization
4. Скопируйте запрос из примера выше
5. Настройте визуализацию
6. Save dashboard

### Способ 2: JSON импорт

Создайте файл `dashboard.json`:

```json
{
  "dashboard": {
    "title": "Microservices Overview",
    "panels": [
      {
        "title": "Total Logs per Service",
        "targets": [
          {
            "expr": "sum(count_over_time({service=~\".*-app-dev\"} [1m])) by (service)"
          }
        ],
        "type": "timeseries"
      }
    ]
  }
}
```

Импорт:
1. Dashboards → Import
2. Upload JSON file
3. Select Loki as data source
4. Import

### Способ 3: Provisioning (автоматический)

Создайте файл `infra/grafana-dashboards.yml`:

```yaml
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    options:
      path: /etc/grafana/provisioning/dashboards
```

Добавьте в `docker-compose.logging.yml`:

```yaml
grafana:
  volumes:
    - ./grafana-dashboards.yml:/etc/grafana/provisioning/dashboards/dashboards.yml
    - ./dashboards:/etc/grafana/provisioning/dashboards
```

Поместите JSON файлы дашбордов в папку `infra/dashboards/`.

---

## 💡 Советы по использованию

### 1. Используйте переменные

Добавьте переменную `$service`:
- Dashboard settings → Variables → New
- Name: `service`
- Type: Query
- Query: `label_values(service)`

Теперь в запросах:
```logql
{service="$service"}
```

### 2. Настройте auto-refresh

Dashboard settings → Time options → Auto refresh: 5s, 10s, 30s

### 3. Создайте плейлисты

Dashboards → Playlists → New playlist
Добавьте несколько дашбордов для ротации на большом экране.

### 4. Используйте аннотации

Dashboard settings → Annotations → New
Отмечайте важные события (деплои, релизы).

### 5. Экспортируйте дашборды

Dashboard settings → JSON Model → Copy to clipboard
Сохраните в Git для версионирования.

---

## 🎯 Рекомендуемый порядок создания

1. **Microservices Overview** — общий обзор
2. **Error Tracking** — отслеживание ошибок
3. **Gateway Service** — мониторинг API
4. **Performance** — производительность
5. **Business Metrics** — бизнес-метрики
6. Остальные по необходимости

---

**Удачи в создании дашбордов! 📊**
