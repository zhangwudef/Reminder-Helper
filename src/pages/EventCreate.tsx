import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventStore } from '@/store/useEventStore';
import { Event } from '@/types';

const EventCreate = () => {
  const navigate = useNavigate();
  const addEvent = useEventStore((state) => state.addEvent);
  
  const [formData, setFormData] = useState<Partial<Event>>({
    title: '',
    type: 'normal',
    description: '',
    importance: 'medium',
    progress: 0,
    date: new Date().toISOString().split('T')[0],
    reminder: {
      enabled: false,
      method: 'notification',
      frequency: 'once'
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) return;

    const newEvent: Event = {
      ...formData as Event,
      id: crypto.randomUUID(),
    };

    addEvent(newEvent);
    navigate('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">创建新事件</h1>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-4 md:p-8 rounded-xl shadow-sm border border-gray-100">
        
        {/* Basic Info */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">基本信息</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">事件标题</label>
            <input 
              type="text" 
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="请输入事件标题"
              required
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">事件类型</label>
              <select 
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="normal">普通事件</option>
                <option value="special">信息整合推送事件</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">重要程度</label>
              <select 
                name="importance"
                value={formData.importance}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="low">低</option>
                <option value="medium">一般</option>
                <option value="high">重要</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
            <textarea 
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent" 
              rows={4}
              placeholder="事件详细描述..."
            ></textarea>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold border-b pb-2">设置</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
            <input 
              type="date" 
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">初始进度 ({formData.progress}%)</label>
            <input 
              type="range" 
              name="progress"
              min="0"
              max="100"
              value={formData.progress}
              onChange={handleChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
            />
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
            取消
          </button>
          <button type="submit" className="flex-1 py-3 px-4 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors shadow-lg">
            创建事件
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventCreate;
