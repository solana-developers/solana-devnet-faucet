import { NextApiRequest, NextApiResponse } from "next";
import { Client, Pool } from "pg";

const pgClient = new Pool({
  connectionString: process.env.POSTGRES_STRING as string,
});

export default async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    const result = await pgClient.query(
      "SELECT account, balance, date FROM solana_balances WHERE date >= CURRENT_DATE - INTERVAL '1 month' ORDER BY date "
    );
    const results = { results: result ? result.rows : null };

    res.json(results);
  } catch (err) {
    console.error(err);
    res.send("Error " + err);
  }
};
