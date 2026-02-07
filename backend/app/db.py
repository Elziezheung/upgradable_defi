import json
import sqlite3
import threading
from typing import Any, Dict, List, Optional


class Database:
    def __init__(self, path: str):
        self._conn = sqlite3.connect(path, check_same_thread=False)
        self._conn.row_factory = sqlite3.Row
        self._lock = threading.Lock()

    def init_schema(self) -> None:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS state (
                    key TEXT PRIMARY KEY,
                    value TEXT
                )
                """
            )
            cursor.execute(
                """
                CREATE TABLE IF NOT EXISTS events (
                    block_number INTEGER,
                    tx_hash TEXT,
                    log_index INTEGER,
                    contract TEXT,
                    event_name TEXT,
                    args_json TEXT,
                    timestamp INTEGER,
                    UNIQUE(tx_hash, log_index)
                )
                """
            )
            self._conn.commit()

    def get_state(self, key: str) -> Optional[str]:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute("SELECT value FROM state WHERE key = ?", (key,))
            row = cursor.fetchone()
            return row["value"] if row else None

    def set_state(self, key: str, value: str) -> None:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(
                """
                INSERT INTO state (key, value)
                VALUES (?, ?)
                ON CONFLICT(key) DO UPDATE SET value = excluded.value
                """,
                (key, value),
            )
            self._conn.commit()

    def insert_event(
        self,
        block_number: int,
        tx_hash: str,
        log_index: int,
        contract: str,
        event_name: str,
        args_json: str,
        timestamp: int,
    ) -> None:
        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(
                """
                INSERT OR IGNORE INTO events
                (block_number, tx_hash, log_index, contract, event_name, args_json, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    block_number,
                    tx_hash,
                    log_index,
                    contract,
                    event_name,
                    args_json,
                    timestamp,
                ),
            )
            self._conn.commit()

    def query_events(
        self,
        contract: Optional[str],
        event: Optional[str],
        from_block: Optional[int],
        to_block: Optional[int],
        limit: int,
    ) -> List[Dict[str, Any]]:
        where = []
        params: List[Any] = []

        if contract:
            where.append("contract = ?")
            params.append(contract)
        if event:
            where.append("event_name = ?")
            params.append(event)
        if from_block is not None:
            where.append("block_number >= ?")
            params.append(from_block)
        if to_block is not None:
            where.append("block_number <= ?")
            params.append(to_block)

        sql = """
            SELECT block_number, tx_hash, log_index, contract, event_name, args_json, timestamp
            FROM events
        """
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY block_number ASC, log_index ASC LIMIT ?"
        params.append(limit)

        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(sql, params)
            rows = cursor.fetchall()

        results: List[Dict[str, Any]] = []
        for row in rows:
            results.append(
                {
                    "block_number": row["block_number"],
                    "tx_hash": row["tx_hash"],
                    "log_index": row["log_index"],
                    "contract": row["contract"],
                    "event_name": row["event_name"],
                    "args": json.loads(row["args_json"]) if row["args_json"] else {},
                    "timestamp": row["timestamp"],
                }
            )
        return results

    def query_event_rows(
        self,
        contract: Optional[str],
        event: Optional[str],
        from_block: Optional[int],
        to_block: Optional[int],
        limit: int,
    ) -> List[Dict[str, Any]]:
        where = []
        params: List[Any] = []

        if contract:
            where.append("contract = ?")
            params.append(contract)
        if event:
            where.append("event_name = ?")
            params.append(event)
        if from_block is not None:
            where.append("block_number >= ?")
            params.append(from_block)
        if to_block is not None:
            where.append("block_number <= ?")
            params.append(to_block)

        sql = """
            SELECT block_number, tx_hash, log_index, contract, event_name, args_json, timestamp
            FROM events
        """
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " ORDER BY block_number ASC, log_index ASC LIMIT ?"
        params.append(limit)

        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(sql, params)
            rows = cursor.fetchall()

        results: List[Dict[str, Any]] = []
        for row in rows:
            results.append(
                {
                    "block_number": row["block_number"],
                    "tx_hash": row["tx_hash"],
                    "log_index": row["log_index"],
                    "contract": row["contract"],
                    "event_name": row["event_name"],
                    "args_json": row["args_json"],
                    "timestamp": row["timestamp"],
                }
            )
        return results

    def event_stats(
        self,
        contract: Optional[str],
        event: Optional[str],
        from_block: Optional[int],
        to_block: Optional[int],
    ) -> List[Dict[str, Any]]:
        where = []
        params: List[Any] = []

        if contract:
            where.append("contract = ?")
            params.append(contract)
        if event:
            where.append("event_name = ?")
            params.append(event)
        if from_block is not None:
            where.append("block_number >= ?")
            params.append(from_block)
        if to_block is not None:
            where.append("block_number <= ?")
            params.append(to_block)

        sql = """
            SELECT contract, event_name, COUNT(*) as count
            FROM events
        """
        if where:
            sql += " WHERE " + " AND ".join(where)
        sql += " GROUP BY contract, event_name ORDER BY count DESC"

        with self._lock:
            cursor = self._conn.cursor()
            cursor.execute(sql, params)
            rows = cursor.fetchall()

        results: List[Dict[str, Any]] = []
        for row in rows:
            results.append(
                {
                    "contract": row["contract"],
                    "event_name": row["event_name"],
                    "count": row["count"],
                }
            )
        return results
