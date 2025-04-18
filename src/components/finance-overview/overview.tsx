"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

const data = [
  {
    name: "Jan",
    Income: 4000,
    Expenses: 2400,
    Savings: 1600,
  },
  {
    name: "Feb",
    Income: 4200,
    Expenses: 2800,
    Savings: 1400,
  },
  {
    name: "Mar",
    Income: 4100,
    Expenses: 2700,
    Savings: 1400,
  },
  {
    name: "Apr",
    Income: 4500,
    Expenses: 2900,
    Savings: 1600,
  },
  {
    name: "May",
    Income: 4300,
    Expenses: 3100,
    Savings: 1200,
  },
  {
    name: "Jun",
    Income: 4800,
    Expenses: 3000,
    Savings: 1800,
  },
]

export function Overview() {
  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="Income" fill="#22c55e" />
        <Bar dataKey="Expenses" fill="#ef4444" />
        <Bar dataKey="Savings" fill="#3b82f6" />
      </BarChart>
    </ResponsiveContainer>
  )
}
