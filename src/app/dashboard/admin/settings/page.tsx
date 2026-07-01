'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, RotateCcw, Upload, FileText, Palette, Bell } from 'lucide-react'
import { IncelLogo } from '@/components/ui/incel-logo'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface SystemSettings {
  maxUploadSize: number
  allowedFileTypes: string[]
  brandingName: string
  enableNotifications: boolean
}

const defaultSettings: SystemSettings = {
  maxUploadSize: 20,
  allowedFileTypes: ['.pdf', '.docx'],
  brandingName: 'Incel E-Sign',
  enableNotifications: true,
}

const availableFileTypes = [
  { value: '.pdf', label: 'PDF' },
  { value: '.docx', label: 'Word Document' },
  { value: '.txt', label: 'Text File' },
  { value: '.jpg', label: 'JPEG Image' },
  { value: '.png', label: 'PNG Image' },
  { value: '.xlsx', label: 'Excel Spreadsheet' },
]

export default function SystemSettingsPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings)
  const [isSaving, setIsSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Simulate admin check - in real implementation, this would check user role from session
    const checkAdminAccess = () => {
      // For demo purposes, simulate admin access
      // In production, this would check the user's role from the session
      setIsAdmin(true)
      setIsLoading(false)
    }

    checkAdminAccess()
  }, [])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!settings.brandingName.trim()) {
      newErrors.brandingName = 'Branding name is required'
    }

    if (settings.maxUploadSize <= 0) {
      newErrors.maxUploadSize = 'Max upload size must be greater than 0'
    }

    if (settings.maxUploadSize > 50) {
      newErrors.maxUploadSize = 'Max upload size cannot exceed 50 MB'
    }

    if (settings.allowedFileTypes.length === 0) {
      newErrors.allowedFileTypes = 'At least one file type must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors before saving')
      return
    }

    setIsSaving(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    setIsSaving(false)
    toast.success('Settings saved successfully!')
  }

  const handleReset = () => {
    setSettings(defaultSettings)
    setErrors({})
    toast.success('Settings reset to defaults')
  }

  const toggleFileType = (fileType: string) => {
    setSettings(prev => ({
      ...prev,
      allowedFileTypes: prev.allowedFileTypes.includes(fileType)
        ? prev.allowedFileTypes.filter(type => type !== fileType)
        : [...prev.allowedFileTypes, fileType]
    }))
  }

  const updateSetting = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
    
    // Clear error for this field when user starts typing
    if (errors[key]) {
      setErrors(prev => ({
        ...prev,
        [key]: ''
      }))
    }
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted">Checking access permissions...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="bg-white shadow-sm">
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <IncelLogo className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-on-surface mb-2">Access Denied</h3>
              <p className="text-muted mb-4">
                You don&apos;t have permission to view system settings. Admin access required.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="text-primary hover:text-primary/80 font-medium"
              >
                Return to Dashboard
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Page Header */}
      <motion.div 
        className="bg-white rounded-lg shadow-sm p-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-on-surface mb-2 flex items-center gap-2">
              <Settings className="h-8 w-8 text-secondary" />
              System Settings
            </h1>
            <p className="text-muted text-lg">
              Configure global application settings and preferences.
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-medium text-red-600">Admin Access</span>
          </div>
        </div>
      </motion.div>

      {/* Settings Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Application Settings
            </CardTitle>
            <CardDescription>
              Configure system-wide settings for the e-sign application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Max Upload Size */}
            <div className="space-y-2">
              <Label htmlFor="maxUploadSize" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Max Upload Size (MB)
              </Label>
              <Input
                id="maxUploadSize"
                type="number"
                min="1"
                max="50"
                value={settings.maxUploadSize}
                onChange={(e) => updateSetting('maxUploadSize', parseInt(e.target.value) || 0)}
                className={errors.maxUploadSize ? 'border-red-500' : ''}
              />
              {errors.maxUploadSize && (
                <p className="text-sm text-red-500">{errors.maxUploadSize}</p>
              )}
              <p className="text-sm text-muted">
                Maximum file size allowed for uploads (1-50 MB)
              </p>
            </div>

            {/* Allowed File Types */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Allowed File Types
              </Label>
              <div className="flex flex-wrap gap-2">
                {availableFileTypes.map((fileType) => (
                  <Badge
                    key={fileType.value}
                    variant={settings.allowedFileTypes.includes(fileType.value) ? 'default' : 'outline'}
                    className={`cursor-pointer transition-colors ${
                      settings.allowedFileTypes.includes(fileType.value)
                        ? 'bg-secondary hover:bg-accent-hover'
                        : 'hover:bg-surface-container-low'
                    }`}
                    onClick={() => toggleFileType(fileType.value)}
                  >
                    {fileType.label}
                  </Badge>
                ))}
              </div>
              {errors.allowedFileTypes && (
                <p className="text-sm text-red-500">{errors.allowedFileTypes}</p>
              )}
              <p className="text-sm text-muted">
                Click on file types to enable/disable them
              </p>
            </div>

            {/* Branding Name */}
            <div className="space-y-2">
              <Label htmlFor="brandingName" className="flex items-center gap-2">
                <Palette className="h-4 w-4" />
                Branding Name
              </Label>
              <Input
                id="brandingName"
                type="text"
                value={settings.brandingName}
                onChange={(e) => updateSetting('brandingName', e.target.value)}
                className={errors.brandingName ? 'border-red-500' : ''}
                placeholder="Enter application name"
              />
              {errors.brandingName && (
                <p className="text-sm text-red-500">{errors.brandingName}</p>
              )}
              <p className="text-sm text-muted">
                The name displayed throughout the application
              </p>
            </div>

            {/* Enable Notifications */}
            <div className="space-y-2">
              <Label htmlFor="enableNotifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Enable Notifications
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableNotifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => updateSetting('enableNotifications', checked)}
                />
                <Label htmlFor="enableNotifications" className="text-sm">
                  {settings.enableNotifications ? 'Enabled' : 'Disabled'}
                </Label>
              </div>
              <p className="text-sm text-muted">
                Allow users to receive email and in-app notifications
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleReset}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset to Defaults
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current Settings Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="bg-surface">
          <CardHeader>
            <CardTitle className="text-lg">Current Settings</CardTitle>
            <CardDescription>
              Summary of your current configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-body">Max Upload Size</p>
                <p className="text-lg font-semibold">{settings.maxUploadSize} MB</p>
              </div>
              <div>
                <p className="text-sm font-medium text-body">Allowed File Types</p>
                <p className="text-lg font-semibold">{settings.allowedFileTypes.length} types</p>
              </div>
              <div>
                <p className="text-sm font-medium text-body">Branding Name</p>
                <p className="text-lg font-semibold">{settings.brandingName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-body">Notifications</p>
                <p className="text-lg font-semibold">
                  {settings.enableNotifications ? 'Enabled' : 'Disabled'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
