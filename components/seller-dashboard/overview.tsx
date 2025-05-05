"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

// Пример данных
const data = [
  { name: "Янв", revenue: 2400, orders: 24 },
  { name: "Фев", revenue: 1398, orders: 13 },
  { name: "Мар", revenue: 3000, orders: 30 },
  { name: "Апр", revenue: 2780, orders: 28 },
  { name: "Май", revenue: 1890, orders: 19 },
  { name: "Июн", revenue: 2390, orders: 24 },
  { name: "Июл", revenue: 3490, orders: 35 },
]

export function Overview() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 5,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8884d8" activeDot={{ r: 8 }} name="Доход" />
          <Line yAxisId="right" type="monotone" dataKey="orders" stroke="#82ca9d" name="Заказы" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
