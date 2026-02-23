"use client"

import React, { useState, useCallback } from "react"
import { LiquidGlass } from "./LiquidGlass"

interface LiquidButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "rose"
  size?: "sm" | "md" | "lg" | "xl"
  disabled?: boolean
  loading?: boolean
  className?: string
  style?: React.CSSProperties
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
  rippleEffect?: boolean
}

export function LiquidButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  style,
  icon,
  iconPosition = "left",
  rippleEffect = true,
}: LiquidButtonProps) {
  const [isPressed, setIsPressed] = useState(false)

  const getVariantStyles = () => {
    switch (variant) {
      case "primary":
        return "text-white bg-gradient-to-r from-brand-rose/30 to-brand-gold/30 border-brand-rose/30 hover:from-brand-rose/40 hover:to-brand-gold/40"
      case "secondary":
        return "text-brand-charcoal bg-white/10 border-white/20 hover:bg-white/15"
      case "ghost":
        return "text-brand-charcoal bg-transparent border-white/10 hover:bg-white/5"
      case "rose":
        return "text-white bg-gradient-to-r from-brand-rose/40 to-brand-rose-dark/40 border-brand-rose/40 hover:from-brand-rose/50 hover:to-brand-rose-dark/50"
      default:
        return "text-white bg-white/10 border-white/20"
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case "sm":
        return "px-4 py-2 text-sm rounded-xl"
      case "lg":
        return "px-8 py-4 text-lg rounded-2xl"
      case "xl":
        return "px-10 py-5 text-xl rounded-3xl"
      default:
        return "px-6 py-3 text-base rounded-2xl"
    }
  }

  const handleClick = useCallback(() => {
    if (disabled || loading) return
    setIsPressed(false)
    onClick?.()
  }, [disabled, loading, onClick])

  const buttonContent = (
    <div className="flex items-center justify-center gap-2">
      {loading && (
        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
      )}
      {icon && iconPosition === "left" && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}
      <span className={loading ? "opacity-70" : ""}>{children}</span>
      {icon && iconPosition === "right" && !loading && (
        <span className="flex-shrink-0">{icon}</span>
      )}
    </div>
  )

  return (
    <LiquidGlass
      variant="button"
      intensity="medium"
      rippleEffect={rippleEffect}
      flowOnHover={!disabled}
      stretchOnDrag={false}
      onClick={handleClick}
      className={`
        ${getVariantStyles()}
        ${getSizeStyles()}
        ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
        ${isPressed ? "scale-95" : ""}
        transition-all duration-150 ease-out
        font-medium
        select-none
        backdrop-blur-3xl
        ${className}
      `}
      style={style}
    >
      {buttonContent}
    </LiquidGlass>
  )
}
