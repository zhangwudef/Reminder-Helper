import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, CheckSquare, BarChart2, ArrowRight } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'l') {
        navigate('/login');
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-black text-white py-10 md:py-20">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">事件追踪与智能推送</h1>
          <p className="text-lg md:text-xl text-gray-400 mb-10 max-w-2xl mx-auto">
            高效管理您的个人时间，通过AI智能整合重要信息。
            无需繁琐操作，一切尽在掌握。
          </p>
          <Link 
            to="/login" 
            className="inline-flex items-center px-8 py-3 bg-white text-black font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            开始使用 (按 L 键) <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-10 md:py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">核心功能</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <CheckSquare className="w-12 h-12 mb-6 text-black" />
              <h3 className="text-xl font-bold mb-4">事件追踪</h3>
              <p className="text-gray-600">
                轻松创建和管理各类事件。支持普通待办事项和需要智能推送的特别事件。
              </p>
            </div>
            <div className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <Calendar className="w-12 h-12 mb-6 text-black" />
              <h3 className="text-xl font-bold mb-4">日历视图</h3>
              <p className="text-gray-600">
                直观的月历视图，清晰展示每日安排。重要事项一目了然，不再错过任何截止日期。
              </p>
            </div>
            <div className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <BarChart2 className="w-12 h-12 mb-6 text-black" />
              <h3 className="text-xl font-bold mb-4">智能整合</h3>
              <p className="text-gray-600">
                利用AI技术自动爬取和整合关注的信息，生成摘要并按需推送，助您掌握最新动态。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Pre-generated Data Preview */}
      <div className="py-10 md:py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">演示数据</h2>
          <div className="max-w-4xl mx-auto grid gap-6">
            <div className="flex flex-col md:flex-row items-start md:items-center p-6 border rounded-lg hover:border-black transition-colors gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center mb-2">
                  <span className="px-2 py-1 text-xs font-semibold bg-gray-100 rounded mr-3">普通事件</span>
                  <h3 className="text-lg font-bold">团队周会</h3>
                </div>
                <p className="text-gray-600">每周一上午10点 • 重要程度：中</p>
              </div>
              <div className="w-full md:w-32">
                <div className="text-xs text-right mb-1 text-gray-500">进度 50%</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-black h-2 rounded-full" style={{ width: '50%' }}></div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center p-6 border rounded-lg hover:border-black transition-colors gap-4">
              <div className="flex-1 w-full">
                <div className="flex items-center mb-2">
                  <span className="px-2 py-1 text-xs font-semibold bg-black text-white rounded mr-3">智能推送</span>
                  <h3 className="text-lg font-bold">项目进度汇总</h3>
                </div>
                <p className="text-gray-600">每日推送项目相关数据 • 重要程度：高</p>
              </div>
              <div className="w-full md:w-32">
                <div className="text-xs text-right mb-1 text-gray-500">进度 30%</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-black h-2 rounded-full" style={{ width: '30%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
