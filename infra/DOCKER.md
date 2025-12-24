красивый вывод таблицы (название, порт, статус)
docker ps -a --format "table {{.Names}}\t{{.Ports}}\t{{.Status}}"

логи контейнера
docker logs infra-gateway-app-dev-1
docker logs --tail=50 infra-gateway-app-dev-1

пересобрать контейнер
docker compose -f docker-compose.dev.yml up -d --build gateway-app-dev
