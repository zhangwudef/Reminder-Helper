import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEventStore } from '@/store/useEventStore';
import { 
  startMonitoringEvent, 
  getMonitoredEvents, 
  quickAddEvents, 
  MonitoredEvent, 
  convertToEvent,
  stopMonitoringEvent,
  getAIServiceStatus 
} from '@/services/dataIntegration';
import { 
  Clock, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Trash2, 
  Save,
  Globe,
  AlertCircle,
  Zap
} from 'lucide-react';

const Monitor = () => {
  const navigate = useNavigate();
  const addEvent = useEventStore((state) => state.addEvent);
  
  const [keyword, setKeyword] = useState<string>('');
  const [monitoredEvents, setMonitoredEvents] = useState<MonitoredEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<{qwen: any} | null>(null);

  useEffect(() => {
    const events = getMonitoredEvents();
    setMonitoredEvents(events);
    const status = getAIServiceStatus();
    setAiStatus(status);
  }, []);

  const handleStartMonitoring = async () => {
    if (!keyword.trim()) {
      setError('请输入关注的财经事件');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await startMonitoringEvent(keyword);
      setMonitoredEvents(getMonitoredEvents());
      setKeyword('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickAdd = async (quickKeyword: string) => {
    setIsLoading(true);
    setError(null);

    try {
      await startMonitoringEvent(quickKeyword);
      setMonitoredEvents(getMonitoredEvents());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsEvent = async (monitoredEvent: MonitoredEvent) => {
    try {
      const event = await convertToEvent(monitoredEvent);
      addEvent(event);
      navigate('/dashboard');
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDeleteEvent = (id: string) => {
    stopMonitoringEvent(id);
    setMonitoredEvents(getMonitoredEvents());
  };

  const toggleExpand = (id: string) => {
    setExpandedEvent(expandedEvent === id ? null : id);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'monitoring':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "text-xs font-semibold px-2 py-1 rounded";
    switch (status) {
      case 'completed':
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>查询成功</span>;
      case 'monitoring':
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>查询中...</span>;
      case 'failed':
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>查询失败</span>;
      default:
        return null;
    }
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">事件追踪</h1>
          <p className="text-gray-500">通过千问大模型智能查询并监控您关注的财经事件</p>
        </div>
        {aiStatus && (
          <div className="flex items-center gap-2 text-sm flex-wrap">
            <Zap className="w-4 h-4 text-amber-500" />
            <span className="text-gray-600">AI服务状态：</span>
            <span className={`px-2 py-1 rounded ${aiStatus.qwen.configured ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              千问 {aiStatus.qwen.configured ? '已连接' : '未配置'}
            </span>
          </div>
        )}
      </header>

      <div className="bg-white border border-gray-100 rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-bold mb-4">添加监控事件</h2>
        <div className="space-y-4">
          <div className="relative">
            <input 
              type="text" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleStartMonitoring()}
              placeholder="请输入你关注的财经事件，如：美联储议息会议、A股市场动态等"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm bg-red-50 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
          <button 
            onClick={handleStartMonitoring}
            disabled={isLoading}
            className="w-full py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                正在查询中...
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                开始智能查询
              </>
            )}
          </button>
          <div className="text-sm text-gray-500">
            快速添加：
            <div className="flex flex-wrap gap-2 mt-2">
              {quickAddEvents.map((event, index) => (
                <button 
                  key={index}
                  onClick={() => handleQuickAdd(event)}
                  disabled={isLoading}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {event}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {monitoredEvents.map((event) => (
          <div key={event.id} className="bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            <div 
              className="p-6 cursor-pointer"
              onClick={() => event.status === 'completed' && toggleExpand(event.id)}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 mt-1">
                  {getStatusIcon(event.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>创建时间：{formatTime(event.createdAt)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(event.status)}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold mb-2 truncate">{event.keyword}</h3>
                  
                  {event.crawledInfo && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          <span>信息来源：{event.crawledInfo.source}</span>
                        </div>
                        <span>置信度：{Math.round(event.crawledInfo.confidence * 100)}%</span>
                      </div>
                      
                      {event.crawledInfo.acquisitionTime && (
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>信息获取时间：{formatTime(event.crawledInfo.acquisitionTime)}</span>
                        </div>
                      )}
                      
                      {event.crawledInfo.keyPoints && event.crawledInfo.keyPoints.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                          <p className="text-sm font-medium text-gray-700 mb-2">关键要点：</p>
                          <ul className="space-y-1">
                            {event.crawledInfo.keyPoints.slice(0, 3).map((point, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                <span className="text-blue-500 mt-1">•</span>
                                <span className="line-clamp-2">{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {event.errorMessage && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                      <p className="text-sm text-red-600">错误信息：{event.errorMessage}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {event.status === 'completed' && expandedEvent === event.id && event.crawledInfo && (
              <div className="border-t border-gray-100 bg-gray-50 p-6">
                <div className="space-y-6">
                  {event.crawledInfo.processDescription && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded"></span>
                        事件完整进程描述
                      </h4>
                      <div className="bg-white rounded-lg p-4 border border-gray-200 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                        {event.crawledInfo.processDescription}
                      </div>
                    </div>
                  )}

                  {event.crawledInfo.sourceUrls && event.crawledInfo.sourceUrls.length > 0 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-green-500 rounded"></span>
                        信息来源网址及渠道
                      </h4>
                      <div className="space-y-2">
                        {event.crawledInfo.sourceUrls.map((source, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                            <div className="flex items-center gap-3 min-w-0">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded whitespace-nowrap">
                                {source.channel}
                              </span>
                              <a 
                                href={source.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-sm text-gray-600 hover:text-blue-600 truncate flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {source.url}
                                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {event.crawledInfo.keyPoints && event.crawledInfo.keyPoints.length > 3 && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                        <span className="w-1 h-4 bg-amber-500 rounded"></span>
                        全部关键要点
                      </h4>
                      <ul className="space-y-2">
                        {event.crawledInfo.keyPoints.map((point, idx) => (
                          <li key={idx} className="text-sm text-gray-600 bg-white rounded-lg p-3 border border-gray-200 flex items-start gap-2">
                            <span className="text-amber-500 font-bold">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSaveAsEvent(event);
                      }}
                      className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      保存为事件
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteEvent(event.id);
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              </div>
            )}

            {event.status === 'completed' && expandedEvent !== event.id && (
              <div className="px-6 pb-4">
                <button 
                  onClick={() => toggleExpand(event.id)}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  点击展开查看详细信息 →
                </button>
              </div>
            )}
          </div>
        ))}
        
        {monitoredEvents.length === 0 && (
          <div className="text-center py-20 bg-white border border-dashed border-gray-300 rounded-xl">
            <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">暂无监控事件</p>
            <p className="text-gray-400 text-sm mt-2">输入关键词开始智能查询财经事件</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Monitor;
