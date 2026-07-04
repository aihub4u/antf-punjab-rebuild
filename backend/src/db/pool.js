const sql = require('mssql');

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT || '1433', 10),
  options: {
    encrypt: true, // required for Azure SQL / most modern SQL Server hosts
    trustServerCertificate: true, // set false in production once you have a real cert
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let poolPromise;

/**
 * Returns a shared connection pool (singleton), created lazily on first use.
 */
function getPool() {
  if (!poolPromise) {
    poolPromise = new sql.ConnectionPool(config)
      .connect()
      .then((pool) => {
        console.log('Connected to SQL Server');
        return pool;
      })
      .catch((err) => {
        poolPromise = null; // allow retry on next call
        console.error('DB connection failed:', err.message);
        throw err;
      });
  }
  return poolPromise;
}

/**
 * Executes a stored procedure and returns { recordsets, output }.
 *
 * @param {string} procName - stored procedure name, e.g. "GetRequestList"
 * @param {Object} params - map of param name -> { type, value, isOutput }
 *   Example:
 *   {
 *     ContactID: { type: sql.Int, value: 5 },
 *     Status:    { type: sql.VarChar(50), value: 'Open' },
 *     oStatus:   { type: sql.Int, isOutput: true },
 *   }
 */
async function execProc(procName, params = {}) {
  const pool = await getPool();
  const request = pool.request();

  for (const [name, def] of Object.entries(params)) {
    if (def.isOutput) {
      request.output(name, def.type);
    } else {
      request.input(name, def.type, def.value);
    }
  }

  const result = await request.execute(procName);
  return {
    recordsets: result.recordsets, // array of result sets, in case a proc returns more than one
    recordset: result.recordset,   // first result set, for convenience
    output: result.output,         // named output params
  };
}

module.exports = { sql, getPool, execProc };
