import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import zhCN from '@fullcalendar/core/locales/zh-cn';
import { useEventStore } from '@/store/useEventStore';
import { Event } from '@/types';

const Calendar = () => {
  const [currentView, setCurrentView] = useState('dayGridMonth');
  const { events, getEventsByDate } = useEventStore();

  // 准备日历事件数据
  const calendarEvents = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: event.date,
    allDay: true,
    extendedProps: {
      type: event.type,
      importance: event.importance,
      description: event.description
    }
  }));

  // 事件点击处理
  const handleEventClick = (info: any) => {
    // 这里可以添加事件详情查看逻辑
    console.log('Event clicked:', info.event);
  };

  // 日期点击处理
  const handleDateClick = (info: any) => {
    // 这里可以添加快速添加事件的逻辑
    console.log('Date clicked:', info.dateStr);
  };

  // 视图切换处理
  const handleViewChange = (info: any) => {
    setCurrentView(info.view.type);
  };

  // 自定义事件渲染
  const eventContent = (arg: any) => {
    const event = arg.event;
    const importance = event.extendedProps.importance;
    
    // 根据重要程度设置不同的背景色
    let bgColor = '';
    let textColor = '';
    switch (importance) {
      case 'high':
        bgColor = 'bg-rose-100';
        textColor = 'text-rose-700';
        break;
      case 'medium':
        bgColor = 'bg-amber-100';
        textColor = 'text-amber-700';
        break;
      case 'low':
        bgColor = 'bg-emerald-100';
        textColor = 'text-emerald-700';
        break;
      default:
        bgColor = 'bg-gray-100';
        textColor = 'text-gray-700';
    }

    return (
      <div className={`p-1 ${bgColor} ${textColor} text-xs rounded`}>
        {event.title}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-6">
      <h1 className="text-3xl font-bold mb-8">日历视图</h1>
      <div className="border rounded-lg bg-white p-4 shadow-sm">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={currentView}
          events={calendarEvents}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
          }}
          eventClick={handleEventClick}
          dateClick={handleDateClick}
          viewDidMount={handleViewChange}
          viewWillUnmount={handleViewChange}
          eventContent={eventContent}
          height="auto"
          contentHeight={600}
          themeSystem="standard"
          dayMaxEvents={true}
          nowIndicator={true}
          weekends={true}
          editable={true}
          selectable={true}
          locale={zhCN}
        />
        
        {/* 事件汇总 */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">事件汇总</h2>
          <div className="border rounded-lg bg-white p-4 shadow-sm">
            {events.length > 0 ? (
              <div className="space-y-4">
                {events.map((event) => (
                  <div key={event.id} className="p-4 border-b last:border-b-0">
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-bold">{event.title}</h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded ${event.type === 'special' ? 'bg-black text-white' : 'bg-gray-100'}`}>
                        {event.type === 'special' ? '智能推送' : '普通事件'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="font-medium">日期：</span>
                        {event.date}
                      </div>
                      <div>
                        <span className="font-medium">重要程度：</span>
                        {event.importance === 'high' ? '高' : event.importance === 'medium' ? '中' : '低'}
                      </div>
                      <div>
                        <span className="font-medium">进度：</span>
                        {event.progress}%
                      </div>
                      {event.reminder?.enabled && (
                        <div>
                          <span className="font-medium">提醒：</span>
                          {event.reminder.method === 'email' ? '邮件' : event.reminder.method === 'notification' ? '通知' : '短信'}
                        </div>
                      )}
                    </div>
                    <div className="mt-2">
                      <span className="font-medium">描述：</span>
                      <p className="text-gray-600">{event.description}</p>
                    </div>
                    {event.specialData?.summary && (
                      <div className="mt-2">
                        <span className="font-medium">摘要：</span>
                        <p className="text-gray-600">{event.specialData.summary}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                暂无事件
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
