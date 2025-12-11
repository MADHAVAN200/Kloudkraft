import React from 'react';
import { useNavigate } from 'react-router-dom';


function User() {
  const users = [
    {
      id: 1,
      name: 'Alex Johnson',
      role: 'Admin',
      email: 'alex.j@example.com',
      lastLogin: '2 hours ago',
      avatarColor: 'bg-blue-500',
      initials: 'AJ',
    },
    {
      id: 2,
      name: 'Marketing Team',
      role: 'Group',
      email: '12 members',
      lastLogin: 'July 15, 2023',
      avatarColor: 'bg-green-500',
      initials: 'MT',
    },
    {
      id: 3,
      name: 'Maria Garcia',
      role: 'Instructor',
      email: 'maria.g@example.com',
      lastLogin: 'Yesterday',
      avatarColor: 'bg-pink-500',
      initials: 'MG',
    },
    {
      id: 4,
      name: 'Chen Wei',
      role: 'Learner',
      email: 'chen.w@example.com',
      lastLogin: '5 days ago',
      avatarColor: 'bg-purple-500',
      initials: 'CW',
    },
    {
      id: 5,
      name: 'Engineering Team',
      role: 'Group',
      email: '34 members',
      lastLogin: 'June 28, 2023',
      avatarColor: 'bg-indigo-500',
      initials: 'ET',
    },
  ];
  const navigate = useNavigate();

  const renderRoleBadge = (role) => {
    if (role === 'Admin') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
          Admin
        </span>
      );
    }
    if (role === 'Group') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
          Group
        </span>
      );
    }
    if (role === 'Instructor') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-600">
          Instructor
        </span>
      );
    }
    if (role === 'Learner') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-50 text-yellow-700">
          Learner
        </span>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users and Groups</h1>
          <p className="text-gray-600 mt-1">
            Manage user accounts, roles, and group permissions.
          </p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">delete</span>
            Delete
          </button>
                    <button
            onClick={() => navigate('/add-user')}
            className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            Add User/Group
          </button>

        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Search + actions */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center w-full max-w-md bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
            <span className="material-symbols-outlined text-gray-400 text-lg mr-2">
              search
            </span>
            <input
              type="text"
              placeholder="Search users or groups..."
              className="bg-transparent w-full focus:outline-none text-sm text-gray-700"
            />
          </div>
          <button className="ml-4 flex items-center text-gray-500 hover:text-gray-700 text-sm">
            <span className="material-symbols-outlined text-lg mr-1">tune</span>
            Filters
          </button>
        </div>

        {/* Table */}
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <th className="px-4 py-3 w-10">
                <input type="checkbox" className="rounded border-gray-300" />
              </th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Email / Members</th>
              <th className="px-4 py-3">Last Login</th>
              <th className="px-4 py-3 w-10"></th>
            </tr>
          </thead>
                    <tbody className="divide-y divide-gray-100">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-4 py-4">
                  <input type="checkbox" className="rounded border-gray-300" />
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`h-8 w-8 rounded-full ${user.avatarColor} text-white flex items-center justify-center text-xs font-semibold`}
                    >
                      {user.initials}
                    </div>
                    <span className="font-medium text-gray-900">
                      {user.name}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  {renderRoleBadge(user.role)}
                </td>
                <td className="px-4 py-4 text-gray-700">
                  {user.email}
                </td>
                <td className="px-4 py-4 text-gray-500">
                  {user.lastLogin}
                </td>
                <td className="px-4 py-4 text-right">
                  <button className="text-gray-400 hover:text-gray-600">
                    <span className="material-symbols-outlined text-lg">
                      more_vert
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <div>
            Showing <span className="font-medium">1-5</span> of{' '}
            <span className="font-medium">100</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
              Previous
            </button>
            <button className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              1
            </button>
            <button className="px-3 py-1 rounded border border-red-500 bg-red-50 text-red-600">
              2
            </button>
            <button className="px-3 py-1 rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
              3
            </button>
            <button className="px-3 py-1 rounded border border-gray-300 text-gray-700 hover:bg-gray-50">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default User;
