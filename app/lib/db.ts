import { Pool } from 'pg';
import type { PoolClient, QueryResult, QueryResultRow } from 'pg';

// Создаем пул соединений
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Укажите вашу строку подключения
});

/**
 * Типизированный клиент с поддержкой метода `sql`.
 */
interface TypedClient extends PoolClient {
    sql<T extends QueryResultRow = any>(
        strings: TemplateStringsArray,
        ...values: any[]
    ): Promise<QueryResult<T>>;
}

/**
 * Настраиваем обертку для выполнения SQL-запросов с параметрами.
 * @template T Тип данных, возвращаемых запросом.
 * @param strings Шаблонная строка SQL-запроса.
 * @param values Значения для параметризованных запросов.
 * @returns {Promise<QueryResult<T>>} Результат запроса.
 */
const db = {
    connect: async (): Promise<TypedClient> => {
        const client: PoolClient = await pool.connect();

        // Добавляем метод `sql` к клиенту
        (client as TypedClient).sql = async <T extends QueryResultRow = any>(
            strings: TemplateStringsArray,
            ...values: any[]
        ): Promise<QueryResult<T>> => {
            try {
                // Формируем параметризованный SQL-запрос
                const queryText = strings.reduce(
                    (prev, curr, i) => prev + curr + (i < values.length ? `$${i + 1}` : ''),
                    ''
                );

                return (await client.query(queryText, values)) as QueryResult<T>;
            } catch (error) {
                console.error('SQL Error:', error);
                throw error;
            }
        };

        return client as TypedClient;
    },
};

/**
 * Универсальная функция для выполнения SQL-запросов.
 * Подходит для случаев, когда не нужно вручную управлять соединением.
 * @template T Тип данных, возвращаемых запросом.
 * @param strings Шаблонная строка SQL-запроса.
 * @param values Значения для параметризованных запросов.
 * @returns {Promise<QueryResult<T>>} Результат запроса.
 */
const sql = async <T extends QueryResultRow = any>(
    strings: TemplateStringsArray,
    ...values: any[]
): Promise<QueryResult<T>> => {
    const client = await pool.connect();
    try {
        // Формируем параметризованный SQL-запрос
        const queryText = strings.reduce(
            (prev, curr, i) => prev + curr + (i < values.length ? `$${i + 1}` : ''),
            ''
        );

        return (await client.query(queryText, values)) as QueryResult<T>;
    } catch (error) {
        console.error('SQL Error:', error);
        throw error;
    } finally {
        client.release();
    }
};

export { db, sql };