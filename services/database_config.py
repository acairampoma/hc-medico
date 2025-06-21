import asyncpg
import json
from typing import Dict, List, Optional
from datetime import datetime, timedelta
import os
import logging

class DatabaseManager:
    def __init__(self):
        # Configuración de conexión PostgreSQL
        self.connection_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', '5432')),  # 🔧 Convertir a int
            'database': os.getenv('DB_NAME', 'bd_hdigital'),
            'user': os.getenv('DB_USER', 'postgres'),
            'password': os.getenv('DB_PASSWORD', 'tu_password'),
            # 🚀 MEJORAS OPCIONALES:
            'min_size': int(os.getenv('DB_POOL_MIN', '1')),      # Pool mínimo
            'max_size': int(os.getenv('DB_POOL_MAX', '10')),     # Pool máximo
            'command_timeout': int(os.getenv('DB_TIMEOUT', '60')) # Timeout queries
        }
        self.pool = None
    
    async def init_pool(self):
        """Inicializar pool de conexiones"""
        try:
            self.pool = await asyncpg.create_pool(**self.connection_config)
            print("✅ Pool de conexiones PostgreSQL inicializado")
            
            # 🧪 Test de conexión opcional
            async with self.pool.acquire() as connection:
                version = await connection.fetchval('SELECT version()')
                print(f"🗃️ PostgreSQL conectado: {version[:50]}...")
                
        except Exception as e:
            print(f"❌ Error conectando a PostgreSQL: {e}")
            raise
    
    async def close_pool(self):
        """Cerrar pool de conexiones"""
        if self.pool:
            await self.pool.close()
            print("🔒 Pool de conexiones cerrado")
    
    # 🔧 MÉTODO OPCIONAL: Test de salud de la BD
    async def health_check(self) -> bool:
        """Verificar que la conexión esté activa"""
        try:
            if not self.pool:
                return False
            async with self.pool.acquire() as connection:
                await connection.fetchval('SELECT 1')
            return True
        except:
            return False

# Instancia global
db_manager = DatabaseManager()