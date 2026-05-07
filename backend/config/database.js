import sql from "mssql";
import dotenv from "dotenv";

dotenv.config();

const config = {
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

const poolPromise = new sql.ConnectionPool(config).connect();

const query = async (text, params = []) => {
  const pool = await poolPromise;
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
