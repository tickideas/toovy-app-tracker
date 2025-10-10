'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Copy, Plus, Trash2, Share2, Eye, MessageSquare, CheckSquare } from 'lucide-react';
import { generateShareUrl } from '@/lib/share';

interface ShareLink {
  id: string;
  code: string;
  permissions: {
    view: boolean;
    comment: boolean;
    create_tasks: boolean;
  };
  isActive: boolean;
  createdAt: string;
  expiresAt: string | null;
  lastAccessedAt: string | null;
  accessCount: number;
  _count: {
    feedbacks: number;
    clientTasks: number;
  };
}

interface ShareLinkManagerProps {
  appSlug: string;
}

export default function ShareLinkManager({ appSlug }: ShareLinkManagerProps) {
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newLinkData, setNewLinkData] = useState({
    preset: 'view_only' as 'view_only' | 'can_comment' | 'full_access' | 'custom',
    customPermissions: {
      view: true,
      comment: false,
      create_tasks: false,
    },
    expiresAt: '',
  });

  useEffect(() => {
    fetchShareLinks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appSlug]);

  const fetchShareLinks = async () => {
    try {
      const response = await fetch(`/api/apps/${appSlug}/share`);
      if (response.ok) {
        const data: ShareLink[] = await response.json();
        setShareLinks(data);
      }
    } catch (error) {
      console.error('Failed to fetch share links:', error);
      toast.error('Failed to fetch share links');
    } finally {
      setIsLoading(false);
    }
  };

  const createShareLink = async () => {
    setIsCreating(true);
    try {
      const payload: {
        preset?: string;
        customPermissions?: {
          view: boolean;
          comment: boolean;
          create_tasks: boolean;
        };
        expiresAt?: string;
      } = {
        preset: newLinkData.preset === 'custom' ? undefined : newLinkData.preset,
        customPermissions: newLinkData.preset === 'custom' ? newLinkData.customPermissions : undefined,
        expiresAt: newLinkData.expiresAt || undefined,
      };

      const response = await fetch(`/api/apps/${appSlug}/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const newLink = await response.json();
        setShareLinks(prev => [newLink, ...prev]);
        setShowCreateDialog(false);
        setNewLinkData({
          preset: 'view_only',
          customPermissions: {
            view: true,
            comment: false,
            create_tasks: false,
          },
          expiresAt: '',
        });
        toast.success('Share link created successfully!');
      } else {
        toast.error('Failed to create share link');
      }
    } catch (error) {
      console.error('Failed to create share link:', error);
      toast.error('Failed to create share link');
    } finally {
      setIsCreating(false);
    }
  };

  const deleteShareLink = async (code: string) => {
    if (!confirm('Are you sure you want to revoke this share link? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/share/${code}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setShareLinks(prev => prev.filter(link => link.code !== code));
        toast.success('Share link revoked successfully!');
      } else {
        toast.error('Failed to revoke share link');
      }
    } catch (error) {
      console.error('Failed to delete share link:', error);
      toast.error('Failed to revoke share link');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const getPermissionIcon = (permission: string, enabled: boolean) => {
    switch (permission) {
      case 'view':
        return <Eye className={`h-4 w-4 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />;
      case 'comment':
        return <MessageSquare className={`h-4 w-4 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />;
      case 'create_tasks':
        return <CheckSquare className={`h-4 w-4 ${enabled ? 'text-green-600' : 'text-gray-400'}`} />;
      default:
        return null;
    }
  };

  const getShareUrl = (code: string) => generateShareUrl(code);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading share links...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            <CardTitle>Public Sharing</CardTitle>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Share Link
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {shareLinks.length === 0 ? (
          <div className="text-center py-8">
            <Share2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">No share links created yet</p>
            <p className="text-sm text-gray-500">
              Create share links to allow clients to view your app progress and provide feedback
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {shareLinks.map((link) => (
              <div key={link.id} className="border rounded-lg p-4 space-y-3 transition-all duration-200 hover:shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant={link.isActive ? 'default' : 'secondary'}>
                      {link.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {link.code}
                    </code>
                    {link.expiresAt && (
                      <span className="text-sm text-gray-500">
                        Expires {new Date(link.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                    {link.lastAccessedAt && (
                      <span className="text-sm text-gray-500">
                        Last accessed {new Date(link.lastAccessedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteShareLink(link.code)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    {getPermissionIcon('view', link.permissions.view)}
                    <span className="text-sm">View</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPermissionIcon('comment', link.permissions.comment)}
                    <span className="text-sm">Comment</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getPermissionIcon('create_tasks', link.permissions.create_tasks)}
                    <span className="text-sm">Create Tasks</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-4 text-sm text-gray-600">
                    <span>{link.accessCount} views</span>
                    <span>{link._count.feedbacks} feedbacks</span>
                    <span>{link._count.clientTasks} tasks</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(getShareUrl(link.code))}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Create Share Link Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Share Link</DialogTitle>
            <DialogDescription>
              Create a share link with specific permissions for clients to access your application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="preset">Permission Preset</Label>
              <Select
                value={newLinkData.preset}
                onValueChange={(value: 'view_only' | 'can_comment' | 'full_access' | 'custom') => setNewLinkData(prev => ({ ...prev, preset: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="view_only">View Only</SelectItem>
                  <SelectItem value="can_comment">Can Comment</SelectItem>
                  <SelectItem value="full_access">Full Access</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {newLinkData.preset === 'custom' && (
              <div className="space-y-3">
                <Label>Custom Permissions</Label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newLinkData.customPermissions.view}
                      onChange={(e) => setNewLinkData(prev => ({
                        ...prev,
                        customPermissions: {
                          ...prev.customPermissions,
                          view: e.target.checked
                        }
                      }))}
                    />
                    <span className="text-sm">View application</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newLinkData.customPermissions.comment}
                      onChange={(e) => setNewLinkData(prev => ({
                        ...prev,
                        customPermissions: {
                          ...prev.customPermissions,
                          comment: e.target.checked
                        }
                      }))}
                    />
                    <span className="text-sm">Leave comments</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={newLinkData.customPermissions.create_tasks}
                      onChange={(e) => setNewLinkData(prev => ({
                        ...prev,
                        customPermissions: {
                          ...prev.customPermissions,
                          create_tasks: e.target.checked
                        }
                      }))}
                    />
                    <span className="text-sm">Create tasks/requests</span>
                  </label>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="expiresAt">Expiration Date (Optional)</Label>
              <Input
                id="expiresAt"
                type="datetime-local"
                value={newLinkData.expiresAt}
                onChange={(e) => setNewLinkData(prev => ({ ...prev, expiresAt: e.target.value }))}
              />
              <p className="text-xs text-gray-500">
                Leave empty for no expiration
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={createShareLink} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
