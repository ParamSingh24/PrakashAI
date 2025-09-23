import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { motion } from 'framer-motion';
import { Card } from '../UI/Card';
import { Icon } from '../UI/Icon';
import { PowerConsumer } from '../../types/dashboard.types';

interface PowerConsumersChartProps {
  data: PowerConsumer[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-dark-card border border-dark-surface rounded-lg p-3 shadow-lg">
        <p className="text-dark-text font-medium">{data.name}</p>
        <p className="text-primary">{data.usage} kWh</p>
        <p className="text-dark-textSecondary">{data.percentage}% of total</p>
        <p className="text-secondary">₹{data.cost}</p>
      </div>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => (
  <div className="flex flex-wrap gap-2 mt-4">
    {payload.map((entry: any, index: number) => (
      <div key={index} className="flex items-center space-x-2">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: entry.color }}
        />
        <span className="text-sm text-dark-textSecondary">
          {entry.value}
        </span>
      </div>
    ))}
  </div>
);

export const PowerConsumersChart: React.FC<PowerConsumersChartProps> = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <Card className="h-full">
        <div className="mb-6">
          <h3 className="text-2xl font-accent text-dark-text mb-2 serif-optimized neon-text-blue">
            Top Power Consumers
          </h3>
          <p className="font-body text-dark-textSecondary serif-optimized">
            Energy consumption breakdown by device
          </p>
        </div>
        <div className="text-center py-8">
          <Icon name="zap" size={48} className="text-dark-surface mx-auto mb-4" />
          <p className="font-body text-dark-textSecondary serif-optimized">No power consumption data available</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <div className="mb-6">
        <h3 className="text-xl font-accent text-dark-text mb-2 serif-optimized">
          Top Power Consumers
        </h3>
        <p className="font-body text-dark-textSecondary serif-optimized">
          Energy consumption breakdown by device
        </p>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="percentage"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 space-y-3">
        {data.map((item, index) => (
          <motion.div
            key={item.name}
            className="flex items-center justify-between p-3 rounded-lg bg-dark-surface/20 hover:bg-dark-surface/30 transition-all duration-200"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-3">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-accent text-dark-text serif-optimized">
                {item.name}
              </span>
            </div>
            <div className="text-right">
              <div className="text-sm font-display text-dark-text serif-optimized">
                {item.percentage}%
              </div>
              <div className="text-xs font-body text-dark-textSecondary serif-optimized">
                ₹{item.cost}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </Card>
  );
};
