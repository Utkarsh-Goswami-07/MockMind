"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import React, { useEffect, useState } from 'react'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const PerformanceChart = ({ assessments }) => {
    const [chartData, setChartData] = useState([]);

    useEffect(() => {
        if (assessments) {
            const formattedData = assessments.map((assessment) => ({
                date: format(new Date(assessment.createdAt), "MMM dd"),
                score: assessment.quizScore
            }))

            setChartData(formattedData);
        }
    }, [assessments])
    return (
        <Card>
            <CardHeader>
                <CardTitle className='bg-gradient-to-b from-gray-400 via-gray-200 to-gray-600 text-3xl md:text-4xl font-extrabold tracking-tighter text-transparent bg-clip-text pb-2 pr-2'>Performance Trend</CardTitle>
                <CardDescription>Quiz scores over time</CardDescription>
            </CardHeader>
            <CardContent>
                <div className='h-[300px]'>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={chartData}

                        >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis domain={[0, 100]} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload.length) {
                                        return (
                                            <div className='bg-background border rounded-lg p-2 shadow-md'>
                                                <p className='text-sm font-medium'>
                                                    Score: {payload[0].value}%
                                                </p>
                                                <p className='text-xs text-muted-foreground'>
                                                    {payload[0].payload.date}
                                                </p>
                                            </div>
                                        )
                                    }
                                }}
                            />

                            <Line type="monotone" dataKey="score" stroke="#8884d8" strokeWidth={2} />

                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>

    )
}

export default PerformanceChart
