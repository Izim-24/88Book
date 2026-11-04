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

const poolPromise = useWindowsAuth
  ? null
  : new sql.ConnectionPool(config).connect().catch((error) => {
      console.error("Database connection failed:", error.message);
      return null;
    });

const query = async (text, params = []) => {
  if (useWindowsAuth) {
    const boundParams = [];
    const normalizedQuery = text.replace(/\$(\d+)/g, (_, index) => {
      boundParams.push(params[Number(index) - 1]);
      return "?";
    });
    const connection = await sql.promises.open(windowsConnectionString);
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

  const pool = await poolPromise;
  if (!pool) {
    const error = new Error(
      "Database connection unavailable. Check SQL Server settings and ensure the database is running.",
    );
    error.status = 503;
    throw error;
  }

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

export default { query };
