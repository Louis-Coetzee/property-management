'use client';

import { Wrench, Clock, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MaintenanceModeProps {
  message?: string;
}

export function MaintenanceMode({
  message = "We're currently performing scheduled maintenance to improve your experience. Please check back soon."
}: MaintenanceModeProps) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8">
          <div className="relative inline-block">
            <div className="bg-gradient-to-br from-orange-100 to-red-200 rounded-full p-8 shadow-lg">
              <Wrench className="h-20 w-20 text-orange-600 animate-pulse" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full w-10 h-10 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Site Under Maintenance
          </h1>
          <p className="text-xl text-gray-600 max-w-xl mx-auto leading-relaxed mb-8">
            {message}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <Card className="border-2 border-green-100 bg-green-50">
            <CardContent className="p-4 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-sm font-medium text-green-800">Database</div>
              <div className="text-xs text-green-600">Updated</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-100 bg-orange-50">
            <CardContent className="p-4 text-center">
              <RefreshCw className="h-8 w-8 text-orange-600 mx-auto mb-2 animate-spin" />
              <div className="text-sm font-medium text-orange-800">Security</div>
              <div className="text-xs text-orange-600">In Progress</div>
            </CardContent>
          </Card>

          <Card className="border-2 border-gray-100">
            <CardContent className="p-4 text-center">
              <Clock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm font-medium text-gray-600">Performance</div>
              <div className="text-xs text-gray-500">Queued</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 mb-8">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Expected Timeline
            </h3>
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">15</div>
                <div className="text-gray-600">minutes</div>
              </div>
              <div className="text-gray-400">•</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">95%</div>
                <div className="text-gray-600">complete</div>
              </div>
              <div className="text-gray-400">•</div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">3</div>
                <div className="text-gray-600">tasks left</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Button
            onClick={handleRefresh}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Check Again
          </Button>

          <p className="text-sm text-gray-500">
            Thank you for your patience while we make improvements to serve you better.
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Need immediate assistance?{' '}
            <a href="mailto:support@findaccommodation.co.za" className="text-blue-600 hover:underline">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
