import React, { useState, useEffect, useRef } from 'react';

const CustomDatePicker = ({ label, value, onChange, minDate }) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [currentDate, setCurrentDate] = useState(new Date()); // For navigation
    const [selectedDate, setSelectedDate] = useState(null);
    const wrapperRef = useRef(null);

    // Initialize state from existing value
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setSelectedDate(date);
                setCurrentDate(date);
            }
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowCalendar(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        return new Date(year, month, 1).getDay();
    };

    const handlePrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const handleDateClick = (day) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        // Adjust for timezone offset to ensure the string date is correct when just using YYYY-MM-DD
        // Actually, just storing the string YYYY-MM-DD is safer for input[type="date"] compatibility
        const year = newDate.getFullYear();
        const month = String(newDate.getMonth() + 1).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        const dateStr = `${year}-${month}-${dayStr}`;

        onChange(dateStr);
        setSelectedDate(newDate);
        setShowCalendar(false);
    };

    const formatDateDisplay = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const renderCalendarDays = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const firstDay = getFirstDayOfMonth(currentDate);
        const days = [];

        // Empty slots for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-8 md:h-10"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const thisDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isSelected = selectedDate &&
                thisDate.getDate() === selectedDate.getDate() &&
                thisDate.getMonth() === selectedDate.getMonth() &&
                thisDate.getFullYear() === selectedDate.getFullYear();

            const isToday = new Date().toDateString() === thisDate.toDateString();

            days.push(
                <button
                    key={day}
                    onClick={() => handleDateClick(day)}
                    className={`h-8 md:h-10 w-8 md:w-10 rounded-full flex items-center justify-center text-sm transition-all
                        ${isSelected
                            ? 'bg-red-600 text-white shadow-md shadow-red-200 font-bold'
                            : isToday
                                ? 'text-red-600 font-bold bg-red-50'
                                : 'text-gray-700 hover:bg-gray-100'
                        }
                    `}
                >
                    {day}
                </button>
            );
        }

        return days;
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {label && <label className="block text-sm font-semibold text-gray-700 mb-2">{label}</label>}

            <div
                onClick={() => setShowCalendar(!showCalendar)}
                className={`w-full px-4 py-2.5 border rounded-lg cursor-pointer flex items-center justify-between transition-all bg-white
                    ${showCalendar ? 'border-red-500 ring-2 ring-red-100' : 'border-gray-300 hover:border-gray-400'}
                `}
            >
                <span className={value ? 'text-gray-900' : 'text-gray-400'}>
                    {value ? formatDateDisplay(value) : (label === "Start Date" ? "Select Start Date" : "Select Date")}
                </span>
                <span className="material-symbols-outlined text-gray-400">calendar_today</span>
            </div>

            {showCalendar && (
                <div className="absolute z-50 mt-2 p-4 bg-white rounded-2xl shadow-xl border border-gray-100 w-full md:w-80 animate-in fade-in zoom-in-95 duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                        </button>
                        <span className="font-bold text-gray-800">
                            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-full text-gray-600">
                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                        </button>
                    </div>

                    {/* Weekdays */}
                    <div className="grid grid-cols-7 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-400">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="grid grid-cols-7 gap-1 place-items-center">
                        {renderCalendarDays()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomDatePicker;
