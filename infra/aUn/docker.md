запускать вседа из папки infra
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.logging.yml up -d

Остановка
docker compose -f docker-compose.dev.yml down

красивый вывод таблицы (название, порт, статус)
docker ps -a --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

логи контейнера
docker logs infra-gateway-app-dev-1
docker logs infra-product-app-dev-1
docker logs --tail=50 infra-gateway-app-dev-1

пересобрать контейнер
docker compose -f docker-compose.dev.yml up -d --build gateway-app-dev
