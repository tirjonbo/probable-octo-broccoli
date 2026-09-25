#!/bin/sh
# Папка данных подключается с хоста и принадлежит root — отдаём её пользователю node
# и запускаем приложение без прав root.
set -e
DATA_DIR="${DATA_DIR:-/data}"
mkdir -p "$DATA_DIR"
chown -R node:node "$DATA_DIR"
exec su node -s /bin/sh -c 'exec "$0" "$@"' -- "$@"
