import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './amplify-config';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Login from './Login.jsx';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './modules/Dashboard/Dashboard.jsx';
import SQLPlayground from './modules/SQLPlayground/SQLPlayground.jsx';
import CreateAssessment from './modules/Assessments/CreateAssessment.jsx';
import DatasetUpload from './modules/SQLPlayground/DatasetUpload.jsx';
import VirtualMachine from './modules/VirtualMachine/VirtualMachine.jsx';
import CloudConsole from './modules/CloudConsole/CloudConsole.jsx';
import CloudLabs from './modules/CloudLabs/CloudLabs.jsx';
import Assessments from './modules/Assessments/Assessments.jsx';
import AssessmentsList from './modules/Assessments/AssessmentsList.jsx';
import TakeAssessment from './modules/Assessments/TakeAssessment.jsx';
import AssessmentResults from './modules/Assessments/AssessmentResults.jsx';
import Reports from './Reports.jsx';
import AvailableDatasets from './modules/SQLPlayground/AvailableDatasets.jsx';
import UsersAndCohorts from './modules/SQLPlayground/UsersAndCohorts.jsx';
import CreateSQLAssessment from './modules/SQLPlayground/CreateSQLAssessment.jsx';
import Content from './modules/ContentUploading/Content.jsx';

function KloudkraftAdminContent() {
  return (
    <div className="font-display bg-background-light dark:bg-brand-dark text-gray-800 dark:text-gray-100 antialiased min-h-screen flex flex-col overflow-hidden transition-colors duration-300">
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
                  <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-brand-dark p-4 sm:p-8 scrollbar-hide transition-colors duration-300">
                    <Routes>
                      {/* Routes accessible to all authenticated users */}
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/content-uploading" element={<Content />} />
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
                      <Route
                        path="/sql-playground/create-assessment"
                        element={
                          <ProtectedRoute allowedRoles={['admin', 'trainer']}>
                            <CreateSQLAssessment />
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
        <ThemeProvider>
          <KloudkraftAdminContent />
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default KloudkraftAdmin;
