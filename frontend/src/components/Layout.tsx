import { Link } from "react-router-dom"

import { ModeToggle } from "@/components/ModeToggle"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface LayoutProps {
  children: React.ReactNode
  onSignOut: () => void
  isAuthed: boolean
}

export function Layout({ children, onSignOut, isAuthed }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fef3c7,_transparent_60%)] dark:bg-[radial-gradient(circle_at_top,_#1f2937,_transparent_60%)]">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
        <Link to="/" className="text-xl font-semibold">
          Problem Trainer
        </Link>
        <nav className="flex items-center gap-3">
          {isAuthed && (
            <>
              <Link to="/problems" className={cn(buttonVariants({ variant: "ghost" }))}>
                Problem Set
              </Link>
              <Link to="/proposals" className={cn(buttonVariants({ variant: "ghost" }))}>
                Propose
              </Link>
              <Link to="/admin/proposals" className={cn(buttonVariants({ variant: "ghost" }))}>
                Admin Proposals
              </Link>
              <Link to="/profile" className={cn(buttonVariants({ variant: "ghost" }))}>
                Profile
              </Link>
              <button className={cn(buttonVariants({ variant: "outline" }))} onClick={onSignOut}>
                Sign out
              </button>
            </>
          )}
          <ModeToggle />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 pb-16">{children}</main>
    </div>
  )
}
