'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    LineChart,
    Line
} from 'recharts';

// Orange shades for charts
const COLORS = [
    'hsl(34, 100%, 50%)', // orange-500
    'hsl(34, 100%, 60%)', // lighter
    'hsl(34, 100%, 40%)', // darker
    'hsl(34, 100%, 70%)', // very light
    'hsl(34, 100%, 30%)'  // very dark
];

// Multi-color palette for Pie chart slices
const PIE_COLORS = [
    'hsl(34, 100%, 50%)',   // orange
    'hsl(142, 60%, 40%)',   // green
    'hsl(198, 100%, 50%)',  // blue
    'hsl(340, 80%, 50%)',   // pink/red
    'hsl(50, 100%, 50%)',   // yellow
    'hsl(280, 60%, 50%)',   // purple
    'hsl(14, 100%, 50%)',   // deep orange
];



interface ChartCardProps {
    title: string;
    description?: string;
    children: React.ReactNode;
    className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
    title,
    description,
    children,
    className
}) => {
    return (
        <Card className={className}>
            <CardHeader>
                <CardTitle className="text-lg">{title}</CardTitle>
                {description && (
                    <p className="text-sm text-muted-foreground">{description}</p>
                )}
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        {children}
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
};

interface AreaChartProps {
    data: any[];
    dataKey: string;
    xAxisKey: string;
    title: string;
    description?: string;
    color?: string;
}

export const DashboardAreaChart: React.FC<AreaChartProps> = ({
    data,
    dataKey,
    xAxisKey,
    title,
    description,
    color = COLORS[0]
}) => {
    return (
        <ChartCard title={title} description={description}>
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey={xAxisKey}
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                    }}
                />
                <Area
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    fill={color}
                    fillOpacity={0.1}
                />
            </AreaChart>
        </ChartCard>
    );
};

interface PieChartProps {
    data: { name: string; value: number; }[];
    title: string;
    description?: string;
}

export const DashboardPieChart: React.FC<PieChartProps> = ({
    data,
    title,
    description
}) => {
    return (
        <ChartCard title={title} description={description}>
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                </Pie>

                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                    }}
                />
                <Legend />
            </PieChart>
        </ChartCard>
    );
};

interface BarChartProps {
    data: any[];
    dataKey: string;
    xAxisKey: string;
    title: string;
    description?: string;
    color?: string;
}

export const DashboardBarChart: React.FC<BarChartProps> = ({
    data,
    dataKey,
    xAxisKey,
    title,
    description,
    color = COLORS[0]
}) => {
    return (
        <ChartCard title={title} description={description}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey={xAxisKey}
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                    }}
                />
                <Bar dataKey={dataKey} fill={color} />
            </BarChart>
        </ChartCard>
    );
};

interface LineChartProps {
    data: any[];
    dataKey: string;
    xAxisKey: string;
    title: string;
    description?: string;
    color?: string;
}

export const DashboardLineChart: React.FC<LineChartProps> = ({
    data,
    dataKey,
    xAxisKey,
    title,
    description,
    color = COLORS[0]
}) => {
    return (
        <ChartCard title={title} description={description}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey={xAxisKey}
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                />
                <YAxis
                    className="text-xs"
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px'
                    }}
                />
                <Line
                    type="monotone"
                    dataKey={dataKey}
                    stroke={color}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                />
            </LineChart>
        </ChartCard>
    );
};
