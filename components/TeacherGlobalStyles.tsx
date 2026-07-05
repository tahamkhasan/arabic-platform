'use client'

import type { UITheme } from './teacher.types'

export function TeacherGlobalStyles({
  ui,
  themeMode,
}: {
  ui: UITheme
  themeMode: 'light' | 'dark'
}) {
  return (
    <style>{`
      * { box-sizing: border-box; }
      body { margin: 0; background: ${ui.bg}; }

      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }

      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }

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

      .teacher-page-wrap {
        width: 100%;
        max-width: 1180px;
        margin: 0 auto;
        padding: 22px 16px 40px;
      }

      .teacher-hero-grid {
        display: grid;
        grid-template-columns: 1.2fr .8fr;
        gap: 18px;
        align-items: stretch;
      }

      .teacher-stats-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }

      .teacher-tabs-strip {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: thin;
      }

      .teacher-cards-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 14px;
      }

      .teacher-split-grid {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 16px;
        min-height: 420px;
      }

      .teacher-stats-top-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
        margin-bottom: 24px;
      }

      .teacher-modal-shell {
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

      .teacher-modal-card {
        width: 100%;
        border-radius: 22px;
        overflow: hidden;
        max-height: 88vh;
        display: flex;
        flex-direction: column;
      }

      .teacher-modal-body-scroll {
        overflow-y: auto;
        padding: 20px;
      }

      @media (max-width: 980px) {
        .teacher-hero-grid { grid-template-columns: 1fr; }
        .teacher-split-grid { grid-template-columns: 1fr; }
        .teacher-stats-top-grid { grid-template-columns: 1fr 1fr; }
      }

      @media (max-width: 640px) {
        .teacher-stats-grid { grid-template-columns: 1fr; }
        .teacher-stats-top-grid { grid-template-columns: 1fr; }
      }
    `}</style>
  )
}