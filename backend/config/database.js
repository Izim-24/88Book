import dotenv from "dotenv";

dotenv.config();

const useWindowsAuth = process.env.DB_AUTH === "windows";
const sql = useWindowsAuth
  ? (await import("msnodesqlv8")).default
  : (await import("mssql")).default;

const windowsConnectionString = useWindowsAuth
  ? `Driver={${process.env.DB_ODBC_DRIVER || "ODBC Driver 18 for SQL Server"}};Server=${process.env.DB_HOST || "localhost"};Database=${process.env.DB_NAME};Trusted_Connection=Yes;TrustServerCertificate=Yes;Encrypt=No`
  : null;

const config = useWindowsAuth
  ? null
  : {
      server: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 1433,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      options: {
        encrypt: process.env.DB_ENCRYPT === "true",
        trustServerCertificate:
          process.env.DB_TRUST_SERVER_CERTIFICATE !== "false",
      },
    };

let poolPromise;
const getPool = async () => {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config).connect().catch((error) => {
      poolPromise = null;
      console.error("Database connection failed:", error.message);
      const unavailable = new Error("Database connection unavailable. Check SQL Server settings and ensure the database is running.");
      unavailable.status = 503;
      throw unavailable;
    });
  }
  return poolPromise;
};

const openWindowsConnection = async () => {
  try {
    return await sql.promises.open(windowsConnectionString);
  } catch (error) {
    const unavailable = new Error("Database connection unavailable. Check SQL Server settings and ensure the database is running.");
    unavailable.status = 503;
    unavailable.cause = error;
    throw unavailable;
  }
};

const query = async (text, params = []) => {
  if (useWindowsAuth) {
    const boundParams = [];
    const normalizedQuery = text.replace(/\$(\d+)/g, (_, index) => {
      boundParams.push(params[Number(index) - 1]);
      return "?";
    });
    const connection = await openWindowsConnection();
    try {
      const result = await connection.promises.query(normalizedQuery, boundParams);
      return {
        rows: result.first || [],
        rowCount: result.counts?.[0] ?? result.rows ?? 0,
      };
    } finally {
      await connection.promises.close();
    }
  }

  const pool = await getPool();

  const request = pool.request();

  params.forEach((value, index) => {
    request.input(`p${index + 1}`, value);
  });

  const normalizedQuery = text.replace(/\$(\d+)/g, "@p$1");
  const result = await request.query(normalizedQuery);

  return {
    rows: result.recordset || [],
    rowCount: result.rowsAffected?.[0] ?? 0,
  };
};

const withTransaction = async (work) => {
  if (useWindowsAuth) {
    const connection = await openWindowsConnection();
    let started = false;
    try {
      await connection.promises.query("BEGIN TRANSACTION");
      started = true;
      const result = await work(async (text, params = []) => {
        const boundParams = [];
        const normalizedQuery = text.replace(/\$(\d+)/g, (_, index) => {
          boundParams.push(params[Number(index) - 1]);
          return "?";
        });
        const response = await connection.promises.query(normalizedQuery, boundParams);
        return {
          rows: response.first || [],
          rowCount: response.counts?.[0] ?? response.rows ?? 0,
        };
      });
      await connection.promises.query("COMMIT TRANSACTION");
      return result;
    } catch (error) {
      if (started) {
        try { await connection.promises.query("ROLLBACK TRANSACTION"); }
        catch (rollbackError) { console.error("Rollback failed:", rollbackError); }
      }
      throw error;
    } finally {
      await connection.promises.close();
    }
  }

  const pool = await getPool();

  const transaction = new sql.Transaction(pool);
  await transaction.begin();
  try {
    const result = await work(async (text, params = []) => {
      const request = new sql.Request(transaction);
      params.forEach((value, index) => request.input(`p${index + 1}`, value));
      const response = await request.query(text.replace(/\$(\d+)/g, "@p$1"));
      return {
        rows: response.recordset || [],
        rowCount: response.rowsAffected?.[0] ?? 0,
      };
    });
    await transaction.commit();
    return result;
  } catch (error) {
    try { await transaction.rollback(); }
    catch (rollbackError) { console.error("Rollback failed:", rollbackError); }
    throw error;
  }
};

// Lets one-off scripts (migrations, bootstrap) exit once their work is done.
const close = async () => {
  if (!poolPromise) return;
  const pending = poolPromise;
  poolPromise = null;
  try {
    const pool = await pending;
    await pool.close();
  } catch {
    // The pool never connected, so there is nothing to close.
  }
};

export default { query, withTransaction, close };
