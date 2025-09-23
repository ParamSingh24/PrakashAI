import React from 'react';
import { DollarSign, Zap, TrendingUp, Target } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

type SavingsData = {
  totalSaved: number;
  monthlySavings: {
    month: string;
    amount: number;
  }[];
  topSavingAreas: {
    name: string;
    amount: number;
    percentage: number;
  }[];
  potentialSavings: number;
  energyEfficiencyScore: number;
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; description?: string }> = ({
  icon,
  title,
  value,
  description,
}) => (
  <div className="bg-dark-card p-6 rounded-xl shadow-lg">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="text-sm font-accent text-dark-textSecondary serif-optimized">{title}</h3>
    </div>
    <div className="space-y-1">
      <p className="text-2xl font-display font-semibold text-dark-text serif-optimized">{value}</p>
      {description && <p className="text-sm font-body text-dark-textSecondary serif-optimized">{description}</p>}
    </div>
  </div>
);

export const SavingsAnalysis: React.FC<{ data: SavingsData }> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading text-dark-text mb-2 serif-optimized">Savings Analysis</h2>
        <p className="font-body text-dark-textSecondary serif-optimized leading-relaxed">Track your energy savings and efficiency improvements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<DollarSign size={20} />}
          title="Total Saved"
          value={`$${data.totalSaved.toLocaleString()}`}
          description="Lifetime savings"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          title="This Month"
          value={`$${data.monthlySavings[data.monthlySavings.length - 1]?.amount.toLocaleString() || '0'}`}
          description={`${data.monthlySavings[data.monthlySavings.length - 1]?.amount > 0 ? '↑' : '↓'} from last month`}
        />
        <StatCard
          icon={<Target size={20} />}
          title="Potential Savings"
          value={`$${data.potentialSavings.toLocaleString()}`}
          description="Estimated monthly savings"
        />
        <StatCard
          icon={<Zap size={20} />}
          title="Efficiency Score"
          value={`${data.energyEfficiencyScore}/100`}
          description="Your energy efficiency rating"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-card p-6 rounded-xl shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-accent text-dark-text serif-optimized">Monthly Savings</h3>
            <div className="text-sm text-primary">
              {new Date().toLocaleString('default', { month: 'long' })} {new Date().getFullYear()}
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.monthlySavings}
                margin={{
                  top: 5,
                  right: 10,
                  left: -20,
                  bottom: 5,
                }}
                barSize={20}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#2D3748" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#A0AEC0', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: '#A0AEC0', fontSize: 12 }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: '#2D3748',
                    border: 'none',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Savings']}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar 
                  dataKey="amount" 
                  radius={[4, 4, 0, 0]}
                >
                  {data.monthlySavings.map((_, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === data.monthlySavings.length - 1 ? '#06b6d4' : '#06b6d480'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 text-xs text-dark-textSecondary text-center">
            {data.monthlySavings.length > 0 && (
              <p>Total saved this month: ${data.monthlySavings[data.monthlySavings.length - 1].amount.toLocaleString()}</p>
            )}
          </div>
        </div>

        <div className="bg-dark-card p-6 rounded-xl shadow-lg">
          <h3 className="text-lg font-accent text-dark-text mb-4 serif-optimized">Top Saving Areas</h3>
          <div className="space-y-4">
            {data.topSavingAreas.map((area) => (
              <div key={area.name} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-dark-text">{area.name}</span>
                  <span className="font-accent text-primary serif-optimized">${area.amount.toLocaleString()}</span>
                </div>
                <div className="w-full bg-dark-cardHighlight rounded-full h-2">
                  <div 
                    className="bg-primary h-full rounded-full" 
                    style={{ width: `${area.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SavingsAnalysis;
