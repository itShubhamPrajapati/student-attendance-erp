import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Shield, School, GraduationCap, ArrowRight, CheckCircle2, Sparkles, Terminal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConnectionStatus } from '../components/ConnectionStatus';

const FluidGlass = lazy(() =>
  import('../components/effects/FluidGlass').then((m) => ({ default: m.FluidGlass }))
);

export const LandingPage: React.FC = () => {
  const roleCards = [
    {
      title: 'Administrator Portal',
      role: 'admin',
      path: '/admin',
      icon: <Shield className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />,
      badge: 'Admin Workspace',
      badgeVariant: 'info' as const,
      description: 'Manage students, faculty members, subjects, classrooms, and system-wide attendance reports.',
      stats: ['Student Directory', 'Teacher Allocation', 'Batch Management', 'Audit Overview'],
    },
    {
      title: 'Teacher & Faculty',
      role: 'teacher',
      path: '/teacher',
      icon: <School className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      badge: 'Faculty Workspace',
      badgeVariant: 'warning' as const,
      description: 'Launch real-time QR attendance sessions, track lecture attendance, and generate classroom summaries.',
      stats: ['Today\'s Lectures', 'Live QR Sessions', 'Manual Override', 'Export Attendance'],
    },
    {
      title: 'Student Portal',
      role: 'student',
      path: '/student',
      icon: <GraduationCap className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      badge: 'Student Workspace',
      badgeVariant: 'success' as const,
      description: 'Check your overall attendance percentage, scan lecture QR codes, and view your attendance timeline.',
      stats: ['Scan QR Code', 'Attendance % Tracker', 'Subject Breakdown', 'Attendance History'],
    },
  ];

  return (
    <div className="space-y-10 py-4 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section with Liquid Glass & FluidGlass 3D Backdrop */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950/90 via-slate-900/95 to-slate-950 p-6 sm:p-10 lg:p-12 text-white shadow-xl border border-white/10 dark:border-white/10 backdrop-blur-2xl">
        {/* 3D FluidGlass Ambient Hero Element (Desktop only, lazy-loaded) */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[340px] h-[340px] lg:w-[420px] lg:h-[420px] pointer-events-none hidden md:block opacity-80">
          <Suspense fallback={<div className="w-full h-full rounded-full bg-indigo-500/10 blur-3xl" />}>
            <FluidGlass mode="lens" className="w-full h-full" />
          </Suspense>
        </div>

        <div className="relative z-10 max-w-2xl space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1 text-xs font-semibold text-indigo-300 backdrop-blur-md border border-indigo-400/30 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
            <span>Enterprise Academic Platform</span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
            QR-Based Student Attendance Management System
          </h1>

          <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-xl font-light">
            A fast, modern, and reliable college attendance ERP. Built with Go, Gin, GORM, PostgreSQL and React, TypeScript, Tailwind CSS with liquid glass design.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Link to="/login">
              <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30">
                <span>Open Login Interface</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/admin">
              <Button variant="glass" size="lg" className="text-white border-white/20 hover:bg-white/10">
                <span>Explore Dashboards</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Developer Environment & Health Check Section */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white font-heading">
              Environment & Connection Verification
            </h2>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">System Health</span>
        </div>

        <ConnectionStatus />
      </section>

      {/* Role-Based Dashboards Preview Grid */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white font-heading">
            Role-Based Workspaces
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Select your academic role to access specialized features, live attendance, and reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {roleCards.map((card) => (
            <Card key={card.role} variant="glass" hoverEffect className="flex flex-col justify-between">
              <div>
                <CardHeader className="flex-row items-center justify-between pb-3 border-b border-slate-200/50 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-white/10 flex items-center justify-center shadow-xs">
                      {card.icon}
                    </div>
                    <div>
                      <CardTitle className="text-base">{card.title}</CardTitle>
                      <CardDescription>Academic Workspace</CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-3">
                  <Badge variant={card.badgeVariant} withDot>
                    {card.badge}
                  </Badge>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {card.description}
                  </p>

                  <div className="pt-2 border-t border-slate-200/50 dark:border-white/5">
                    <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Core Capabilities:
                    </p>
                    <ul className="space-y-1.5">
                      {card.stats.map((stat) => (
                        <li key={stat} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400 flex-shrink-0" />
                          <span>{stat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-200/50 dark:border-white/5">
                <Link to={card.path} className="block">
                  <Button variant="outline" size="sm" className="w-full justify-between group">
                    <span>Access {card.title}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition" />
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Tech Stack Specs */}
      <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 font-heading">
          Technical Architecture (Phase 1 Foundation)
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Frontend</span>
            <span className="text-slate-500 dark:text-slate-400">React + Vite + TypeScript + Tailwind</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Backend</span>
            <span className="text-slate-500 dark:text-slate-400">Go + Gin Web Framework</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Database</span>
            <span className="text-slate-500 dark:text-slate-400">PostgreSQL + GORM Driver</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
            <span className="font-semibold text-slate-700 dark:text-slate-200 block mb-1">Security Model</span>
            <span className="text-slate-500 dark:text-slate-400">JWT & bcrypt Architecture-Ready</span>
          </div>
        </div>
      </section>
    </div>
  );
};
