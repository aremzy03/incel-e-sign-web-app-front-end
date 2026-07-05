import { redirect } from 'next/navigation'

export default function AdminAuditRedirectPage() {
  redirect('/dashboard/audit')
}
