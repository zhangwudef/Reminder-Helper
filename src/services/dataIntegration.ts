import { Event, CrawledInfo } from '@/types';
import { 
  monitorEventByQwen, 
  generateEventSummary, 
  getQwenServiceStatus, 
  EventMonitorResult 
} from './qwen';

export const quickAddEvents = [
  '美联储议息会议',
  'A股市场动态',
  '央行货币政策'
];

export type EventStatus = 'monitoring' | 'completed' | 'failed';

export interface MonitoredEvent {
  id: string;
  keyword: string;
  status: EventStatus;
  createdAt: string;
  lastUpdated?: string;
  crawledInfo?: CrawledInfo;
  errorMessage?: string;
  retryCount?: number;
}

export interface EventStatistics {
  total: number;
  monitoring: number;
  completed: number;
  failed: number;
}

export interface AIServiceStatus {
  qwen: {
    configured: boolean;
    rateLimit: {
      used: number;
      limit: number;
      remaining: number;
    };
  };
}

export interface BatchOperationResult {
  success: string[];
  failed: { id: string; error: string }[];
}

interface DataCache {
  [keyword: string]: {
    data: CrawledInfo;
    timestamp: number;
  };
}

const STORAGE_KEY = 'monitored_events';
const CACHE_KEY = 'event_cache';
const CACHE_DURATION = 30 * 60 * 1000;
const MAX_CACHE_SIZE = 50;
const MAX_EVENTS = 100;

let monitoredEvents: MonitoredEvent[] = [];
let dataCache: DataCache = {};
let isInitialized = false;

function logAction(action: string, details: Record<string, unknown>): void {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [DataIntegration] ${action}:`, details);
}

function initializeStorage(): void {
  if (isInitialized) return;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      monitoredEvents = JSON.parse(stored) as MonitoredEvent[];
      logAction('从localStorage加载数据', { count: monitoredEvents.length });
    }
    
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      dataCache = JSON.parse(cachedData) as DataCache;
      cleanExpiredCache();
    }
    
    isInitialized = true;
  } catch (error) {
    logAction('初始化存储失败', { error: (error as Error).message });
    monitoredEvents = [];
    dataCache = {};
  }
}

function saveToStorage(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(monitoredEvents));
  } catch (error) {
    logAction('保存数据失败', { error: (error as Error).message });
  }
}

function saveCacheToStorage(): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(dataCache));
  } catch (error) {
    logAction('保存缓存失败', { error: (error as Error).message });
  }
}

function cleanExpiredCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  for (const key of Object.keys(dataCache)) {
    if (now - dataCache[key].timestamp > CACHE_DURATION) {
      keysToDelete.push(key);
    }
  }
  
  for (const key of keysToDelete) {
    delete dataCache[key];
  }
  
  if (Object.keys(dataCache).length > MAX_CACHE_SIZE) {
    const sortedKeys = Object.keys(dataCache).sort(
      (a, b) => dataCache[a].timestamp - dataCache[b].timestamp
    );
    const toDelete = sortedKeys.slice(0, Object.keys(dataCache).length - MAX_CACHE_SIZE);
    for (const key of toDelete) {
      delete dataCache[key];
    }
  }
  
  if (keysToDelete.length > 0) {
    saveCacheToStorage();
  }
}

function getFromCache(keyword: string): CrawledInfo | null {
  const normalizedKeyword = normalizeKeyword(keyword);
  const cached = dataCache[normalizedKeyword];
  
  if (cached && Date.now() - cached.timestamp <= CACHE_DURATION) {
    logAction('缓存命中', { keyword: normalizedKeyword });
    return cached.data;
  }
  
  return null;
}

function setCache(keyword: string, data: CrawledInfo): void {
  const normalizedKeyword = normalizeKeyword(keyword);
  dataCache[normalizedKeyword] = {
    data,
    timestamp: Date.now()
  };
  cleanExpiredCache();
  saveCacheToStorage();
}

export function normalizeKeyword(keyword: string): string {
  return keyword
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function parseKeywords(keyword: string): string[] {
  return keyword
    .split(/[,，、\s]+/)
    .map(k => k.trim())
    .filter(k => k.length > 0);
}

function convertQwenResultToCrawledInfo(result: EventMonitorResult, keywords: string[]): CrawledInfo {
  return {
    timestamp: result.acquisitionTime,
    source: result.sourceUrls.length > 0 ? result.sourceUrls[0].channel : '千问大模型',
    keywords,
    content: result.processDescription,
    confidence: result.confidence,
    processDescription: result.processDescription,
    acquisitionTime: result.acquisitionTime,
    sourceUrls: result.sourceUrls,
    keyPoints: result.keyPoints
  };
}

export function findDuplicateEvent(keyword: string): MonitoredEvent | undefined {
  const normalized = normalizeKeyword(keyword);
  return monitoredEvents.find(e => normalizeKeyword(e.keyword) === normalized);
}

initializeStorage();

export async function startMonitoringEvent(keyword: string): Promise<MonitoredEvent> {
  if (!keyword.trim()) {
    throw new Error('请输入关注的财经事件');
  }

  const duplicate = findDuplicateEvent(keyword);
  if (duplicate) {
    logAction('检测到重复事件', { keyword, existingId: duplicate.id });
    throw new Error(`该事件已在监控中，ID: ${duplicate.id.substring(0, 8)}`);
  }

  if (monitoredEvents.length >= MAX_EVENTS) {
    throw new Error(`已达到最大事件数量限制（${MAX_EVENTS}），请删除部分事件后再添加`);
  }

  const newEvent: MonitoredEvent = {
    id: crypto.randomUUID(),
    keyword: keyword.trim(),
    status: 'monitoring',
    createdAt: new Date().toISOString(),
    retryCount: 0
  };

  monitoredEvents.push(newEvent);
  saveToStorage();

  try {
    const cachedInfo = getFromCache(keyword);
    let crawledInfo: CrawledInfo;

    if (cachedInfo) {
      crawledInfo = cachedInfo;
      logAction('使用缓存数据', { keyword });
    } else {
      const qwenStatus = getQwenServiceStatus();

      if (!qwenStatus.configured) {
        throw new Error('千问API密钥未配置，请在环境变量中设置VITE_QWEN_API_KEY');
      }

      const qwenResult = await monitorEventByQwen(keyword);
      const keywordsArray = parseKeywords(keyword);
      crawledInfo = convertQwenResultToCrawledInfo(qwenResult, keywordsArray);
      setCache(keyword, crawledInfo);
    }

    const eventIndex = monitoredEvents.findIndex(e => e.id === newEvent.id);
    if (eventIndex !== -1) {
      monitoredEvents[eventIndex] = {
        ...monitoredEvents[eventIndex],
        status: 'completed',
        lastUpdated: new Date().toISOString(),
        crawledInfo
      };
      saveToStorage();
    }

    logAction('事件监控完成', { id: newEvent.id, keyword });
    return monitoredEvents[eventIndex];
  } catch (error) {
    const eventIndex = monitoredEvents.findIndex(e => e.id === newEvent.id);
    if (eventIndex !== -1) {
      monitoredEvents[eventIndex] = {
        ...monitoredEvents[eventIndex],
        status: 'failed',
        lastUpdated: new Date().toISOString(),
        errorMessage: (error as Error).message,
        retryCount: (monitoredEvents[eventIndex].retryCount || 0) + 1
      };
      saveToStorage();
    }

    logAction('事件监控失败', { id: newEvent.id, error: (error as Error).message });
    return monitoredEvents[eventIndex];
  }
}

export async function refreshEvent(id: string): Promise<MonitoredEvent> {
  const event = monitoredEvents.find(e => e.id === id);
  if (!event) {
    throw new Error(`未找到ID为 ${id} 的事件`);
  }

  logAction('刷新事件', { id, keyword: event.keyword });

  const index = monitoredEvents.findIndex(e => e.id === id);
  monitoredEvents[index] = {
    ...monitoredEvents[index],
    status: 'monitoring',
    lastUpdated: new Date().toISOString()
  };
  saveToStorage();

  try {
    const qwenStatus = getQwenServiceStatus();
    let crawledInfo: CrawledInfo;

    if (!qwenStatus.configured) {
      throw new Error('千问API密钥未配置，请在环境变量中设置VITE_QWEN_API_KEY');
    }

    const qwenResult = await monitorEventByQwen(event.keyword);
    const keywordsArray = parseKeywords(event.keyword);
    crawledInfo = convertQwenResultToCrawledInfo(qwenResult, keywordsArray);
    setCache(event.keyword, crawledInfo);

    monitoredEvents[index] = {
      ...monitoredEvents[index],
      status: 'completed',
      lastUpdated: new Date().toISOString(),
      crawledInfo,
      errorMessage: undefined
    };
    saveToStorage();

    logAction('事件刷新完成', { id });
    return monitoredEvents[index];
  } catch (error) {
    monitoredEvents[index] = {
      ...monitoredEvents[index],
      status: 'failed',
      lastUpdated: new Date().toISOString(),
      errorMessage: (error as Error).message
    };
    saveToStorage();

    logAction('事件刷新失败', { id, error: (error as Error).message });
    return monitoredEvents[index];
  }
}

export async function retryFailedEvent(id: string): Promise<MonitoredEvent> {
  const event = monitoredEvents.find(e => e.id === id);
  if (!event) {
    throw new Error(`未找到ID为 ${id} 的事件`);
  }

  if (event.status !== 'failed') {
    throw new Error('只能重试失败的事件');
  }

  logAction('重试失败事件', { id, keyword: event.keyword });
  return refreshEvent(id);
}

export function getMonitoredEvents(): MonitoredEvent[] {
  return [...monitoredEvents];
}

export function getMonitoredEventById(id: string): MonitoredEvent | undefined {
  return monitoredEvents.find(e => e.id === id);
}

export function getEventsByStatus(status: EventStatus): MonitoredEvent[] {
  return monitoredEvents.filter(e => e.status === status);
}

export function stopMonitoringEvent(id: string): boolean {
  const index = monitoredEvents.findIndex(e => e.id === id);
  if (index !== -1) {
    const removed = monitoredEvents.splice(index, 1);
    saveToStorage();
    logAction('删除事件', { id, keyword: removed[0].keyword });
    return true;
  }
  return false;
}

export function clearAllEvents(): number {
  const count = monitoredEvents.length;
  monitoredEvents = [];
  saveToStorage();
  logAction('清空所有事件', { count });
  return count;
}

export function clearCompletedEvents(): number {
  const initialLength = monitoredEvents.length;
  monitoredEvents = monitoredEvents.filter(e => e.status !== 'completed');
  const removed = initialLength - monitoredEvents.length;
  saveToStorage();
  logAction('清除已完成事件', { count: removed });
  return removed;
}

export function clearFailedEvents(): number {
  const initialLength = monitoredEvents.length;
  monitoredEvents = monitoredEvents.filter(e => e.status !== 'failed');
  const removed = initialLength - monitoredEvents.length;
  saveToStorage();
  logAction('清除失败事件', { count: removed });
  return removed;
}

export async function batchDeleteEvents(ids: string[]): Promise<BatchOperationResult> {
  const result: BatchOperationResult = { success: [], failed: [] };

  for (const id of ids) {
    if (stopMonitoringEvent(id)) {
      result.success.push(id);
    } else {
      result.failed.push({ id, error: '事件不存在' });
    }
  }

  logAction('批量删除事件', { success: result.success.length, failed: result.failed.length });
  return result;
}

export async function batchRefreshEvents(ids: string[]): Promise<BatchOperationResult> {
  const result: BatchOperationResult = { success: [], failed: [] };

  for (const id of ids) {
    try {
      await refreshEvent(id);
      result.success.push(id);
    } catch (error) {
      result.failed.push({ id, error: (error as Error).message });
    }
  }

  logAction('批量刷新事件', { success: result.success.length, failed: result.failed.length });
  return result;
}

export async function batchMonitorEvents(keywords: string[]): Promise<BatchOperationResult & { events: MonitoredEvent[] }> {
  const result: BatchOperationResult & { events: MonitoredEvent[] } = { 
    success: [], 
    failed: [], 
    events: [] 
  };

  for (const keyword of keywords) {
    try {
      const event = await startMonitoringEvent(keyword);
      result.success.push(event.id);
      result.events.push(event);
    } catch (error) {
      result.failed.push({ 
        id: 'new', 
        error: `${keyword}: ${(error as Error).message}` 
      });
    }
  }

  logAction('批量监控事件', { success: result.success.length, failed: result.failed.length });
  return result;
}

export function getEventStatistics(): EventStatistics {
  return {
    total: monitoredEvents.length,
    monitoring: monitoredEvents.filter(e => e.status === 'monitoring').length,
    completed: monitoredEvents.filter(e => e.status === 'completed').length,
    failed: monitoredEvents.filter(e => e.status === 'failed').length
  };
}

export async function convertToEvent(monitoredEvent: MonitoredEvent): Promise<Event> {
  const specialData: Event['specialData'] = {};
  
  if (monitoredEvent.crawledInfo) {
    specialData.crawledInfo = monitoredEvent.crawledInfo;
  }
  
  if (!specialData.summary && monitoredEvent.keyword) {
    let summary: string;
    
    if (monitoredEvent.crawledInfo?.processDescription) {
      summary = await generateEventSummary(monitoredEvent.crawledInfo.processDescription);
    } else {
      summary = monitoredEvent.keyword;
    }
    specialData.summary = summary;
  }

  const content = monitoredEvent.crawledInfo?.content || '';
  const description = content.length > 200 
    ? content.substring(0, 200) + '...' 
    : content;

  return {
    id: crypto.randomUUID(),
    title: monitoredEvent.keyword,
    type: 'special',
    description,
    importance: 'medium',
    progress: 0,
    date: new Date().toISOString().split('T')[0],
    specialData,
    isAIGenerated: true
  };
}

export function getAIServiceStatus(): AIServiceStatus {
  const qwenStatus = getQwenServiceStatus();
  return {
    qwen: qwenStatus
  };
}

export function exportEventsToJson(): string {
  return JSON.stringify({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    events: monitoredEvents
  }, null, 2);
}

export function importEventsFromJson(jsonString: string): { imported: number; skipped: number } {
  try {
    const data = JSON.parse(jsonString);
    
    if (!data.events || !Array.isArray(data.events)) {
      throw new Error('无效的数据格式');
    }

    let imported = 0;
    let skipped = 0;

    for (const event of data.events as MonitoredEvent[]) {
      if (findDuplicateEvent(event.keyword)) {
        skipped++;
        continue;
      }

      const newEvent: MonitoredEvent = {
        ...event,
        id: crypto.randomUUID(),
        createdAt: event.createdAt || new Date().toISOString()
      };
      
      monitoredEvents.push(newEvent);
      imported++;
    }

    saveToStorage();
    logAction('导入事件', { imported, skipped });
    return { imported, skipped };
  } catch (error) {
    logAction('导入事件失败', { error: (error as Error).message });
    throw new Error(`导入失败: ${(error as Error).message}`);
  }
}

export function clearCache(): void {
  dataCache = {};
  localStorage.removeItem(CACHE_KEY);
  logAction('清空缓存', {});
}

export interface EventTypeDistribution {
  normal: number;
  special: number;
  total: number;
  percentages: {
    normal: number;
    special: number;
  };
}

export interface ImportanceDistribution {
  high: number;
  medium: number;
  low: number;
  total: number;
  percentages: {
    high: number;
    medium: number;
    low: number;
  };
}

export interface DistributionFilter {
  dateRange?: {
    start: string;
    end: string;
  };
  status?: EventStatus;
}

export function getEventTypeDistribution(filter?: DistributionFilter): EventTypeDistribution {
  let events = monitoredEvents.filter(e => e.status === 'completed' && e.crawledInfo);
  
  if (filter?.dateRange) {
    const startDate = new Date(filter.dateRange.start);
    const endDate = new Date(filter.dateRange.end);
    events = events.filter(e => {
      const eventDate = new Date(e.createdAt);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }
  
  if (filter?.status) {
    events = events.filter(e => e.status === filter.status);
  }
  
  const normalCount = events.filter(e => e.crawledInfo?.keywords.some(k => 
    ['会议', '例会', '汇报', '日常', '周会', '月会'].some(keyword => k.includes(keyword))
  )).length;
  
  const specialCount = events.length - normalCount;
  const total = events.length;
  
  return {
    normal: normalCount,
    special: specialCount,
    total,
    percentages: {
      normal: total > 0 ? Math.round((normalCount / total) * 100) : 0,
      special: total > 0 ? Math.round((specialCount / total) * 100) : 0
    }
  };
}

export function getImportanceDistribution(filter?: DistributionFilter): ImportanceDistribution {
  let events = monitoredEvents.filter(e => e.status === 'completed' && e.crawledInfo);
  
  if (filter?.dateRange) {
    const startDate = new Date(filter.dateRange.start);
    const endDate = new Date(filter.dateRange.end);
    events = events.filter(e => {
      const eventDate = new Date(e.createdAt);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }
  
  if (filter?.status) {
    events = events.filter(e => e.status === filter.status);
  }
  
  const highKeywords = ['重要', '紧急', '关键', '核心', '重大', '美联储', '央行', '议息'];
  const lowKeywords = ['日常', '普通', '一般', '例行'];
  
  let highCount = 0;
  let mediumCount = 0;
  let lowCount = 0;
  
  events.forEach(event => {
    const keyword = event.keyword.toLowerCase();
    const hasHighKeyword = highKeywords.some(k => keyword.includes(k));
    const hasLowKeyword = lowKeywords.some(k => keyword.includes(k));
    
    if (hasHighKeyword) {
      highCount++;
    } else if (hasLowKeyword) {
      lowCount++;
    } else {
      mediumCount++;
    }
  });
  
  const total = events.length;
  
  return {
    high: highCount,
    medium: mediumCount,
    low: lowCount,
    total,
    percentages: {
      high: total > 0 ? Math.round((highCount / total) * 100) : 0,
      medium: total > 0 ? Math.round((mediumCount / total) * 100) : 0,
      low: total > 0 ? Math.round((lowCount / total) * 100) : 0
    }
  };
}

export function getEventTypeDistributionFromStore(
  storeEvents: Event[], 
  filter?: { dateRange?: { start: string; end: string } }
): EventTypeDistribution {
  let events = storeEvents;
  
  if (filter?.dateRange) {
    const startDate = new Date(filter.dateRange.start);
    const endDate = new Date(filter.dateRange.end);
    events = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }
  
  const normalCount = events.filter(e => e.type === 'normal').length;
  const specialCount = events.filter(e => e.type === 'special').length;
  const total = events.length;
  
  return {
    normal: normalCount,
    special: specialCount,
    total,
    percentages: {
      normal: total > 0 ? Math.round((normalCount / total) * 100) : 0,
      special: total > 0 ? Math.round((specialCount / total) * 100) : 0
    }
  };
}

export function getImportanceDistributionFromStore(
  storeEvents: Event[],
  filter?: { dateRange?: { start: string; end: string } }
): ImportanceDistribution {
  let events = storeEvents;
  
  if (filter?.dateRange) {
    const startDate = new Date(filter.dateRange.start);
    const endDate = new Date(filter.dateRange.end);
    events = events.filter(e => {
      const eventDate = new Date(e.date);
      return eventDate >= startDate && eventDate <= endDate;
    });
  }
  
  const highCount = events.filter(e => e.importance === 'high').length;
  const mediumCount = events.filter(e => e.importance === 'medium').length;
  const lowCount = events.filter(e => e.importance === 'low').length;
  const total = events.length;
  
  return {
    high: highCount,
    medium: mediumCount,
    low: lowCount,
    total,
    percentages: {
      high: total > 0 ? Math.round((highCount / total) * 100) : 0,
      medium: total > 0 ? Math.round((mediumCount / total) * 100) : 0,
      low: total > 0 ? Math.round((lowCount / total) * 100) : 0
    }
  };
}
