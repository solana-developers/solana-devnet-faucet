import { Pool } from "pg";
import { HOURS } from "./constants";
const log = console.log;

export interface Row {
  timestamps: Array<number>;
}

const pgClient = new Pool({
  connectionString: process.env.POSTGRES_STRING as string,
});

// Eg if AIRDROPS_LIMIT_TOTAL is 2, and AIRDROPS_LIMIT_HOURS is 1,
// then a user can only get 2 airdrops per 1 hour.
const AIRDROPS_LIMIT_TOTAL = 2;
const AIRDROPS_LIMIT_HOURS = 1;

// Formerly called 'getOrCreateAndVerifyDatabaseEntry'
export const checkLimits = async (
  ipAddressWithoutDotsOrWalletAddress: string
): Promise<void> => {
  // Remove the . (IPV4) and : (IPV6) from the IP address
  let databaseKey = ipAddressWithoutDotsOrWalletAddress.replace(/[\.,:]/g, "");

  const entryQuery = "SELECT * FROM rate_limits WHERE key = $1;";
  const insertQuery =
    "INSERT INTO rate_limits (key, timestamps) VALUES ($1, $2);";
  const updateQuery = "UPDATE rate_limits SET timestamps = $2 WHERE key = $1;";

  const timeAgo = Date.now() - AIRDROPS_LIMIT_HOURS * HOURS;

  const queryResult = await pgClient.query(entryQuery, [databaseKey]);

  const rows = queryResult.rows as Array<Row>;
  const entry = rows[0];

  if (entry) {
    const timestamps = entry.timestamps;

    const isExcessiveUsage =
      timestamps.filter((timestamp: number) => timestamp > timeAgo).length >=
      AIRDROPS_LIMIT_TOTAL;

    if (isExcessiveUsage) {
      throw new Error(
        `You have exceeded the ${AIRDROPS_LIMIT_TOTAL} airdrops limit in the past ${AIRDROPS_LIMIT_HOURS} hour(s)`
      );
    }

    timestamps.push(Date.now());

    await pgClient.query(updateQuery, [
      ipAddressWithoutDotsOrWalletAddress,
      timestamps,
    ]);
  } else {
    await pgClient.query(insertQuery, [
      ipAddressWithoutDotsOrWalletAddress,
      [Date.now()],
    ]);
  }
};
