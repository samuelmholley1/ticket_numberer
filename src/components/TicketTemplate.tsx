'use client'

import { useState, useRef, useEffect } from 'react'
import { TicketData } from '@/types/ticket'

interface TicketTemplateProps {
  ticketData: TicketData
  onUpdate: (updates: Partial<TicketData>) => void
  isPreview?: boolean
}

export default function TicketTemplate({ ticketData, onUpdate, isPreview = false }: TicketTemplateProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  // Fixed artboard dimensions: 600x1500px (2" x 5" at 300 DPI)
  const artboardStyle = {
    width: '600px',
    height: '1500px',
    backgroundColor: ticketData.backgroundColor || '#ffffff',
    color: ticketData.textColor || '#000000',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    border: isPreview ? '2px solid #e5e7eb' : 'none',
    borderRadius: isPreview ? '8px' : '0',
  }

  const handleFieldChange = (field: keyof TicketData, value: string) => {
    onUpdate({ [field]: value })
  }

  return (
    <div ref={containerRef} style={artboardStyle} className="ticket-artboard">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          background: `linear-gradient(135deg, ${ticketData.accentColor || '#3b82f6'} 0%, ${ticketData.backgroundColor || '#ffffff'} 100%)`
        }}
      />

      {/* Logo Section */}
      <div className="absolute top-8 left-8 right-8 h-24 flex items-center justify-center">
        {ticketData.logoUrl ? (
          <img
            src={ticketData.logoUrl}
            alt="Logo"
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="text-4xl font-bold opacity-20">
            LOGO
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="absolute top-40 left-8 right-8 bottom-40 flex flex-col justify-center items-center text-center space-y-6">
        {/* Title */}
        <div className="w-full">
          {isPreview ? (
            <h1 className="text-6xl font-black leading-tight">
              {ticketData.title || 'EVENT TITLE'}
            </h1>
          ) : (
            <input
              type="text"
              value={ticketData.title || ''}
              onChange={(e) => handleFieldChange('title', e.target.value)}
              placeholder="Event Title"
              className="w-full text-6xl font-black text-center bg-transparent border-none outline-none leading-tight"
              style={{ color: ticketData.textColor }}
            />
          )}
        </div>

        {/* Subtitle */}
        <div className="w-full">
          {isPreview ? (
            <h2 className="text-3xl font-semibold opacity-80">
              {ticketData.subtitle || 'Event Subtitle'}
            </h2>
          ) : (
            <input
              type="text"
              value={ticketData.subtitle || ''}
              onChange={(e) => handleFieldChange('subtitle', e.target.value)}
              placeholder="Event Subtitle"
              className="w-full text-3xl font-semibold text-center bg-transparent border-none outline-none opacity-80"
              style={{ color: ticketData.textColor }}
            />
          )}
        </div>

        {/* Ticket Number - Large and Prominent */}
        <div className="mt-8">
          <div
            className="text-8xl font-black tracking-wider"
            style={{
              color: ticketData.accentColor || '#3b82f6',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {ticketData.number}
          </div>
        </div>

        {/* Custom Fields */}
        {ticketData.customFields && Object.entries(ticketData.customFields).map(([key, value]) => (
          <div key={key} className="w-full text-center">
            {isPreview ? (
              <div className="text-xl font-medium">
                {value}
              </div>
            ) : (
              <input
                type="text"
                value={value}
                onChange={(e) => onUpdate({
                  customFields: {
                    ...ticketData.customFields,
                    [key]: e.target.value
                  }
                })}
                placeholder={key}
                className="w-full text-xl font-medium text-center bg-transparent border-none outline-none"
                style={{ color: ticketData.textColor }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="absolute bottom-8 left-8 right-8 text-center">
        <div className="text-sm opacity-60">
          {isPreview ? 'www.example.com' : 'Website URL'}
        </div>
      </div>

      {/* Decorative Elements */}
      <div
        className="absolute top-4 left-4 w-16 h-16 rounded-full opacity-20"
        style={{ backgroundColor: ticketData.accentColor }}
      />
      <div
        className="absolute top-4 right-4 w-12 h-12 rounded-full opacity-20"
        style={{ backgroundColor: ticketData.accentColor }}
      />
      <div
        className="absolute bottom-4 left-4 w-8 h-8 rounded-full opacity-20"
        style={{ backgroundColor: ticketData.accentColor }}
      />
      <div
        className="absolute bottom-4 right-4 w-10 h-10 rounded-full opacity-20"
        style={{ backgroundColor: ticketData.accentColor }}
      />
    </div>
  )
}