import React, { useState, useEffect, useMemo } from 'react';
import { useEventStore } from '@/store/useEventStore';
import { 
  getEventTypeDistributionFromStore, 
  getImportanceDistributionFromStore,
  getMonitoredEvents,
  getEventTypeDistribution,
  getImportanceDistribution
} from '@/services/dataIntegration';
import { Calendar, Filter, RefreshCw, PieChart, BarChart3, TrendingUp } from 'lucide-react';

interface DateRangeFilter {
  start: string;
  end: string;
}

const Stats = () => {
  const storeEvents = useEventStore((state) => state.events);
  const [dateRange, setDateRange] = useState<DateRangeFilter>({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dataSource, setDataSource] = useState<'store' | 'monitored'>('store');
  const [activeChartType, setActiveChartType] = useState<'pie' | 'bar'>('pie');

  useEffect(() => {
    getMonitoredEvents();
  }, []);

  const eventTypeDistribution = useMemo(() => {
    if (dataSource === 'store') {
      return getEventTypeDistributionFromStore(storeEvents, { dateRange });
    } else {
      return getEventTypeDistribution({ dateRange });
    }
  }, [storeEvents, dateRange, dataSource]);

  const importanceDistribution = useMemo(() => {
    if (dataSource === 'store') {
      return getImportanceDistributionFromStore(storeEvents, { dateRange });
    } else {
      return getImportanceDistribution({ dateRange });
    }
  }, [storeEvents, dateRange, dataSource]);

  const handleRefresh = () => {
    getMonitoredEvents();
  };

  const PieChartComponent = ({ data, colors, labels }: { 
    data: number[]; 
    colors: string[]; 
    labels: string[] 
  }) => {
    const total = data.reduce((sum, val) => sum + val, 0);
    if (total === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <PieChart className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无数据</p>
          </div>
        </div>
      );
    }

    let currentAngle = 0;
    const radius = 80;
    const centerX = 100;
    const centerY = 100;

    const slices = data.map((value, index) => {
      const percentage = value / total;
      const angle = percentage * 360;
      const startAngle = currentAngle;
      currentAngle += angle;
      
      const startRad = (startAngle - 90) * Math.PI / 180;
      const endRad = (currentAngle - 90) * Math.PI / 180;
      
      const x1 = centerX + radius * Math.cos(startRad);
      const y1 = centerY + radius * Math.sin(startRad);
      const x2 = centerX + radius * Math.cos(endRad);
      const y2 = centerY + radius * Math.sin(endRad);
      
      const largeArcFlag = angle > 180 ? 1 : 0;
      
      const pathD = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;
      
      return {
        path: pathD,
        color: colors[index],
        label: labels[index],
        value,
        percentage: Math.round(percentage * 100)
      };
    });

    return (
      <div className="flex flex-col md:flex-row items-center justify-center gap-6">
        <svg viewBox="0 0 200 200" className="w-48 h-48">
          {slices.map((slice, index) => (
            <path
              key={index}
              d={slice.path}
              fill={slice.color}
              className="hover:opacity-80 transition-opacity cursor-pointer"
              stroke="white"
              strokeWidth="2"
            />
          ))}
        </svg>
        <div className="space-y-2">
          {slices.map((slice, index) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div 
                className="w-4 h-4 rounded" 
                style={{ backgroundColor: slice.color }}
              />
              <span className="text-gray-600">{slice.label}:</span>
              <span className="font-semibold">{slice.value}</span>
              <span className="text-gray-400">({slice.percentage}%)</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const BarChartComponent = ({ data, colors, labels }: { 
    data: number[]; 
    colors: string[]; 
    labels: string[];
  }) => {
    const maxValue = Math.max(...data, 1);
    const total = data.reduce((sum, val) => sum + val, 0);

    if (total === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>暂无数据</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-end justify-center gap-8 h-48 px-4">
          {data.map((value, index) => {
            const heightPercent = (value / maxValue) * 100;
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            
            return (
              <div key={index} className="flex flex-col items-center gap-2">
                <div className="text-sm font-semibold text-gray-700">{value}</div>
                <div 
                  className="w-16 rounded-t-lg transition-all duration-500 hover:opacity-80 relative group"
                  style={{ 
                    height: `${Math.max(heightPercent, 5)}%`,
                    backgroundColor: colors[index],
                    minHeight: '20px'
                  }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {percentage}%
                  </div>
                </div>
                <div className="text-xs text-gray-500 text-center">{labels[index]}</div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-center gap-6 pt-4 border-t">
          {data.map((value, index) => {
            const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
            return (
              <div key={index} className="flex items-center gap-2 text-sm">
                <div 
                  className="w-3 h-3 rounded" 
                  style={{ backgroundColor: colors[index] }}
                />
                <span className="text-gray-600">{labels[index]}:</span>
                <span className="font-semibold">{value}</span>
                <span className="text-gray-400">({percentage}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color }: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ElementType;
    color: string;
  }) => (
    <div className="bg-white p-4 rounded-lg border shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 bg-gray-50 min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">数据整合</h1>
          <p className="text-gray-500">事件类型与重要程度分布统计分析</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 rounded-lg border transition-colors flex items-center gap-2 ${
              showFilters ? 'bg-black text-white border-black' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </button>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            刷新
          </button>
        </div>
      </header>

      {showFilters && (
        <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Filter className="w-5 h-5" />
            数据筛选
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">数据来源</label>
              <select
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value as 'store' | 'monitored')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="store">事件展示数据</option>
                <option value="monitored">事件追踪数据</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">开始日期</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">结束日期</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="总事件数"
          value={eventTypeDistribution.total}
          subtitle="所有事件"
          icon={TrendingUp}
          color="bg-blue-500"
        />
        <StatCard
          title="普通事件"
          value={eventTypeDistribution.normal}
          subtitle={`${eventTypeDistribution.percentages.normal}% 占比`}
          icon={Calendar}
          color="bg-gray-500"
        />
        <StatCard
          title="重要事件"
          value={importanceDistribution.high}
          subtitle={`${importanceDistribution.percentages.high}% 占比`}
          icon={TrendingUp}
          color="bg-red-500"
        />
        <StatCard
          title="一般事件"
          value={importanceDistribution.medium}
          subtitle={`${importanceDistribution.percentages.medium}% 占比`}
          icon={BarChart3}
          color="bg-yellow-500"
        />
      </div>

      <div className="flex justify-end mb-4">
        <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setActiveChartType('pie')}
            className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
              activeChartType === 'pie' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <PieChart className="w-4 h-4" />
            饼图
          </button>
          <button
            onClick={() => setActiveChartType('bar')}
            className={`px-4 py-2 text-sm flex items-center gap-2 transition-colors ${
              activeChartType === 'bar' ? 'bg-black text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            柱状图
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">事件类型分布</h2>
            <span className="text-sm text-gray-500">共 {eventTypeDistribution.total} 个事件</span>
          </div>
          {activeChartType === 'pie' ? (
            <PieChartComponent
              data={[eventTypeDistribution.normal, eventTypeDistribution.special]}
              colors={['#6B7280', '#3B82F6']}
              labels={['普通事件', '智能推送']}
            />
          ) : (
            <BarChartComponent
              data={[eventTypeDistribution.normal, eventTypeDistribution.special]}
              colors={['#6B7280', '#3B82F6']}
              labels={['普通事件', '智能推送']}
            />
          )}
        </div>

        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">重要程度分布</h2>
            <span className="text-sm text-gray-500">共 {importanceDistribution.total} 个事件</span>
          </div>
          {activeChartType === 'pie' ? (
            <PieChartComponent
              data={[importanceDistribution.high, importanceDistribution.medium, importanceDistribution.low]}
              colors={['#EF4444', '#F59E0B', '#10B981']}
              labels={['重要', '一般', '低']}
            />
          ) : (
            <BarChartComponent
              data={[importanceDistribution.high, importanceDistribution.medium, importanceDistribution.low]}
              colors={['#EF4444', '#F59E0B', '#10B981']}
              labels={['重要', '一般', '低']}
            />
          )}
        </div>
      </div>

      <div className="mt-6 bg-white border rounded-lg p-6 shadow-sm">
        <h3 className="text-lg font-semibold mb-4">数据摘要</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">事件类型分析</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 普通事件占比 <span className="font-semibold text-gray-900">{eventTypeDistribution.percentages.normal}%</span></p>
              <p>• 智能推送事件占比 <span className="font-semibold text-gray-900">{eventTypeDistribution.percentages.special}%</span></p>
              <p>• 数据来源: <span className="font-semibold text-gray-900">{dataSource === 'store' ? '事件展示' : '事件追踪'}</span></p>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">重要程度分析</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <p>• 重要事件占比 <span className="font-semibold text-gray-900">{importanceDistribution.percentages.high}%</span></p>
              <p>• 一般事件占比 <span className="font-semibold text-gray-900">{importanceDistribution.percentages.medium}%</span></p>
              <p>• 低优先级事件占比 <span className="font-semibold text-gray-900">{importanceDistribution.percentages.low}%</span></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
