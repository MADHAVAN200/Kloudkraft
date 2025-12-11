import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

function Reports() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [searchQuery, setSearchQuery] = useState('');

    // Get the referrer from URL params
    const referrer = searchParams.get('from');

    const students = [
        {
            id: 1,
            name: 'John Doe',
            email: 'john.doe@example.com',
            lastAssessment: '2023-10-26',
            overallScore: '88%',
        },
        {
            id: 2,
            name: 'Jane Smith',
            email: 'jane.smith@example.com',
            lastAssessment: '2023-10-25',
            overallScore: '92%',
        },
        {
            id: 3,
            name: 'Mike Johnson',
            email: 'mike.johnson@example.com',
            lastAssessment: '2023-10-27',
            overallScore: '76%',
        },
        {
            id: 4,
            name: 'Emily Davis',
            email: 'emily.davis@example.com',
            lastAssessment: '2023-10-26',
            overallScore: '95%',
        },
        {
            id: 5,
            name: 'Chris Wilson',
            email: 'chris.wilson@example.com',
            lastAssessment: '2023-10-24',
            overallScore: '81%',
        },
    ];

    const filteredStudents = students.filter((student) =>
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="max-w-7xl mt-2 ml-2">
            {/* Back Button */}
            {referrer && (
                <button
                    onClick={() => navigate(referrer === 'sql-playground' ? '/sql-playground' : '/assessments')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                    <span className="font-medium">Back</span>
                </button>
            )}

            {/* Header */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Student Reports</h1>
                        <p className="text-gray-600 text-sm mt-1">View and manage student information and reports.</p>
                    </div>
                    <button className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors">
                        <span className="material-symbols-outlined text-base">download</span>
                        <span>Download Reports</span>
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Student Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Last Assessment
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Overall Score
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredStudents.length > 0 ? (
                            filteredStudents.map((student) => (
                                <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                        {student.name}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {student.email}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {student.lastAssessment}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                                        {student.overallScore}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                    No students found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Reports;
