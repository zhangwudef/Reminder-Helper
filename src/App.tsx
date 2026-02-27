import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import EventCreate from "@/pages/EventCreate";
import Calendar from "@/pages/Calendar";
import Stats from "@/pages/Stats";
import Layout from "@/components/Layout";
import WeChatCallback from "@/pages/WeChatCallback";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/wechat-callback" element={<WeChatCallback />} />
        
        {/* Authenticated Routes with Layout */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/events/new" element={<EventCreate />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/stats" element={<Stats />} />
        </Route>
      </Routes>
    </Router>
  );
}
