import React from 'react';

function AddUser() {
  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Add New User / Group</h1>
        <p className="text-gray-600 mt-1">
          Enter the details below. Required fields are marked with *.
        </p>
      </div>

      {/* Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Information</h2>

          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name *
              </label>
              <input
                type="text"
                placeholder="e.g., John Doe or Marketing Team"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                <option>User</option>
                <option>Group</option>
              </select>
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address (if User)
              </label>
              <input
                type="email"
                placeholder="user@example.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role (if User)
              </label>
              <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500">
                <option>Learner</option>
                <option>Admin</option>
                <option>Instructor</option>
              </select>
            </div>
          </div>
        </div>

        {/* Schedule Exam */}
        <div className="p-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule Exam</h2>
          <div className="border border-gray-200 rounded-lg px-4 py-3 flex items-start gap-3">
            <input type="checkbox" className="mt-1 rounded border-gray-300" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Assign an exam upon creation
              </p>
              <p className="text-sm text-gray-600">
                Select an exam and set a deadline for the new user/group.
              </p>
            </div>
          </div>
        </div>

        {/* Footer buttons */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-white">
            Cancel
          </button>
          <button className="px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">save</span>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddUser;
