import React, { useState } from 'react';
import { Users, School, BookOpen, Layers, Plus, Search, Filter, Database } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { PageHeader } from '../components/PageHeader';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'students' | 'teachers' | 'subjects' | 'classes'>('students');

  const statCards = [
    { title: 'Registered Students', count: '120', status: 'Placeholder Schema', icon: <Users className="w-5 h-5 text-indigo-600" />, tab: 'students' as const },
    { title: 'Faculty Teachers', count: '14', status: 'Placeholder Schema', icon: <School className="w-5 h-5 text-amber-600" />, tab: 'teachers' as const },
    { title: 'Academic Subjects', count: '8', status: 'Placeholder Schema', icon: <BookOpen className="w-5 h-5 text-blue-600" />, tab: 'subjects' as const },
    { title: 'Class Batches', count: '6', status: 'Placeholder Schema', icon: <Layers className="w-5 h-5 text-emerald-600" />, tab: 'classes' as const },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <PageHeader
        title="Admin Management Console"
        description="Oversee college academic directories, course subjects, faculty allocations, and class batches."
        badge={
          <Badge variant="info" withDot>
            Admin Workspace
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" leftIcon={<Database className="w-3.5 h-3.5" />}>
              PostgreSQL Connected
            </Button>
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} disabled title="Activated in Phase 2">
              Add New Record
            </Button>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card
            key={card.title}
            hoverEffect
            className={`cursor-pointer transition-all ${
              activeTab === card.tab ? 'ring-2 ring-indigo-500/30 border-indigo-300' : ''
            }`}
            onClick={() => setActiveTab(card.tab)}
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
                {card.icon}
              </div>
              <Badge variant="neutral" className="text-[10px]">
                {card.status}
              </Badge>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-bold text-slate-900 font-heading">{card.count}</div>
              <div className="text-xs text-slate-500 mt-0.5">{card.title}</div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content Section with Tabs */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3 flex-row items-center justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="text-base font-bold capitalize">
              {activeTab} Management Directory
            </CardTitle>
            <CardDescription>
              Architectural model placeholder ready for GORM CRUD operations in Phase 2.
            </CardDescription>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            {(['students', 'teachers', 'subjects', 'classes'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${
                  activeTab === tab
                    ? 'bg-white text-indigo-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          {/* Action & Filter Mock Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-4">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                disabled
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed"
              />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <Button variant="outline" size="sm" disabled leftIcon={<Filter className="w-3.5 h-3.5" />}>
                Filter
              </Button>
            </div>
          </div>

          {/* Clean Academic Empty State for Placeholder Directory */}
          <EmptyState
            icon={
              activeTab === 'students' ? (
                <Users className="w-6 h-6" />
              ) : activeTab === 'teachers' ? (
                <School className="w-6 h-6" />
              ) : activeTab === 'subjects' ? (
                <BookOpen className="w-6 h-6" />
              ) : (
                <Layers className="w-6 h-6" />
              )
            }
            title={`No ${activeTab} registered yet`}
            description={`The database schema for ${activeTab} is prepared in GORM backend models. Live CRUD endpoints and data tables will be connected in Phase 2.`}
            badgeText="Phase 2 Scope"
          />
        </CardContent>
      </Card>
    </div>
  );
};
