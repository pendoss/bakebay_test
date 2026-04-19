'use client'

import {LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer} from 'recharts'

interface MonthlyData {
    name: string
    revenue: number
    orders: number
}

export function Overview({ data }: { data: MonthlyData[] }) {
    return (
        <div className='h-[300px] w-full'>
            <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={data} margin={{top: 5, right: 30, left: 20, bottom: 5}}>
                    <CartesianGrid strokeDasharray='3 3'/>
                    <XAxis dataKey='name'/>
                    <YAxis yAxisId='left'/>
                    <YAxis yAxisId='right' orientation='right'/>
                    <Tooltip
                        formatter={(value: number, name: string) =>
                            name === 'Доход' ? [`${value.toLocaleString('ru-RU')} ₽`, name] : [value, name]
                        }
                    />
                    <Legend/>
                    <Line yAxisId='left' type='monotone' dataKey='revenue' stroke='#E06680' activeDot={{r: 8}}
                          name='Доход'/>
                    <Line yAxisId='right' type='monotone' dataKey='orders' stroke='#2B5F55' name='Заказы'/>
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}
