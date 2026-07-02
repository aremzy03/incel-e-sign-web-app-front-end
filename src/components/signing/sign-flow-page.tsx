'use client'

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { getUserById, type User } from '@/lib/api/users'
import { uploadUserSignature } from '@/lib/api/signatures'
import { buildSigningFieldChecklist, getActiveFieldId } from '@/lib/signing/signing-field-checklist'
import { useAuthReady } from '@/hooks/useAuthReady'
import { useProfile } from '@/hooks/useProfile'
import { useSigningView } from '@/hooks/useSigningView'
import {
  useSigningCoordinates,
  useSigningEnvelope,
  useSignActions,
  useSigningFieldValues,
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
import { SigningStatusWaiting } from '@/components/signing/signing-status-waiting'
import { SigningStatusComplete } from '@/components/signing/signing-status-complete'
import { SigningStatusDeclined } from '@/components/signing/signing-status-declined'
import { SigningStatusCancelled } from '@/components/signing/signing-status-cancelled'
import { SigningFrozenEnvelopeAlert } from '@/components/signing/signing-frozen-envelope-alert'
import { SigningDocumentViewer } from '@/components/signing/signing-document-viewer'
import { SigningFieldsSidebar } from '@/components/signing/signing-fields-sidebar'
import { SigningMobileSheet } from '@/components/signing/signing-mobile-sheet'
import { SigningSignFooter } from '@/components/signing/signing-sign-footer'
import { SignatureModal } from '@/components/library/signature-modal'
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

  const [signedFor, setSignedFor] = useState<Record<string, boolean>>({})
  const [previewSignerId, setPreviewSignerId] = useState<string | null>(null)
  const [selected, setSelected] = useState<SignerDocumentPositionEntry | null>(null)
  const [draftPlacement, setDraftPlacement] = useState<Position | null>(null)
  const [isDraggingDraft, setIsDraggingDraft] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [signerDetails, setSignerDetails] = useState<Record<string, User>>({})
  const [selectedSignature, setSelectedSignature] = useState<unknown>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeclineDialogOpen, setIsDeclineDialogOpen] = useState(false)
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [zoom, setZoom] = useState(SIGNING_ZOOM_DEFAULT)
  const [pageIndicator, setPageIndicator] = useState({ current: 1, total: 1 })

  const {
    envelope,
    loadingEnv,
    envelopeDocuments,
    loadingDocs,
    docsError,
    pdfFileByDocumentId,
    pdfLoadedByDocId,
    setPdfLoadedByDocId,
    markPreviewFallback,
  } = useSigningEnvelope({
    envelopeId,
    enabled: isDashboard ? isReady : !!envelopeId,
    accessToken: isDashboard ? accessToken : accessToken,
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

  const mySignatureId = useMemo(() => resolveSignatureId(selectedSignature), [selectedSignature])

  const signActions = useSignActions({
    envelopeId,
    envelope,
    envelopeDocuments,
    currentUserId,
    mySignatureId,
    signerDetails,
    fieldValues: fieldState.fieldValues,
    signedFor,
    supportsDecline: isDashboard,
    supportsFieldSave: isDashboard,
    onSignSuccess: () => goToStatus('complete'),
    onDeclineSuccess: () => goToStatus('declined'),
  })

  const isSigningInFlight =
    signActions.signMutation.isPending || signActions.saveValuesMutation.isPending

  const mySignatureStatus = envelope?.signatures?.find(
    (s) => String(s.signer) === String(currentUserId),
  )?.status

  const handleApproveAndSign = async () => {
    const result = await signActions.approveAndSign()
    if (result?.kind === 'queued') {
      setIsDialogOpen(false)
      goToStatus('complete')
    }
  }

  const onPlaceholderClick = useCallback(
    (entry: SignerDocumentPositionEntry) => {
      const documentIdForEntry = entry.document_id || selected?.document_id
      if (documentIdForEntry && signedFor[`${documentIdForEntry}-${entry.signer_id}`]) return
      if (!selectedSignature) {
        toast.error('Please select a signature first')
        return
      }
      if (previewSignerId !== entry.signer_id) {
        setPreviewSignerId(entry.signer_id)
        setSelected(entry)
        if (!entry.position) setDraftPlacement(null)
        return
      }
      setIsDialogOpen(true)
    },
    [previewSignerId, selected?.document_id, selectedSignature, signedFor],
  )

  const handleClearPreview = useCallback(() => {
    if (previewSignerId && !isDialogOpen) {
      setPreviewSignerId(null)
      setSelected(null)
    }
  }, [isDialogOpen, previewSignerId])

  const handlePageIndicatorChange = useCallback((current: number, total: number) => {
    setPageIndicator((prev) =>
      prev.current === current && prev.total === total ? prev : { current, total },
    )
  }, [])

  const totalFields = useMemo(() => {
    const sigCount = envelopeDocuments.reduce((acc, doc) => {
      return (
        acc +
        (doc.signer_document_positions?.filter((p) => p.signer_id === currentUserId).length ?? 0)
      )
    }, 0)
    const otherFields =
      envelope?.fields?.filter((f) => f.assigned_signer === currentUserId).length ?? 0
    return sigCount + otherFields
  }, [currentUserId, envelope?.fields, envelopeDocuments])

  const completedFields = useMemo(() => {
    let count = Object.keys(signedFor).filter((k) => signedFor[k]).length
    envelope?.fields
      ?.filter((f) => f.assigned_signer === currentUserId)
      .forEach((f) => {
        if (f.type === 'date' || f.type === 'initials' || f.type === 'designation') count += 1
        if (f.type === 'text' && fieldState.fieldValues[f.id ?? '']) count += 1
      })
    return Math.min(count, totalFields || 1)
  }, [currentUserId, envelope?.fields, fieldState.fieldValues, signedFor, totalFields])

  const canComplete = completedFields >= totalFields && totalFields > 0 && !!mySignatureId

  const fieldChecklist = useMemo(
    () =>
      buildSigningFieldChecklist({
        envelopeDocuments,
        envelope,
        currentUserId,
        signedFor,
        fieldValues: fieldState.fieldValues,
      }),
    [currentUserId, envelope, envelopeDocuments, fieldState.fieldValues, signedFor],
  )

  const activeFieldId = useMemo(() => getActiveFieldId(fieldChecklist), [fieldChecklist])

  const isSignStep = view.kind === 'step' && view.step === 'sign'
  const needsDocuments = isSignStep
  const signToolbar = isSignStep ? (
    <SigningToolbar
      zoom={zoom}
      onZoomIn={() => setZoom((z) => Math.min(SIGNING_ZOOM_MAX, z + SIGNING_ZOOM_STEP))}
      onZoomOut={() => setZoom((z) => Math.max(SIGNING_ZOOM_MIN, z - SIGNING_ZOOM_STEP))}
      pageIndicator={`Page ${pageIndicator.current} of ${pageIndicator.total}`}
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

  if (isDashboard && !isReady) {
    return <PdfLoadingIndicator label="Loading…" />
  }

  if (loadingEnv || !envelope) {
    return (
      <SigningShell documentTitle="Loading…" user={shellUser}>
        <PdfLoadingIndicator label="Loading envelope…" />
      </SigningShell>
    )
  }

  if (needsDocuments && loadingDocs) {
    return (
      <SigningShell documentTitle={envelope.name} user={shellUser}>
        <PdfLoadingIndicator label="Loading documents…" />
      </SigningShell>
    )
  }

  if (needsDocuments && (docsError || envelopeDocuments.length === 0)) {
    return (
      <SigningShell documentTitle={envelope.name} user={shellUser}>
        <div className="flex flex-1 items-center justify-center p-8">
          <p className="text-muted">{docsError || 'No documents found.'}</p>
        </div>
      </SigningShell>
    )
  }

  const envelopeAsFull = envelope as unknown as Envelope

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
              isEnvelopeComplete={(envelope.status || '').toLowerCase().includes('complete')}
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

    const handleCompleteSigning = () => {
      if (previewSignerId) setIsDialogOpen(true)
      else toast.error('Click a signature field on the document first')
    }

    return (
      <>
        <div className="flex min-h-0 flex-1 overflow-hidden pb-[72px]">
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
            signedFor={signedFor}
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
            onPageIndicatorChange={handlePageIndicatorChange}
          />
          <SigningFieldsSidebar
            completedCount={completedFields}
            totalCount={totalFields || 1}
            fieldItems={fieldChecklist}
            activeFieldId={activeFieldId}
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
            completedCount={completedFields}
            totalCount={totalFields || 1}
            signatures={signatures}
            selectedSignature={selectedSignature}
            onSelectSignature={setSelectedSignature}
            onUploadClick={() => setIsUploadModalOpen(true)}
            isUploading={uploadSignatureMutation.isPending}
          />
        </div>
        <SigningSignFooter
          completedCount={completedFields}
          totalCount={totalFields || 1}
          canComplete={canComplete}
          isSubmitting={isSigningInFlight}
          onDecline={() => setIsDeclineDialogOpen(true)}
          onFinishLater={() => router.push(dashboardHref)}
          onComplete={handleCompleteSigning}
        />
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Signature Placement</DialogTitle>
              <DialogDescription>
                Approve to finalize signing on this envelope.
              </DialogDescription>
            </DialogHeader>
            <div className="my-4 flex justify-center">
              {resolveSignatureImage(selectedSignature) ? (
                <img
                  src={resolveSignatureImage(selectedSignature)}
                  alt="Signature preview"
                  className="h-[60px] w-[200px] rounded-md border border-border object-contain"
                />
              ) : (
                <p className="text-sm text-muted">No signature selected</p>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApproveAndSign}
                disabled={isSigningInFlight}
              >
                {isSigningInFlight ? 'Processing…' : 'Approve & Sign'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  return (
    <>
      <SigningShell
        documentTitle={envelope.name}
        showNavRail={isSignStep}
        hideClose={isSignStep}
        user={shellUser}
        toolbar={signToolbar}
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
              disabled={signActions.declineMutation.isPending || isSigningInFlight || mySignatureStatus === 'processing'}
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
