'use client'

import { createContext, useContext } from 'react'

interface SidebarContextValue {
  isCollapsed: boolean
}

const SidebarContext = createContext<SidebarContextValue>({ isCollapsed: false })

export const SidebarProvider = SidebarContext.Provider

export function useSidebar() {
  return useContext(SidebarContext)
}
