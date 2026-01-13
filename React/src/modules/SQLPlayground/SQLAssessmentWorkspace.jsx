import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const SQLAssessmentWorkspace = () => {
    const { assessmentId } = useParams();
    const navigate = useNavigate();
    const [query, setQuery] = useState('SELECT * FROM customer;');
    const [results, setResults] = useState(null);
    const [isSchemaOpen, setIsSchemaOpen] = useState({ customer: true });

    // Dummy Data to match screenshot
    const schema = [
        {
            table: "branch",
            columns: []
        },
        {
            table: "customer",
            columns: [
                { name: "id", type: "INTEGER", pk: true },
                { name: "name", type: "VARCHAR" },
                { name: "phone_no", type: "VARCHAR" }
            ]
        },
        {
            table: "employee",
            columns: []
        },
        {
            table: "menu",
            columns: []
        },
        {
            table: "order_items",
            columns: []
        }
    ];

    const dummyResults = [
        { NAME: "Ankit Mehta", PHONE_NO: "+91-9876543101" },
        { NAME: "Neha Verma", PHONE_NO: "+91-9876543102" },
        { NAME: "Rahul Sharma", PHONE_NO: "+91-9876543103" },
        { NAME: "Pooja Joshi", PHONE_NO: "+91-9876543104" }
    ];

    const handleRunQuery = () => {
        // Simulate running query
        setResults(dummyResults);
    };

    const toggleTable = (tableName) => {
        setIsSchemaOpen(prev => ({
            ...prev,
            [tableName]: !prev[tableName]
        }));
    };

    return (
        <div className="fixed inset-0 bg-gray-50 dark:bg-gray-900 z-50 flex flex-col font-sans">
            {/* Header */}
            <div className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-3">
                    <h1 className="font-bold text-lg text-red-600">Kloudkraft</h1>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden p-6 gap-6">

                {/* LEFT COLUMN: Navigation & Question */}
                <div className="w-1/4 flex flex-col gap-6">
                    {/* Nav Buttons */}
                    <div className="flex gap-4">
                        <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium transition-colors">
                            <span className="material-symbols-outlined text-sm">arrow_back</span>
                            Previous
                        </button>
                        <button className="flex-1 flex items-center justify-center gap-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium transition-colors">
                            Next
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>

                    {/* Difficulty Dropdown */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-3 flex items-center justify-between shadow-sm cursor-pointer">
                        <span className="font-semibold text-gray-700 dark:text-gray-300 ml-1">All Difficulties</span>
                        <span className="material-symbols-outlined text-gray-400">tune</span>
                    </div>

                    {/* Question Card */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 leading-snug">
                            Retrieve the names and phone numbers of all customers.
                        </h3>
                    </div>

                    {/* Tables Used */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
                        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-3">Tables Used</h4>
                        <span className="inline-block px-3 py-1 bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 text-sm font-medium rounded-full border border-red-100 dark:border-red-900/30">
                            customer
                        </span>
                    </div>

                    <button
                        onClick={() => navigate('/sql-playground/assessments')}
                        className="mt-auto w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-bold transition-colors">
                        Exit Assessment
                    </button>
                </div>

                {/* MIDDLE COLUMN: Editor & Results */}
                <div className="flex-1 flex flex-col gap-6 min-w-0">
                    {/* Code Editor Area */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 flex flex-col h-[50%]">
                        <div className="flex-1 bg-[#0F1014] rounded-xl p-4 font-mono text-gray-300 text-sm leading-relaxed overflow-auto">
                            <textarea
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                className="w-full h-full bg-transparent border-0 outline-none resize-none text-gray-300 placeholder-gray-600"
                                spellCheck="false"
                            />
                        </div>
                        <div className="flex justify-end pt-2 px-2 pb-1">
                            <button
                                onClick={handleRunQuery}
                                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition-transform active:scale-95 shadow-lg shadow-red-600/20">
                                <span className="material-symbols-outlined text-xl">play_arrow</span>
                                Run Query
                            </button>
                        </div>
                    </div>

                    {/* Results Area */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-gray-800 dark:text-white">Query Result</h3>
                            {results && <span className="text-xs font-semibold text-gray-500">{results.length} rows returned</span>}
                        </div>
                        <div className="overflow-auto flex-1 p-4">
                            {results ? (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr>
                                            {Object.keys(results[0]).map(key => (
                                                <th key={key} className="p-3 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider first:rounded-tl-lg last:rounded-tr-lg">
                                                    {key}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {results.map((row, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                                                {Object.values(row).map((val, vIdx) => (
                                                    <td key={vIdx} className="p-3 text-sm text-gray-600 dark:text-gray-300 font-mono border-b border-gray-50 dark:border-gray-800">
                                                        {val}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <span className="material-symbols-outlined text-4xl mb-2">table_view</span>
                                    <p className="text-sm">Run a query to see results</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: Database Schema */}
                <div className="w-64 bg-white dark:bg-white/5 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-white/5 flex flex-col overflow-hidden shrink-0">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-gray-800 dark:text-white">Database Schema</h3>
                        <button className="text-red-500 text-xs font-semibold hover:underline">Collapse All</button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-1">
                        {schema.map((table) => {
                            const isOpen = isSchemaOpen[table.table];
                            return (
                                <div key={table.table} className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                                    <div
                                        onClick={() => toggleTable(table.table)}
                                        className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${isOpen ? 'bg-red-50 dark:bg-red-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {isOpen && <div className="w-1 h-3 bg-red-500 rounded-full"></div>}
                                            <span className={`text-sm font-mono ${isOpen ? 'text-red-600 font-bold' : 'text-gray-600 dark:text-gray-400'}`}>
                                                {table.table}
                                            </span>
                                        </div>
                                        <span className={`material-symbols-outlined text-gray-400 text-lg transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                                            expand_more
                                        </span>
                                    </div>

                                    {isOpen && (
                                        <div className="px-3 py-2 space-y-2 bg-white dark:bg-brand-card">
                                            {table.columns.length > 0 ? (
                                                table.columns.map(col => (
                                                    <div key={col.name} className="flex items-start justify-between text-xs group">
                                                        <div className="flex gap-2">
                                                            <span className="text-gray-700 dark:text-gray-300 font-medium">{col.name}</span>
                                                            <span className="text-gray-400 uppercase text-[10px] mt-0.5">{col.type}</span>
                                                        </div>
                                                        {col.pk && <span className="material-symbols-outlined text-yellow-500 text-[14px]" title="Primary Key">key</span>}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-xs text-gray-400 italic pl-1">No columns visible</div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default SQLAssessmentWorkspace;
