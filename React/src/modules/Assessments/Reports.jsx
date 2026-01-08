import React from 'react';
import { useSearchParams } from 'react-router-dom';
import AssessmentReports from './AssessmentReports';
import SQLReports from '../SQLPlayground/SQLReports';

function Reports() {
    const [searchParams] = useSearchParams();
    const referrer = searchParams.get('from');

    if (referrer === 'sql-playground') {
        return <SQLReports />;
    }

    // Default to main Assessments Reports if not specifically from SQL Playground
    return <AssessmentReports />;
}

export default Reports;
