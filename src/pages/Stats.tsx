import React from 'react';

const Stats = () => {
  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-8">数据整合</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">事件类型分布</h2>
          <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-500">
            图表区域
          </div>
        </div>
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h2 className="text-xl font-semibold mb-4">重要程度分布</h2>
          <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-500">
            图表区域
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stats;
