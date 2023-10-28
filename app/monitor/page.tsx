"use client";
import React, { useEffect, useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Curve,
} from "recharts";

interface Balance {
  account: string;
  balance: number;
  date: string;
}

interface ChartData {
  name: string;
  [key: string]: number | string;
}

export default function Home() {
  const [chartData, setChartData] = useState<ChartData[]>([]);

  useEffect(() => {
    const fetchBalances = async () => {
      const res = await fetch("/api/getbalances");
      const data = await res.json();
      const results = data.results as Balance[];

      const dataMap: { [key: string]: ChartData } = {};

      console.log("results", results);

      results.forEach((r) => {
        if (!dataMap[r.date]) {
          dataMap[r.date] = { name: new Date(r.date).toLocaleDateString() };
        }

        dataMap[r.date][r.account] = r.balance;
      });

      const dataArray = Object.values(dataMap);

      setChartData(dataArray);
      console.log(dataArray, "DATA ARRAY");
    };

    console.log(allKeys, "ALL KEYS");
    fetchBalances();
  }, []);

  const allKeys = useMemo(() => {
    const keys = chartData.reduce((acc, cur) => {
      Object.keys(cur).forEach((key) => acc.add(key));
      return acc;
    }, new Set());

    keys.delete("name");
    return Array.from(keys);
  }, [chartData]);

  return (
    <div className="w-screen h-screen mt-5 bg-slate-900">
      <LineChart
        width={900}
        height={600}
        data={chartData}
        title="SOLANA DEVNET FAUCETS BALANCES"
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="blue" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Curve />

        {chartData.length > 0 &&
          allKeys.map((key) => (
            // @ts-ignore
            <Line
              type="linear"
              dataKey={key}
              stroke={`#${Math.floor(Math.random() * 16777215).toString(16)}`}
              key={key}
              animationEasing="ease-in-out"
              strokeOpacity={100}
              strokeWidth={10}
              dot={true}
            />
          ))}
      </LineChart>
    </div>
  );
}
