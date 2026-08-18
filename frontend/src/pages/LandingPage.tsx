import React from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  School,
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  Terminal,
  QrCode,
  Award,
  Zap,
  Activity,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { ConnectionStatus } from '../components/ConnectionStatus';
import { LiveQrHeroVisual } from '../components/effects/LiveQrHeroVisual';

export const LandingPage: React.FC = () => {
  const roleCards = [
    {
      title: 'Administrator Portal',
      role: 'admin',
      path: '/admin',
      icon: <Shield className="w-6 h-6 text-[#4648d4] dark:text-indigo-400" />,
      badge: 'Admin Workspace',
      badgeVariant: 'primary' as const,
      description: 'Institutional governance, faculty & student directories, academic terms, and audit-ready attendance reporting.',
      stats: ['Student Directory', 'Teacher Allocation', 'Batch Management', 'Audit Overview'],
    },
    {
      title: 'Teacher & Faculty',
      role: 'teacher',
      path: '/teacher',
      icon: <School className="w-6 h-6 text-[#6b38d4] dark:text-purple-400" />,
      badge: 'Faculty Workspace',
      badgeVariant: 'secondary' as const,
      description: 'Launch real-time dynamic QR sessions, track live attendance check-ins, and inspect student engagement.',
      stats: ['Today\'s Lectures', 'Live QR Sessions', 'Manual Override', 'Export Attendance'],
    },
    {
      title: 'Student Portal',
      role: 'student',
      path: '/student',
      icon: <GraduationCap className="w-6 h-6 text-[#006c49] dark:text-emerald-400" />,
      badge: 'Student Workspace',
      badgeVariant: 'tertiary' as const,
      description: 'Scan lecture QR codes, monitor attendance health & standing, view calendar timeline, and download official proofs.',
      stats: ['Scan QR Code', 'Attendance % Tracker', 'Subject Breakdown', 'Attendance History'],
    },
  ];

  const coreFeatures = [
    {
      icon: <QrCode className="w-6 h-6 text-[#4648d4] dark:text-indigo-400" />,
      title: 'Dynamic Cryptography',
      desc: 'QR codes regenerate automatically with SHA-256 signatures, making screenshots and proxy sharing mathematically impossible.',
    },
    {
      icon: <Activity className="w-6 h-6 text-[#6b38d4] dark:text-purple-400" />,
      title: 'Real-Time Analytics',
      desc: 'Instant dashboard telemetry for faculty. Identify at-risk students falling below mandatory 75% attendance thresholds.',
    },
    {
      icon: <Zap className="w-6 h-6 text-[#006c49] dark:text-emerald-400" />,
      title: 'Frictionless Experience',
      desc: 'Sub-second scan validation even in 500-seat lecture halls. Optimized for high-density campus Wi-Fi & cellular networks.',
    },
    {
      icon: <Award className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      title: 'Tamper-Proof Proofs',
      desc: 'Official digital attendance receipts with public cryptographic verification URLs for academic audits.',
    },
  ];

  return (
    <div className="space-y-10 sm:space-y-14 py-2 sm:py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Section: Live QR Attendance Hub */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#faf8ff] via-[#f2f3ff] to-[#e2e7ff] dark:from-[#0c1220] dark:via-[#111726] dark:to-[#171f33] p-6 sm:p-10 lg:p-12 border border-slate-200/80 dark:border-white/10 shadow-lg">
        {/* Ambient Hero Glows */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#6b38d4]/15 dark:bg-[#6b38d4]/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-[450px] h-[450px] rounded-full bg-[#4648d4]/15 dark:bg-[#4648d4]/20 blur-[140px] pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative z-10">
          {/* Left Column: Hero Copy & Actions */}
          <div className="lg:col-span-7 space-y-5 sm:space-y-6 text-center lg:text-left flex flex-col items-center lg:items-start">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 dark:bg-slate-800/80 px-3.5 py-1 text-xs font-semibold font-heading text-[#4648d4] dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800/60 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#4648d4] dark:bg-indigo-400 animate-pulse" />
              <span>Next-Gen Campus Attendance</span>
            </div>

            <h1 className="font-heading text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-[#131b2e] dark:text-white">
              Secure Campus <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#4648d4] via-[#6063ee] to-[#6b38d4]">
                Attendance. Simplified.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-[#464554] dark:text-slate-300 leading-relaxed max-w-xl font-normal">
              Eliminate proxy attendance with cryptographically secure, dynamic QR codes designed for modern higher education.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 w-full sm:w-auto">
              <Link to="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-[#4648d4] hover:bg-[#383ab6] text-white shadow-md shadow-[#4648d4]/30 px-7">
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
              <Link to="/admin" className="w-full sm:w-auto">
                <Button variant="container" size="lg" className="w-full sm:w-auto px-6">
                  <span>Explore Dashboards</span>
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Live QR Attendance Visual */}
          <div className="lg:col-span-5 flex items-center justify-center pt-2 lg:pt-0 w-full">
            <LiveQrHeroVisual />
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Banner */}
      <section className="w-full bg-[#4648d4] dark:bg-[#3b3dbb] text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
            <Shield className="w-6 h-6 text-white" />
          </div>

          <div>
            <h3 className="text-3xl sm:text-4xl font-black font-heading tracking-tight text-white">99.9%</h3>
            <p className="text-xs sm:text-sm text-indigo-100 font-medium mt-0.5">Accuracy in Attendance Tracking</p>
          </div>

          <div className="w-full max-w-md h-px bg-white/20 my-1" />

          <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
            <div className="text-center">
              <div className="font-heading text-2xl font-bold text-white">50k+</div>
              <div className="text-xs text-indigo-200">Daily Scans</div>
            </div>
            <div className="text-center border-l border-white/20">
              <div className="font-heading text-2xl font-bold text-white">120+</div>
              <div className="text-xs text-indigo-200">Campus Cohorts</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid: "Engineered for Accuracy" */}
      <section className="space-y-4">
        <div className="text-center max-w-lg mx-auto space-y-1">
          <h2 className="font-heading text-xl sm:text-2xl font-black text-[#131b2e] dark:text-white">
            Engineered for Accuracy
          </h2>
          <p className="text-xs sm:text-sm text-[#464554] dark:text-slate-400">
            High-integrity architecture designed for large-scale institutional lecture halls.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {coreFeatures.map((feat, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-[#111726]/95 shadow-xs hover:border-[#4648d4]/50 dark:hover:border-indigo-500/50 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-3 border border-slate-100 dark:border-slate-700 shadow-xs">
                  {feat.icon}
                </div>
                <h3 className="font-heading font-bold text-sm text-[#131b2e] dark:text-white mb-1.5">{feat.title}</h3>
                <p className="text-xs text-[#464554] dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role-Based Workspaces Grid */}
      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-[#131b2e] dark:text-white font-heading">
            Role-Based Workspaces
          </h2>
          <p className="text-xs text-[#464554] dark:text-slate-400">
            Select your academic role to access specialized features, live attendance, and reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {roleCards.map((card) => (
            <Card key={card.role} variant="solid" hoverEffect className="flex flex-col justify-between">
              <div>
                <CardHeader className="flex-row items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-white/10 flex items-center justify-center shadow-xs">
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

                  <p className="text-xs text-[#464554] dark:text-slate-300 leading-relaxed">
                    {card.description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                    <p className="text-[11px] font-semibold font-heading text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Core Capabilities:
                    </p>
                    <ul className="space-y-1.5">
                      {card.stats.map((stat) => (
                        <li key={stat} className="flex items-center gap-2 text-xs text-[#131b2e] dark:text-slate-300">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#4648d4] dark:text-indigo-400 flex-shrink-0" />
                          <span>{stat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
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

      {/* System Health & Connection Verification */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#4648d4] dark:text-indigo-400" />
            <h2 className="text-base font-bold text-[#131b2e] dark:text-white font-heading">
              Environment &amp; Connection Status
            </h2>
          </div>
          <span className="text-xs text-slate-400 dark:text-slate-500 font-mono font-heading">System Live Check</span>
        </div>

        <ConnectionStatus />
      </section>
    </div>
  );
};
