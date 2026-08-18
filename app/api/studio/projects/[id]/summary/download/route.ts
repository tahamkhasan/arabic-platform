import { NextRequest, NextResponse } from 'next/server'
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  TextRun,
} from 'docx'
import { supabaseAdmin } from '@/lib/supabase-admin'

export const runtime = 'nodejs'

type StudioProject = {
  id: string
  title: string | null
  output_type: string | null
}

type StudioSummary = {
  content: string
  updated_at: string | null
}

function sanitizeFileName(value: string): string {
  const cleaned = value
    .trim()
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .slice(0, 100)

  return cleaned || 'ملخص-الدرس'
}

function cleanLessonTitle(projectTitle: string | null): string {
  const raw = (projectTitle || 'الدرس').trim()

  return (
    raw
      .replace(/^ملخص\s+(الدرس|درس)\s*[:：-]?\s*/i, '')
      .replace(/^درس\s*[:：-]?\s*/i, '')
      .trim() || 'الدرس'
  )
}

function buildParagraphs(content: string): Paragraph[] {
  const lines = content
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())

  return lines.map((line) => {
    if (!line) {
      return new Paragraph({
        spacing: {
          after: 120,
        },
      })
    }

    const isSectionTitle = /^(أولًا|ثانيًا|ثالثًا|رابعًا|خامسًا|سادسًا|مصدر الملخص)/.test(
      line
    )

    const isQuestion = /^\d+\./.test(line)
    const isBullet = line.startsWith('-')

    return new Paragraph({
      alignment: AlignmentType.RIGHT,
      bidirectional: true,
      spacing: {
        after: 130,
        line: 360,
      },
      indent: isBullet
        ? {
            right: 360,
          }
        : undefined,
      children: [
        new TextRun({
          text: line,
          font: 'Arial',
          size: 25,
          bold: isSectionTitle,
          color: isSectionTitle ? '7A1E2C' : '1F2937',
          rightToLeft: true,
          italics: false,
        }),
      ],
    })
  })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: projectId } = await params

  if (!projectId) {
    return NextResponse.json(
      { error: 'لم يتم تمرير معرّف المشروع.' },
      { status: 400 }
    )
  }

  try {
    const { data: project, error: projectError } = await supabaseAdmin
      .from('studio_projects')
      .select('id, title, output_type')
      .eq('id', projectId)
      .single<StudioProject>()

    if (projectError || !project) {
      console.error('summary download project error:', projectError)

      return NextResponse.json(
        { error: 'تعذر العثور على المشروع المطلوب.' },
        { status: 404 }
      )
    }

    if (project.output_type !== 'lesson_summary') {
      return NextResponse.json(
        { error: 'هذا المشروع ليس مشروع ملخص درس.' },
        { status: 400 }
      )
    }

    const { data: summary, error: summaryError } = await supabaseAdmin
      .from('studio_summaries')
      .select('content, updated_at')
      .eq('project_id', projectId)
      .single<StudioSummary>()

    if (summaryError || !summary?.content?.trim()) {
      console.error('summary download summary error:', summaryError)

      return NextResponse.json(
        { error: 'لا يوجد ملخص محفوظ يمكن تنزيله بعد.' },
        { status: 404 }
      )
    }

    const lessonTitle = cleanLessonTitle(project.title)

    const document = new Document({
      creator: 'مِداد',
      title: `ملخص درس: ${lessonTitle}`,
      description: 'ملخص درس تم إنشاؤه بواسطة مِداد استديو.',
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 900,
                right: 900,
                bottom: 900,
                left: 900,
              },
            },
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              spacing: {
                after: 120,
              },
              children: [
                new TextRun({
                  text: 'مِداد استديو',
                  font: 'Arial',
                  size: 28,
                  bold: true,
                  color: '7A1E2C',
                  rightToLeft: true,
                }),
              ],
            }),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              spacing: {
                after: 420,
              },
              children: [
                new TextRun({
                  text: `ملخص درس: ${lessonTitle}`,
                  font: 'Arial',
                  size: 36,
                  bold: true,
                  color: '1F2937',
                  rightToLeft: true,
                }),
              ],
            }),

            ...buildParagraphs(summary.content),

            new Paragraph({
              alignment: AlignmentType.CENTER,
              bidirectional: true,
              spacing: {
                before: 360,
              },
              children: [
                new TextRun({
                  text: `تم الإنشاء بواسطة مِداد استديو • ${new Date(
                    summary.updated_at || Date.now()
                  ).toLocaleDateString('ar-KW')}`,
                  font: 'Arial',
                  size: 18,
                  color: '6B7280',
                  rightToLeft: true,
                }),
              ],
            }),
          ],
        },
      ],
    })

    const buffer = await Packer.toBuffer(document)
    const encodedFileName = encodeURIComponent(
      `${sanitizeFileName(`ملخص درس ${lessonTitle}`)}.docx`
    )
    const fileBytes = new Uint8Array(buffer)

    return new NextResponse(fileBytes, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodedFileName}`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (error) {
    console.error('summary download unexpected error:', error)

    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع أثناء تجهيز ملف Word.' },
      { status: 500 }
    )
  }
}