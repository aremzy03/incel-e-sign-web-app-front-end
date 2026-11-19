import { getActiveNavItem, getPageTitle, primaryDashboardNav } from '../dashboard-nav-config'

describe('dashboard section titles', () => {
  it.each([
    ['/dashboard', 'Dashboard'],
    ['/dashboard/envelopes', 'Envelopes'],
    ['/dashboard/envelopes/6f3c50f5-e4f6-4088-9ce7-3bd04a3c4bbc', 'Envelopes'],
    ['/dashboard/envelopes/create', 'Envelopes'],
    ['/dashboard/documents/upload', 'Documents'],
    ['/dashboard/profile', 'Profile'],
    ['/dashboard/notifications', 'Notifications'],
  ])('%s is titled %s', (path, title) => {
    expect(getPageTitle(path, primaryDashboardNav)).toBe(title)
  })

  it('highlights the section, not the dashboard home, on a nested page', () => {
    expect(getActiveNavItem('/dashboard/envelopes/abc', primaryDashboardNav)?.name).toBe('Envelopes')
    expect(getActiveNavItem('/dashboard/profile', primaryDashboardNav)).toBeUndefined()
  })
})
