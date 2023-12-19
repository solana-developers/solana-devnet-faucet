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
    <div className="w-screen h-screen">
      <p className="text-2xl">Web faucet {allKeys[2] as string}</p>
      <LineChart
        width={900}
        height={600}
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
        <XAxis dataKey="name" />
        <YAxis
          label={{ value: "Balance", angle: -90, position: "insideLeft" }}
          domain={[0, "dataMax + 50000"]}
        />

        <Tooltip />
        <Legend />
        <Curve />

        {chartData.length > 0 && (
          // @ts-ignore
          <Line
            type="monotone"
            dataKey={allKeys[2]}
            stroke={"#8884d8"}
            key={allKeys[2]}
            strokeWidth={2}
            dot={{ stroke: "#8884d8", strokeWidth: 2, r: 4 }}
          />
        )}
      </LineChart>

      <p className="text-2xl">Pow faucet 1</p>
      <LineChart
        width={900}
        height={600}
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="blue" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, "dataMax + 50000"]} />
        <Tooltip />
        <Legend />
        <Curve />

        {chartData.length > 0 && (
          // @ts-ignore
          <Line
            type="monotone"
            dataKey={allKeys[1]}
            stroke={"#8884d8"}
            key={allKeys[1]}
            strokeWidth={2}
            dot={{ stroke: "#8884d8", strokeWidth: 2, r: 4 }}
          />
        )}
      </LineChart>

      <p className="text-2xl">Pow faucet 2</p>
      <LineChart
        width={900}
        height={600}
        data={chartData}
        title="Web faucet"
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="blue" />
        <XAxis dataKey="name" />
        <YAxis domain={[0, "dataMax + 50000"]} />
        <Tooltip />
        <Legend />
        <Curve />

        {chartData.length > 0 && (
          // @ts-ignore
          <Line
            type="monotone"
            dataKey={allKeys[0]}
            stroke={"#8884d8"}
            key={allKeys[0]}
            strokeWidth={2}
            dot={{ stroke: "#8884d8", strokeWidth: 2, r: 4 }}
          />
        )}
      </LineChart>
    </div>
  );
}
