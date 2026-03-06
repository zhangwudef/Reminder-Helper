import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventStore } from '@/store/useEventStore';
import { Event, CrawledInfo } from '@/types';
import { 
  monitorEventByQwen,
  generateEventSummary,
  getQwenServiceStatus,
  EventMonitorResult
} from '@/services/qwen';
import { 
  Loader2, 
  Sparkles, 
  AlertCircle, 
  CheckCircle, 
  ExternalLink,
  Zap,
  Globe,
  Clock,
  TrendingUp,
  Lightbulb,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

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

  const [userInput, setUserInput] = useState<string>('');
  const [crawledInfo, setCrawledInfo] = useState<EventMonitorResult | null>(null);
  const [isCrawling, setIsCrawling] = useState<boolean>(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{configured: boolean; rateLimit: {used: number; limit: number; remaining: number}} | null>(null);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [autoFillEnabled, setAutoFillEnabled] = useState<boolean>(true);

  useEffect(() => {
    const status = getQwenServiceStatus();
    setAiStatus(status);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title) return;

    let newEvent: Event = {
      ...formData as Event,
      id: crypto.randomUUID(),
      isAIGenerated: crawledInfo !== null,
    };

    if (formData.type === 'special' || crawledInfo) {
      try {
        let specialData: Event['specialData'] = {};
        
        if (crawledInfo) {
          specialData.crawledInfo = {
            timestamp: crawledInfo.acquisitionTime,
            source: crawledInfo.sourceUrls.length > 0 ? crawledInfo.sourceUrls[0].channel : '千问大模型',
            keywords: [userInput],
            content: crawledInfo.processDescription,
            confidence: crawledInfo.confidence,
            processDescription: crawledInfo.processDescription,
            acquisitionTime: crawledInfo.acquisitionTime,
            sourceUrls: crawledInfo.sourceUrls,
            keyPoints: crawledInfo.keyPoints
          };
        }
        
        if (!specialData.summary && crawledInfo?.processDescription) {
          const summary = await generateEventSummary(
            crawledInfo.processDescription
          );
          specialData.summary = summary;
        }
        
        newEvent = {
          ...newEvent,
          specialData
        };
      } catch (error) {
        console.error('Error generating summary:', error);
      }
    }

    addEvent(newEvent);
    navigate('/dashboard');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAICrawl = async () => {
    if (!userInput.trim()) {
      setCrawlError('请输入事件相关信息');
      return;
    }

    setIsCrawling(true);
    setCrawlError(null);
    setCrawledInfo(null);

    try {
      const info = await monitorEventByQwen(userInput);
      setCrawledInfo(info);
      
      if (autoFillEnabled) {
        if (!formData.title) {
          const titleFromInput = userInput.length > 50 
            ? userInput.substring(0, 50) + '...' 
            : userInput;
          setFormData(prev => ({
            ...prev,
            title: titleFromInput
          }));
        }
        
        if (!formData.description && info.processDescription) {
          setFormData(prev => ({
            ...prev,
            description: info.processDescription.substring(0, 500)
          }));
        }
      }

      const status = getQwenServiceStatus();
      setAiStatus(status);
      
    } catch (error) {
      setCrawlError((error as Error).message);
      console.error('AI crawl error:', error);
    } finally {
      setIsCrawling(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">创建新事件</h1>
        {aiStatus && (
          <div className="flex items-center gap-2 text-sm">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-gray-600">千问AI：</span>
            <span className={`px-2 py-1 rounded ${aiStatus.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {aiStatus.configured ? '已连接' : '未配置'}
            </span>
            {aiStatus.configured && (
              <span className="text-gray-500 text-xs">
                ({aiStatus.rateLimit.remaining}/{aiStatus.rateLimit.limit}次/分钟)
              </span>
            )}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold border-b pb-2 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-black" />
            AI智能信息抓取
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                输入事件相关信息
                <span className="text-gray-400 font-normal ml-2">
                  (关键词、事件描述、关注主题等)
                </span>
              </label>
              <textarea 
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none"
                rows={3}
                placeholder="例如：美联储最新议息会议结果、A股市场今日行情分析、央行降准政策影响..."
                disabled={isCrawling}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input 
                  type="checkbox"
                  checked={autoFillEnabled}
                  onChange={(e) => setAutoFillEnabled(e.target.checked)}
                  className="rounded border-gray-300 text-black focus:ring-black"
                />
                自动填充表单
              </label>
              
              <button 
                type="button"
                onClick={handleAICrawl}
                disabled={isCrawling || !userInput.trim()}
                className="px-6 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg"
              >
                {isCrawling ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    智能分析中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    开始智能抓取
                  </>
                )}
              </button>
            </div>

            {crawlError && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-700 font-medium">抓取失败</p>
                  <p className="text-red-600 text-sm mt-1">{crawlError}</p>
                </div>
              </div>
            )}

            {crawledInfo && (
              <div className="mt-6 border border-gray-200 rounded-xl overflow-hidden">
                <div 
                  className="bg-black p-4 cursor-pointer"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 text-green-400" />
                      <div>
                        <h4 className="font-semibold text-white">信息抓取成功</h4>
                        <p className="text-sm text-gray-300">
                          来源：{crawledInfo.sourceUrls.length > 0 ? crawledInfo.sourceUrls[0].channel : '千问大模型'} · 置信度：{Math.round(crawledInfo.confidence * 100)}%
                        </p>
                      </div>
                    </div>
                    {showDetails ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>

                {showDetails && (
                  <div className="p-4 space-y-4 bg-white">
                    {crawledInfo.keyPoints && crawledInfo.keyPoints.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-amber-500" />
                          关键要点
                        </h5>
                        <ul className="space-y-2">
                          {crawledInfo.keyPoints.map((point, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-start gap-2 bg-gray-50 p-2 rounded">
                              <span className="text-black mt-0.5">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {crawledInfo.sourceUrls && crawledInfo.sourceUrls.length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <Globe className="w-4 h-4 text-blue-500" />
                          信息来源
                        </h5>
                        <div className="space-y-2">
                          {crawledInfo.sourceUrls.map((source, idx) => (
                            <a 
                              key={idx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors group"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded whitespace-nowrap">
                                  {source.channel}
                                </span>
                                <span className="text-sm text-gray-600 truncate">{source.title}</span>
                              </div>
                              <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-blue-500 flex-shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {crawledInfo.processDescription && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          详细描述
                        </h5>
                        <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded max-h-40 overflow-y-auto whitespace-pre-wrap">
                          {crawledInfo.processDescription}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        获取时间：{formatTime(crawledInfo.acquisitionTime)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold border-b pb-2 mb-6">基本信息</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">事件标题 *</label>
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
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold border-b pb-2 mb-6">设置</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
        </div>

        <div className="flex gap-4">
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
