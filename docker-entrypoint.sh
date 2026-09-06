#!/bin/bash
set -e

echo "[Docker] Starting internal MariaDB (MySQL) server..."
mkdir -p /var/run/mysqld /var/lib/mysql
chown -R mysql:mysql /var/run/mysqld /var/lib/mysql

if [ ! -d "/var/lib/mysql/mysql" ]; then
    echo "[Docker] Initializing MariaDB data directory..."
    mysql_install_db --user=mysql --datadir=/var/lib/mysql > /dev/null 2>&1
fi

/usr/bin/mysqld_safe --datadir=/var/lib/mysql &

# Wait for MariaDB to be ready
echo "[Docker] Waiting for MariaDB to accept connections..."
for i in {1..30}; do
    if mysqladmin ping -h 127.0.0.1 --silent 2>/dev/null || mysqladmin ping -u root -padmin -h 127.0.0.1 --silent 2>/dev/null; then
        echo "[Docker] MariaDB is alive!"
        break
    fi
    sleep 1
done

# Configure root password and ensure meetdraw_db exists
mysql -u root -e "ALTER USER 'root'@'localhost' IDENTIFIED BY 'admin'; FLUSH PRIVILEGES;" 2>/dev/null || true
mysql -u root -padmin -e "CREATE DATABASE IF NOT EXISTS meetdraw_db;" 2>/dev/null || true

# Import initial schema if users table doesn't exist
if [ -f "/app/server/src/db/schema.sql" ]; then
    mysql -u root -padmin meetdraw_db < /app/server/src/db/schema.sql 2>/dev/null || true
fi

echo "[Docker] ✅ Database initialized successfully. Starting Node.js Server..."
exec node server/dist/server.js
