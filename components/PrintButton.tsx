'use client'
import { useRef } from 'react'
import { useReactToPrint } from 'react-to-print'

interface PrintButtonProps {
  content:     string
  title:       string
  grade?:      string
  subject?:    string
  themeColor?: string
}

export default function PrintButton({
  content,
  title,
  grade,
  subject,
  themeColor = '#f9d423',
}: PrintButtonProps) {
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: title,
    pageStyle: `
      @page {
        size: A4;
        margin: 20mm 15mm;
      }
      @media print {
        body {
          font-family: 'Arial', sans-serif;
          direction: rtl;
          color: #1a1a2e;
          background: #fff;
        }
        .print-header {
          border-bottom: 3px solid #f9d423;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .print-content {
          font-size: 14px;
          line-height: 2;
          white-space: pre-wrap;
        }
        .print-footer {
          border-top: 1px solid #e2e8f0;
          padding-top: 8px;
          margin-top: 20px;
          font-size: 11px;
          color: #718096;
          text-align: center;
        }
      }
    `,
  })

  return (
    <>
      {/* زر الطباعة */}
      <button
        onClick={handlePrint}
        style={{
          display:        'flex',
          alignItems:     'center',
          gap:            6,
          padding:        '7px 14px',
          borderRadius:   10,
          border:         `1.5px solid ${themeColor}44`,
          background:     themeColor + '15',
          color:          themeColor,
          cursor:         'pointer',
          fontWeight:     700,
          fontSize:       13,
          fontFamily:     'inherit',
          transition:     'all 0.2s',
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLButtonElement).style.background = themeColor + '25'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.background = themeColor + '15'
          ;(e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
        }}
      >
        <span style={{ fontSize: 16 }}>🖨️</span>
        <span>طباعة / PDF</span>
      </button>

      {/* المحتوى المخفي للطباعة */}
      <div style={{ display: 'none' }}>
        <div ref={printRef} dir="rtl" style={{ padding: '0 10px', fontFamily: 'Arial, sans-serif' }}>

          {/* رأس الصفحة */}
          <div className="print-header" style={{ borderBottom: '3px solid #f9d423', paddingBottom: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h1 style={{ margin: '0 0 4px', fontSize: 20, color: '#1a1a2e', fontWeight: 900 }}>
                  🌙 منصة مساعد اللغة العربية
                </h1>
                <p style={{ margin: 0, fontSize: 13, color: '#718096' }}>
                  {subject && `المادة: ${subject}`}
                  {grade && ` • الصف: ${grade}`}
                </p>
              </div>
              <div style={{ textAlign: 'left', fontSize: 11, color: '#a0aec0' }}>
                <p style={{ margin: 0 }}>{new Date().toLocaleDateString('ar-KW', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
              </div>
            </div>
            <h2 style={{ margin: '12px 0 0', fontSize: 16, color: '#1a1a2e', fontWeight: 800, borderRight: '4px solid #f9d423', paddingRight: 10 }}>
              {title}
            </h2>
          </div>

          {/* المحتوى */}
          <div className="print-content" style={{ fontSize: 14, lineHeight: 2, whiteSpace: 'pre-wrap', color: '#1a1a2e' }}>
            {content}
          </div>

          {/* تذييل الصفحة */}
          <div className="print-footer" style={{ borderTop: '1px solid #e2e8f0', paddingTop: 8, marginTop: 20, fontSize: 11, color: '#718096', textAlign: 'center' }}>
            منصة مساعد اللغة العربية • الكويت 🇰🇼 • mosaed-arabic.vercel.app
          </div>
        </div>
      </div>
    </>
  )
}