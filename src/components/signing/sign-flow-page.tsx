'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getUserById, type User } from '@/lib/api/users'
import { uploadUserSignature } from '@/lib/api/signatures'
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
import { SigningStatusComplete } from '@/components/signing/signing-status-complete'
import { SigningStatusDeclined } from '@/components/signing/signing-status-declined'
import { SigningStatusCancelled } from '@/components/signing/signing-status-cancelled'
import { SigningFrozenEnvelopeAlert } from '@/components/signing/signing-frozen-envelope-alert'
import { SigningDocumentViewer } from '@/components/signing/signing-document-viewer'
import { SigningFieldsSidebar } from '@/components/signing/signing-fields-sidebar'
import { SigningMobileSheet } from '@/components/signing/signing-mobile-sheet'
import { SigningSignFooter } from '@/components/signing/signing-sign-footer'
import { SigningInlineConfirm } from '@/components/signing/signing-inline-confirm'
import { SigningProcessingOverlay } from '@/components/signing/signing-processing-overlay'
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

function SignFlowPageInner({ isDashboard }: SignFlowPageProps) {
  const params = useParams<{ id: string }>()
  const envelopeId = params?.id
  const router = useRouter()
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
  const [inlineConfirmOpen, setInlineConfirmOpen] = useState(false)
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
  })

  const { signatures, refetch: refetchSignatures } = useUserSignatures({
    envelopeId,
    mode: isDashboard ? 'dashboard' : 'public',
    enabled: isDashboard ? isReady : !!envelopeId,
  })

  const uploadSignatureMutation = useMutation({
    mutationFn: ({ file, name, isDefault }: { file: File; name: string; isDefault: boolean }) =>
      uploadUserSignature(file, name, isDefault),
    onSuccess: async (uploaded) => {
      await refetchSignatures()
      setSelectedSignature(uploaded)
      setIsUploadModalOpen(false)
      toast.success('Signature uploaded')
    },
    onError: () => toast.error('Failed to upload signature'),
  })

  const { view, goToSign, goToStatus } = useSigningView({
    envelope: envelope as Envelope | undefined,
    currentUserId,
    isDashboard,
    isLoading: loadingEnv,
  })

  const mySignatureId = useMemo(() => resolveSignatureId(selectedSignature), [selectedSignature])

  const progress = useSigningProgress({
    envelopeDocuments,
    envelope,
    currentUserId,
    fieldValues: fieldState.fieldValues,
    mySignatureId,
  })

  const signActions = useSignActions({
    envelopeId,
    envelope,
    envelopeDocuments,
    currentUserId,
    mySignatureId,
    placement: draftPlacement,
    signerDetails,
    fieldValues: fieldState.fieldValues,
    supportsDecline: isDashboard,
    supportsFieldSave: isDashboard,
    onDeclineSuccess: () => goToStatus('declined'),
  })

  const signingSubmit = useSigningSubmit({
    envelopeId,
    signActions,
    onSignComplete: () => {
      progress.markAllSignaturesComplete()
      setInlineConfirmOpen(false)
      goToStatus('complete')
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

    const fetchSigners = async () => {
      const details: Record<string, User> = {}
      for (const entry of envelope.signing_order) {
        if (!entry.signer_id) continue
        try {
          details[entry.signer_id] = await getUserById(entry.signer_id)
        } catch {
          /* ignore */
        }
      }
      if (Object.keys(details).length > 0) setSignerDetails(details)
    }
    fetchSigners()
  }, [envelope?.signing_order, isDashboard, isReady])

  useEffect(() => {
    if (envelopeDocuments.length > 0 && !activeDocumentId) {
      setActiveDocumentId(envelopeDocuments[0].id)
    }
  }, [activeDocumentId, envelopeDocuments])

  const mySignatureStatus = envelope?.signatures?.find(
    (s) => String(s.signer) === String(currentUserId),
  )?.status

  const onPlaceholderClick = useCallback(
    (entry: SignerDocumentPositionEntry) => {
      const documentIdForEntry = entry.document_id || selected?.document_id
      if (!documentIdForEntry) return
      if (progress.isSignatureComplete(documentIdForEntry, entry.signer_id)) return
      if (!selectedSignature) {
        toast.error('Please select a signature first')
        return
      }

      const positions =
        envelopeDocuments
          .find((d) => d.id === documentIdForEntry)
          ?.signer_document_positions?.filter((p) => p.signer_id === currentUserId) ?? []
      const idx = positions.findIndex((p) => p.signer_id === entry.signer_id)
      const targetKey = `sig-${documentIdForEntry}-${entry.signer_id}-${Math.max(idx, 0)}`

      setPreviewSignerId(entry.signer_id)
      setSelected(entry)
      setSelectedFieldKey(targetKey)
      setFocusedTargetId(targetKey)
      setInlineConfirmOpen(true)
      if (!entry.position) setDraftPlacement(null)
    },
    [currentUserId, envelopeDocuments, progress, selected?.document_id, selectedSignature],
  )

  const handleClearPreview = useCallback(() => {
    if (previewSignerId && !inlineConfirmOpen) {
      setPreviewSignerId(null)
      setSelected(null)
      setSelectedFieldKey(null)
      setInlineConfirmOpen(false)
    }
  }, [inlineConfirmOpen, previewSignerId])

  const handleInlineConfirm = useCallback(async () => {
    if (selected?.document_id && selected.signer_id) {
      progress.markSignatureConfirmed(selected.document_id, selected.signer_id)
    }
    setInlineConfirmOpen(false)
    setPreviewSignerId(null)
    setSelected(null)
    setSelectedFieldKey(null)
  }, [progress, selected])

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

  const shellUser = isDashboard && session?.user
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
    : undefined

  const homeHref = isDashboard ? '/dashboard' : '/'
  const dashboardHref = isDashboard ? '/dashboard/envelopes' : '/login'
  const fallbackHref = isDashboard ? dashboardHref : homeHref

  const selectedFieldLabel = useMemo(() => {
    if (!selectedFieldKey) return 'Signature field'
    return progress.fieldChecklist.find((i) => i.id === selectedFieldKey)?.label ?? 'Signature field'
  }, [progress.fieldChecklist, selectedFieldKey])

  const inlineContextLabel = useMemo(() => {
    if (!selected?.position?.page) return undefined
    const doc = envelopeDocuments.find((d) => d.id === selected.document_id)
    return `${doc?.file_name ?? 'Document'}, page ${selected.position.page}`
  }, [envelopeDocuments, selected])

  if (isDashboard && !isReady) {
    return <PdfLoadingIndicator label="Loading…" />
  }

  if (loadingEnv) {
    return (
      <SigningShell documentTitle="Loading…" user={shellUser}>
        <PdfLoadingIndicator label="Loading envelope…" />
      </SigningShell>
    )
  }

  if (!envelope && envelopeErrorState) {
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

  if (needsDocuments && (waitingForDocumentsAuth || loadingDocs)) {
    return (
      <SigningShell documentTitle={envelope.name} user={shellUser}>
        <PdfLoadingIndicator
          label={waitingForDocumentsAuth ? 'Preparing secure preview…' : 'Loading documents…'}
        />
      </SigningShell>
    )
  }

  if (needsDocuments && documentsErrorState) {
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

  if (needsDocuments && envelopeDocuments.length === 0) {
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

  const renderContent = () => {
    if (view.kind === 'status') {
      switch (view.status) {
        case 'waiting':
          return (
            <SigningStatusWaiting
              envelope={envelopeAsFull}
              currentUserId={currentUserId}
              onClose={() => router.push(dashboardHref)}
              backLabel={isDashboard ? 'Back to Dashboard' : 'Back to Home'}
            />
          )
        case 'complete':
          return (
            <SigningStatusComplete
              envelopeName={envelope.name}
              completionPhase={isEnvelopeFullyComplete ? 'envelope_complete' : 'submitted'}
              dashboardHomeHref={homeHref}
              downloadHref={
                isDashboard && envelopeId ? `/dashboard/envelopes/${envelopeId}` : undefined
              }
            />
          )
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
          currentUserId={currentUserId}
          signerName={session?.user?.full_name}
          signerEmail={session?.user?.email}
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
          currentUserId={currentUserId}
          signerName={session?.user?.full_name}
          signerEmail={session?.user?.email}
          onContinue={goToSign}
          onDecline={isDashboard ? () => setIsDeclineDialogOpen(true) : undefined}
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
            currentUserId={currentUserId}
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

        <SigningInlineConfirm
          open={inlineConfirmOpen}
          signatureImage={resolveSignatureImage(selectedSignature)}
          fieldLabel={selectedFieldLabel}
          contextLabel={inlineContextLabel}
          isSubmitting={signingSubmit.isSigningInFlight}
          onConfirm={handleInlineConfirm}
          onChangeSignature={() => setIsMobileSheetOpen(true)}
          onDismiss={() => {
            setInlineConfirmOpen(false)
            setPreviewSignerId(null)
            setSelected(null)
            setSelectedFieldKey(null)
          }}
        />

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
        onClose={() => router.push(isDashboard ? `/dashboard/envelopes/${envelopeId}` : '/')}
      >
        {renderContent()}
      </SigningShell>

      <SigningProcessingOverlay
        open={signingSubmit.showOverlay}
        phase={signingSubmit.overlayPhase}
        title="Applying your signature to the document…"
        message="Please wait while we embed your signature. This may take a moment."
        errorMessage={signingSubmit.errorMessage}
        onRetry={signingSubmit.retry}
        onKeepWaiting={signingSubmit.keepWaiting}
        onDismiss={signingSubmit.dismissFailure}
      />

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
    <Suspense fallback={<PdfLoadingIndicator label="Loading…" />}>
      <SignFlowPageInner {...props} />
    </Suspense>
  )
}

export default SignFlowPage
