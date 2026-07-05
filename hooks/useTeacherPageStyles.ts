'use client'

import { useMemo } from 'react'
import type { CSSProperties } from 'react'
import type { TeacherStyles, UITheme } from '@/lib/teacher/teacher.styles'

type UseTeacherPageStylesParams = {
  ui: UITheme
  isDark: boolean
  themeMode: 'light' | 'dark'
}

export function useTeacherPageStyles({
  ui,
  isDark,
  themeMode,
}: UseTeacherPageStylesParams): TeacherStyles {
  return useMemo(() => {
    const inputStyle: CSSProperties = {
      width: '100%',
      padding: '13px 14px',
      borderRadius: 14,
      borderWidth: '1.5px',
      borderStyle: 'solid',
      borderColor: ui.border,
      background: ui.inputBg,
      color: ui.text,
      fontSize: 14,
      fontFamily: 'inherit',
      colorScheme: themeMode,
      transition: 'border-color .18s, box-shadow .18s, background .18s',
      outline: 'none',
    }

    const sectionCard: CSSProperties = {
      background: ui.panel,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: ui.border,
      borderRadius: 24,
      boxShadow: ui.cardGlow,
      backdropFilter: 'blur(12px)',
    }

    const smallCard: CSSProperties = {
      background: ui.panelStrong,
      borderWidth: '1px',
      borderStyle: 'solid',
      borderColor: ui.border,
      borderRadius: 18,
      boxShadow: ui.cardGlow,
    }

    const ghostBtn = (active = false): CSSProperties => ({
      padding: '10px 14px',
      borderRadius: 12,
      borderWidth: '1.5px',
      borderStyle: 'solid',
      borderColor: active ? ui.borderAccent : ui.border,
      background: active
        ? isDark
          ? 'rgba(140,20,40,0.12)'
          : 'rgba(140,20,40,0.07)'
        : 'transparent',
      color: active ? ui.themeColor : ui.sub,
      cursor: 'pointer',
      fontFamily: 'inherit',
      fontSize: 13,
      fontWeight: active ? 800 : 700,
      transition: 'all .18s',
    })

    const primaryBtn = (enabled = true): CSSProperties => ({
      padding: '14px 16px',
      borderRadius: 14,
      borderWidth: 0,
      borderStyle: 'solid',
      borderColor: 'transparent',
      background: enabled ? ui.gradMain : ui.border,
      color: '#fff',
      fontWeight: 900,
      fontSize: 15,
      cursor: enabled ? 'pointer' : 'not-allowed',
      fontFamily: 'inherit',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      boxShadow: enabled ? ui.glow : 'none',
    })

    const pageCss = `
      * { box-sizing: border-box; }
      body { margin: 0; background: ${ui.bg}; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      .fade-in { animation: fadeIn .28s ease; }
      textarea:focus, input:focus, select:focus {
        outline: none;
        border-color: rgba(140,20,40,0.36) !important;
        box-shadow: 0 0 0 3px rgba(140,20,40,0.08);
      }
      select option {
        background-color: ${ui.panelAlt} !important;
        color: ${ui.text} !important;
      }
      select { color-scheme: ${themeMode}; }
      .page-wrap {
        width: 100%;
        max-width: 1180px;
        margin: 0 auto;
        padding: 22px 16px 40px;
      }
      .hero-grid {
        display: grid;
        grid-template-columns: 1.2fr .8fr;
        gap: 18px;
        align-items: stretch;
      }
      .stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
      .tabs-strip {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: thin;
      }
      .cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 14px;
      }
      .split-grid {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 16px;
        min-height: 420px;
      }
      .stats-top-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }
      .modal-shell {
        position: fixed;
        inset: 0;
        z-index: 100;
        background: rgba(0,0,0,.74);
        backdrop-filter: blur(6px);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 16px;
      }
      .modal-card {
        width: 100%;
        max-width: 920px;
        border-radius: 22px;
        overflow: hidden;
        background: ${ui.panelAlt};
        border: 1px solid ${ui.border};
        box-shadow: ${ui.shadow};
        max-height: 88vh;
        display: flex;
        flex-direction: column;
      }
      .modal-body-scroll {
        overflow-y: auto;
        padding: 20px;
      }
      @media (max-width: 980px) {
        .hero-grid { grid-template-columns: 1fr; }
        .split-grid { grid-template-columns: 1fr; }
        .stats-top-grid { grid-template-columns: 1fr 1fr; }
      }
      @media (max-width: 640px) {
        .stats-grid { grid-template-columns: 1fr; }
        .stats-top-grid { grid-template-columns: 1fr; }
      }
    `

    return {
      inputStyle,
      sectionCard,
      smallCard,
      ghostBtn,
      primaryBtn,
      pageCss,
    }
  }, [ui, isDark, themeMode])
}