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

  // TODO: this needs a proper return type set
  const allKeys = useMemo(() => {
    const keys = chartData.reduce((acc, cur) => {
      Object.keys(cur).forEach(key => acc.add(key));
      return acc;
    }, new Set());

    keys.delete("name");
    return Array.from(keys);
  }, [chartData]);

  function getMinMaxForKey(data: ChartData[], key: string): [number, number] {
    let min = Infinity;
    let max = -Infinity;
    data.forEach(row => {
      const val = Number(row[key]);
      if (!isNaN(val)) {
        min = Math.min(min, val);
        max = Math.max(max, val);
      }
    });
    if (!isFinite(min) || !isFinite(max)) return [0, 1];
    if (min === max) {
      // All values are the same, add a small range around the value
      return [min - 10, max + 10];
    }
    const padding = Math.max((max - min) * 0.1, 1000);
    return [
      Number((min - padding).toFixed(0)),
      Number((max + padding).toFixed(0)),
    ];
  }

  const [minY0, maxY0] = useMemo(
    () => getMinMaxForKey(chartData, allKeys[0] as string),
    [chartData, allKeys],
  );
  const [minY1, maxY1] = useMemo(
    () => getMinMaxForKey(chartData, allKeys[1] as string),
    [chartData, allKeys],
  );
  const [minY2, maxY2] = useMemo(
    () => getMinMaxForKey(chartData, allKeys[2] as string),
    [chartData, allKeys],
  );

  useEffect(
    () => {
      const fetchBalances = async () => {
        const res = await fetch("/api/getbalances");
        const data = await res.json();
        const results = data.results as Balance[];

        const dataMap: { [key: string]: ChartData } = {};

        console.log("results", results);

        results.forEach(r => {
          if (!dataMap[r.date]) {
            dataMap[r.date] = { name: new Date(r.date).toLocaleDateString() };
          }

          dataMap[r.date][r.account] = r.balance;
        });

        const dataArray = Object.values(dataMap);

        setChartData(dataArray);
        console.log(dataArray, "DATA ARRAY");
      };

      console.log("ALL KEYS:", allKeys);
      fetchBalances();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="p-8 mx-auto space-y-4">
      <p className="text-2xl">Web faucet {allKeys[2] as string}</p>
      <LineChart
        width={900}
        height={600}
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 100,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
        <XAxis dataKey="name" />
        <YAxis
          label={{ value: "Balance", angle: -90, position: "insideLeft" }}
          domain={[minY2, maxY2]}
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
          left: 100,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="blue" />
        <XAxis dataKey="name" />
        <YAxis domain={[minY1, maxY1]} />
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
          left: 100,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="blue" />
        <XAxis dataKey="name" />
        <YAxis domain={[minY0, maxY0]} />
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
