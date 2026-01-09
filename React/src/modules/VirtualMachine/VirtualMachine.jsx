import React, { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    FaWindows,
    FaLinux,
    FaApple,
    FaDesktop,
    FaPowerOff,
    FaRedo,
    FaStop,
    FaServer,
    FaChevronRight,
    FaCircle,
    FaLock,
    FaTerminal,
    FaMemory,
    FaMicrochip,
    FaNetworkWired
} from "react-icons/fa";

// Constants
const START_INSTANCE_URL = "https://jl5dgb2cwz2s2zyekjmowtol3q0pstjt.lambda-url.ap-south-1.on.aws/";
const STOP_INSTANCE_URL = "https://37tfoq3l4dv63r3iyq723ioyiu0egivh.lambda-url.ap-south-1.on.aws/";
const REBOOT_INSTANCE_URL = "https://ifq7v3s42ks4ruvjdleysk5t6e0ajhau.lambda-url.ap-south-1.on.aws/";
const GET_INSTANCE_INFO_URL = "https://5lv4q4gc5j7xrfkttbw7i2queq0bjusy.lambda-url.ap-south-1.on.aws/";
// Reverted to direct URL as requested (CORS bypass disabled)
const GUACAMOLE_TOKEN_URL = "https://kastle.labskraft.com/LabsKraft/api/tokens";
const GUACAMOLE_CLIENT_BASE = "https://kastle.labskraft.com/LabsKraft/#/client";

// --- UI Components ---

const StatusBadge = ({ state }) => {
    const getStyles = (s) => {
        switch (s?.toLowerCase()) {
            case "running": return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20", glow: "shadow-[0_0_10px_rgba(16,185,129,0.2)]" };
            case "stopped": return { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20", glow: "shadow-[0_0_10px_rgba(244,63,94,0.2)]" };
            case "pending": return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20", glow: "shadow-[0_0_10px_rgba(245,158,11,0.2)]" };
            case "stopping": return { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20", glow: "shadow-[0_0_10px_rgba(249,115,22,0.2)]" };
            default: return { bg: "bg-gray-500/10", text: "text-gray-400", border: "border-gray-500/20", glow: "" };
        }
    };

    const styles = getStyles(state);

    return (
        <div className={`px-3 py-1 rounded-full text-xs font-semibold border backdrop-blur-md flex items-center gap-2 w-fit transition-all duration-300 ${styles.bg} ${styles.text} ${styles.border} ${styles.glow}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${styles.text.replace('text-', 'bg-')} animate-pulse`} />
            <span className="capitalize tracking-wider">{state || "Unknown"}</span>
        </div>
    );
};

const OsIcon = ({ osType, className }) => {
    switch (osType?.toLowerCase()) {
        case "windows": return <FaWindows className={`text-blue-400 filter drop-shadow-[0_0_8px_rgba(96,165,250,0.5)] ${className}`} />;
        case "linux": case "linux/unix": case "ubuntu": return <FaLinux className={`text-amber-400 filter drop-shadow-[0_0_8px_rgba(251,191,36,0.5)] ${className}`} />;
        case "apple": case "macos": return <FaApple className={`text-gray-200 ${className}`} />;
        default: return <FaDesktop className={`text-gray-400 ${className}`} />;
    }
};

const VmManagement = () => {
    const { user } = useAuth();
    const username = user?.username || user?.signInDetails?.loginId || user?.name || "";

    // Internal State
    const [instances, setInstances] = useState([]);
    const [selectedInstance, setSelectedInstance] = useState(null);
    const [instanceInfo, setInstanceInfo] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [authToken, setAuthToken] = useState(null);

    // Ref for Safe Polling
    const selectedIdRef = useRef(null);
    useEffect(() => { selectedIdRef.current = selectedInstance?.instanceId; }, [selectedInstance]);

    // Password Prompt State
    const [passwordPromptOpen, setPasswordPromptOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [manualPassword, setManualPassword] = useState("");

    const showMessage = useCallback((msg, isError = false) => {
        if (isError) {
            setError(msg);
            setTimeout(() => setError(null), 6000);
        } else {
            setSuccessMessage(msg);
            setTimeout(() => setSuccessMessage(null), 4000);
        }
    }, []);

    // --- Logic & API Calls ---

    const fetchInstances = useCallback(async () => {
        if (!username) return;
        setLoading(true);
        try {
            console.log(`Fetching instances for user: ${username}`);
            const response = await fetch(`${GET_INSTANCE_INFO_URL}?username=${username}`);
            if (!response.ok) throw new Error(`Failed to fetch instances: ${response.status}`);

            const data = await response.json();

            // Robust Parsing
            let instancesList = [];
            if (data.instances && Array.isArray(data.instances)) instancesList = data.instances;
            else if (Array.isArray(data)) instancesList = data;
            else if (typeof data === 'string') {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.instances && Array.isArray(parsed.instances)) instancesList = parsed.instances;
                    else if (Array.isArray(parsed)) instancesList = parsed;
                } catch (e) { console.error("Parse error", e); }
            } else if (data.body) {
                try {
                    const parsed = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
                    if (parsed.instances && Array.isArray(parsed.instances)) instancesList = parsed.instances;
                    else if (Array.isArray(parsed)) instancesList = parsed;
                } catch (e) { console.error("Body parse error", e); }
            }

            // Deduplicate
            const newInstancesMap = new Map();
            instancesList.forEach(item => {
                if (item && item.instanceId) newInstancesMap.set(item.instanceId, item);
            });

            // Merge & Persist ConnectionId
            setInstances(prev => {
                const merged = [];
                const prevMap = new Map(prev.map(p => [p.instanceId, p]));
                newInstancesMap.forEach((newInstance, id) => {
                    const prevInstance = prevMap.get(id);
                    const mergedInstance = {
                        ...newInstance,
                        connectionId: newInstance.encoded_con_id || newInstance.connectionId || prevInstance?.connectionId || prevInstance?.encoded_con_id
                    };
                    merged.push(mergedInstance);
                });
                return merged;
            });
        } catch (err) {
            setInstances([]);
            showMessage(err.message, true);
        } finally {
            setLoading(false);
        }
    }, [username, showMessage]);

    const fetchInstanceInfo = useCallback(async (instanceId) => {
        if (!username || !instanceId) return;
        setLoading(true);
        try {
            const response = await fetch(`${GET_INSTANCE_INFO_URL}?username=${username}&instanceId=${instanceId}`);
            if (!response.ok) throw new Error("Failed to fetch instance info");
            const data = await response.json();

            const connId = data.encoded_con_id || data.connectionId || null;

            setInstanceInfo(`State: ${data.state || "N/A"}\nOS: ${data.osType || "N/A"}\nIP: ${data.publicIp || "N/A"}`);

            const updater = (inst) => {
                if (inst.instanceId !== instanceId) return inst;
                return { ...inst, state: data.state, publicIp: data.publicIp, connectionId: connId || inst.connectionId };
            };

            setInstances(prev => prev.map(updater));
            if (selectedInstance?.instanceId === instanceId) {
                setSelectedInstance(prev => {
                    if (!prev || prev.instanceId !== instanceId) return prev;
                    return { ...prev, state: data.state, publicIp: data.publicIp, connectionId: connId || prev.connectionId };
                });
            }
        } catch (err) {
            setInstanceInfo(`Error: ${err.message}`);
            showMessage(err.message, true);
        } finally {
            setLoading(false);
        }
    }, [username, selectedInstance, showMessage]);

    // Actions
    const executeWithPassword = (callback) => {
        const stored = sessionStorage.getItem("userPassword");
        if (stored) callback(stored);
        else {
            setPendingAction(() => callback);
            setPasswordPromptOpen(true);
        }
    };

    const handlePasswordSubmit = () => {
        if (!manualPassword) return;
        sessionStorage.setItem("userPassword", manualPassword);
        setPasswordPromptOpen(false);
        if (pendingAction) {
            pendingAction(manualPassword);
            setPendingAction(null);
        }
        setManualPassword("");
    };

    const startInstance = async (instanceId, password) => {
        if (!username || !instanceId) return;
        setLoading(true);
        try {
            const url = `${START_INSTANCE_URL}?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&instance_id=${encodeURIComponent(instanceId)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to start instance");
            const data = await response.json();
            const conId = data.encoded_con_id;

            const updateCallback = (prev) => {
                if (!prev || prev.instanceId !== instanceId) return prev;
                return { ...prev, state: data.state || "pending", publicIp: data.publicIp, connectionId: conId };
            }

            setInstances(prev => prev.map(inst => inst.instanceId === instanceId ? { ...inst, state: data.state || "pending", publicIp: data.publicIp, connectionId: conId } : inst));
            if (selectedInstance?.instanceId === instanceId) setSelectedInstance(updateCallback);

            setInstanceInfo(`State: ${data.state || "pending"}\nOS: ${selectedInstance?.osType || "N/A"}\nIP: ${data.publicIp || "N/A"}`);
            showMessage("Instance start initiated...");

            startPolling(instanceId);
        } catch (err) { showMessage(err.message, true); }
        finally { setLoading(false); }
    };

    const stopInstance = async (instanceId, password) => {
        if (!username || !instanceId) return;
        setLoading(true);
        try {
            const url = `${STOP_INSTANCE_URL}?username=${encodeURIComponent(username)}&instanceId=${encodeURIComponent(instanceId)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to stop instance");
            const data = await response.json();

            const updateCallback = (prev) => {
                if (!prev || prev.instanceId !== instanceId) return prev;
                return { ...prev, state: data.state || "stopping", publicIp: data.publicIp || prev.publicIp };
            }

            setInstances(prev => prev.map(inst => inst.instanceId === instanceId ? { ...inst, state: data.state || "stopping", publicIp: data.publicIp || inst.publicIp } : inst));
            if (selectedInstance?.instanceId === instanceId) setSelectedInstance(updateCallback);

            setInstanceInfo(`State: ${data.state || "stopping"}`);
            startPolling(instanceId);
        } catch (err) { showMessage(err.message, true); }
        finally { setLoading(false); }
    };

    const rebootInstance = async (instanceId, password) => {
        if (!username || !instanceId) return;
        setLoading(true);
        try {
            const url = `${REBOOT_INSTANCE_URL}?username=${encodeURIComponent(username)}&instanceId=${encodeURIComponent(instanceId)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error("Failed to reboot instance");

            setInstanceInfo("State: Rebooting...");
            showMessage("Instance reboot initiated...");
            startPolling(instanceId);
        } catch (err) { showMessage(err.message, true); }
        finally { setLoading(false); }
    };

    const startPolling = (instanceId) => {
        let attempts = 0;
        const maxAttempts = 40;
        const pollInterval = 3000;

        const poll = async () => {
            if (attempts >= maxAttempts) return;
            attempts++;
            try {
                const response = await fetch(`${GET_INSTANCE_INFO_URL}?username=${username}&instanceId=${instanceId}`);
                if (!response.ok) return;
                const statusData = await response.json();
                const connId = statusData.encoded_con_id || statusData.connectionId || null;

                setInstances(prev => prev.map(inst => {
                    if (inst.instanceId !== instanceId) return inst;
                    return { ...inst, state: statusData.state, publicIp: statusData.publicIp, connectionId: connId || inst.connectionId };
                }));

                if (selectedIdRef.current === instanceId) {
                    setSelectedInstance(prev => {
                        if (!prev || prev.instanceId !== instanceId) return prev;
                        return { ...prev, state: statusData.state, publicIp: statusData.publicIp, connectionId: connId || prev.connectionId };
                    });
                    setInstanceInfo(`State: ${statusData.state}\nOS: ${statusData.osType || "N/A"}\nIP: ${statusData.publicIp}`);
                }

                if (statusData.state !== "pending" && statusData.state !== "stopping") {
                    showMessage(`Instance is ${statusData.state}`);
                } else {
                    setTimeout(poll, pollInterval);
                }
            } catch (e) { console.error("Poll error", e); }
        };
        setTimeout(poll, pollInterval);
    };

    const connectRDP = async (password) => {
        if (!selectedInstance || selectedInstance.state !== "running" || !selectedInstance.connectionId) {
            showMessage("Instance not ready for connection", true);
            return;
        }
        try {
            let token = authToken;
            if (!token) {
                const resp = await fetch(GUACAMOLE_TOKEN_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: new URLSearchParams({ username, password }).toString(),
                });
                if (!resp.ok) throw new Error("Auth failed");
                const data = await resp.json();
                token = data.authToken;
                setAuthToken(token);
            }
            const clientUrl = `${GUACAMOLE_CLIENT_BASE}/${selectedInstance.connectionId}?token=${encodeURIComponent(token)}`;
            window.open(clientUrl, "_blank");
            showMessage("RDP Session Launched");
        } catch (err) { showMessage(`Connection Error: ${err.message}`, true); }
    };

    useEffect(() => { if (username) fetchInstances(); }, [username, fetchInstances]);

    // --- Render ---
    const runningCount = instances.filter(i => i.state === 'running').length;

    return (
        <div className="flex flex-col h-full min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-['Poppins',sans-serif] transition-colors duration-500 overflow-hidden relative">

            <main className="relative z-10 flex-1 p-2 md:p-6 w-full flex items-start justify-center">
                <div className="w-full h-full flex gap-6">

                    {/* Left: Instance List */}
                    <motion.div
                        layout
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20 }}
                        className="flex-1 min-w-0"
                    >
                        <header className="mb-6 flex justify-between items-center">
                            <div>
                                <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white dark:drop-shadow-lg">
                                    Virtual Machines
                                </h1>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Manage your cloud environments
                                </p>
                            </div>
                            <div className="flex gap-3">
                                <div className="px-4 py-2 rounded-2xl bg-white/50 dark:bg-white/5 border border-gray-200 dark:border-white/10 backdrop-blur-md shadow-sm">
                                    <span className="block text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold">Total</span>
                                    <span className="text-xl font-mono font-bold text-gray-800 dark:text-white">{instances.length}</span>
                                </div>
                                <div className="px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-md shadow-sm">
                                    <span className="block text-xs text-emerald-600 dark:text-emerald-400 uppercase tracking-widest font-bold">Active</span>
                                    <span className="text-xl font-mono font-bold text-emerald-600 dark:text-emerald-400">{runningCount}</span>
                                </div>
                            </div>
                        </header>

                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {loading && instances.length === 0 ? (
                                <div className="col-span-full py-20 flex flex-col items-center text-gray-400 animate-pulse">
                                    <FaServer className="text-4xl mb-4 opacity-20" />
                                    Loading resources...
                                </div>
                            ) : instances.map(inst => (
                                <motion.div
                                    key={inst.instanceId}
                                    layoutId={inst.instanceId}
                                    onClick={() => { setSelectedInstance(inst); fetchInstanceInfo(inst.instanceId); }}
                                    whileHover={{ scale: 1.01, backgroundColor: "rgba(220, 38, 38, 0.04)" }}
                                    whileTap={{ scale: 0.98 }}
                                    className={`relative cursor-pointer group overflow-hidden rounded-2xl p-5 border transition-all duration-300 hover:border-red-500/20 hover:shadow-[0_0_15px_rgba(239,68,68,0.05)] ${selectedInstance?.instanceId === inst.instanceId
                                        ? 'bg-blue-600/10 dark:bg-blue-500/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
                                        : 'bg-white/60 dark:bg-white/5 border-gray-200 dark:border-white/10'
                                        } backdrop-blur-xl`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 border border-white/20 shadow-inner flex items-center justify-center text-2xl">
                                                <OsIcon osType={inst.osType} />
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">
                                                    {inst.instanceName || "Cloud Instance"}
                                                </h3>
                                                <div className="flex flex-wrap gap-2 text-xs font-mono text-gray-500 dark:text-gray-400">
                                                    <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded"><FaMicrochip /> t2.micro</span>
                                                    <span className="flex items-center gap-1 bg-black/5 dark:bg-white/10 px-1.5 py-0.5 rounded">{inst.instanceId}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <StatusBadge state={inst.state} />
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-white/5">
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 font-mono">
                                            <FaNetworkWired className="text-gray-400 dark:text-gray-600" />
                                            {inst.publicIp || "IP Not Assigned"}
                                        </div>
                                        <FaChevronRight className={`transition-transform duration-300 text-gray-400 ${selectedInstance?.instanceId === inst.instanceId ? 'rotate-90 text-blue-500' : ''}`} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Right: Floating Management Panel */}
                    <AnimatePresence>
                        {selectedInstance && (
                            <motion.div
                                initial={{ opacity: 0, x: 50, rotateY: -10 }}
                                animate={{ opacity: 1, x: 0, rotateY: 0 }}
                                exit={{ opacity: 0, x: 50, rotateY: 10 }}
                                transition={{ type: "spring", damping: 25, stiffness: 120 }}
                                className="w-[420px] shrink-0 sticky top-0 h-[calc(100vh-2rem)] flex flex-col"
                            >
                                <div className="h-full flex flex-col rounded-3xl overflow-hidden border border-white/20 dark:border-white/10 bg-white/70 dark:bg-[#121214]/60 backdrop-blur-2xl shadow-2xl">

                                    {/* Glass Header */}
                                    <div className="relative p-8 pb-12 overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-500/20" />
                                        <div className="relative z-10 flex justify-between items-start">
                                            <div className="flex gap-4 items-center">
                                                <div className="p-3 bg-white dark:bg-white/10 rounded-2xl shadow-lg backdrop-blur text-3xl">
                                                    <OsIcon osType={selectedInstance.osType} />
                                                </div>
                                                <div>
                                                    <h2 className="text-2xl font-black text-gray-900 dark:text-white drop-shadow-md">
                                                        {selectedInstance.instanceName || "Instance"}
                                                    </h2>
                                                    <StatusBadge state={selectedInstance.state} />
                                                </div>
                                            </div>
                                            <button onClick={() => setSelectedInstance(null)} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition">
                                                <span className="material-symbols-outlined text-gray-500 dark:text-gray-300">close</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Controls Body */}
                                    <div className="flex-1 -mt-8 px-6 pb-6 overflow-y-auto z-20">
                                        <div className="space-y-6">

                                            {/* Details Card */}
                                            <div className="bg-white dark:bg-[#1E1E21]/80 backdrop-blur-md p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-lg">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Public IP</label>
                                                        <div className="font-mono text-sm dark:text-gray-200">{selectedInstance.publicIp || "—"}</div>
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] uppercase tracking-widest text-gray-400 font-bold mb-1 block">Instance ID</label>
                                                        <div className="font-mono text-sm dark:text-gray-200 truncate" title={selectedInstance.instanceId}>{selectedInstance.instanceId}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Power Actions */}
                                            <div>
                                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 pl-1">Power Controls</h3>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={() => executeWithPassword((pwd) => startInstance(selectedInstance.instanceId, pwd))}
                                                        disabled={selectedInstance.state === 'running' || loading}
                                                        className="group relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 hover:border-emerald-500/50 disabled:opacity-40 transition-all"
                                                    >
                                                        <div className="flex flex-col items-center gap-2 relative z-10">
                                                            <span className="material-symbols-outlined text-3xl text-emerald-500 group-hover:scale-110 transition-transform">play_circle</span>
                                                            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Start System</span>
                                                        </div>
                                                    </button>

                                                    <button
                                                        onClick={() => executeWithPassword((pwd) => stopInstance(selectedInstance.instanceId, pwd))}
                                                        disabled={selectedInstance.state !== 'running' || loading}
                                                        className="group relative overflow-hidden p-4 rounded-xl bg-gradient-to-br from-rose-500/10 to-red-500/10 border border-rose-500/20 hover:border-rose-500/50 disabled:opacity-40 transition-all"
                                                    >
                                                        <div className="flex flex-col items-center gap-2 relative z-10">
                                                            <FaStop className="text-2xl text-rose-500 group-hover:scale-110 transition-transform mb-1" />
                                                            <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Shutdown</span>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>

                                            {/* RDP Button */}
                                            <button
                                                onClick={() => executeWithPassword((pwd) => connectRDP(pwd))}
                                                disabled={selectedInstance.state !== 'running' || loading}
                                                className="w-full relative group overflow-hidden py-4 rounded-xl font-bold text-white shadow-xl shadow-blue-600/20 disabled:opacity-50 disabled:shadow-none"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 group-hover:scale-105 transition-transform duration-500" />
                                                <div className="relative flex items-center justify-center gap-3">
                                                    <FaDesktop className="text-lg" /> Connect via RDP
                                                </div>
                                            </button>

                                            {/* Console Info */}
                                            <div className="bg-black/90 rounded-xl p-4 border border-white/10 font-mono text-[10px] text-gray-400 shadow-inner">
                                                <div className="flex justify-between items-center mb-2 border-b border-white/10 pb-2">
                                                    <span className="flex items-center gap-2 font-bold text-gray-500"><FaTerminal /> SYSTEM OUTPUT</span>
                                                    <button onClick={() => fetchInstanceInfo(selectedInstance.instanceId)} className="text-blue-500 hover:text-blue-400 transition-colors">REFRESH</button>
                                                </div>
                                                <div className="h-24 overflow-y-auto opacity-80 leading-relaxed whitespace-pre-wrap">
                                                    {instanceInfo || "> Waiting for system logs..."}
                                                </div>
                                            </div>

                                            <div className="text-center">
                                                <button
                                                    onClick={() => executeWithPassword((pwd) => rebootInstance(selectedInstance.instanceId, pwd))}
                                                    disabled={selectedInstance.state !== 'running' || loading}
                                                    className="inline-flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-400 transition-colors disabled:opacity-30"
                                                >
                                                    <FaRedo className={loading ? "animate-spin" : ""} /> Force System Reboot
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Messages Toast */}
                <AnimatePresence>
                    {(error || successMessage) && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl backdrop-blur-xl border shadow-2xl z-50 flex items-center gap-3 ${error
                                ? "bg-rose-500/20 border-rose-500/30 text-rose-200"
                                : "bg-emerald-500/20 border-emerald-500/30 text-emerald-200"
                                }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${error ? "bg-rose-500" : "bg-emerald-500"} animate-pulse`} />
                            {error || successMessage}
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Password Modal */}
            <AnimatePresence>
                {passwordPromptOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-[#18181b] p-0 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 w-full max-w-sm overflow-hidden"
                        >
                            <form onSubmit={(e) => { e.preventDefault(); handlePasswordSubmit(); }}>
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-5 text-2xl">
                                        <FaLock />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Authentication Required</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                                        Please enter your session password to confirm this action.
                                    </p>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        value={manualPassword}
                                        onChange={(e) => setManualPassword(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center text-lg tracking-widest transition-all dark:text-white"
                                        autoFocus
                                        autoComplete="current-password"
                                    />
                                </div>
                                <div className="flex border-t border-gray-100 dark:border-white/5">
                                    <button type="button" onClick={() => setPasswordPromptOpen(false)} className="flex-1 py-4 text-sm font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">CANCEL</button>
                                    <div className="w-px bg-gray-100 dark:bg-white/5" />
                                    <button type="submit" className="flex-1 py-4 text-sm font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors">CONFIRM</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default VmManagement;
