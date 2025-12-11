import React, { useState, useRef, useEffect } from 'react';

import { File as FileIcon, Edit2, Files } from 'lucide-react';
import {
  Menu,
  Search,
  Settings,
  Bell,
  Grid,
  User,
  MessageSquare,
  HelpCircle,
  Home,
  Layout,
  ChevronRight,
  Pin,
  MoreHorizontal,
  Filter,
  Columns,
  List,
  ArrowUpDown,
  Plus,
  FileText,
  CheckCircle2,
  Check,
  ArrowLeft,
  Star,
  Maximize,
  PanelRight,
  MessageCircle,
  Moon,
  Sun,
  X,
  ClipboardList,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckSquare,
  CheckCircle,
  Clock,
  ArrowRightFromLine,
  LayoutGrid,
  Eye,
  ChevronDown,
  GripHorizontal
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import ProjectDetailView from './ProjectDetailView';

// --- Mock Data ---

const PROJECTS_DATA = [
  { id: 1, name: "Omnicom | Omnicom Platforms | O...", owner: "Jen", status: "Working At Risk", color: "orange", due: "3/31/26", update: "Jen met with the Omni+ team..." },
  { id: 2, name: "AI Services Team Goals, Meetings a...", owner: "Sarah", status: "Active", color: "green", due: "12/31/25", update: "Meeting Summary Date: Septe..." },
  { id: 3, name: "AI GTM and Department Structure", owner: "Sarah", status: "Active", color: "green", due: "12/31/25", update: "I believe this applies to all cust..." },
  { id: 4, name: "LP AoA", owner: "Sarah", status: "Complete", color: "green", due: "7/2/25", update: "Omni AI to Fusion Endpoint It l..." },
  { id: 5, name: "FireFly Tiger Team Service Offering", owner: "Sarah", status: "Cancelled", color: "red", due: "4/12/27", update: "We haven't gotten to really defi..." },
  { id: 6, name: "CVS Group PLC | Marketing | CVS | ...", owner: "Mike", status: "Active", color: "green", due: "1/30/26", update: "Total of 800 hours + 210 reques..." },
  { id: 7, name: "CVS Group PLC | Marketing | CVS | L...", owner: "Mike", status: "Complete", color: "green", due: "3/1/25", update: "@Karen Hughes I just did this m..." },
  { id: 8, name: "2025 AEM Team Goals, Meetings, N...", owner: "Sarah", status: "Operations O...", color: "orange", due: "1/31/26", update: "Kathy Haven confirmed 10/22/2..." },
  { id: 9, name: "CVS Group PLC | Marketing | CVS Gr...", owner: "Mike", status: "Active", color: "green", due: "12/31/25", update: "@Emma Kovacs @Bev Collins V..." },
  { id: 10, name: "Newell Brands | Marketing | 2025...", owner: "Tom", status: "Planning", color: "gray", due: "6/15/26", update: "Scope review pending..." },
];

const TIMESHEETS_DATA = [
  { id: 1, range: "11/23/25 - 11/29/25", owner: "Jimmie Miller", hours: "0.00", overtime: "0", approver: "Alexander Stratford", status: "Open" },
  { id: 2, range: "11/30/25 - 11/30/25", owner: "Jimmie Miller", hours: "0.00", overtime: "0", approver: "Alexander Stratford", status: "Open" },
  { id: 3, range: "12/1/25 - 12/6/25", owner: "Jimmie Miller", hours: "0.00", overtime: "0", approver: "Alexander Stratford", status: "Open" },
];

const TIMESHEET_ROWS = [
  "*Short Term Disability", "*Sick Leave", "*Unpaid Leave", "*Voting",
  "Business Development", "Conference", "Connected Work", "Internal Meetings",
  "Internal Operations", "JumpSeat", "Marketing", "Research & Development",
  "Service Lane Activation", "Training", "Travel"
];

const WEEK_DAYS = [
  { day: "Sun", date: "11/23" },
  { day: "Mon", date: "11/24" },
  { day: "Tue", date: "11/25" },
  { day: "Wed", date: "11/26" },
  { day: "Thu", date: "11/27" },
  { day: "Fri", date: "11/28" },
  { day: "Sat", date: "11/29" },
];

// --- Sortable Component Wrapper ---

function SortableItem(props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`h-full ${props.className || ''} ${isDragging ? 'opacity-50 ring-2 ring-blue-400 ring-offset-2 rounded-lg bg-white dark:bg-gray-800 shadow-lg' : ''}`}
    >
      {/* 
        We need to pass the drag handle listeners to the child component or use a Context.
        For simplicity, let's clone the child and pass a prop `dragHandleProps` which contains `attributes` and `listeners`.
      */}
      {React.cloneElement(props.children, { dragHandleProps: { ...attributes, ...listeners } })}
    </div>

  );
}

// --- Widget Components ---

const MyApprovalsWidget = ({ dragHandleProps }) => {
  const [approvals, setApprovals] = useState([]);

  useEffect(() => {
    // Function to simplify date display
    const checkApprovals = () => {
      try {
        const stored = localStorage.getItem('omnify_pending_approvals');
        if (stored) {
          setApprovals(JSON.parse(stored));
        } else {
          setApprovals([]);
        }
      } catch (e) {
        console.error("Failed to parse approvals", e);
      }
    };

    // Initial check
    checkApprovals();

    // Poll for changes (simple way to sync across components without context)
    const interval = setInterval(checkApprovals, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full min-h-[500px]">
      <div
        className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-move drag-handle select-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg touch-none"
        {...dragHandleProps}
      >
        <div className="flex items-center space-x-2 pointer-events-none">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">My Approvals</h2>
          <HelpCircle size={14} className="text-gray-400" />
          <div className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{approvals.length}</div>
        </div>
        <div className="flex items-center space-x-2">
          <GripHorizontal size={16} className="text-gray-300 dark:text-gray-500" />
          <MoreHorizontal size={20} className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="px-4 py-3 flex justify-end items-center space-x-3 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          <button className="px-3 py-1 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-xs font-medium rounded transition-colors border border-gray-200 dark:border-gray-600">
            Delegate approvals
          </button>
          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600"></div>
          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-800 dark:hover:text-white">
            <Filter size={14} />
            <span className="text-sm font-medium">All</span>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto">
          {approvals.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-full mb-3">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="text-gray-900 dark:text-white font-medium mb-1">All caught up!</h3>
              <p className="text-sm">You have no pending approvals.</p>
            </div>
          ) : (
            approvals.map((item) => (
              <div key={item.id} className="p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors group animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-lg overflow-hidden">
                        <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.requester.split(' ')[0]}`} alt={item.requester} className="w-full h-full" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 bg-purple-600 text-white p-0.5 rounded shadow-sm">
                        <FileText size={10} />
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-sm text-gray-800 dark:text-gray-200 leading-snug">
                        <span className="font-bold">{item.requester}</span> would like your approval on
                      </p>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                        {item.project}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{item.date}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span>Approval Stage</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{item.stage || 'Approval'}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex rounded-md shadow-sm">
                        <button className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-bold rounded-l-md transition-colors border-r border-emerald-800">
                          Approve
                        </button>
                        <button className="px-1.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-r-md transition-colors">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      <div className="flex rounded-md shadow-sm">
                        <button className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white text-sm font-bold rounded-l-md transition-colors border-r border-red-800">
                          Reject
                        </button>
                        <button className="px-1.5 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded-r-md transition-colors">
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="absolute bottom-0 right-0 p-1 cursor-se-resize">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[10px] border-b-gray-400 transform rotate-0 opacity-50"></div>
      </div>
    </div>
  );
};

const MyProjectsWidget = ({ dragHandleProps, onNavigate }) => {
  const [activeTab, setActiveTab] = useState('projects-on');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [isNewDropdownOpen, setIsNewDropdownOpen] = useState(false);
  const [projects, setProjects] = useState(PROJECTS_DATA);
  const lastProjectSyncRef = useRef(null);

  // Polling for new project trigger from Interact Console (Market Brief)
  useEffect(() => {
    const checkProjectCookie = () => {
      const match = document.cookie.match(new RegExp('(^| )omnify_create_projects_trigger=([^;]+)'));
      if (match) {
        const triggerData = decodeURIComponent(match[2]);
        if (triggerData !== lastProjectSyncRef.current) {
          lastProjectSyncRef.current = triggerData;
          try {
            const data = JSON.parse(triggerData);
            console.log("Project sync trigger detected:", data);

            const newProjects = [
              {
                id: Date.now() + 1,
                name: data.briefName,
                owner: "Jimmie Miller",
                status: "Planning",
                color: "orange",
                due: "12/08/25",
                update: "Auto-created from Market Brief",
                documents: [
                  { id: 1, name: `Market Brief - ${data.briefName}.docx`, date: new Date().toLocaleDateString(), size: "24 KB", type: "docx", user: "System" }
                ]
              },
              {
                id: Date.now() + 2,
                name: `${data.briefName} - Media Planning`,
                owner: "Jimmie Miller",
                status: "Planning",
                color: "orange",
                due: "12/08/25",
                update: "Auto-created from Market Brief",
                documents: [
                  { id: 1, name: `Market Brief - ${data.briefName}.docx`, date: new Date().toLocaleDateString(), size: "24 KB", type: "docx", user: "System" }
                ]
              },
              {
                id: Date.now() + 3,
                name: `${data.briefName} - Creative Campaign`,
                owner: "Jimmie Miller",
                status: "Planning",
                color: "orange",
                due: "12/08/25",
                update: "Auto-created from Market Brief",
                documents: [
                  { id: 1, name: `Market Brief - ${data.briefName}.docx`, date: new Date().toLocaleDateString(), size: "24 KB", type: "docx", user: "System" }
                ]
              }
            ];

            setProjects(prev => [...newProjects, ...prev]);
          } catch (e) {
            console.error("Error parsing project sync trigger", e);
          }
        }
      }
    };
    const intervalId = setInterval(checkProjectCookie, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Filter logic
  const filteredProjects = activeTab === 'projects-on'
    ? projects
    : projects.filter(p => p.owner === "You" || p.owner === "Jimmie Miller"); // Mock filter

  // Sort logic
  const sortedProjects = React.useMemo(() => {
    let sortableItems = [...filteredProjects];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProjects, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getStatusColor = (color) => {
    switch (color) {
      case 'green': return 'bg-green-500';
      case 'orange': return 'bg-orange-500';
      case 'red': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full min-h-[500px]">
      <div
        className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center cursor-move drag-handle select-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg touch-none"
        {...dragHandleProps}
      >
        <div className="flex items-center space-x-2 pointer-events-none">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">My Tasks</h2>
          <HelpCircle size={14} className="text-gray-400" />
        </div>
        <div className="flex items-center space-x-2">
          <GripHorizontal size={16} className="text-gray-300 dark:text-gray-500" />
          <MoreHorizontal size={20} className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                onClick={() => setIsNewDropdownOpen(!isNewDropdownOpen)}
                className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-1"
              >
                <span>New</span>
              </button>

              {isNewDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50 py-1 animate-in fade-in zoom-in-95 duration-100">
                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2">
                    <FileText size={16} />
                    <span>From template</span>
                  </button>
                  <button
                    onClick={() => {
                      // Trigger sync to Interact Console via cookie
                      document.cookie = "omnify_new_project_trigger=" + Date.now() + "; path=/; max-age=60";
                      if (onNavigate) onNavigate('project-detail');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Layout size={16} />
                    <span>Blank project</span>
                  </button>
                </div>
              )}
            </div>
            <Search size={18} className="text-gray-400 cursor-pointer" />
          </div>

          <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 p-1 rounded-md">
            <button
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'projects-i-own' ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('projects-i-own')}
            >
              Projects I Own
            </button>
            <button
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${activeTab === 'projects-on' ? 'bg-gray-800 dark:bg-gray-900 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
              onClick={() => setActiveTab('projects-on')}
            >
              Projects I'm On
            </button>
          </div>

          <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400 text-sm">
            <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
              <Filter size={14} />
              <span>Filter</span>
            </div>
            <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
              <Columns size={14} />
              <span className="font-bold">Columns</span>
            </div>
            <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-900 dark:hover:text-gray-200">
              <List size={14} />
              <span>Grouping</span>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-md border-gray-200 dark:border-gray-700">
          <table className="w-full text-left text-sm relative">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-600 sticky top-0 z-10">
              <tr>
                <th className="py-2 pl-3 w-16 bg-gray-50 dark:bg-gray-700">Quick Actions</th>
                <th className="py-2 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('name')}>Name</th>
                <th className="py-2 px-2 w-24 bg-gray-50 dark:bg-gray-700">Owner: Photo</th>
                <th className="py-2 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('status')}>Status</th>
                <th className="py-2 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 bg-gray-50 dark:bg-gray-700" onClick={() => requestSort('due')}>Due On</th>
                <th className="py-2 px-2 bg-gray-50 dark:bg-gray-700">Last Update</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
              {sortedProjects.map((project, idx) => (
                <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 group text-xs md:text-sm">
                  <td className="py-2 pl-3">
                    <div className="flex items-center space-x-2 text-gray-500 opacity-60 group-hover:opacity-100">
                      <FileText size={16} />
                      <MoreHorizontal size={16} />
                    </div>
                  </td>
                  <td
                    className="py-2 px-2 font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer truncate max-w-[200px]"
                    title={project.name}
                    onClick={() => {
                      if (onNavigate) onNavigate('project-detail', project);
                    }}
                  >
                    {project.name}
                  </td>
                  <td className="py-2 px-2">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden" title={project.owner}>
                      <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${project.owner}`} alt="avatar" className="w-full h-full" />
                    </div>
                  </td>
                  <td className="py-2 px-2 whitespace-nowrap">
                    <div className="flex items-center space-x-1.5">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(project.color)}`}></div>
                      <span className="text-gray-700 dark:text-gray-300">{project.status}</span>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-gray-600 dark:text-gray-400">{project.due}</td>
                  <td className="py-2 px-2 text-gray-500 dark:text-gray-400 truncate max-w-[150px]" title={project.update}>{project.update}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 text-right text-xs text-gray-400 dark:text-gray-500">
          Showing {sortedProjects.length} projects
        </div>
      </div>

      {/* Resize Handle */}
      <div className="absolute bottom-0 right-0 p-1 cursor-se-resize">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[10px] border-b-gray-400 transform rotate-0 opacity-50"></div>
      </div>
    </div>
  );
};

const MentionsWidget = ({ dragHandleProps }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showReply, setShowReply] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-full min-h-[500px] relative">
      <div
        className="p-4 flex justify-between items-center cursor-move drag-handle select-none hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors rounded-t-lg border-b border-gray-100 dark:border-gray-700 touch-none"
        {...dragHandleProps}
      >
        <div className="flex items-center space-x-2 pointer-events-none">
          <h2 className="font-bold text-gray-800 dark:text-gray-100 text-lg">Mentions</h2>
          <HelpCircle size={14} className="text-gray-400" />
          <div className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">2</div>
        </div>
        <div className="flex items-center space-x-2">
          <GripHorizontal size={16} className="text-gray-300 dark:text-gray-500" />
          <MoreHorizontal size={20} className="text-gray-400 cursor-pointer hover:text-gray-600 dark:hover:text-gray-300" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Accordion Header */}
        <div
          className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer mb-4"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <ChevronDown size={16} className={`transform transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          <span>Last week</span>
        </div>

        {isExpanded && (
          <div className="pl-2 border-l-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
            {/* Thread Item */}
            <div className="flex items-start space-x-3 mb-6">
              <div className="mt-1.5">
                <div className="w-2 h-2 bg-blue-500 rounded-full mb-2"></div>
                <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Colin" alt="Colin" />
                </div>
              </div>

              <div className="flex-1 text-sm">
                <div className="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium mb-1 leading-snug">
                  Pre-Sales | Demo/Scoping Requests » American Eagle Outfitters (AEO) | Demo Request for WF and AEM
                </div>

                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Colin McEvily</span>
                  <span>11/13/2025, 7:56 AM</span>
                  <span>•</span>
                  <button className="hover:text-blue-600 dark:hover:text-blue-400 font-medium">Like</button>
                  <MoreHorizontal size={12} className="cursor-pointer" />
                </div>

                <div className="text-gray-800 dark:text-gray-200 mb-4 leading-relaxed">
                  Trying to extend reach into CXO level stakeholders. Pushing AID on AEM move to cloud support to start early. They are on managed services, which will be end of life next --September time frame I believe. Pushing urgency to get started
                </div>

                {/* Reply from Anna */}
                <div className="flex items-start space-x-3 mb-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-md">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600 shrink-0">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Anna" alt="Anna" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-1">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">Anna Damareck</span>
                      <span>11/17/2025, 11:59 AM</span>
                      <button className="hover:text-blue-600 dark:hover:text-blue-400">Like</button>
                      <MoreHorizontal size={12} />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">to Colin McEvily</div>
                    <div className="text-gray-800 dark:text-gray-200 text-sm">
                      <span className="text-blue-600 dark:text-blue-400 cursor-pointer hover:underline">@Colin McEvily</span> - any updates here? Any additional support needed?
                    </div>
                  </div>
                </div>

                {/* Reply Button / Box */}
                {!showReply ? (
                  <button
                    onClick={() => setShowReply(true)}
                    className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Reply
                  </button>
                ) : (
                  <div className="mt-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <textarea
                      className="w-full border border-gray-300 dark:border-gray-600 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                      rows="3"
                      placeholder="Write a reply..."
                      autoFocus
                    ></textarea>
                    <div className="flex justify-end space-x-2 mt-2">
                      <button onClick={() => setShowReply(false)} className="px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">Cancel</button>
                      <button onClick={() => setShowReply(false)} className="px-3 py-1 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700">Post</button>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Next Section Header */}
        <div className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer mt-6 opacity-60 hover:opacity-100 transition-opacity">
          <ChevronRight size={16} />
          <span>Week of November 9, 2025</span>
        </div>

      </div>

      <div className="absolute bottom-0 right-0 p-1 cursor-se-resize">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[10px] border-b-gray-400 transform rotate-0 opacity-50"></div>
      </div>
    </div>
  );
};

const TodosWidget = ({ dragHandleProps }) => {
  return (
    <div className="bg-[#FFFBEB] dark:bg-yellow-900/20 rounded-lg shadow-sm border border-gray-200 dark:border-yellow-900/30 flex flex-col min-h-[150px] relative h-full">
      <div
        className="p-4 flex justify-between items-center cursor-move drag-handle select-none hover:bg-[#FDF6D8] dark:hover:bg-yellow-900/30 transition-colors rounded-t-lg touch-none"
        {...dragHandleProps}
      >
        <div className="flex items-center space-x-2 pointer-events-none">
          <h2 className="font-bold text-gray-800 dark:text-yellow-100 text-lg">To-dos</h2>
          <HelpCircle size={14} className="text-gray-400 dark:text-yellow-100/50" />
        </div>
        <div className="flex items-center space-x-2">
          <GripHorizontal size={16} className="text-gray-300 dark:text-yellow-100/30" />
          <MoreHorizontal size={20} className="text-gray-400 dark:text-yellow-100/50 cursor-pointer hover:text-gray-600 dark:hover:text-yellow-100" />
        </div>
      </div>

      <div className="px-4 pb-4">
        <button className="flex items-center text-gray-700 dark:text-yellow-100 hover:text-black dark:hover:text-white font-medium text-sm space-x-2 mt-2 group">
          <div className="bg-gray-700 dark:bg-yellow-100 group-hover:bg-black dark:group-hover:bg-white text-white dark:text-yellow-900 rounded-full p-0.5 transition-colors">
            <Plus size={12} />
          </div>
          <span>Add to-do</span>
        </button>
      </div>
      <div className="absolute bottom-0 right-0 p-1 cursor-se-resize">
        <div className="w-0 h-0 border-l-[10px] border-l-transparent border-b-[10px] border-b-gray-400 transform rotate-0 opacity-50"></div>
      </div>
    </div>
  );
};

// --- Modal Components ---

const NewTaskModal_DEPRECATED = ({ isOpen, onClose, onCreate }) => {
  const [taskName, setTaskName] = useState('');
  const [description, setDescription] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [duration, setDuration] = useState(1);
  const [plannedCompletionDate, setPlannedCompletionDate] = useState('Dec 8, 2025'); // Default future date

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!taskName.trim()) return; // Basic validation

    const newTask = {
      id: Date.now(),
      name: taskName,
      assignments,
      duration: `${duration} Day${duration > 1 ? 's' : ''}`,
      plannedHours: '0 Hours',
      startDate: new Date().toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }),
      dueDate: new Date(plannedCompletionDate).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric', year: '2-digit' }) || '12/8/25',
      percentComplete: 0
    };

    onCreate(newTask);

    // Reset form
    setTaskName('');
    setDescription('');
    setAssignments([]);
    setDuration(1);
    onClose();
  };

  const handleAssignToMe = () => {
    // Check if "Demo User" is already assigned
    if (!assignments.some(a => a.id === 'current-user')) {
      setAssignments([
        ...assignments,
        { id: 'current-user', name: 'Jimmie Miller', initials: 'JM', color: 'bg-emerald-600' }
      ]);
    }
  };

  const removeAssignment = (id) => {
    setAssignments(assignments.filter(a => a.id !== id));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-center space-x-3 p-6 pb-4">
          <div className="w-10 h-10 bg-[#3B82F6] rounded flex items-center justify-center text-white shrink-0 shadow-sm">
            <ClipboardList size={22} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Task</h2>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-8 py-2 space-y-6">

          {/* Task Name */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
              Task Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Task Name"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              className="w-full px-3 py-2 border border-purple-500 rounded focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
              Description
            </label>
            <div className="relative">
              <textarea
                placeholder="Description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm resize-y"
              />
              <div className="text-right text-xs text-gray-400 mt-1">
                0/4000
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-gray-800 dark:text-gray-200">
              Assignments
            </label>
            <div className="flex items-center space-x-4">
              <div className="flex-1 flex flex-wrap items-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent min-h-[38px] p-1 gap-1">
                {assignments.map((assignee) => (
                  <div key={assignee.id} className="flex items-center bg-blue-50 dark:bg-blue-900/30 text-blue-900 dark:text-blue-100 rounded-full pl-1 pr-2 py-0.5 border border-blue-100 dark:border-blue-800">
                    <div className={`w-6 h-6 rounded-full ${assignee.color} text-white flex items-center justify-center text-[10px] font-bold mr-2`}>
                      {assignee.initials}
                    </div>
                    <span className="text-sm font-medium mr-1">{assignee.name}</span>
                    <button
                      onClick={() => removeAssignment(assignee.id)}
                      className="text-blue-400 hover:text-blue-600 dark:text-blue-300 dark:hover:text-blue-100 focus:outline-none"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  placeholder={assignments.length === 0 ? "Search people, roles, or teams" : ""}
                  className="flex-1 min-w-[150px] px-2 py-1 bg-transparent border-none focus:ring-0 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                />
              </div>
              <button
                onClick={handleAssignToMe}
                className="text-sm font-bold text-gray-800 dark:text-gray-300 hover:underline shrink-0"
              >
                Assign to me
              </button>
            </div>
          </div>

          {/* Date Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Duration
              </label>
              <div className="flex border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 0)}
                  className="w-16 px-3 py-2 text-sm text-gray-900 dark:text-white bg-white dark:bg-gray-900 focus:outline-none border-r border-gray-300 dark:border-gray-600"
                />
                <div className="flex-1 flex items-center justify-between px-3 bg-white dark:bg-gray-900 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                  <span className="text-sm text-gray-700 dark:text-gray-300">Days</span>
                  <ChevronDown size={14} className="text-gray-500" />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Planned Completion Date
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Planned Completion Date"
                  value={plannedCompletionDate}
                  onChange={(e) => setPlannedCompletionDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 text-sm pr-10"
                />
                <Calendar size={16} className="absolute right-3 top-2.5 text-gray-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 pt-4 flex items-center justify-between mt-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleCreate}
              className="px-5 py-2 bg-[#1d4ed8] hover:bg-blue-800 text-white text-sm font-bold rounded-full transition-colors shadow-sm"
            >
              Create task
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-sm font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
          <button className="px-4 py-1.5 border border-gray-300 dark:border-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            More options
          </button>
        </div>

      </div>
    </div>
  );
};

// --- Google Drive Authorization Modal ---

const GoogleDriveModal = ({ onClose, onAuthorize }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[600px] max-w-full relative overflow-hidden">
        <div className="p-8 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add Google Drive Account</h2>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            In order to create a Google Drive file you need to authorize Workfront to access your Google Drive files. Press the "Authorize Google Drive" button to continue.
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        <div className="p-6 flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onAuthorize}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded shadow-sm transition-colors"
          >
            Authorize Google Drive
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Microsoft OneDrive Authorization Modal ---

const OneDriveModal = ({ onClose, onAuthorize }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[600px] max-w-full relative overflow-hidden">
        <div className="p-8 pb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Add Microsoft OneDrive Account</h2>
          <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
            In order to create a Microsoft OneDrive file you need to authorize Workfront to access your Microsoft OneDrive files. Press the "Authorize Microsoft OneDrive" button to continue.
          </p>
        </div>

        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        <div className="p-6 flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50">
          <button
            onClick={onAuthorize}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded shadow-sm transition-colors"
          >
            Authorize Microsoft OneDrive
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-blue-600 dark:text-blue-400 hover:underline text-sm font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Document Detail View ---

const DocumentDetailView = ({ document, taskName, onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Top Breadcrumb & Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Breadcrumbs */}
        <div className="px-5 py-2 text-xs text-gray-500 flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700">
          <button className="hover:underline">PROJECT</button>
          <span className="text-gray-900 dark:text-gray-300">Untitled Project</span>
          <span className="text-gray-300">|</span>
          <button onClick={onBack} className="hover:underline uppercase tracking-wider">TASK</button>
          <button onClick={onBack} className="text-gray-900 dark:text-gray-300 hover:underline">{taskName}</button>
          <span className="text-gray-300">|</span>
          <span className="uppercase tracking-wider">DOCUMENT</span>
          <span className="text-gray-900 dark:text-gray-300">{document.name}</span>
        </div>

        {/* Main Header */}
        <div className="px-6 py-4 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
              <FileIcon size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">DOCUMENT</div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {document.name}
                <select className="text-sm font-normal border border-gray-300 rounded px-2 py-0.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                  <option>v1</option>
                </select>
                <Star size={18} className="text-gray-400 cursor-pointer hover:text-yellow-400" />
                <MoreHorizontal size={16} className="text-gray-400" />
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button className="text-sm font-medium text-blue-600 hover:underline">
              Create Proof
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
              <Edit2 size={16} className="text-gray-500" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col py-2">
          <button
            onClick={onBack}
            className="flex items-center space-x-2 px-4 py-2 text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">Details</span>
          </button>
          <div className="space-y-0.5">
            {['Details', 'Updates', 'Approvals', 'All Versions', 'Custom Forms'].map(item => (
              <button
                key={item}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium border-l-4 ${item === 'Details' ? 'border-gray-800 bg-gray-100 text-gray-900' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
              >
                {item === 'Details' && <List size={16} />}
                {item === 'Updates' && <MessageSquare size={16} />}
                {item === 'Approvals' && <CheckCircle2 size={16} />}
                {item === 'All Versions' && <Files size={16} />}
                {item === 'Custom Forms' && <FileText size={16} />}
                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-y-auto p-6">
          <div className="flex items-center gap-2 mb-4">
            <ChevronDown size={20} className="text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Overview</h2>
          </div>

          <div className="flex gap-6 h-full">
            {/* Left Column: Preview */}
            <div className="flex-1 bg-gray-100 dark:bg-gray-800 border border-dashed border-gray-300 dark:border-gray-700 rounded-lg flex items-center justify-center min-h-[400px]">
              <div className="text-center text-gray-400">
                <FileIcon size={64} className="mx-auto mb-4" />
                <p>Preview not available</p>
              </div>
            </div>

            {/* Right Column: Basic Information */}
            <div className="w-80 shrink-0">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4">Basic Information</h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase">Description</label>
                  <button className="text-sm text-gray-500 hover:text-blue-600 mt-1 flex items-center gap-1">
                    <Plus size={12} />
                    Add
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Reference number</label>
                    <div className="text-sm text-gray-900 dark:text-gray-200">36950</div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Size</label>
                    <div className="text-sm text-gray-900 dark:text-gray-200">4.01 MB</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Added on</label>
                    <div className="text-sm text-gray-900 dark:text-gray-200">{document.date}</div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Added by</label>
                    <div className="text-sm text-gray-900 dark:text-gray-200">{document.user}</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <button className="text-sm text-blue-600 hover:underline block">Check in / Check out</button>
                  <button className="text-sm text-blue-600 hover:underline block">Check out</button>
                </div>

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Task Detail View ---

const TaskDetailView = ({ task, onBack }) => {
  const [activeTab, setActiveTab] = useState('updates'); // 'updates' | 'documents' | 'details' etc
  const [isAddNewOpen, setIsAddNewOpen] = useState(false);
  const [isGoogleDriveModalOpen, setIsGoogleDriveModalOpen] = useState(false);
  const [isOneDriveModalOpen, setIsOneDriveModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleGoogleFileClick = () => {
    setIsAddNewOpen(false);
    setIsGoogleDriveModalOpen(true);
  };

  const handleOneDriveClick = () => {
    setIsAddNewOpen(false);
    setIsOneDriveModalOpen(true);
  };

  const fileInputRef = useRef(null);

  const handleDocumentClick = () => {
    setIsAddNewOpen(false);
    fileInputRef.current?.click();
  };



  const [documents, setDocuments] = useState([]);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      console.log('File selected:', file.name);

      const newDoc = {
        id: Date.now(),
        name: file.name,
        date: new Date().toLocaleDateString() + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        user: 'Jimmie Miller',
        type: 'file'
      };

      setDocuments(prev => [newDoc, ...prev]); // Add to top

      // Trigger document sync to Interact Console via cookie
      const docCookieValue = JSON.stringify({
        name: newDoc.name,
        date: newDoc.date,
        size: '24 KB', // Mock size
        type: 'docx' // Mock type
      });
      document.cookie = `omnify_new_document_trigger=${encodeURIComponent(docCookieValue)}; path=/; max-age=60`;
    }
  };


  // Mock data for the view if task props are missing details
  const taskDetails = {
    ...task,
    percentComplete: task?.percentComplete || 0,
    status: 'New',
    plannedCompletionDate: task?.dueDate || 'Dec 8, 2025',
    assignments: task?.assignments || []
  };

  if (selectedDocument) {
    return (
      <DocumentDetailView
        document={selectedDocument}
        taskName={taskDetails.name}
        onBack={() => setSelectedDocument(null)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Top Breadcrumb & Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Breadcrumbs */}
        <div className="px-5 py-2 text-xs text-gray-500 flex items-center space-x-2 border-b border-gray-200 dark:border-gray-700">
          <span className="uppercase tracking-wider">PROJECT</span>
          <span className="text-gray-900 dark:text-gray-300">Untitled Project</span>
          <span className="text-gray-300">|</span>
          <span className="uppercase tracking-wider">TASK</span>
          <span className="text-gray-900 dark:text-gray-300">{taskDetails.name}</span>
        </div>

        {/* Main Header */}
        <div className="px-6 py-4 flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="w-10 h-10 bg-emerald-500 rounded flex items-center justify-center text-white shrink-0 shadow-sm mt-1">
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">TASK</div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {taskDetails.name}
                <Star size={18} className="text-gray-400 cursor-pointer hover:text-yellow-400" />
                <button className="text-sm font-medium border border-gray-300 rounded-full px-3 py-0.5 hover:bg-gray-50 flex items-center gap-1">
                  Share
                </button>
                <MoreHorizontal size={16} className="text-gray-400" />
              </h1>
            </div>
          </div>

          {/* Metrics/Status Right Side */}
          <div className="flex items-center space-x-8">
            <div>
              <div className="text-[10px] text-gray-500 mb-1">Percent Complete</div>
              <div className="flex items-center gap-2">
                <div className="bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {taskDetails.percentComplete}%
                </div>
                <div className="w-24 h-1 bg-gray-200 rounded-full">
                  <div className="bg-blue-600 h-1 rounded-full" style={{ width: `${taskDetails.percentComplete}%` }}></div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 mb-1">Assignments</div>
              <div className="flex items-center gap-2">
                {taskDetails.assignments.length > 0 ? (
                  taskDetails.assignments.map(a => (
                    <div key={a.id} className={`w-6 h-6 rounded-full ${a.color} text-white flex items-center justify-center text-[10px] font-bold`}>
                      {a.initials}
                    </div>
                  ))
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-400 flex items-center justify-center">
                    <User size={12} />
                  </div>
                )}
                <button className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-medium">
                  Work on it
                </button>
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 mb-1">Planned Completion Date</div>
              <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                {taskDetails.plannedCompletionDate}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 mb-1">Status</div>
              <button className="text-sm font-medium flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                {taskDetails.status}
                <ChevronDown size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <div className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col py-2">
          <button
            onClick={activeTab === 'updates' ? onBack : () => setActiveTab('updates')}
            className="flex items-center space-x-2 px-4 py-2 text-gray-500 hover:text-gray-900 mb-2"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">{activeTab === 'documents' ? 'Documents' : 'Updates'}</span>
          </button>
          <div className="space-y-0.5">
            {['Updates', 'Documents', 'Task Details', 'Subtasks', 'Issues (0)', 'Hours', 'Approvals', 'Expenses', 'Bookings'].map(item => (
              <button
                key={item}
                onClick={() => setActiveTab(item.toLowerCase())}
                className={`w-full flex items-center space-x-3 px-4 py-2 text-sm font-medium border-l-4 ${activeTab === item.toLowerCase() || (item === 'Updates' && activeTab === 'updates') ? 'border-gray-800 bg-gray-100 text-gray-900' : 'border-transparent text-gray-600 hover:bg-gray-50'}`}
              >
                {item === 'Updates' && <MessageSquare size={16} />}
                {item === 'Documents' && <FileText size={16} />}
                {item === 'Task Details' && <List size={16} />}
                {item === 'Subtasks' && <CheckCircle2 size={16} />}
                {item.includes('Issues') && <AlertTriangle size={16} />}
                {item === 'Hours' && <Clock size={16} />}
                {item === 'Approvals' && <CheckCircle2 size={16} />}
                {item === 'Expenses' && <DollarSign size={16} />}
                {item === 'Bookings' && <ArrowRightFromLine size={16} />}

                <span>{item}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 overflow-y-auto">
          {activeTab === 'updates' && (
            <div className="px-8 py-6 max-w-5xl mx-auto w-full">

              {/* Tab Headers */}
              <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 mb-6">
                <div className="flex items-center space-x-6">
                  <button className="pb-3 border-b-2 border-gray-900 font-bold text-gray-900 text-sm">Comments</button>
                  <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm">System activity</button>
                  <button className="pb-3 border-b-2 border-transparent text-gray-500 hover:text-gray-700 text-sm">All (read-only)</button>
                </div>
                <div className="flex items-center space-x-3 pb-2">
                  <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-xs font-bold hover:shadow-md transition-shadow">
                    <Star size={12} className="fill-current" />
                    <span>Summarize comments...</span>
                  </button>
                  <button className="flex items-center space-x-1 text-gray-500 text-xs">
                    <Clock size={14} />
                    <span>Log Time</span>
                  </button>
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2 text-gray-400" />
                    <input type="text" className="pl-8 pr-3 py-1 border border-gray-300 rounded text-sm w-40" />
                  </div>
                </div>
              </div>

              {/* New Comment Input */}
              <div className="mb-10">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                    <User size={16} className="text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 mb-1 ml-1">New comment</div>
                    <div className="border border-gray-300 rounded shadow-sm bg-white overflow-hidden">
                      <input type="text" className="w-full px-4 py-3 text-sm focus:outline-none" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty State Illustration */}
              <div className="flex flex-col items-center justify-center py-10 opacity-60">
                <div className="relative w-32 h-32 mb-4">
                  <MessageSquare size={64} className="text-gray-200 absolute top-0 left-0" />
                  <MessageSquare size={48} className="text-gray-300 absolute bottom-0 right-0 transform -scale-x-100" />
                  <X size={24} className="text-gray-300 absolute top-4 right-8" />
                  <Plus size={20} className="text-gray-300 absolute bottom-8 left-4" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">No comments yet</h3>
              </div>

            </div>
          )}

          {activeTab === 'documents' && (
            <div className="flex flex-col h-full">
              {/* Documents Toolbar */}
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-3 flex items-center justify-between relative">
                <div className="relative">
                  <button
                    onClick={() => setIsAddNewOpen(!isAddNewOpen)}
                    className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium"
                  >
                    <Plus size={16} />
                    <span>Add new</span>
                    <ChevronDown size={14} />
                  </button>

                  {isAddNewOpen && (
                    <div className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 z-50 text-sm py-1">
                      <div onClick={handleDocumentClick} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">Document</div>
                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">Proof</div>

                      <div className="group relative px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200 flex justify-between items-center">
                        <span>Google File</span>
                        <ChevronRight size={14} />

                        {/* Submenu */}
                        <div className="hidden group-hover:block absolute left-full top-0 w-48 bg-white dark:bg-gray-800 rounded shadow-lg border border-gray-200 dark:border-gray-700 ml-0.5 py-1">
                          <div onClick={handleGoogleFileClick} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">Docs</div>
                          <div onClick={handleGoogleFileClick} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">Sheets</div>
                          <div onClick={handleGoogleFileClick} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">Slides</div>
                          <div onClick={handleGoogleFileClick} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">Drawings</div>
                        </div>
                      </div>

                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">Request a Document</div>
                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">Folder</div>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>

                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">From AEM LeapPoint Pro...</div>
                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">From EMEA - Portfolio/P...</div>
                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">From Box</div>
                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">From Dropbox</div>
                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">From Google Drive</div>
                      <div onClick={handleOneDriveClick} className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">From Microsoft OneDrive</div>
                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">From SharePoint (Graph ...</div>
                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">From Workfront Proof</div>

                      <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                      <div className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-700 dark:text-gray-200">Paste from Clipboard</div>
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-4 text-gray-500">
                  <div className="flex bg-gray-100 dark:bg-gray-800 rounded p-0.5">
                    <button className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm"><LayoutGrid size={16} /></button>
                    <button className="p-1 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-700 rounded shadow-sm"><List size={16} /></button>
                    <button className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded shadow-sm"><Columns size={16} /></button>
                  </div>
                  <div className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-medium text-sm cursor-pointer">
                    <ArrowUpDown size={14} />
                    <span>Date Modified</span>
                    <ChevronDown size={12} />
                  </div>
                </div>
              </div>

              {/* Split View */}
              <div className="flex-1 flex">
                {/* Left Pane (Folders) */}
                <div className="w-1/4 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col">
                  <div className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide flex justify-between items-center">
                    <span>Folders</span>
                    <div className="flex space-x-2">
                      <ChevronDown size={12} className="cursor-pointer rotate-90" />
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    <div className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                      <ChevronDown size={14} className="mr-1 text-gray-400" />
                      <span className="font-semibold text-xs text-gray-500 uppercase">Task Folders (0)</span>
                    </div>
                  </div>
                </div>

                {/* Right Pane (Files - Empty) */}
                <div className="flex-1 bg-white dark:bg-gray-900 p-6">
                  {documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                      <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-3">
                        <FileText size={32} />
                      </div>
                      <p className="text-sm">No documents found</p>
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3 px-2">Task Folders ({documents.length})</div>
                      <div className="bg-white dark:bg-gray-900">
                        {documents.map(doc => (
                          <div
                            key={doc.id}
                            onClick={() => setSelectedDocument(doc)}
                            className="flex items-start p-3 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800 group cursor-pointer"
                          >
                            <div className="mr-3 mt-0.5">
                              <FileText size={24} className="text-gray-400" strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-semibold text-blue-600 dark:text-blue-400 truncate group-hover:underline">{doc.name}</h4>
                              <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                <span>Added {doc.date} by {doc.user}</span>
                                <span>-</span>
                                <span className="text-blue-600 dark:text-blue-400 hover:underline">Comment</span>
                              </div>
                            </div>
                            <div className="hidden group-hover:flex items-center space-x-2 text-gray-400">
                              <button className="p-1 hover:text-gray-600 dark:hover:text-gray-300"><MessageSquare size={14} /></button>
                              <button className="p-1 hover:text-gray-600 dark:hover:text-gray-300"><MoreHorizontal size={14} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              {/* Messages/Modals */}
              {isGoogleDriveModalOpen && (
                <GoogleDriveModal
                  onClose={() => setIsGoogleDriveModalOpen(false)}
                  onAuthorize={() => setIsGoogleDriveModalOpen(false)}
                />
              )}
              {isOneDriveModalOpen && (
                <OneDriveModal
                  onClose={() => setIsOneDriveModalOpen(false)}
                  onAuthorize={() => setIsOneDriveModalOpen(false)}
                />
              )}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
              />

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ProjectDetailView_DEPRECATED = ({ onBack, project }) => { // Accept project prop
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [projectName, setProjectName] = useState(project?.name || "Untitled Project"); // Use synced name with fallback
  const [activeTab, setActiveTab] = useState('tasks'); // Add activeTab state

  // Use synced documents if available
  const documents = project?.documents || [];

  const handleCreateTask = (newTask) => {
    setTasks([...tasks, newTask]);
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setProjectName(newName);
    // Sync to Interact Console
    document.cookie = "omnify_project_name_trigger=" + encodeURIComponent(newName) + "; path=/; max-age=60";
  };

  if (selectedTask) {
    return <TaskDetailView task={selectedTask} onBack={() => setSelectedTask(null)} />;
  }

  const SIDEBAR_ITEMS = [
    { id: 'updates', label: 'Updates', icon: MessageSquare },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'details', label: 'Task Details', icon: List },
    { id: 'subtasks', label: 'Subtasks', icon: CheckSquare },
    { id: 'issues', label: 'Issues (0)', icon: AlertTriangle },
    { id: 'hours', label: 'Hours', icon: Clock },
    { id: 'approvals', label: 'Approvals', icon: CheckCircle },
    { id: 'expenses', label: 'Expenses', icon: DollarSign },
    { id: 'bookings', label: 'Bookings', icon: ArrowRightFromLine },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      <NewTaskModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onCreate={handleCreateTask}
      />
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 bg-white dark:bg-gray-800 z-10">
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
          <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300">PROJECT</span>
          <span className="font-medium text-gray-700 dark:text-gray-300">{projectName}</span>
        </div>

        <div className="flex items-center space-x-4 mb-4">
          <div className="w-10 h-10 bg-purple-600 rounded flex items-center justify-center text-white shrink-0">
            <CheckSquare size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-gray-500 uppercase">PROJECT</span>
            </div>
            <input
              type="text"
              value={projectName}
              onChange={handleNameChange}
              className="text-2xl font-bold text-gray-900 dark:text-white bg-transparent border-none focus:ring-0 p-0 w-full"
            />
          </div>
          <div className="flex items-center space-x-2">
            <button className="px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-full text-sm font-medium text-gray-700 dark:text-gray-200 transition-colors">
              Share
            </button>
            <button className="p-1 text-gray-400 hover:text-gray-600">
              <MoreHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center space-x-12 text-sm">
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Percent Complete</div>
            <div className="font-medium text-gray-900 dark:text-gray-200">0%</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Project Owner</div>
            <div className="flex items-center space-x-2 font-medium">
              <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                <User size={12} className="text-gray-500 dark:text-gray-300" />
              </div>
              <span className="text-gray-900 dark:text-gray-200">{project?.owner || "Jimmie Miller"}</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Planned Completion Date</div>
            <div className="font-medium text-gray-900 dark:text-gray-200">{project?.due || "Dec 1, 2025"}</div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Condition</div>
            <div className="flex items-center space-x-1 font-medium">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-900 dark:text-gray-200">On Target</span>
            </div>
          </div>
          <div>
            <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Status</div>
            <div className="flex items-center space-x-1 font-medium">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <span className="text-gray-900 dark:text-gray-200">{project?.status || "Planning"}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col overflow-y-auto">
          <div className="flex items-center text-gray-500 hover:text-gray-700 px-6 py-3 text-sm cursor-pointer" onClick={onBack}>
            <ArrowLeft size={14} className="mr-2" />
            <span>Documents</span>
          </div>

          <div className="px-4 py-2">
            {SIDEBAR_ITEMS.map((item) => (
              <div
                key={item.id}
                onClick={() => setActiveTab(item.id === 'details' ? 'tasks' : item.id)}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-md text-sm font-medium cursor-pointer transition-colors ${(activeTab === item.id || (activeTab === 'tasks' && item.id === 'details'))
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white border-l-4 border-gray-900 dark:border-white pl-3'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white border-l-4 border-transparent pl-3'
                  }`}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-gray-900 overflow-hidden">

          {activeTab === 'tasks' && (
            <div className="h-full flex flex-col">
              {/* Task Toolbar */}
              <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <button className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 font-medium text-sm">
                    <Plus size={16} />
                    <span>Add new</span>
                    <ChevronDown size={14} />
                  </button>
                </div>

                {/* Right Toolbar Items (Search, Board, etc.) */}
                <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                  <Search size={18} className="cursor-pointer" />
                  <div className="flex items-center space-x-2 border-l border-gray-300 dark:border-gray-600 pl-4">
                    <LayoutGrid size={16} />
                    <span>Board</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ArrowRightFromLine size={16} className="rotate-90" />
                    <span>Gantt</span>
                  </div>
                  <div className="flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 px-2 py-1 rounded shadow-sm text-gray-900 dark:text-white">
                    <User size={14} />
                    <span className="font-medium">Bulk Assignments</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Filter size={14} />
                    <span>Filters</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye size={14} />
                    <span>Standard</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <LayoutGrid size={14} />
                    <span>Nothing</span>
                  </div>
                </div>
              </div>

              {/* Task List Header */}
              <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2 grid grid-cols-12 text-xs font-semibold text-gray-500 dark:text-gray-400">
                {/* ... header columns ... */}
                <div className="col-span-1 flex items-center space-x-2">
                  <input type="checkbox" className="rounded border-gray-300" />
                  <span>#</span>
                </div>
                <div className="col-span-4">Task Name</div>
                <div className="col-span-2">Assignments</div>
                <div className="col-span-1">Duration</div>
                <div className="col-span-1">Pln Hrs</div>
                <div className="col-span-1">Predecessors</div>
                <div className="col-span-1">Start On</div>
                <div className="col-span-1">Due On</div>
              </div>

              {/* Task List Content */}
              {tasks.length > 0 ? (
                <div className="flex-1 overflow-y-auto">
                  {tasks.map((task, index) => (
                    <div key={task.id} className="grid grid-cols-12 items-center px-6 py-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-sm">
                      <div className="col-span-1 flex items-center space-x-2">
                        <span className="text-gray-500 dark:text-gray-400">{index + 1}</span>
                      </div>
                      <div
                        className="col-span-4 font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline truncate pr-4"
                        onClick={() => setSelectedTask(task)}
                      >
                        {task.name}
                      </div>
                      <div className="col-span-2 flex items-center space-x-1 overflow-hidden">
                        {task.assignments.length > 0 ? (
                          task.assignments.map(a => (
                            <div key={a.id} className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 rounded-full pl-0.5 pr-2 py-0.5 max-w-full">
                              <div className={`w-5 h-5 rounded-full ${a.color} text-white flex items-center justify-center text-[9px] font-bold shrink-0`}>
                                {a.initials}
                              </div>
                              <span className="text-xs truncate">{a.name}</span>
                            </div>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs italic">Unassigned</span>
                        )}
                      </div>
                      <div className="col-span-1 text-gray-600 dark:text-gray-300">{task.duration}</div>
                      <div className="col-span-1 text-gray-600 dark:text-gray-300">{task.plannedHours}</div>
                      <div className="col-span-1 text-gray-400"></div>
                      <div className="col-span-1 text-gray-600 dark:text-gray-300">{task.startDate}</div>
                      <div className="col-span-1 text-gray-600 dark:text-gray-300">{task.dueDate}</div>

                    </div>
                  ))}
                  <div className="px-6 py-3">
                    <button
                      onClick={() => setIsNewTaskModalOpen(true)}
                      className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>Add More Tasks</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                  <div className="w-full px-6 py-3 border-b border-gray-100 dark:border-gray-800">
                    <button
                      onClick={() => setIsNewTaskModalOpen(true)}
                      className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center space-x-1"
                    >
                      <Plus size={14} />
                      <span>Start Adding Tasks</span>
                    </button>
                  </div>
                  <div className="flex-1 flex items-center justify-center pb-20">
                    Tasks will show here as you add them.
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="flex-1 p-6 bg-gray-50 dark:bg-gray-900/50 h-full overflow-y-auto">
              {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <FileText size={48} className="mb-4 text-gray-300" />
                  <p>No documents found for this project.</p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-sm bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    Documents ({documents.length})
                  </div>
                  {documents.map((doc, idx) => (
                    <div key={idx} className="flex items-center p-4 hover:bg-gray-50 dark:hover:bg-gray-800 border-b last:border-0 border-gray-100 dark:border-gray-800 cursor-pointer group">
                      <div className="mr-4">
                        <FileText size={24} className="text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400">{doc.name}</h4>
                        <div className="text-xs text-gray-500 mt-1">
                          {doc.date} • {doc.size} • Uploaded by {doc.user}
                        </div>
                      </div>
                      <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



// --- Timesheet Views ---

const TimesheetDetailView = ({ onBack }) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Detailed Header */}
      <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <button
          onClick={onBack}
          className="text-xs text-gray-500 dark:text-gray-400 hover:underline mb-2 flex items-center"
        >
          <ArrowLeft size={12} className="mr-1" />
          Back to timesheets
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center text-white">
              <FileText size={20} />
            </div>
            <div>
              <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">TIMESHEET</div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nov 23, 2025 - Nov 29, 2025</h1>
                <Star size={16} className="text-gray-400 cursor-pointer hover:text-yellow-400" />
              </div>
            </div>
          </div>

          <div className="flex space-x-12 text-sm">
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Owner</div>
              <div className="flex items-center space-x-2 font-medium">
                <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                  <User size={12} className="text-gray-500 dark:text-gray-300" />
                </div>
                <span className="text-gray-900 dark:text-gray-200">Jimmie Miller</span>
              </div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Total Hours</div>
              <div className="font-bold text-gray-900 dark:text-gray-200">0</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Overtime</div>
              <div className="font-bold text-gray-900 dark:text-gray-200">0</div>
            </div>
            <div>
              <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Status</div>
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-gray-700 dark:text-gray-300">Open</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inner Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Side Nav */}
        <div className="w-48 border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex flex-col pt-4">
          <div className="flex items-center px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600 font-medium text-sm cursor-pointer">
            <FileText size={16} className="mr-2" />
            Timesheet
          </div>
          <div className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium text-sm cursor-pointer mt-1">
            <MessageCircle size={16} className="mr-2" />
            Updates
          </div>
        </div>

        {/* Grid Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Action Bar */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
            <div className="flex items-center space-x-2">
              <button className="flex items-center space-x-1 text-blue-600 dark:text-blue-400 font-medium hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2 py-1 rounded">
                <Plus size={16} />
                <span>Add item</span>
                <ChevronDown size={14} />
              </button>
            </div>
            <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
              <Search size={18} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" />

              <div className="flex items-center space-x-2 cursor-pointer">
                <div className="relative inline-block w-8 h-4 align-middle select-none transition duration-200 ease-in">
                  <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-4 h-4 rounded-full bg-white border-4 appearance-none cursor-pointer" />
                  <label htmlFor="toggle" className="toggle-label block overflow-hidden h-4 rounded-full bg-gray-300 cursor-pointer"></label>
                </div>
                <span className="text-xs font-medium">Show comments</span>
              </div>

              <Maximize size={16} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" />

              <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 cursor-pointer border-l pl-4 dark:border-gray-600">
                <PanelRight size={16} />
                <span className="text-xs font-medium">Open Summary</span>
              </div>
            </div>
          </div>

          {/* The Spreadsheet Grid */}
          <div className="flex-1 overflow-auto bg-white dark:bg-gray-800">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 bg-gray-50 dark:bg-gray-700 z-10 text-gray-500 dark:text-gray-300 font-semibold border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="py-2 pl-4 w-64 border-r border-gray-100 dark:border-gray-600">
                    <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-800 dark:hover:text-white">
                      <ChevronDown size={14} />
                      <span>Name</span>
                    </div>
                  </th>
                  <th className="py-2 px-2 w-24 border-r border-gray-100 dark:border-gray-600">Hour Type</th>

                  {/* Days Header */}
                  <th className="py-1 px-1 border-r border-gray-100 dark:border-gray-600 text-center" colSpan={7}>
                    <div className="border-b border-gray-200 dark:border-gray-600 pb-1 mb-1 text-[10px]">Nov 23 - 29</div>
                    <div className="grid grid-cols-7">
                      {WEEK_DAYS.map((d, i) => (
                        <div key={i} className="text-center px-1">
                          <div className="font-normal">{d.day}</div>
                          <div className="font-bold">{d.date}</div>
                        </div>
                      ))}
                    </div>
                  </th>

                  <th className="py-2 px-2 w-16 text-center font-bold">Totals</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {TIMESHEET_ROWS.map((row, idx) => (
                  <tr key={idx} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300">
                    <td className="py-2 pl-8 border-r border-gray-100 dark:border-gray-700 truncate max-w-[200px]">{row}</td>
                    <td className="border-r border-gray-100 dark:border-gray-700"></td>

                    {/* Input Cells */}
                    <td colSpan={7} className="p-0 border-r border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-7 h-full">
                        {WEEK_DAYS.map((_, i) => (
                          <div key={i} className="border-r border-gray-100 dark:border-gray-700 h-full p-1">
                            <input type="text" className="w-full h-full border border-blue-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded text-center focus:outline-none focus:ring-1 focus:ring-blue-500" />
                          </div>
                        ))}
                      </div>
                    </td>

                    <td className="bg-gray-50 dark:bg-gray-700 text-center text-gray-500 dark:text-gray-300">0.00</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Grid Footer */}
          <div className="bg-gray-100 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600 p-2 text-right">
            <span className="text-xs font-bold mr-4 text-gray-800 dark:text-gray-200">Total: 0.00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const TimesheetListPage = ({ onViewDetail }) => {
  return (
    <div className="p-6">
      {/* Page Title & Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center text-white">
            <FileClock size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Timesheets</h1>
        </div>

        <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-full inline-flex self-start md:self-auto">
          <button className="px-4 py-1.5 rounded-full text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors flex items-center">
            <Check size={14} className="mr-1 text-gray-400" />
            My Timesheet Approvals
          </button>
          <button className="px-4 py-1.5 rounded-full text-sm font-medium bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 shadow-sm flex items-center">
            <Check size={14} className="mr-1 text-blue-600 dark:text-blue-400" />
            My Timesheets
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 cursor-pointer">
            <ArrowRightFromLine size={20} className="rotate-180" />
            <ChevronDown size={14} />
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <Search size={20} className="text-gray-400 hover:text-gray-600 cursor-pointer" />

          <div className="flex items-center space-x-1 bg-gray-200 dark:bg-gray-700 px-3 py-1.5 rounded text-sm text-gray-700 dark:text-gray-200 font-medium cursor-pointer hover:bg-gray-300 dark:hover:bg-gray-600">
            <span className="font-bold">3</span>
            <span>Filters</span>
          </div>

          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer px-2">
            <Eye size={18} />
            <span className="text-sm font-medium">Standard</span>
          </div>

          <div className="flex items-center space-x-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 cursor-pointer px-2">
            <LayoutGrid size={18} />
            <span className="text-sm font-medium">Nothing</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-sm overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold">
              <th className="py-3 pl-4 w-10">
                <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
              </th>
              <th className="py-3 px-4">Date Range</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4">Total Hours</th>
              <th className="py-3 px-4">Overtime</th>
              <th className="py-3 px-4">Approvers</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 bg-white dark:bg-gray-800">
            {TIMESHEETS_DATA.map((ts, idx) => (
              <tr key={idx} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20">
                <td className="py-3 pl-4">
                  <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                </td>
                <td
                  className="py-3 px-4 text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer"
                  onClick={onViewDetail}
                >
                  {ts.range}
                </td>
                <td className="py-3 px-4 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">{ts.owner}</td>
                <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{ts.hours}</td>
                <td className="py-3 px-4 text-gray-800 dark:text-gray-200">{ts.overtime}</td>
                <td className="py-3 px-4 flex items-center space-x-2">
                  <User size={14} className="text-blue-500" />
                  <span className="text-gray-700 dark:text-gray-300">{ts.approver}</span>
                </td>
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300">{ts.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="bg-white dark:bg-gray-800 p-3 border-t border-gray-200 dark:border-gray-700 text-right text-xs text-gray-400">
          Showing {TIMESHEETS_DATA.length} timesheets
        </div>
      </div>
    </div>
  );
};

// --- Program View ---

const ProgramView = ({ onBack }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex bg-white dark:bg-gray-800 h-full relative group/sidebar">
      {/* Sidebar */}
      <div
        className={`${isSidebarOpen ? 'w-64 opacity-100' : 'w-0 opacity-0'} transition-all duration-300 ease-in-out bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col hidden lg:flex overflow-hidden relative shrink-0`}
      >
        <div className="min-w-[16rem] h-full flex flex-col">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-bold">
              <ArrowLeft size={16} className="cursor-pointer" onClick={onBack} />
              <span>Projects</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto py-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600 px-4 py-2 text-sm font-medium flex items-center space-x-3 cursor-pointer">
              <Layout size={16} />
              <span>Projects</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-2 text-sm font-medium flex items-center space-x-3 cursor-pointer">
              <FileText size={16} />
              <span>Program Details</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-2 text-sm font-medium flex items-center space-x-3 cursor-pointer">
              <MessageSquare size={16} />
              <span>Updates</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-2 text-sm font-medium flex items-center space-x-3 cursor-pointer">
              <FileText size={16} />
              <span>Documents</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-2 text-sm font-medium flex items-center space-x-3 cursor-pointer">
              <MessageCircle size={16} />
              <span>Planning</span>
            </div>
            <div className="text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 px-6 py-2 text-sm font-medium flex items-center space-x-3 cursor-pointer">
              <LayoutGrid size={16} />
              <span>Hierarchy</span>
            </div>
          </div>
        </div>
      </div>

      {/* Toggle Button */}
      <div className="hidden lg:block absolute z-20 top-4 transition-all duration-300" style={{ left: isSidebarOpen ? '15.5rem' : '0.5rem' }}>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-full flex items-center justify-center shadow-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
        >
          <ChevronRight size={12} className={`transform transition-transform duration-300 ${isSidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-4">
          {/* Breadcrumbs */}
          <div className="flex items-center space-x-2 text-xs text-gray-500 mb-3">
            <span className="cursor-pointer hover:underline">More</span>
            <ChevronRight size={12} />
            <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300">PORTFOLIO</span>
            <span className="font-medium text-gray-700 dark:text-gray-300">Omni Platforms Gro...</span>
            <span className="text-gray-400">|</span>
            <span className="bg-gray-100 dark:bg-gray-700 px-1 rounded text-gray-600 dark:text-gray-300">PROGRAM</span>
            <span className="font-medium text-gray-900 dark:text-white">LP Omni</span>
          </div>

          {/* Title Row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 bg-orange-500 rounded flex items-center justify-center text-white shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">PROGRAM</div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">LP Omni</h1>
                  <Star size={18} className="text-gray-400 cursor-pointer hover:text-yellow-400" />
                  <button className="px-3 py-0.5 border border-gray-300 dark:border-gray-600 rounded-full text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Share</button>
                  <MoreHorizontal size={16} className="text-gray-400 cursor-pointer" />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Percent Complete</div>
                <div className="font-medium text-gray-900 dark:text-gray-200">0%</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Program Manager</div>
                <div className="flex items-center space-x-2 font-medium">
                  <div className="w-5 h-5 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center overflow-hidden">
                    <User size={12} className="text-gray-500 dark:text-gray-300" />
                  </div>
                  <span className="text-gray-900 dark:text-gray-200">Erin Furrow</span>
                </div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Planned Completion Date</div>
                <div className="font-medium text-gray-900 dark:text-gray-200">N/A</div>
              </div>
              <div>
                <div className="text-gray-500 dark:text-gray-400 text-xs mb-1">Active Projects Condition</div>
                <div className="flex space-x-3 text-xs">
                  <div className="text-green-600 dark:text-green-400 font-bold">
                    0%
                    <div className="text-[10px] font-normal text-gray-400">On Target</div>
                  </div>
                  <div className="text-orange-500 font-bold">
                    0%
                    <div className="text-[10px] font-normal text-gray-400">At Risk</div>
                  </div>
                  <div className="text-red-500 font-bold">
                    0%
                    <div className="text-[10px] font-normal text-gray-400">In Trouble</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Project List Area */}
        <div className="flex-1 flex flex-col bg-gray-50 dark:bg-gray-900/50">
          {/* Toolbar */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700 flex flex-wrap justify-between items-center bg-white dark:bg-gray-800 gap-4">
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-1 text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white font-medium">
                <Plus size={16} />
                <span>New Project</span>
                <ChevronDown size={14} />
              </button>
            </div>

            <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
              <Search size={18} className="cursor-pointer" />
              <div className="flex items-center space-x-2 text-sm font-medium">
                <Layout size={16} className="rotate-90" />
                <span>Gantt</span>
              </div>
              <div className="flex items-center space-x-1 text-sm font-medium">
                <Filter size={14} />
                <span>Projects I'm On</span>
              </div>
              <div className="flex items-center space-x-1 text-sm font-medium">
                <Eye size={14} />
                <span>Standard</span>
              </div>
              <div className="flex items-center space-x-1 text-sm font-medium">
                <LayoutGrid size={14} />
                <span>Nothing</span>
              </div>
            </div>
          </div>

          {/* Table Header */}
          <div className="bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center">
            <div className="w-8 ml-2">
              <input type="checkbox" className="rounded border-gray-300" />
            </div>
            <div className="flex-1 grid grid-cols-12 gap-4 pl-2">
              <div className="col-span-4">Name</div>
              <div className="col-span-2">Owner</div>
              <div className="col-span-2">Desc</div>
              <div className="col-span-1">Start On</div>
              <div className="col-span-1">Due On</div>
              <div className="col-span-2 text-right pr-4">% Complete</div>
            </div>
          </div>

          {/* Empty State */}
          <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-400 dark:text-gray-500 mb-1">All Projects</h3>
              <p className="text-gray-400 dark:text-gray-500">There aren't any projects yet.</p>
              <p className="text-gray-400 dark:text-gray-500">Click the New Project button to get started.</p>
            </div>
            {/* Visual placeholder for empty state if needed, but text matches screenshot */}
          </div>

          {/* Bottom Resize Handle */}
          <div className="h-4 flex justify-center items-center cursor-ns-resize opacity-0 hover:opacity-100">
            <div className="w-10 h-1 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main Application ---

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'timesheets' | 'timesheet-detail' | 'project-detail'
  const [selectedProject, setSelectedProject] = useState(null);
  const [widgets, setWidgets] = useState(['my-approvals', 'projects', 'mentions', 'todos']);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotification, setShowNotification] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setWidgets((items) => {
        const oldIndex = items.indexOf(active.id);
        const newIndex = items.indexOf(over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const renderWidget = (id) => {
    switch (id) {
      case 'my-approvals': return <MyApprovalsWidget dragHandleProps={{}} />;
      case 'projects':
        return (
          <MyProjectsWidget
            onNavigate={(view, project) => {
              if (project) {
                setSelectedProject(project);
              }
              setCurrentView(view);
            }}
          />
        );
      case 'mentions': return <MentionsWidget />;
      case 'todos': return <TodosWidget />;
      default: return null;
    }
  };

  const renderMainContent = () => {
    switch (currentView) {
      case 'dashboard':
        return (
          <>
            {/* Hero Section */}
            <div className="bg-gradient-to-r from-[#8B7FE8] to-[#6BCFEF] p-6 pb-20 text-white relative flex flex-col md:flex-row justify-between items-start gap-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold tracking-tight">Good morning, Jimmie</h1>
              </div>

              {/* Error Alert Box */}
              {showNotification && (
                <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 p-4 rounded shadow-lg border-l-4 border-red-500 flex items-start space-x-3 max-w-lg animate-in fade-in slide-in-from-right-4 duration-500 relative group z-20">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={20} />
                  <div>
                    <h3 className="font-bold text-sm">The Home Workspace service is currently unavailable</h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 leading-relaxed pr-8">
                      Workspace customization has been disabled, changes to this workspace will not be saved.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNotification(false)}
                    className="absolute top-2 right-2 p-1 text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                    aria-label="Close notification"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}

              <div className="absolute top-6 right-6 flex items-center space-x-3">
                <HelpCircle size={20} className="opacity-80 hover:opacity-100 cursor-pointer" />
                <button className="bg-white/20 hover:bg-white/30 text-white border border-white/40 px-3 py-1.5 rounded-full text-sm font-medium flex items-center space-x-1 backdrop-blur-sm transition-colors">
                  <div className="w-3 h-3 bg-white rounded-full opacity-80 mr-1"></div>
                  <span>Customize</span>
                </button>
              </div>
            </div>

            {/* Dashboard Grid - Draggable */}
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={widgets}
                strategy={rectSortingStrategy}
              >
                <div className="p-4 -mt-14 grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-[1600px] mx-auto pb-10 relative z-10 bg-gray-50/0">
                  {widgets.map((id) => (
                    <SortableItem key={id} id={id} className={`${id === 'my-approvals' ? 'lg:col-span-2' : ''} ${id === 'todos' ? 'lg:col-span-1' : ''}`}>
                      {renderWidget(id)}
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </>
        );
      case 'timesheets':
        return <TimesheetListPage onViewDetail={() => setCurrentView('timesheet-detail')} />;
      case 'timesheet-detail':
        return <TimesheetDetailView onBack={() => setCurrentView('timesheets')} />;
      case 'project-detail':
        return <ProjectDetailView project={selectedProject} onBack={() => setCurrentView('dashboard')} />;
      case 'program':
        return <ProgramView onBack={() => setCurrentView('dashboard')} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900 font-sans text-slate-800 dark:text-slate-200 overflow-hidden transition-colors duration-200">
      {/* Sidebar Navigation */}
      <div className="w-14 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col items-center py-4 space-y-6 z-20 shadow-sm transition-colors duration-200">
        <div className="text-red-600 font-bold text-xl cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
            <path d="M12 2L2 22h20L12 2zm0 3.5L18.5 20h-13L12 5.5z" />
          </svg>
        </div>
        <button
          className={`p-2 rounded transition-colors ${currentView === 'dashboard' ? 'text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
          onClick={() => setCurrentView('dashboard')}
        >
          <Home size={20} />
        </button>
        <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
          <Layout size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden relative">

        {/* Top Header Bar */}
        <header className="h-12 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 z-10 text-sm whitespace-nowrap overflow-x-auto no-scrollbar transition-colors duration-200">
          <div className="flex items-center space-x-4">
            <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <Menu size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center text-gray-600 dark:text-gray-400 font-medium space-x-4 text-xs md:text-sm">
              <span
                className={`font-bold cursor-pointer hover:text-black dark:hover:text-white transition-colors ${currentView === 'program' ? 'text-black dark:text-white border-b-2 border-black dark:border-white pb-[14px] mt-[14px]' : ''}`}
                onClick={() => setCurrentView('program')}
              >
                Program
              </span>
              <span
                className={`font-bold cursor-pointer hover:text-black dark:hover:text-white transition-colors ${currentView.includes('timesheet') ? 'text-black dark:text-white border-b-2 border-black dark:border-white pb-[14px] mt-[14px]' : ''}`}
                onClick={() => setCurrentView('timesheets')}
              >
                Timesheets
              </span>
              <span className="font-bold hover:text-black dark:hover:text-white cursor-pointer">My Billable Hours</span>
              <span className="font-bold hover:text-black dark:hover:text-white cursor-pointer hidden md:inline">CVS Group PLC | Mar...</span>
              <span className="font-bold hover:text-black dark:hover:text-white cursor-pointer hidden lg:inline">Newell Brands | Mar...</span>
              <span className="font-bold hover:text-black dark:hover:text-white cursor-pointer hidden xl:inline">Omnicom | Omnicom...</span>

              <div className="flex items-center space-x-1 cursor-pointer hover:text-gray-900 dark:hover:text-white ml-2">
                <Pin size={14} className="rotate-45" />
                <span>{currentView.includes('timesheet') ? 'Unpin current page' : 'Pin current page'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 ml-4">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="w-8 h-8 bg-blue-600 rounded text-white text-xs font-bold flex items-center justify-center shadow-sm">28</div>
            <div className="flex items-center space-x-3 text-gray-500 dark:text-gray-400">
              <MessageSquare size={18} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" />
              <HelpCircle size={18} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" />
              <div className="relative">
                <Bell size={18} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" />
              </div>
              <Search size={18} className="cursor-pointer hover:text-gray-700 dark:hover:text-gray-200" />
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-white dark:bg-gray-900 transition-colors duration-200">
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}
