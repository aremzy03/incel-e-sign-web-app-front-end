'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  PageHeader,
  SettingsCard,
  ToggleRow,
  DangerZone,
} from '@/components/library'
import toast from 'react-hot-toast'

const NOTIFICATION_PREFS = [
  { label: 'Signing request received', description: 'When someone sends you a document to sign' },
  { label: "It's your turn to sign", description: 'When you are next in the signing order' },
  { label: 'Envelope completed', description: 'When all parties have signed' },
  { label: 'Envelope declined', description: 'When a recipient declines to sign' },
]

const PLACEHOLDER_SESSIONS = [
  { device: 'laptop_mac', name: 'Chrome on Windows', location: 'Current device', current: true },
  { device: 'smartphone', name: 'Safari on iPhone', location: 'Last active 2 days ago', current: false },
]

export default function SettingsPage() {
  const showComingSoon = () => toast('This feature is coming soon', { icon: 'ℹ️' })

  return (
    <div className="mx-auto max-w-max-content-width space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Manage your account security and notification preferences"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <SettingsCard icon="security" title="Account Security" className="lg:col-span-7">
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault()
              showComingSoon()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" disabled placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" disabled placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" disabled placeholder="••••••••" />
            </div>
            <Button type="submit" disabled title="Available soon">
              Update Password
            </Button>
          </form>
        </SettingsCard>

        <SettingsCard icon="notifications_active" title="Notification Preferences" className="lg:col-span-5">
          <div className="divide-y divide-border">
            {NOTIFICATION_PREFS.map((pref) => (
              <ToggleRow
                key={pref.label}
                label={pref.label}
                description={pref.description}
                checked
                disabled
              />
            ))}
          </div>
        </SettingsCard>

        <SettingsCard icon="devices" title="Active Sessions" className="lg:col-span-12">
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="border-b border-border text-left text-caption-xs uppercase text-muted">
                  <th className="pb-3 pr-4">Device</th>
                  <th className="pb-3 pr-4">Location</th>
                  <th className="pb-3 pr-4">Last Active</th>
                  <th className="pb-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {PLACEHOLDER_SESSIONS.map((s) => (
                  <tr key={s.name} className="border-b border-border">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <MaterialIcon name={s.device} size={20} className="text-muted" />
                        <span className="font-medium text-on-surface">{s.name}</span>
                        {s.current && (
                          <span className="flex items-center gap-1 text-caption-xs text-status-completed">
                            <span className="h-1.5 w-1.5 rounded-full bg-status-completed" />
                            Current
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-muted">{s.location}</td>
                    <td className="py-3 pr-4 text-muted">—</td>
                    <td className="py-3">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={s.current}
                        onClick={showComingSoon}
                      >
                        Revoke
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SettingsCard>

        <div className="lg:col-span-12">
          <DangerZone onAction={showComingSoon} />
        </div>
      </div>
    </div>
  )
}
