import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEventStore } from '@/store/useEventStore';
import { Event, CrawledInfo } from '@/types';
import { monitorEventByQwen, generateEventSummary } from '@/services/qwen';

const EventEdit = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const events = useEventStore((state) => state.events);
  const updateEvent = useEventStore((state) => state.updateEvent);
  
  const [formData, setFormData] = useState<Partial<Event>>({});
  const [loading, setLoading] = useState(true);
  const [keywords, setKeywords] = useState<string>('');
  const [crawledInfo, setCrawledInfo] = useState<CrawledInfo | null>(null);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      const event = events.find(e => e.id === id);
      if (event) {
        setFormData(event);
      } else {
        navigate('/dashboard');
      }
      setLoading(false);
    }
  }, [id, events, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !id) return;

    let updatedEvent: Event = {
      ...formData as Event,
      isAIGenerated: crawledInfo !== null || formData.isAIGenerated,
    };

    if (formData.type === 'special' || crawledInfo || formData.specialData) {
      try {
        let specialData: any = { ...formData.specialData };
        
        if (crawledInfo) {
          specialData.crawledInfo = crawledInfo;
        }
        
        if (!specialData.summary) {
          const summary = await generateEventSummary(
            formData.description || formData.title
          );
          specialData.summary = summary;
        }
        
        updatedEvent = {
          ...updatedEvent,
          specialData
        };
      } catch (error) {
        console.error('Error generating summary:', error);
        // 即使API调用失败，也继续更新事件
      }
    }

    updateEvent(id, updatedEvent);
    navigate('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCrawlInfo = async () => {
    if (!keywords.trim()) {
      setCrawlError('请输入关键词');
      return;
    }

    setIsCrawling(true);
    setCrawlError(null);

    try {
      const info = await monitorEventByQwen(keywords);
      const crawledData: CrawledInfo = {
        timestamp: info.acquisitionTime,
        source: info.sourceUrls.length > 0 ? info.sourceUrls[0].channel : '千问大模型',
        keywords: [keywords],
        content: info.processDescription,
        confidence: info.confidence,
        processDescription: info.processDescription,
        acquisitionTime: info.acquisitionTime,
        sourceUrls: info.sourceUrls,
        keyPoints: info.keyPoints
      };
      setCrawledInfo(crawledData);
      if (!formData.description) {
        setFormData(prev => ({
          ...prev,
          description: info.processDescription.substring(0, 200) + '...'
        }));
      }
    } catch (error) {
      setCrawlError('信息抓取失败，请稍后重试');
      console.error('Crawl error:', error);
    } finally {
      setIsCrawling(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-8">编辑事件</h1>
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
                <option value="special">特殊事件</option>
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

          {/* AI Information Crawler */}
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-700">AI信息抓取</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">关键词 (用逗号分隔)</label>
                <input 
                  type="text" 
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="例如: 会议, 项目, 截止日期"
                />
              </div>
              <div className="flex items-end">
                <button 
                  type="button"
                  onClick={handleCrawlInfo}
                  disabled={isCrawling}
                  className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCrawling ? '抓取中...' : '抓取信息'}
                </button>
              </div>
            </div>
            {crawlError && (
              <div className="text-red-500 text-sm">{crawlError}</div>
            )}
            {(crawledInfo || formData.specialData?.crawledInfo) && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="font-medium text-gray-700 mb-2">抓取的信息</h4>
                <div className="text-sm space-y-2">
                  <p><span className="font-medium">时间戳:</span> {new Date((crawledInfo || formData.specialData?.crawledInfo)!.timestamp).toLocaleString()}</p>
                  <p><span className="font-medium">来源:</span> {(crawledInfo || formData.specialData?.crawledInfo)!.source}</p>
                  <p><span className="font-medium">关键词:</span> {(crawledInfo || formData.specialData?.crawledInfo)!.keywords.join(', ')}</p>
                  <p><span className="font-medium">内容:</span> {(crawledInfo || formData.specialData?.crawledInfo)!.content.substring(0, 100)}...</p>
                  <p><span className="font-medium">置信度:</span> {Math.round((crawledInfo || formData.specialData?.crawledInfo)!.confidence * 100)}%</p>
                  <p className="text-xs text-gray-500 mt-2">* 信息由AI抓取，可能存在误差，请审核后使用</p>
                </div>
              </div>
            )}
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
            <label className="block text-sm font-medium text-gray-700 mb-1">进度 ({formData.progress}%)</label>
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
            更新事件
          </button>
        </div>
      </form>
    </div>
  );
};

export default EventEdit;