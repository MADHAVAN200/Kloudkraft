import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  // ----- Static Data for Admin/Trainer -----
  const adminStats = [
    { label: 'Total Users', value: '128', icon: 'group', color: 'bg-blue-50 text-blue-600' },
    { label: 'Active Assessments', value: '12', icon: 'assignment', color: 'bg-purple-50 text-purple-600' },
    { label: 'Active Labs', value: '45', icon: 'cloud', color: 'bg-green-50 text-green-600' },
    { label: 'Pending Reviews', value: '8', icon: 'pending_actions', color: 'bg-orange-50 text-orange-600' },
  ];

  const adminNotifications = [
    { id: 1, title: 'New User Registration', time: '2 mins ago', type: 'info' },
    { id: 2, title: 'Server Usage High', time: '1 hour ago', type: 'warning' },
    { id: 3, title: 'Deployment Success', time: '3 hours ago', type: 'success' },
    { id: 4, title: 'New Dataset Uploaded', time: '5 hours ago', type: 'info' },
  ];

  // ----- Static Data for Candidate -----
  const candidateProgress = {
    completed: 12,
    total: 20,
    averageScore: '88%'
  };

  const candidateNotifications = [
    { id: 1, title: 'New Assessment Assigned: SQL Basics', time: '10 mins ago', type: 'info' },
    { id: 2, title: 'Grades released for Python Module', time: '1 day ago', type: 'success' },
    { id: 3, title: 'Maintenance scheduled for tonight', time: '2 days ago', type: 'warning' },
  ];

  const recentResult = {
    title: 'Advanced SQL Queries',
    date: 'Oct 24, 2025',
    score: '92/100',
    status: 'Passed'
  };

  // ----- Render Components -----

  const StatCard = ({ label, value, icon, color }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
      <div>
        <p className="text-gray-500 text-sm font-medium">{label}</p>
        <h3 className="text-3xl font-bold text-gray-900 mt-1">{value}</h3>
      </div>
      <div className={`p-4 rounded-xl ${color}`}>
        <span className="material-symbols-outlined text-2xl">{icon}</span>
      </div>
    </div>
  );

  const NotificationDetail = ({ title, time, type }) => {
    const iconMap = {
      info: 'info',
      warning: 'warning',
      success: 'check_circle',
      error: 'error'
    };
    const colorMap = {
      info: 'text-blue-500 bg-blue-50',
      warning: 'text-yellow-500 bg-yellow-50',
      success: 'text-green-500 bg-green-50',
      error: 'text-red-500 bg-red-50'
    };

    return (
      <div className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
        <div className={`p-2 rounded-full ${colorMap[type]}`}>
          <span className="material-symbols-outlined text-sm font-bold">{iconMap[type]}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-800 line-clamp-1">{title}</p>
          <p className="text-xs text-gray-400 mt-0.5">{time}</p>
        </div>
      </div>
    );
  };

  // ----- Admin View -----
  const AdminDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500">Welcome back, Administrator</p>
        </div>
        <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium">
          <span className="material-symbols-outlined text-base">calendar_today</span>
          Oct 26, 2025
        </button>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min">

        {/* Stats Row */}
        {adminStats.map((stat, idx) => (
          <StatCard key={idx} {...stat} />
        ))}

        {/* Large Chart Area (Updates Visualization) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 lg:col-span-3 min-h-[300px] flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-900">Platform Activity</h3>
            <select className="text-sm border-gray-200 rounded-lg text-gray-500 bg-gray-50">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="flex-1 flex items-end justify-between gap-2 px-2">
            {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95].map((h, i) => (
              <div key={i} className="w-full bg-red-200 hover:bg-red-300 rounded-t-lg relative group transition-all" style={{ height: `${h}%` }}>
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                  {h} users
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-xs text-gray-400">
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>

        {/* System Notifications */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 lg:col-span-1 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-lg text-gray-900">Notifications</h3>
            <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full font-medium">4 New</span>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto pr-2 max-h-[250px] lg:max-h-none scrollbar-hide">
            {adminNotifications.map((notif) => (
              <NotificationDetail key={notif.id} {...notif} />
            ))}
          </div>
          <button className="mt-4 w-full py-2 text-sm text-center text-red-600 font-medium hover:bg-red-50 rounded-lg transition-colors">
            View All
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6 rounded-2xl shadow-sm border border-slate-700 md:col-span-2 text-white flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div>
            <h3 className="font-bold text-lg">Quick Actions</h3>
            <p className="text-slate-300 text-sm mt-1">Common tasks for administrators</p>
          </div>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => navigate('/create-assessment')}
              className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">add_circle</span>
              Create Assessment
            </button>
            <button
              onClick={() => navigate('/dataset-upload')}
              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 backdrop-blur-sm"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              Upload Dataset
            </button>
          </div>
        </div>

        {/* System Health */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 md:col-span-2 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-green-50 text-green-600 rounded-full">
              <span className="material-symbols-outlined">dns</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900">System Status</h3>
              <p className="text-green-600 text-sm font-medium flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                All systems operational
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-400">Uptime</p>
            <p className="text-xl font-bold text-gray-800">99.9%</p>
          </div>
        </div>

      </div>
    </div>
  );

  // ----- Candidate View -----
  const CandidateDashboard = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 text-gray-500 mb-1">
            <span className="material-symbols-outlined text-sm">waving_hand</span>
            <span className="text-sm font-medium">Hello there,</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Your Dashboard</h1>
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-min">

        {/* Main Progress Card */}
        <div className="bg-red-600 text-white p-8 rounded-3xl md:col-span-2 flex flex-col justify-between relative overflow-hidden group">
          {/* Background Decorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full blur-2xl translate-y-1/3 -translate-x-1/3"></div>

          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-2">Keep up the great work!</h2>
            <p className="text-red-100 max-w-md">You've completed {candidateProgress.completed} out of {candidateProgress.total} assigned modules. You're on track to finish the course on time.</p>
          </div>

          <div className="mt-8 relative z-10">
            <div className="flex justify-between text-sm font-semibold mb-2">
              <span>Course Progress</span>
              <span>{Math.round((candidateProgress.completed / candidateProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-black/20 rounded-full h-3">
              <div className="bg-white rounded-full h-3 transition-all duration-1000" style={{ width: `${(candidateProgress.completed / candidateProgress.total) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-6 md:col-span-1">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
                <span className="material-symbols-outlined">emoji_events</span>
              </div>
              <h3 className="font-bold text-gray-900">Average Score</h3>
            </div>
            <p className="text-4xl font-bold text-gray-900">{candidateProgress.averageScore}</p>
            <p className="text-sm text-gray-400 mt-1">Top 15% of your cohort</p>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                <span className="material-symbols-outlined">schedule</span>
              </div>
              <h3 className="font-bold text-gray-900">Learning Time</h3>
            </div>
            <p className="text-4xl font-bold text-gray-900">24h 15m</p>
            <p className="text-sm text-gray-400 mt-1">This week</p>
          </div>
        </div>

        {/* Recent Assessment Result */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 md:col-span-1 flex flex-col">
          <h3 className="font-bold text-lg text-gray-900 mb-4">Recent Result</h3>
          <div className="flex-1 flex flex-col justify-center items-center text-center p-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-3xl">verified</span>
            </div>
            <h4 className="font-bold text-gray-900">{recentResult.title}</h4>
            <p className="text-xs text-gray-500 mb-3">{recentResult.date}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold text-gray-800">{recentResult.score}</span>
            </div>
            <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full mt-2">
              {recentResult.status}
            </span>
          </div>
          <button className="w-full mt-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors">
            View All Results
          </button>
        </div>

        {/* Notifications */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 md:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-gray-900">Notifications</h3>
            <button className="text-sm text-red-600 font-medium hover:underline">Mark all read</button>
          </div>
          <div className="space-y-3">
            {candidateNotifications.map((notif) => (
              <div key={notif.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${notif.type === 'info' ? 'bg-blue-100 text-blue-600' : notif.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                    <span className="material-symbols-outlined text-xl">
                      {notif.type === 'info' ? 'notifications' : notif.type === 'success' ? 'check_circle' : 'warning'}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{notif.title}</p>
                    <p className="text-xs text-gray-500">{notif.time}</p>
                  </div>
                </div>
                <button className="text-gray-400 hover:text-gray-600">
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Role Based Rendering */}
      {(userRole === 'admin' || userRole === 'trainer') ? <AdminDashboard /> : <CandidateDashboard />}
    </div>
  );
}

export default Dashboard;
