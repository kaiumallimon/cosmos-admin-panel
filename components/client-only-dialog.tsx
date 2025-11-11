"use client"

import React from "react"
import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"

interface ClientOnlyDialogProps {
    trigger: React.ReactNode
    title: React.ReactNode
    description?: React.ReactNode
    children: React.ReactNode
    className?: string
}

export function ClientOnlyDialog({ 
    trigger, 
    title, 
    description, 
    children, 
    className 
}: ClientOnlyDialogProps) {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
        setMounted(true)
    }, [])

    // Return a placeholder during SSR to avoid hydration mismatch
    if (!mounted) {
        return (
            <div className={className}>
                {trigger}
            </div>
        )
    }

    return (
        <Dialog>
            <DialogTrigger asChild>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    {description && (
                        <DialogDescription>{description}</DialogDescription>
                    )}
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    )
}