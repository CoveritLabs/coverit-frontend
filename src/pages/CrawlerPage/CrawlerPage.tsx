import React, { useState } from "react";
import {
  Play,
  Calendar,
  GitBranch,
  Bell,
  ExternalLink,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  Globe,
  Network,
  Terminal,
  TrendingUp,
  AlertTriangle,
  FileCode,
  Link2Off,
  Clock,
  Settings,
  ChevronRight,
  Save,
  Trash2,
  Tag,
  Plus,
  History,
  ChevronDown,
  Check,
  X,
  MoreVertical,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { cn } from "./ui/utils";

type Tab = "overview" | "visual-map" | "live-logs";
type CrawlStatus = "success" | "failed" | "in-progress";

interface CrawlBuild {
  id: string;
  date: string;
  status: CrawlStatus;
  branch: string;
  pagesDiscovered: number;
  brokenLinks: number;
  flowsGenerated: number;
}

interface SavedEnvironment {
  id: string;
  name: string;
  url: string;
  version: string;
  targetRepo: string;
  branchName: string;
  targetBranch: string;
  createdAt: string;
}

const mockBuilds: CrawlBuild[] = [
  {
    id: "1",
    date: "2026-03-07 14:32",
    status: "success",
    branch: "main",
    pagesDiscovered: 247,
    brokenLinks: 3,
    flowsGenerated: 89,
  },
  {
    id: "2",
    date: "2026-03-07 02:15",
    status: "success",
    branch: "develop",
    pagesDiscovered: 198,
    brokenLinks: 0,
    flowsGenerated: 72,
  },
  {
    id: "3",
    date: "2026-03-06 18:45",
    status: "failed",
    branch: "main",
    pagesDiscovered: 45,
    brokenLinks: 12,
    flowsGenerated: 0,
  },
  {
    id: "4",
    date: "2026-03-06 14:20",
    status: "success",
    branch: "staging",
    pagesDiscovered: 231,
    brokenLinks: 1,
    flowsGenerated: 85,
  },
  {
    id: "5",
    date: "2026-03-06 02:10",
    status: "in-progress",
    branch: "main",
    pagesDiscovered: 156,
    brokenLinks: 2,
    flowsGenerated: 0,
  },
];

const initialSavedEnvironments: SavedEnvironment[] = [
  {
    id: "1",
    name: "Production v2.5.1",
    url: "https://app.example.com",
    version: "v2.5.1",
    targetRepo: "acme-corp/qa-automation",
    branchName: "auto-prod-tests",
    targetBranch: "HEAD",
    createdAt: "2026-03-01",
  },
  {
    id: "2",
    name: "Staging RC",
    url: "https://staging.example.com",
    version: "v2.6.0-rc1",
    targetRepo: "acme-corp/qa-automation",
    branchName: "auto-staging-tests",
    targetBranch: "HEAD",
    createdAt: "2026-03-05",
  },
  {
    id: "3",
    name: "QA Beta",
    url: "https://qa.example.com",
    version: "v2.6.0-beta",
    targetRepo: "acme-corp/qa-automation",
    branchName: "",
    targetBranch: "develop",
    createdAt: "2026-03-03",
  },
];

export function CrawlerCodeGen() {
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [envName, setEnvName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [version, setVersion] = useState("");
  const [targetRepo, setTargetRepo] = useState("");
  const [branchName, setBranchName] = useState("");
  const [targetBranch, setTargetBranch] = useState("HEAD");
  const [scheduleEnabled, setScheduleEnabled] = useState(true);
  const [frequency, setFrequency] = useState("daily");
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [savedEnvironments, setSavedEnvironments] = useState<SavedEnvironment[]>(initialSavedEnvironments);
  const [loadDropdownOpen, setLoadDropdownOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);

  const getStatusIcon = (status: CrawlStatus) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="w-4 h-4 text-success" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      case "in-progress":
        return <Loader2 className="w-4 h-4 text-primary animate-spin" />;
    }
  };

  const getStatusBadge = (status: CrawlStatus) => {
    switch (status) {
      case "success":
        return <Badge className="bg-success/10 text-success border-success/20">Success</Badge>;
      case "failed":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Failed</Badge>;
      case "in-progress":
        return <Badge className="bg-primary/10 text-primary border-primary/20">In Progress</Badge>;
    }
  };

  const handleSaveEnvironment = () => {
    const newEnvironment: SavedEnvironment = {
      id: (savedEnvironments.length + 1).toString(),
      name: envName || "New Environment",
      url: targetUrl,
      version: version || "v2.6.0",
      targetRepo: targetRepo,
      branchName: branchName,
      targetBranch: targetBranch,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setSavedEnvironments([...savedEnvironments, newEnvironment]);
  };

  const handleDeleteEnvironment = (id: string) => {
    setSavedEnvironments(savedEnvironments.filter((env) => env.id !== id));
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar - Configuration */}
      <aside className="w-96 border-r border-border bg-card overflow-y-auto">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-2 mb-1">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Configuration</h2>
          </div>
          <p className="text-sm text-muted-foreground">Set up crawler and code generation settings</p>
        </div>

        <div className="p-6 space-y-8">
          {/* Target Environment */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-foreground">Target Environment</h3>
              </div>
              <div className="flex items-center gap-1.5">
                {savedEnvironments.length > 0 && (
                  <div className="relative">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 text-xs"
                      onClick={() => setLoadDropdownOpen(!loadDropdownOpen)}
                    >
                      <History className="w-3.5 h-3.5" />
                      Load
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    {loadDropdownOpen && (
                      <div className="absolute right-0 top-full mt-1 w-64 bg-popover border border-border rounded-lg shadow-xl overflow-hidden z-50">
                        <div className="py-1">
                          {savedEnvironments.map((env) => (
                            <button
                              key={env.id}
                              onClick={() => {
                                setEnvName(env.name);
                                setTargetUrl(env.url);
                                setVersion(env.version);
                                setTargetRepo(env.targetRepo);
                                setBranchName(env.branchName);
                                setTargetBranch(env.targetBranch);
                                setLoadDropdownOpen(false);
                              }}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted/60 transition-colors text-left"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">{env.name}</p>
                                <p className="text-[10px] text-muted-foreground font-mono truncate">{env.url}</p>
                              </div>
                              {env.version && (
                                <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
                                  {env.version}
                                </Badge>
                              )}
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-border p-1">
                          <button
                            onClick={() => {
                              setLoadDropdownOpen(false);
                              setManageModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/60 transition-colors rounded text-xs text-muted-foreground hover:text-foreground"
                          >
                            <Settings className="w-3 h-3" />
                            Manage Saved
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 gap-1.5 text-xs"
                  onClick={handleSaveEnvironment}
                  disabled={!targetUrl || !targetRepo}
                >
                  <Save className="w-3.5 h-3.5" />
                  Save
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="env-name">Name (for saving)</Label>
                <Input
                  id="env-name"
                  type="text"
                  value={envName}
                  onChange={(e) => setEnvName(e.target.value)}
                  placeholder="Production v2.5.1"
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-url">Base URL</Label>
                <Input
                  id="target-url"
                  type="url"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://app.example.com"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="version">Version Label</Label>
                <Input
                  id="version"
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="v2.5.1"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-repo">Target Repository</Label>
                <Input
                  id="target-repo"
                  type="text"
                  value={targetRepo}
                  onChange={(e) => setTargetRepo(e.target.value)}
                  placeholder="org-name/repo-name"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="branch-name">Branch Name (optional)</Label>
                <Input
                  id="branch-name"
                  type="text"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="auto-generated-tests"
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="target-branch">Target Branch</Label>
                <Input
                  id="target-branch"
                  type="text"
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  placeholder="HEAD"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">Default: HEAD (latest commit)</p>
              </div>
            </div>
          </div>

          {/* Manage Modal */}
          {manageModalOpen && (
            <div
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              onClick={() => setManageModalOpen(false)}
            >
              <div
                className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6 border-b border-border flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">Manage Saved Environments</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {savedEnvironments.length} saved {savedEnvironments.length === 1 ? "environment" : "environments"}
                    </p>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setManageModalOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="p-6 space-y-3 overflow-y-auto max-h-[calc(80vh-140px)]">
                  {savedEnvironments.map((env) => (
                    <div
                      key={env.id}
                      className="group p-4 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground truncate">{env.name}</p>
                            {env.version && (
                              <Badge variant="outline" className="text-xs">
                                <Tag className="w-3 h-3 mr-1" />
                                {env.version}
                              </Badge>
                            )}
                          </div>
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">URL:</span>
                              <span className="font-mono text-foreground truncate">{env.url}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Repo:</span>
                              <span className="font-mono text-foreground truncate">{env.targetRepo}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Branch:</span>
                              <span className="font-mono text-foreground">{env.branchName || "main"}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="font-mono text-foreground">{env.targetBranch}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground">Created:</span>
                              <span className="text-foreground">{env.createdAt}</span>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDeleteEnvironment(env.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Schedule Crawler */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-foreground">Schedule Crawler</h3>
              </div>
              <Switch checked={scheduleEnabled} onCheckedChange={setScheduleEnabled} />
            </div>

            {scheduleEnabled && (
              <div className="space-y-3 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="space-y-2">
                  <Label htmlFor="frequency">Frequency</Label>
                  <select
                    id="frequency"
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="hourly">Hourly</option>
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="schedule-time">Run Time (UTC)</Label>
                  <Input id="schedule-time" type="time" defaultValue="02:00" className="text-sm" />
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/50 border border-border">
                  <Clock className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Next scheduled run: <span className="font-medium text-foreground">Mar 8, 2026 at 02:00 UTC</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Alert Rules */}
          <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-medium text-foreground">Alert Rules</h3>
              </div>
              <Switch checked={alertsEnabled} onCheckedChange={setAlertsEnabled} />
            </div>

            {alertsEnabled && (
              <div className="space-y-3 pl-6 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-start gap-2 p-3 rounded-lg bg-warning/5 border border-warning/20">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">Batch Notification</p>
                    <p className="text-xs text-muted-foreground">
                      Alerts are batched to prevent spam during loops or widespread failures
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Start Crawl Button */}
          <div className="pt-6 border-t border-border">
            <Button className="w-full gap-2 bg-primary hover:bg-primary-hover text-primary-foreground">
              <Play className="w-4 h-4" />
              Start Crawl
            </Button>
          </div>
        </div>
      </aside>

      {/* Main View - Monitoring & Results */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-border bg-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-semibold text-foreground mb-1">Crawler & Code Generation</h1>
              <p className="text-sm text-muted-foreground">Monitor crawling activity and manage generated test flows</p>
            </div>
            <Button variant="outline" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              View in GitHub
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 border-b border-border -mb-px">
            <button
              onClick={() => setActiveTab("overview")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "overview"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("visual-map")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "visual-map"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              Visual Map
            </button>
            <button
              onClick={() => setActiveTab("live-logs")}
              className={cn(
                "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                activeTab === "live-logs"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              Live Logs
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "overview" && (
            <div className="space-y-6 max-w-7xl">
              {/* Metric Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Pages Discovered */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +12%
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-1">1,247</h3>
                  <p className="text-sm text-muted-foreground">Pages Discovered</p>
                </Card>

                {/* Broken Links Found */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <Link2Off className="w-6 h-6 text-destructive" />
                    </div>
                    <Badge variant="outline" className="text-xs text-destructive">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      16 total
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-1">16</h3>
                  <p className="text-sm text-muted-foreground">Broken Links Found</p>
                </Card>

                {/* Test Flows Generated */}
                <Card className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                      <FileCode className="w-6 h-6 text-success" />
                    </div>
                    <Badge variant="outline" className="text-xs text-success">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      +8%
                    </Badge>
                  </div>
                  <h3 className="text-2xl font-semibold text-foreground mb-1">456</h3>
                  <p className="text-sm text-muted-foreground">Test Flows Generated</p>
                </Card>
              </div>

              {/* Recent Builds Table */}
              <Card>
                <div className="p-6 border-b border-border">
                  <h3 className="font-medium text-foreground">Recent Crawl Builds</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    History of crawler executions and generated tests
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/30 border-b border-border">
                      <tr>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Date & Time
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Branch
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Pages
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Broken Links
                        </th>
                        <th className="text-right px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Flows
                        </th>
                        <th className="text-center px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {mockBuilds.map((build) => (
                        <tr key={build.id} className="hover:bg-muted/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusIcon(build.status)}
                              <span className="text-sm text-foreground font-medium">{build.date}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(build.status)}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <GitBranch className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm text-foreground font-mono">{build.branch}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm text-foreground font-medium">{build.pagesDiscovered}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span
                              className={cn(
                                "text-sm font-medium",
                                build.brokenLinks > 5
                                  ? "text-destructive"
                                  : build.brokenLinks > 0
                                    ? "text-warning"
                                    : "text-muted-foreground",
                              )}
                            >
                              {build.brokenLinks}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="text-sm text-foreground font-medium">{build.flowsGenerated}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1.5 h-8 text-xs"
                                disabled={build.status === "in-progress"}
                              >
                                <Download className="w-3.5 h-3.5" />
                                Export
                              </Button>
                              <Button size="sm" variant="ghost" className="gap-1.5 h-8 text-xs">
                                View
                                <ChevronRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {activeTab === "visual-map" && (
            <Card className="h-[calc(100vh-300px)]">
              <div className="h-full flex items-center justify-center p-12">
                <div className="text-center space-y-4 max-w-md">
                  <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Network className="w-10 h-10 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">Visual Site Map</h3>
                  <p className="text-sm text-muted-foreground">
                    Interactive node graph visualization showing the discovered website structure, page relationships,
                    and navigation paths.
                  </p>
                  <Button variant="outline" className="gap-2">
                    <Play className="w-4 h-4" />
                    Generate Map
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {activeTab === "live-logs" && (
            <Card className="h-[calc(100vh-300px)] bg-slate-950 border-slate-800 overflow-hidden">
              <div className="h-full flex flex-col">
                {/* Terminal Header */}
                <div className="px-4 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-300">Crawler Output</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs text-slate-400">Live</span>
                  </div>
                </div>

                {/* Terminal Content */}
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1">
                  <div className="text-slate-500">
                    [2026-03-07 14:32:15] <span className="text-cyan-400">INFO</span> Starting crawler session...
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:15] <span className="text-cyan-400">INFO</span> Target:{" "}
                    <span className="text-slate-300">https://app.example.com</span>
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:15] <span className="text-cyan-400">INFO</span> Environment:{" "}
                    <span className="text-slate-300">staging</span>
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:16] <span className="text-green-400">SUCCESS</span> Connected to target
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:16] <span className="text-cyan-400">INFO</span> Discovering pages...
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:17] <span className="text-cyan-400">INFO</span> Found:{" "}
                    <span className="text-slate-300">/dashboard</span>
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:17] <span className="text-cyan-400">INFO</span> Found:{" "}
                    <span className="text-slate-300">/settings</span>
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:18] <span className="text-cyan-400">INFO</span> Found:{" "}
                    <span className="text-slate-300">/profile</span>
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:18] <span className="text-yellow-400">WARN</span> Broken link detected:{" "}
                    <span className="text-slate-300">/old-page</span>
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:19] <span className="text-cyan-400">INFO</span> Generating test flow for:{" "}
                    <span className="text-slate-300">Login → Dashboard</span>
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:20] <span className="text-green-400">SUCCESS</span> Test flow generated
                  </div>
                  <div className="text-slate-500">
                    [2026-03-07 14:32:21] <span className="text-cyan-400">INFO</span> Progress:{" "}
                    <span className="text-slate-300">45/247 pages</span>
                  </div>
                  <div className="text-slate-500 animate-pulse">
                    <span className="text-slate-300">▊</span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
