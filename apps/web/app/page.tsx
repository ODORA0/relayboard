/**
 * Relayboard Web Interface
 *
 * @author AJAL ODORA JONATHAN
 * @github https://github.com/ODORA0
 * @description Next.js web interface for Relayboard data pipeline platform
 */

"use client";
import { useState } from "react";

const API = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

export default function Home() {
  const [name, setName] = useState("billing_items");
  const [csvUrl, setCsvUrl] = useState(
    "https://people.sc.fsu.edu/~jburkardt/data/csv/airtravel.csv"
  );
  const [webhook, setWebhook] = useState("");

  // Loading states
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSavingSlack, setIsSavingSlack] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Success/Error states
  const [registerResult, setRegisterResult] = useState<ApiResponse | null>(
    null
  );
  const [slackResult, setSlackResult] = useState<ApiResponse | null>(null);
  const [runResult, setRunResult] = useState<ApiResponse | null>(null);

  const register = async () => {
    setIsRegistering(true);
    setRegisterResult(null);

    try {
      const res = await fetch(API + "/v1/datasets/csv", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, csvUrl }),
      });

      const data = await res.json();
      setRegisterResult({ success: res.ok, ...data });
    } catch (error) {
      setRegisterResult({ success: false, error: "Network error occurred" });
    } finally {
      setIsRegistering(false);
    }
  };

  const saveSlack = async () => {
    setIsSavingSlack(true);
    setSlackResult(null);

    try {
      const res = await fetch(API + "/v1/destinations/slack", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ webhookUrl: webhook }),
      });

      const data = await res.json();
      setSlackResult({ success: res.ok, ...data });
    } catch (error) {
      setSlackResult({ success: false, error: "Network error occurred" });
    } finally {
      setIsSavingSlack(false);
    }
  };

  const run = async () => {
    setIsRunning(true);
    setRunResult(null);

    try {
      const res = await fetch(API + "/v1/pipelines/run", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ datasetName: name }),
      });

      const data = await res.json();
      setRunResult({ success: res.ok, ...data });
    } catch (error) {
      setRunResult({ success: false, error: "Network error occurred" });
    } finally {
      setIsRunning(false);
    }
  };

  const ResultMessage = ({ result }: { result: ApiResponse | null }) => {
    if (!result) return null;

    return (
      <div
        className={`mt-3 p-3 rounded-lg ${
          result.success
            ? "bg-green-50 border border-green-200 text-green-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}
      >
        <div className="font-medium">
          {result.success ? "✅ Success!" : "❌ Error"}
        </div>
        <div className="text-sm mt-1">
          {result.message ||
            result.error ||
            JSON.stringify(result.data, null, 2)}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relayboard</h1>
              <p className="text-gray-600 mt-1">
                CSV → Postgres (staging) → dbt → Slack
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid gap-8">
          {/* Step 1: Register CSV */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Register CSV Dataset
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dataset Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Enter dataset name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV URL
                </label>
                <input
                  type="url"
                  value={csvUrl}
                  onChange={(e) => setCsvUrl(e.target.value)}
                  className="input-field"
                  placeholder="https://example.com/data.csv"
                />
              </div>

              <button
                onClick={register}
                disabled={isRegistering || !name.trim() || !csvUrl.trim()}
                className="btn-primary"
              >
                {isRegistering ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Registering...</span>
                  </div>
                ) : (
                  "Register CSV"
                )}
              </button>

              <ResultMessage result={registerResult} />
            </div>
          </div>

          {/* Step 2: Slack Destination */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Configure Slack Destination
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slack Incoming Webhook URL
                </label>
                <input
                  type="url"
                  value={webhook}
                  onChange={(e) => setWebhook(e.target.value)}
                  className="input-field"
                  placeholder="https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from your Slack app's Incoming Webhooks settings
                </p>
              </div>

              <button
                onClick={saveSlack}
                disabled={isSavingSlack || !webhook.trim()}
                className="btn-primary"
              >
                {isSavingSlack ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  "Save Slack Destination"
                )}
              </button>

              <ResultMessage result={slackResult} />
            </div>
          </div>

          {/* Step 3: Run Pipeline */}
          <div className="card">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Run Data Pipeline
              </h2>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Execute the complete data pipeline: fetch CSV → load to staging
                → transform with dbt → send to Slack
              </p>

              <button
                onClick={run}
                disabled={isRunning || !name.trim()}
                className="btn-primary bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                {isRunning ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Running Pipeline...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Run Pipeline</span>
                  </div>
                )}
              </button>

              <ResultMessage result={runResult} />
            </div>
          </div>

          {/* Services Status */}
          <div className="card bg-gray-50">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Service Status
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    API Server
                  </div>
                  <div className="text-xs text-gray-500">{API}</div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    Worker Service
                  </div>
                  <div className="text-xs text-gray-500">
                    http://localhost:5055
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    PostgreSQL
                  </div>
                  <div className="text-xs text-gray-500">
                    localhost:5433 (relayboard/relayboard)
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-white rounded-lg">
                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                <div>
                  <div className="font-medium text-sm text-gray-900">
                    MinIO Console
                  </div>
                  <div className="text-xs text-gray-500">
                    http://localhost:9001
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
