import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';
import { Button } from '../components/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-4 shadow-sm">
        <AlertCircle className="w-8 h-8" />
      </div>

      <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 mb-1">
        Error 404
      </span>

      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-heading tracking-tight">
        Page Not Found
      </h1>

      <p className="mt-2 text-sm text-slate-500 max-w-md">
        The route you are trying to access does not exist or has moved. Use the buttons below to return to the application.
      </p>

      <div className="mt-6 flex items-center gap-3">
        <Link to="/">
          <Button leftIcon={<Home className="w-4 h-4" />}>
            Return Home
          </Button>
        </Link>
        <Link to="/login">
          <Button variant="outline" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Go to Login
          </Button>
        </Link>
      </div>
    </div>
  );
};
