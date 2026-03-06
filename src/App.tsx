import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import ProtectedRoute from "@/components/ProtectedRoute";

// 懒加载页面组件
const Home = lazy(() => import("@/pages/Home"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const EventCreate = lazy(() => import("@/pages/EventCreate"));
const EventEdit = lazy(() => import("@/pages/EventEdit"));
const Calendar = lazy(() => import("@/pages/Calendar"));
const Stats = lazy(() => import("@/pages/Stats"));
const Monitor = lazy(() => import("@/pages/Monitor"));
const NotFound = lazy(() => import("@/pages/NotFound"));
const WeChatCallback = lazy(() => import("@/pages/WeChatCallback"));

// 加载中组件
const Loading = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="w-16 h-16 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
  </div>
);

export default function App() {
  return (
    <Router>
      <Suspense fallback={<Loading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/wechat-callback" element={<WeChatCallback />} />
          
          {/* Authenticated Routes with Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/events/new" element={<EventCreate />} />
              <Route path="/events/edit/:id" element={<EventEdit />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/stats" element={<Stats />} />
              <Route path="/monitor" element={<Monitor />} />
            </Route>
          </Route>
          
          {/* 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}
