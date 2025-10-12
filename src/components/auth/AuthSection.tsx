'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { LogIn, Package, Zap, Target } from 'lucide-react';

interface AuthSectionProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

export default function AuthSection({ onLogin }: AuthSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast.error('Please enter both username and password');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await onLogin(formData.username, formData.password);
      if (!success) {
        toast.error('Invalid credentials');
      }
    } catch {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl">
              <Target className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">AppTracker</h1>
          <p className="text-slate-600 dark:text-slate-400">Track your application lifecycle</p>
        </div>

        <Card className="shadow-lg border-slate-200 dark:border-slate-700">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Sign In</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={handleInputChange('username')}
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                  disabled={isLoading}
                  required
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing in...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn className="h-4 w-4" />
                    Sign In
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-2">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400 mx-auto" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Track Apps</p>
            </div>
            <div className="text-center">
              <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mb-2">
                <Zap className="h-6 w-6 text-green-600 dark:text-green-400 mx-auto" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Monitor Progress</p>
            </div>
            <div className="text-center">
              <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg mb-2">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400 mx-auto" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">Reach Goals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
