'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { getUserById, type User } from '@/lib/api/users'
import { mapToReusableSignature, uploadUserSignature } from '@/lib/api/signatures'
import { getApiBaseUrl } from '@/lib/env'
import { scrollToSigningTarget, type SigningFieldChecklistItem } from '@/lib/signing/signing-field-checklist'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useProfile } from '@/hooks/useProfile'
import { useSigningView } from '@/hooks/useSigningView'
import {
  useSigningCoordinates,
  useSigningEnvelope,
  useSignActions,
  useSigningFieldValues,
  useSigningProgress,
  useSigningSubmit,
  useUserSignatures,
  resolveSignatureId,
  resolveSignatureImage,
  type SignerDocumentPositionEntry,
  type SigningEnvelopeResponse,
} from '@/hooks/signing'
import type { Envelope } from '@/lib/api/envelopes'
import { usePdfPasswordDialog } from '@/components/pdf/usePdfPasswordDialog'
import { PdfLoadingIndicator } from '@/components/pdf/PdfLoadingIndicator'
import { SigningShell } from '@/components/signing/signing-shell'
import { SigningLanding } from '@/components/signing/signing-landing'
import { SigningReviewPanel } from '@/components/signing/signing-review-panel'
import { SigningStatusWaiting } from '@/components/signing/signing-status-waiting'
import { SigningStatusProcessing } from '@/components/signing/signing-status-processing'
import { SigningStatusComplete } from '@/components/signing/signing-status-complete'
import { SigningStatusDeclined } from '@/components/signing/signing-status-declined'
import { SigningStatusCancelled } from '@/components/signing/signing-status-cancelled'
import { SigningFrozenEnvelopeAlert } from '@/components/signing/signing-frozen-envelope-alert'
import { SigningDocumentViewer } from '@/components/signing/signing-document-viewer'
import { SigningFieldsSidebar } from '@/components/signing/signing-fields-sidebar'
import { SigningMobileSheet } from '@/components/signing/signing-mobile-sheet'
import { SigningSignFooter } from '@/components/signing/signing-sign-footer'
import { SignatureModal } from '@/components/library/signature-modal'
import { AsyncStatePanel } from '@/components/library'
import {
  SigningToolbar,
  SIGNING_ZOOM_DEFAULT,
  SIGNING_ZOOM_MAX,
  SIGNING_ZOOM_MIN,
  SIGNING_ZOOM_STEP,
} from '@/components/signing/signing-toolbar'
import { Button } from '@/components/ui/button'
import { MaterialIcon } from '@/components/ui/material-icon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import type { Position } from '@/lib/api/envelopes'

interface SignFlowPageProps {
  isDashboard: boolean
}

function PageLoadingSpinner({
  label = 'Loading…',
  fullScreen = false,
}: {
  label?: string
  fullScreen?: boolean
}) {
  return (
    <div
      className={
        fullScreen
          ? 'flex min-h-screen w-full items-center justify-center bg-surface p-8'
          : 'flex min-h-[320px] flex-1 items-center justify-center p-8'
      }
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-2.5 text-muted">
        <Loader2 className="h-5 w-5 animate-spin text-secondary" />
        <span className="font-body-sm text-body-sm">{label}</span>
      </div>
    </div>
  )
}

function SignFlowPageInner({ isDashboard }: SignFlowPageProps) {
  const params = useParams<{ id: string }>()
  const envelopeId = params?.id
  const router = useRouter()
  const searchParams = typeof useSearchParams === 'function' ? useSearchParams() : null
  const tokenFromQuery = searchParams?.get('token')
  const tokenFromWindow = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('token') : null
  const token = (tokenFromQuery || tokenFromWindow || '').trim() || undefined
  const { data: session } = useSession()
  const { isReady } = useAuthReady()
  const { data: profile } = useProfile()
  const currentUserId = session?.user?.id
  const accessToken = (session as { accessToken?: string } | null)?.accessToken

  const password = usePdfPasswordDialog()
  const coords = useSigningCoordinates()
  const fieldState = useSigningFieldValues()
  const documentSectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const [previewSignerId, setPreviewSignerId] = useState<string | null>(null)
  const [selected, setSelected] = useState<SignerDocumentPositionEntry | null>(null)
  const [selectedFieldKey, setSelectedFieldKey] = useState<string | null>(null)
  const [focusedTargetId, setFocusedTargetId] = useState<string | null>(null)
  const [pendingPlaceholderEntry, setPendingPlaceholderEntry] = useState<SignerDocumentPositionEntry | null>(null)
  const [draftPlacement, setDraftPlacement] = useState<Position | null>(null)
  const [isDraggingDraft, setIsDraggingDraft] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [signerDetails, setSignerDetails] = useState<Record<string, User>>({})
  const [selectedSignature, setSelectedSignature] = useState<unknown>(null)
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [zoom, setZoom] = useState(SIGNING_ZOOM_DEFAULT)
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null)
  const [pageIndicator, setPageIndicator] = useState({ current: 1, total: 1 })

  const {
    envelope,
    loadingEnv,
    envelopeErrorState,
    refetchEnvelope,
    envelopeDocuments,
    loadingDocs,
    docsError,
    documentsErrorState,
    refetchDocuments,
    waitingForDocumentsAuth,
    pdfFileByDocumentId,
    pdfLoadedByDocId,
    setPdfLoadedByDocId,
    markPreviewFallback,
  } = useSigningEnvelope({
    envelopeId,
    enabled: isDashboard ? isReady : !!envelopeId,
    accessToken,
    token,
  })

  const { signatures: fetchedSignatures, refetch: refetchSignatures } = useUserSignatures({
    envelopeId,
    mode: isDashboard ? 'dashboard' : 'public',
    enabled: isDashboard ? isReady : !!envelopeId,
    token,
  })

  const envelopeWithTokenMeta = envelope as unknown as {
    recipient?: { user_id?: string; email?: string; full_name?: string; is_current_signer?: boolean }
    saved_signatures?: unknown[]
  }
  const recipientData = envelopeWithTokenMeta?.recipient
  const effectiveUserId =
    token && recipientData?.user_id ? recipientData.user_id : currentUserId || recipientData?.user_id
  const recipientEmail = recipientData?.email
  const isAccountMismatch = Boolean(
    session?.user?.email &&
      recipientEmail &&
      session.user.email.toLowerCase() !== recipientEmail.toLowerCase(),
  )
  const isAuthenticatedSigner = Boolean(isDashboard || (session?.user && !isAccountMismatch))

  const signatures = useMemo(() => {
    if (fetchedSignatures.length > 0) return fetchedSignatures
    const embedded = envelopeWithTokenMeta?.saved_signatures
    if (Array.isArray(embedded) && embedded.length > 0) {
      return embedded.map(mapToReusableSignature)
    }
    return fetchedSignatures
  }, [envelopeWithTokenMeta?.saved_signatures, fetchedSignatures])

  const { view, goToSign, goToStatus } = useSigningView({
    envelope: envelope as Envelope | undefined,
    currentUserId: effectiveUserId,
    isDashboard,
    isLoading: loadingEnv,
  })

  const mySignatureId = useMemo(() => resolveSignatureId(selectedSignature), [selectedSignature])

  const progress = useSigningProgress({
    envelopeDocuments,
    envelope,
    currentUserId: effectiveUserId,
    fieldValues: fieldState.fieldValues,
    mySignatureId,
  })

  const uploadSignatureMutation = useMutation({
    mutationFn: ({ file, name, isDefault }: { file: File; name: string; isDefault: boolean }) =>
      uploadUserSignature(file, name, isDefault, token),
    onSuccess: async (uploaded) => {
      await refetchSignatures()
      setSelectedSignature(uploaded)
      setIsUploadModalOpen(false)
      if (pendingPlaceholderEntry?.document_id && pendingPlaceholderEntry.signer_id) {
        progress.markSignatureConfirmed(
          pendingPlaceholderEntry.document_id,
          pendingPlaceholderEntry.signer_id,
          pendingPlaceholderEntry.position_index,
        )
        setPendingPlaceholderEntry(null)
      }
      toast.success('Signature uploaded')
    },
    onError: () => toast.error('Failed to upload signature'),
  })

  const signActions = useSignActions({
    envelopeId,
    envelope,
    envelopeDocuments,
    currentUserId: effectiveUserId,
    mySignatureId,
    placement: draftPlacement,
    signerDetails,
    fieldValues: fieldState.fieldValues,
    supportsDecline: isDashboard || !!token,
    supportsFieldSave: isDashboard || !!token,
    token,
    onDeclineSuccess: () => goToStatus('declined'),
  })

  const signingSubmit = useSigningSubmit({
    envelopeId,
    signActions,
    token,
    onSignQueued: () => {
      progress.markAllSignaturesComplete()
      if (isAuthenticatedSigner) {
        router.push('/dashboard/envelopes')
      } else {
        goToStatus('processing')
      }
    },
    onSignComplete: () => {
      progress.markAllSignaturesComplete()
      if (!isAuthenticatedSigner) {
        goToStatus('complete')
      }
    },
  })

  useEffect(() => {
    if (signatures.length > 0 && !selectedSignature) {
      const defaultSig =
        signatures.find((s) => (s as { is_default?: boolean }).is_default) || signatures[0]
      setSelectedSignature(defaultSig)
    }
  }, [signatures, selectedSignature])

  useEffect(() => {
    if (!envelope?.signing_order?.length) return
    if (isDashboard && !isReady) return

    const details: Record<string, User> = {}

    // Populate baseline details from envelope signatures and signing order without requiring auth
    if (envelope.signatures?.length) {
      for (const sig of envelope.signatures) {
        if (sig.signer) {
          const signerId = String(sig.signer)
          details[signerId] = {
            id: signerId,
            email: sig.signer_email || '',
            full_name: sig.signer_name || sig.signer_email || 'Signer',
            is_active: true,
            created_at: '',
            updated_at: '',
            profile_photo: null,
            profile_photo_url: null,
          }
        }
      }
    }

    for (const entry of envelope.signing_order) {
      if (!entry.signer_id) continue
      const signerId = String(entry.signer_id)
      if (!details[signerId]) {
        const entryObj = entry as { name?: string; signer_name?: string; email?: string }
        const name = entryObj.signer_name || entryObj.name || 'Signer'
        const email = entryObj.email || ''
        details[signerId] = {
          id: signerId,
          email,
          full_name: name,
          is_active: true,
          created_at: '',
          updated_at: '',
          profile_photo: null,
          profile_photo_url: null,
        }
      }
    }

    if (Object.keys(details).length > 0) {
      setSignerDetails((prev) => {
        const hasChanges = Object.keys(details).some(
          (id) =>
            !prev[id] ||
            prev[id].full_name !== details[id].full_name ||
            prev[id].email !== details[id].email,
        )
        return hasChanges ? { ...prev, ...details } : prev
      })
    }

    // Only make authenticated user profile requests if user has an active session
    if (session?.accessToken) {
      const fetchSigners = async () => {
        const fullDetails: Record<string, User> = {}
        for (const entry of envelope.signing_order) {
          if (!entry.signer_id) continue
          try {
            const user = await getUserById(entry.signer_id)
            fullDetails[entry.signer_id] = user
          } catch {
            /* ignore */
          }
        }
        if (Object.keys(fullDetails).length > 0) {
          setSignerDetails((prev) => ({ ...prev, ...fullDetails }))
        }
      }
      fetchSigners()
    }
  }, [envelope?.signatures, envelope?.signing_order, isDashboard, isReady, session?.accessToken])

  useEffect(() => {
    if (envelopeDocuments.length > 0 && !activeDocumentId) {
      setActiveDocumentId(envelopeDocuments[0].id)
    }
  }, [activeDocumentId, envelopeDocuments])

  const mySignatureStatus = envelope?.signatures?.find(
    (s) => String(s.signer) === String(effectiveUserId),
  )?.status

  const onPlaceholderClick = useCallback(
    (entry: SignerDocumentPositionEntry) => {
      const documentIdForEntry = entry.document_id || selected?.document_id
      if (!documentIdForEntry) return

      const positions =
        envelopeDocuments
          .find((d) => d.id === documentIdForEntry)
          ?.signer_document_positions?.filter((p) => String(p.signer_id) === String(effectiveUserId)) ?? []
      const resolvedIdx =
        entry.position_index !== undefined
          ? entry.position_index
          : Math.max(positions.findIndex((p) => p.signer_id === entry.signer_id), 0)

      if (progress.isSignatureComplete(documentIdForEntry, entry.signer_id, resolvedIdx)) return

      const targetKey = `sig-${documentIdForEntry}-${entry.signer_id}-${resolvedIdx}`

      if (!selectedSignature) {
        setPendingPlaceholderEntry({
          ...entry,
          document_id: documentIdForEntry,
          position_index: resolvedIdx,
        })
        setIsUploadModalOpen(true)
        return
      }

      progress.markSignatureConfirmed(documentIdForEntry, entry.signer_id, resolvedIdx)
      setPreviewSignerId(null)
      setSelected(null)
      setSelectedFieldKey(targetKey)
      setFocusedTargetId(targetKey)
      if (!entry.position) setDraftPlacement(null)
    },
    [effectiveUserId, envelopeDocuments, progress, selected?.document_id, selectedSignature],
  )

  const handleClearPreview = useCallback(() => {
    if (previewSignerId) {
      setPreviewSignerId(null)
      setSelected(null)
      setSelectedFieldKey(null)
    }
  }, [previewSignerId])

  const handleSignDocument = useCallback(async () => {
    if (!progress.canComplete) {
      toast.error(`Complete ${progress.remainingCount} remaining field${progress.remainingCount === 1 ? '' : 's'}`)
      return
    }
    await signingSubmit.submitSign()
  }, [progress.canComplete, progress.remainingCount, signingSubmit])

  const handleFieldSelect = useCallback((item: SigningFieldChecklistItem) => {
    setFocusedTargetId(item.id)
    scrollToSigningTarget(item.id)
    if (item.target?.documentId) {
      setActiveDocumentId(item.target.documentId)
      const section = documentSectionRefs.current[item.target.documentId]
      section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  const handleDocumentSelect = useCallback((documentId: string) => {
    setActiveDocumentId(documentId)
    const section = documentSectionRefs.current[documentId]
    section?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const handlePageIndicatorChange = useCallback((current: number, total: number) => {
    setPageIndicator((prev) =>
      prev.current === current && prev.total === total ? prev : { current, total },
    )
  }, [])

  const isSignStep = view.kind === 'step' && view.step === 'sign'
  const needsDocuments = isSignStep

  const documentTabs = useMemo(
    () =>
      envelopeDocuments.map((doc) => ({
        id: doc.id,
        label: doc.file_name || `Document ${doc.id.slice(0, 6)}`,
      })),
    [envelopeDocuments],
  )

  const activeDocLabel = documentTabs.find((d) => d.id === activeDocumentId)?.label

  const signToolbar = isSignStep ? (
    <SigningToolbar
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(SIGNING_ZOOM_MAX, z + SIGNING_ZOOM_STEP))}
      onZoomOut={() => setZoom((z) => Math.max(SIGNING_ZOOM_MIN, z - SIGNING_ZOOM_STEP))}
      pageIndicator={
        activeDocLabel
          ? `Page ${pageIndicator.current} of ${pageIndicator.total} · ${activeDocLabel}`
          : `Page ${pageIndicator.current} of ${pageIndicator.total}`
      }
      documents={documentTabs}
      activeDocumentId={activeDocumentId ?? undefined}
      onDocumentSelect={handleDocumentSelect}
    />
  ) : undefined

  const effectiveSignerRecord = effectiveUserId ? signerDetails[String(effectiveUserId)] : undefined
  const effectiveSignerName =
    (token && (recipientData?.full_name || effectiveSignerRecord?.full_name)) ||
    session?.user?.full_name ||
    effectiveSignerRecord?.full_name ||
    recipientData?.email
  const effectiveSignerEmail =
    (token && (recipientData?.email || effectiveSignerRecord?.email)) ||
    session?.user?.email ||
    recipientData?.email ||
    effectiveSignerRecord?.email

  const shellUser =
    isDashboard && session?.user
      ? {
          id: session.user.id,
          name: session.user.full_name || 'User',
          email: session.user.email || '',
          profilePhotoUrl: profile?.profile_photo_url,
          initials: (session.user.full_name || 'U')
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)
            .toUpperCase(),
        }
      : token && effectiveUserId
        ? {
            id: String(effectiveUserId),
            name: effectiveSignerName || 'Signer',
            email: effectiveSignerEmail || '',
            profilePhotoUrl: undefined,
            initials: (effectiveSignerName || 'S')
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)
              .toUpperCase(),
          }
        : undefined

  const homeHref = isAuthenticatedSigner ? '/dashboard' : '/'
  const dashboardHref = isAuthenticatedSigner ? '/dashboard/envelopes' : '/login'
  const fallbackHref = isAuthenticatedSigner ? dashboardHref : homeHref

  if (isDashboard && !isReady) {
    return <PageLoadingSpinner label="Loading…" fullScreen />
  }

  if (!isDashboard && !token && !accessToken) {
    const nextPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
    return (
      <SigningShell documentTitle="Sign In Required" user={shellUser}>
        <div className="flex flex-1 items-center justify-center p-8">
          <AsyncStatePanel
            variant="error"
            title="Sign In Required"
            description="A valid signing link or login session is required to review and sign this document."
            primaryAction={
              <Button
                type="button"
                onClick={() => router.push(`/login?next=${encodeURIComponent(nextPath)}`)}
              >
                Sign In to Continue
              </Button>
            }
            secondaryAction={
              <Button type="button" variant="outline" onClick={() => router.push('/')}>
                Back to Home
              </Button>
            }
          />
        </div>
      </SigningShell>
    )
  }

  if (loadingEnv) {
    return (
      <SigningShell documentTitle="Loading…" user={shellUser}>
        <PageLoadingSpinner label="Loading envelope…" />
      </SigningShell>
    )
  }

  if (!envelope && envelopeErrorState) {
    const isAlreadySigned =
      envelopeErrorState.message?.toLowerCase().includes('already been signed') ||
      searchParams?.get('status') === 'complete'

    if (isAlreadySigned) {
      return (
        <SigningShell documentTitle="Document Signed" user={shellUser}>
          <SigningStatusComplete
            envelopeName="Document"
            completionPhase="submitted"
            dashboardHomeHref={homeHref}
          />
        </SigningShell>
      )
    }

    const isTokenExpired =
      envelopeErrorState.message?.toLowerCase().includes('expired') ||
      (envelopeErrorState as { status?: number })?.status === 410

    if (isTokenExpired) {
      const nextPath = typeof window !== 'undefined' ? window.location.pathname + window.location.search : ''
      return (
        <SigningShell documentTitle="Link Expired" user={shellUser}>
          <div className="flex flex-1 items-center justify-center p-8">
            <AsyncStatePanel
              variant="error"
              title="Signing Link Expired"
              description="This signing link has expired. Please sign in to your account to review and sign this document."
              primaryAction={
                <Button
                  type="button"
                  onClick={() => router.push(`/login?message=token_expired&next=${encodeURIComponent(nextPath)}`)}
                >
                  Sign In to Continue
                </Button>
              }
              secondaryAction={
                <Button type="button" variant="outline" onClick={() => router.push('/')}>
                  Back to Home
                </Button>
              }
            />
          </div>
        </SigningShell>
      )
    }

    return (
      <SigningShell documentTitle="Envelope unavailable" user={shellUser}>
        <div className="flex flex-1 items-center justify-center p-8">
          <AsyncStatePanel
            variant={envelopeErrorState.isNotFound ? 'notFound' : 'error'}
            title={envelopeErrorState.isNotFound ? 'Envelope not found' : 'Unable to load envelope'}
            description={
              envelopeErrorState.isNotFound
                ? 'This signing request may have expired, been removed, or you may not have access to it.'
                : envelopeErrorState.message
            }
            primaryAction={
              !envelopeErrorState.isNotFound ? (
                <Button type="button" onClick={() => void refetchEnvelope()}>
                  Retry
                </Button>
              ) : undefined
            }
            secondaryAction={
              <Button type="button" variant="outline" onClick={() => router.push(fallbackHref)}>
                {isDashboard ? 'Back to Envelopes' : 'Back to Home'}
              </Button>
            }
          />
        </div>
      </SigningShell>
    )
  }

  if (!envelope) {
    return (
      <SigningShell documentTitle="Envelope unavailable" user={shellUser}>
        <div className="flex flex-1 items-center justify-center p-8">
          <AsyncStatePanel
            variant="notFound"
            title="Envelope unavailable"
            description="We couldn't find the envelope needed for this signing session."
            secondaryAction={
              <Button type="button" variant="outline" onClick={() => router.push(fallbackHref)}>
                {isDashboard ? 'Back to Envelopes' : 'Back to Home'}
              </Button>
            }
          />
        </div>
      </SigningShell>
    )
  }

  const isLoadingSignDocuments = needsDocuments && (waitingForDocumentsAuth || loadingDocs)

  if (needsDocuments && !isLoadingSignDocuments && documentsErrorState) {
    return (
      <SigningShell documentTitle={envelope.name} user={shellUser}>
        <div className="flex flex-1 items-center justify-center p-8">
          <AsyncStatePanel
            variant="error"
            title="Unable to load signing documents"
            description={documentsErrorState.message}
            primaryAction={
              <Button type="button" onClick={refetchDocuments}>
                Retry
              </Button>
            }
            secondaryAction={
              <Button type="button" variant="outline" onClick={() => router.push(fallbackHref)}>
                {isDashboard ? 'Back to Envelopes' : 'Back to Home'}
              </Button>
            }
          />
        </div>
      </SigningShell>
    )
  }

  if (needsDocuments && !isLoadingSignDocuments && envelopeDocuments.length === 0) {
    return (
      <SigningShell documentTitle={envelope.name} user={shellUser}>
        <div className="flex flex-1 items-center justify-center p-8">
          <AsyncStatePanel
            variant="empty"
            title="No documents available to sign"
            description={docsError || 'This envelope does not currently contain any signable documents.'}
            secondaryAction={
              <Button type="button" variant="outline" onClick={() => router.push(fallbackHref)}>
                {isDashboard ? 'Back to Envelopes' : 'Back to Home'}
              </Button>
            }
          />
        </div>
      </SigningShell>
    )
  }

  const envelopeAsFull = envelope as unknown as Envelope
  const isEnvelopeFullyComplete = (envelope.status || '').toLowerCase().includes('complete')

  const mismatchBanner = isAccountMismatch ? (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-950">
      <div className="flex items-center gap-2">
        <MaterialIcon name="warning" className="text-amber-600 shrink-0" size={20} />
        <span>
          Signed in as <strong>{session?.user?.email}</strong>, but this signing request is for <strong>{recipientEmail}</strong>.
        </span>
      </div>
      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
        <Button
          size="sm"
          variant="outline"
          className="h-8 border-amber-300 bg-amber-100 text-xs font-medium text-amber-950 hover:bg-amber-200"
          onClick={() => signOut({ callbackUrl: window.location.href })}
        >
          Switch Account
        </Button>
      </div>
    </div>
  ) : null

  const renderContent = () => {
    if (view.kind === 'status') {
      switch (view.status) {
        case 'waiting':
          return (
            <SigningStatusWaiting
              envelope={envelopeAsFull}
              currentUserId={effectiveUserId}
              onClose={() => router.push(dashboardHref)}
              backLabel={isAuthenticatedSigner ? 'Back to Dashboard' : 'Back to Home'}
            />
          )
        case 'processing':
          return (
            <SigningStatusProcessing
              envelope={envelopeAsFull}
              currentUserId={effectiveUserId}
              onClose={() => router.push(dashboardHref)}
              backLabel={isAuthenticatedSigner ? 'Back to Dashboard' : 'Back to Home'}
            />
          )
        case 'complete': {
          const apiBase = getApiBaseUrl().replace(/\/$/, '')
          const firstDocId =
            envelopeDocuments[0]?.document ||
            (envelope as unknown as { documents?: Array<{ document?: string }> })?.documents?.[0]?.document
          return (
            <SigningStatusComplete
              envelopeName={envelope.name}
              completionPhase={isEnvelopeFullyComplete ? 'envelope_complete' : 'submitted'}
              dashboardHomeHref={homeHref}
              downloadHref={
                token && firstDocId
                  ? `${apiBase}/documents/${firstDocId}/download-public/?token=${encodeURIComponent(token)}`
                  : isDashboard && envelopeId
                    ? `/dashboard/envelopes/${envelopeId}`
                    : undefined
              }
            />
          )
        }
        case 'declined':
          return (
            <SigningStatusDeclined
              declineMessage={signActions.declineMessage || envelope.decline_message}
              homeHref={homeHref}
            />
          )
        case 'cancelled':
          return (
            <SigningStatusCancelled envelopeId={envelopeId} dashboardHref={dashboardHref} />
          )
        default:
          return null
      }
    }

    if (view.step === 'landing') {
      return (
        <SigningLanding
          envelope={envelopeAsFull}
          currentUserId={effectiveUserId}
          signerName={effectiveSignerName}
          signerEmail={effectiveSignerEmail}
          onReviewSign={goToSign}
          onDecline={() => setIsDeclineDialogOpen(true)}
          onViewDetails={
            isDashboard && envelopeId
              ? () => router.push(`/dashboard/envelopes/${envelopeId}`)
              : undefined
          }
        />
      )
    }

    if (view.step === 'review') {
      return (
        <SigningReviewPanel
          envelope={envelopeAsFull}
          currentUserId={effectiveUserId}
          signerName={effectiveSignerName}
          signerEmail={effectiveSignerEmail}
          onContinue={goToSign}
          onDecline={isDashboard || !!token ? () => setIsDeclineDialogOpen(true) : undefined}
          onViewDetails={
            isDashboard && envelopeId
              ? () => router.push(`/dashboard/envelopes/${envelopeId}`)
              : undefined
          }
        />
      )
    }

    return (
      <>
        <div
          className="flex min-h-0 flex-1 overflow-hidden pb-[72px]"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoadingSignDocuments ? (
            <div className="flex flex-1 flex-col items-center overflow-y-auto bg-surface-container-low bg-[radial-gradient(#041534_1px,transparent_1px)] [background-size:20px_20px] wizard-custom-scrollbar p-8">
              <div className="flex w-full max-w-[850px] flex-col items-center">
                <PdfLoadingIndicator
                  label={waitingForDocumentsAuth ? 'Preparing secure preview…' : 'Loading documents…'}
                />
              </div>
            </div>
          ) : (
            <SigningDocumentViewer
              envelopeDocuments={envelopeDocuments}
              envelope={envelope as SigningEnvelopeResponse}
              pdfFileByDocumentId={pdfFileByDocumentId}
              pdfLoadedByDocId={pdfLoadedByDocId}
              setPdfLoadedByDocId={setPdfLoadedByDocId}
              markPreviewFallback={markPreviewFallback}
              pageDims={coords.pageDims}
              setPageContainerRef={coords.setPageContainerRef}
              measurePageCanvas={coords.measurePageCanvas}
              setPageDimensions={coords.setPageDimensions}
              setDocumentNumPages={coords.setDocumentNumPages}
              passwordDialog={password.dialog}
              onPassword={password.onPassword as never}
              passwordCancelled={password.cancelled}
              currentUserId={effectiveUserId}
              signerDetails={signerDetails}
              signedFor={progress.signedFor}
              previewSignerId={previewSignerId}
              selectedSignature={selectedSignature}
              onPlaceholderClick={onPlaceholderClick}
              fieldValues={fieldState.fieldValues}
              setFieldValue={fieldState.setFieldValue}
              activeFieldPreview={fieldState.activeFieldPreview}
              toggleFieldPreview={fieldState.toggleFieldPreview}
              draftPlacement={draftPlacement}
              setDraftPlacement={setDraftPlacement}
              isDraggingDraft={isDraggingDraft}
              setIsDraggingDraft={setIsDraggingDraft}
              dragOffset={dragOffset}
              setDragOffset={setDragOffset}
              selected={selected}
              setSelected={setSelected}
              onClearPreview={handleClearPreview}
              zoom={zoom}
              focusedTargetId={focusedTargetId}
              selectedFieldKey={selectedFieldKey}
              documentSectionRefs={documentSectionRefs}
              onPageIndicatorChange={handlePageIndicatorChange}
            />
          )}
          <SigningFieldsSidebar
            completedCount={progress.completedFields}
            totalCount={progress.totalFields || 1}
            fieldItems={progress.fieldChecklist}
            activeFieldId={progress.activeFieldId}
            onFieldSelect={handleFieldSelect}
            signatures={signatures}
            selectedSignature={selectedSignature}
            onSelectSignature={setSelectedSignature}
            onUploadClick={() => setIsUploadModalOpen(true)}
            isUploading={uploadSignatureMutation.isPending}
            manageHref={isDashboard ? '/dashboard/signatures' : undefined}
          />
          <SigningMobileSheet
            open={isMobileSheetOpen}
            onOpenChange={setIsMobileSheetOpen}
            completedCount={progress.completedFields}
            totalCount={progress.totalFields || 1}
            fieldItems={progress.fieldChecklist}
            activeFieldId={progress.activeFieldId}
            onFieldSelect={handleFieldSelect}
            signatures={signatures}
            selectedSignature={selectedSignature}
            onSelectSignature={setSelectedSignature}
            onUploadClick={() => setIsUploadModalOpen(true)}
            isUploading={uploadSignatureMutation.isPending}
          />
        </div>

        <SigningSignFooter
          completedCount={progress.completedFields}
          totalCount={progress.totalFields || 1}
          canComplete={progress.canComplete}
          remainingCount={progress.remainingCount}
          isSubmitting={signingSubmit.isSigningInFlight}
          onDecline={() => setIsDeclineDialogOpen(true)}
          onComplete={handleSignDocument}
        />
      </>
    )
  }

  return (
    <>
      <SigningShell
        documentTitle={envelope.name}
        showNavRail={false}
        hideClose={isSignStep}
        user={shellUser}
        toolbar={signToolbar}
        banner={mismatchBanner}
        onClose={() => router.push(isDashboard ? `/dashboard/envelopes/${envelopeId}` : '/')}
      >
        {renderContent()}
      </SigningShell>

      <Dialog open={isDeclineDialogOpen} onOpenChange={setIsDeclineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Decline to Sign</DialogTitle>
            <DialogDescription>Please provide a reason for declining (optional).</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="e.g., Document terms are not acceptable."
            value={signActions.declineMessage}
            onChange={(e) => signActions.setDeclineMessage(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeclineDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={
                signActions.declineMutation.isPending ||
                signingSubmit.isSigningInFlight ||
                mySignatureStatus === 'processing'
              }
              onClick={() => signActions.declineMutation.mutate(signActions.declineMessage)}
            >
              {signActions.declineMutation.isPending ? 'Declining…' : 'Decline Envelope'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SignatureModal
        open={isUploadModalOpen}
        onOpenChange={setIsUploadModalOpen}
        isUploading={uploadSignatureMutation.isPending}
        onUpload={async (file, name, isDefault) => {
          await uploadSignatureMutation.mutateAsync({ file, name, isDefault })
        }}
      />

      {signActions.frozenEnvelopeMessage ? (
        <SigningFrozenEnvelopeAlert
          message={signActions.frozenEnvelopeMessage}
          onDismiss={signActions.clearFrozenEnvelopeMessage}
          resendHref={isDashboard ? '/dashboard/envelopes/create' : undefined}
        />
      ) : null}
    </>
  )
}

export function SignFlowPage(props: SignFlowPageProps) {
  return (
    <Suspense fallback={<PageLoadingSpinner label="Loading…" fullScreen />}>
      <SignFlowPageInner {...props} />
    </Suspense>
  )
}

export default SignFlowPage
