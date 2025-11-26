import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { TestStats } from '../types';

interface ResultChartProps {
  data: TestStats['history'];
}

export const ResultChart: React.FC<ResultChartProps> = ({ data }) => {
  return (
    <div className="w-full h-64 mt-8">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#444" vertical={false} />
          <XAxis 
            dataKey="second" 
            stroke="#646669" 
            tick={{ fill: '#646669', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Time (s)', position: 'insideBottom', offset: -5, fill: '#646669' }}
          />
          <YAxis 
            stroke="#646669" 
            tick={{ fill: '#646669', fontSize: 12 }}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Words per Minute', angle: -90, position: 'insideLeft', fill: '#646669' }}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#323437', borderColor: '#e2b714', color: '#d1d0c5' }}
            itemStyle={{ color: '#e2b714' }}
            cursor={{ stroke: '#646669', strokeWidth: 1 }}
          />
          <Line 
            type="monotone" 
            dataKey="wpm" 
            stroke="#e2b714" 
            strokeWidth={3} 
            dot={false} 
            activeDot={{ r: 6, fill: '#e2b714' }}
            animationDuration={1500}
          />
          <Line 
            type="monotone" 
            dataKey="raw" 
            stroke="#646669" 
            strokeWidth={2} 
            dot={false} 
            strokeDasharray="5 5"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};