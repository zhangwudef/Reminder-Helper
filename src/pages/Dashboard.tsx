import React from 'react';
import { Link } from 'react-router-dom';
import { useEventStore } from '@/store/useEventStore';

const Dashboard = () => {
  const events = useEventStore((state) => state.events);

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">事件展示</h1>
          <p className="text-gray-500">管理您的所有待办事项和推送事件</p>
        </div>
        <Link to="/events/new" className="px-6 py-3 text-white bg-black rounded-lg hover:bg-gray-800 transition-colors shadow-lg text-center md:text-left w-full md:w-auto">
          + 创建新事件
        </Link>
      </header>
      
      {events.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
          <p className="text-gray-500 text-lg">暂无事件，快去创建吧！</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {events.map((event) => (
            <div key={event.id} className="p-6 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1 w-full">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded ${
                      event.type === 'special' ? 'bg-black text-white' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {event.type === 'special' ? '智能推送' : '普通事件'}
                    </span>
                    <h3 className="text-xl font-bold break-words">{event.title}</h3>
                    <span className={`px-2 py-0.5 text-xs rounded-full border ${
                      event.importance === 'high' ? 'border-red-200 text-red-700 bg-red-50' :
                      event.importance === 'medium' ? 'border-yellow-200 text-yellow-700 bg-yellow-50' :
                      'border-green-200 text-green-700 bg-green-50'
                    }`}>
                      {event.importance === 'high' ? '重要' : event.importance === 'medium' ? '一般' : '低'}
                    </span>
                  </div>
                  <p className="text-gray-600 mb-4 break-words">{event.description}</p>
                  
                  {event.specialData?.summary && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-sm text-gray-700">
                        <span className="font-semibold">AI摘要：</span> {event.specialData.summary}
                      </p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center text-sm text-gray-500 gap-4">
                    <span>📅 {event.date}</span>
                    {event.reminder?.enabled && (
                      <span>⏰ {event.reminder.frequency === 'daily' ? '每天' : '每周'}提醒</span>
                    )}
                  </div>
                </div>

                <div className="w-full md:w-48 pl-0 md:pl-6 border-l-0 md:border-l border-t md:border-t-0 pt-4 md:pt-0 mt-4 md:mt-0 border-gray-100">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-gray-500">完成度</span>
                    <span className="font-semibold">{event.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className="bg-black h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${event.progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="mt-4 flex justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                    <button className="text-sm text-gray-600 hover:text-black">编辑</button>
                    <button className="text-sm text-red-600 hover:text-red-800">删除</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
