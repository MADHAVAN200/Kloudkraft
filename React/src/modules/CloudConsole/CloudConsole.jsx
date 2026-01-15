import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../contexts/AuthContext";
import { fetchAuthSession } from "aws-amplify/auth";

// Assets
// Using react.svg as placeholder for missing assets
import placeholderLogo from '../../assets/react.svg';
const awsLogo = placeholderLogo;
const azureLogo = placeholderLogo;
const gcpLogo = placeholderLogo;
const m365Logo = placeholderLogo;
const gitCopilotLogo = placeholderLogo;
const tensorLogo = placeholderLogo;

// ----------------------------- CONFIG -----------------------------
const BASE_URL =
  "https://yrfxdm5lt5.execute-api.ap-south-1.amazonaws.com/stage1";

const availablePlatforms = [
  { key: "aws", name: "AWS Credentials", logo: awsLogo },
  { key: "azure", name: "AZURE Credentials", logo: azureLogo },
  { key: "gcp", name: "GCP Credentials", logo: gcpLogo },
  { key: "ms365", name: "MS365 Credentials", logo: m365Logo },
  { key: "gitcopilot", name: "GITCOPILOT Credentials", logo: gitCopilotLogo, comingSoon: true },
  { key: "tensor", name: "TENSOR Credentials", logo: tensorLogo, comingSoon: true },
];

const signInUrls = {
  aws: (accountId) => accountId ? `https://${accountId}.signin.aws.amazon.com/console` : null,
  azure: "https://portal.azure.com",
  gcp: "https://console.cloud.google.com",
  ms365: "https://www.office.com",
};

// -----------------------------------------------------------------

const CloudConsole = () => {
  const { user } = useAuth();
  const [token, setToken] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [vmInfo, setVmInfo] = useState("");
  const [accountId, setAccountId] = useState(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Toast state
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 4000);
  };

  useEffect(() => {
    const getToken = async () => {
      try {
        const session = await fetchAuthSession();
        setToken(session.tokens?.idToken?.toString() || '');
      } catch (err) {
        console.error("Failed to fetch auth session", err);
      }
    };
    getToken();
  }, []);

  const fetchIamCredentials = async (platform) => {
    if (!user || !user.username) {
      showToast("User not authenticated", "error");
      return;
    }

    setApiLoading(true);
    setVmInfo("");
    setAccountId(null);

    try {
      let response;
      let data;
      const username = user.username;

      if (platform === "aws") {
        response = await fetch(`${BASE_URL}/GenIamCreds?username=${username}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ queryStringParameters: { username: username } }),
        });
      } else if (platform === "azure") {
        response = await fetch(`${BASE_URL}/AzureCreds?username=${username}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username: username }),
        });
      } else if (platform === "ms365") {
        response = await fetch(
          `https://gbxxsrodfvoebtqjze6fvwnvxe0mlomc.lambda-url.ap-south-1.on.aws/?username=${username}`,
          { method: "GET" }
        );
      } else if (platform === "gcp") {
        response = await fetch(
          `https://us-west1-br1ghter-sun.cloudfunctions.net/gcp-user-management?username=${username}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.REACT_APP_GCP_TOKEN || ""}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ queryStringParameters: { username: username } }),
          }
        );
      } else {
        throw new Error(`Unsupported or coming soon: ${platform.toUpperCase()}`);
      }

      if (!response.ok) throw new Error(`Access denied or error for ${platform.toUpperCase()}`);

      data = await response.json();

      let credentials = "";
      let signInUrl = null;

      switch (platform) {
        case "aws":
          credentials = [
            `Username: ${data.username || "N/A"}`,
            `Password: ${data.password || "N/A"}`,
            `Access Key: ${data.access_key_id || "N/A"}`,
            `Secret Key: ${data.secret_access_key || "N/A"}`,
          ].join("\n");
          signInUrl = data.account_number ? signInUrls.aws(data.account_number) : null;
          break;
        case "azure":
          credentials = [`Email: ${data.Email || "N/A"}`, `Password: ${data.Pass || "N/A"}`].join("\n");
          signInUrl = signInUrls.azure;
          break;
        case "ms365":
          credentials = [`Email: ${data.Email || "N/A"}`, `Password: ${data.Pass || "N/A"}`].join("\n");
          signInUrl = signInUrls.ms365;
          break;
        case "gcp":
          credentials = [
            `Email: ${data.email || "N/A"}`,
            `Password: ${data.pass || "N/A"}`,
            `Project ID: ${data.project_id || "N/A"}`,
          ].join("\n");
          signInUrl = signInUrls.gcp;
          break;
        default:
          credentials = "Unsupported platform";
      }

      setVmInfo(credentials);
      setAccountId(signInUrl);
      showToast(`Fetched ${platform.toUpperCase()} credentials successfully`, 'success');
    } catch (error) {
      setVmInfo(`Error: You don’t have access to ${platform.toUpperCase()} `);
      showToast(error.message, "error");
    } finally {
      setApiLoading(false);
    }
  };

  const handlePlatformSelect = (platform) => {
    if (platform.comingSoon) {
      showToast(`${platform.name} is coming soon`, "info");
      return;
    }
    setSelectedPlatform(platform);
    fetchIamCredentials(platform.key);
  };

  const handleBackToPlatforms = () => {
    setSelectedPlatform(null);
    setVmInfo("");
    setAccountId(null);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    showToast("Copied to clipboard!", 'success');
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 relative">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 -z-10"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 -z-10"></div>

      <div className="w-full max-w-7xl space-y-8">
        <div className="flex justify-between items-center mb-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cloud Console</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Access your cloud environment credentials.</p>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {!selectedPlatform ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {availablePlatforms.map((platform) => (
                <motion.div
                  key={platform.key}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => handlePlatformSelect(platform)}
                  className={`
                        relative bg-white dark:bg-[#1e293b]
                        border border-gray-100 dark:border-slate-700/50 rounded-2xl p-8 min-h-[220px]
                        flex flex-col justify-center items-center cursor-pointer overflow-hidden
                        shadow-sm hover:shadow-2xl hover:scale-[1.02] hover:border-red-200 dark:hover:border-red-500/50
                        transition-all duration-300 ease-in-out group
                        ${platform.comingSoon ? 'cursor-not-allowed' : ''}
                    `}
                >
                  {/* Background Glow Effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-transparent to-red-50/30 dark:to-red-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  <img
                    src={platform.logo}
                    alt={`${platform.name} Logo`}
                    className={`h-16 mb-6 object-contain transition-transform duration-300 group-hover:scale-110 drop-shadow-sm ${platform.comingSoon ? 'opacity-80' : ''}`}
                  />
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center group-hover:text-red-500 dark:group-hover:text-red-400 transition-colors">
                    {platform.name}
                  </h3>
                  {platform.comingSoon && (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-500 dark:text-gray-400 text-xs font-bold rounded-full uppercase tracking-wider shadow-sm">
                      Coming Soon
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl mx-auto space-y-6"
            >
              <div className="max-w-xl mx-auto">
                {/* Back Button */}
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="flex items-center gap-2 text-xs font-bold text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 mb-8 transition-colors uppercase tracking-wider mx-auto sm:mx-0"
                >
                  <span className="material-symbols-outlined text-sm">arrow_back</span>
                  Back to Platforms
                </button>

                <div className="bg-white dark:bg-[#1e293b] border border-gray-100 dark:border-slate-700 rounded-3xl p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-black/20 text-center sm:text-left">
                  <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8 border-b border-gray-50 dark:border-slate-800 pb-8">
                    <div className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                      <img
                        src={selectedPlatform.logo}
                        alt={selectedPlatform.name}
                        className="h-12 w-12 object-contain"
                      />
                    </div>
                    <div className="text-center sm:text-left">
                      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2">
                        {selectedPlatform.name}
                      </h2>
                      <p className="text-gray-500 dark:text-slate-400 text-sm">
                        Temporary access credentials for your session.
                      </p>
                    </div>
                  </div>

                  {apiLoading ? (
                    <div className="space-y-4">
                      <div className="animate-pulse h-12 bg-gray-50 dark:bg-slate-800 rounded-xl w-full"></div>
                      <div className="animate-pulse h-12 bg-gray-50 dark:bg-slate-800 rounded-xl w-full"></div>
                      <div className="animate-pulse h-12 bg-gray-50 dark:bg-slate-800 rounded-xl w-full"></div>
                      <div className="animate-pulse h-12 bg-gray-50 dark:bg-slate-800 rounded-xl w-full"></div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {vmInfo && vmInfo.startsWith("Error:") ? (
                        <div className="bg-red-50 dark:bg-red-900/10 rounded-xl p-6 border border-red-100 dark:border-red-900/20">
                          <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
                            <span className="material-symbols-outlined text-red-600 dark:text-red-400">error</span>
                            <h3 className="text-lg font-bold text-red-900 dark:text-red-300">Authentication Failed</h3>
                          </div>
                          <p className="text-sm text-red-600 dark:text-red-400">{vmInfo.replace("Error: ", "")}</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <div className={`grid gap-5 ${vmInfo.split("\n").filter(l => l.includes(": ")).length > 2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                            {vmInfo && vmInfo.split("\n").map((line, idx) => {
                              const parts = line.split(": ");
                              const label = parts[0];
                              const value = parts.slice(1).join(": ");
                              if (!value) return null;

                              return (
                                <div key={idx} className="relative group">
                                  <label className="block text-xs font-semibold text-gray-800 dark:text-gray-200 mb-2 uppercase tracking-wide text-left">
                                    {label}
                                  </label>
                                  <div className="relative">
                                    <div className="w-full pl-4 pr-12 py-3.5 rounded-xl bg-gray-50 dark:bg-slate-900/50 border-none ring-1 ring-gray-100 dark:ring-slate-700 flex items-center justify-between group-hover:ring-red-500/50 transition-all">
                                      <span className="font-mono text-sm font-medium text-gray-900 dark:text-white truncate select-all">{value}</span>
                                      <button
                                        onClick={() => handleCopy(value)}
                                        className="absolute right-3 p-1.5 text-gray-400 hover:text-red-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all"
                                        title="Copy"
                                      >
                                        <span className="material-symbols-outlined text-xl">content_copy</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {accountId && (
                            <a
                              href={accountId}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full py-4 bg-[#D92D20] hover:bg-[#b9251b] text-white font-bold text-sm tracking-wide rounded-lg transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/40 active:scale-[0.98] uppercase text-center mt-8 flex items-center justify-center gap-2"
                            >
                              Open {selectedPlatform.name} Console
                              <span className="material-symbols-outlined text-lg">open_in_new</span>
                            </a>
                          )}


                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-center mt-12 text-xs text-gray-300 dark:text-gray-600">
                  © 2024 LabsKraft Professional Assessment Platform. All rights reserved.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 min-w-[300px]"
          >
            <div className={`
              px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 border backdrop-blur-md
              ${toast.type === 'error' ? 'bg-red-50/90 dark:bg-red-900/90 text-red-800 dark:text-white border-red-200 dark:border-red-800' :
                toast.type === 'info' ? 'bg-blue-50/90 dark:bg-blue-900/90 text-blue-800 dark:text-white border-blue-200 dark:border-blue-800' :
                  'bg-gray-900/90 dark:bg-white/90 text-white dark:text-gray-900 border-transparent'}
            `}>
              <span className="material-symbols-outlined">
                {toast.type === 'error' ? 'error' : toast.type === 'info' ? 'info' : 'check_circle'}
              </span>
              <p className="font-medium text-sm">{toast.message}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CloudConsole;
