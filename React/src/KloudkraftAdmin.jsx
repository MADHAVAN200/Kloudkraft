import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './amplify-config';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './Login.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './Dashboard.jsx';
import SQLPlayground from './modules/sql-assessment/SQLPlayground.jsx';
import CreateAssessment from './modules/assessment/CreateAssessment.jsx';
import DatasetUpload from './modules/sql-assessment/DatasetUpload.jsx';
import VirtualMachine from './VirtualMachine.jsx';
import CloudConsole from './CloudConsole.jsx';
import CloudLabs from './CloudLabs.jsx';
import Assessments from './modules/assessment/Assessments.jsx';
import AssessmentsList from './modules/assessment/AssessmentsList.jsx';
import TakeAssessment from './modules/assessment/TakeAssessment.jsx';
import AssessmentResults from './modules/assessment/AssessmentResults.jsx';
import Reports from './Reports.jsx';
import AvailableDatasets from './modules/sql-assessment/AvailableDatasets.jsx';
import UsersAndCohorts from './modules/sql-assessment/UsersAndCohorts.jsx';

function KloudkraftAdminContent() {
  return (
    <div className="font-display bg-background-light text-gray-800 antialiased min-h-screen flex flex-col overflow-hidden">
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .material-symbols-outlined {
              font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
            }
            .scrollbar-hide::-webkit-scrollbar {
              display: none;
            }
            .scrollbar-hide {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `,
        }}
      />

      <Routes>
        {/* Public Route */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex flex-col min-h-screen">
                <Header />
                <div className="flex flex-1 overflow-hidden">
                  <Sidebar />
                  <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-8 scrollbar-hide">
                    <Routes>
                      {/* Routes accessible to all authenticated users */}
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/virtual-machine" element={<VirtualMachine />} />
                      <Route path="/cloud-console" element={<CloudConsole />} />
                      <Route path="/cloud-labs" element={<CloudLabs />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/assessments" element={<Assessments />} />
                      <Route path="/assessments-list" element={<AssessmentsList />} />

                      <Route path="/sql-playground" element={<SQLPlayground />} />
                      <Route
                        path="/create-assessment"
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                            <CreateAssessment />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/dataset-upload"
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                            <DatasetUpload />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/available-datasets"
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                            <AvailableDatasets />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/users-cohorts"
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                            <UsersAndCohorts />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="/assessment/take/:assessmentId" element={<TakeAssessment />} />
                      <Route path="/assessment/results/:sessionId" element={<AssessmentResults />} />

                      {/* Default redirect */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="*" element={<Navigate to="/dashboard" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function KloudkraftAdmin() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <KloudkraftAdminContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default KloudkraftAdmin;
