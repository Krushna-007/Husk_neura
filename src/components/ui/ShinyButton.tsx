import type React from "react"
import "./ShinyButton.css"

interface ShinyButtonProps {
    children: React.ReactNode
    onClick?: () => void
    className?: string
    href?: string
    target?: string
    rel?: string
}

export function ShinyButton({ children, onClick, className = "", href, ...props }: ShinyButtonProps) {
    const ButtonContent = (
        <button className={`shiny-cta ${className}`} onClick={onClick}>
            <span>{children}</span>
        </button>
    );

    if (href) {
        return (
            <a href={href} {...props} className="no-underline">
                {ButtonContent}
            </a>
        );
    }

    return (
        <>
            {ButtonContent}
        </>
    )
}

export default ShinyButton;
