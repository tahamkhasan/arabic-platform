// app/api/studio/upload-source/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/studio/upload-source
// يتسلّم FormData فيه: file, projectId
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'ملف أو معرف مشروع غير موجود.' },
        { status: 400 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    const { data, error } = await supabaseAdmin.storage
      .from('studio-sources') // اسم الـ bucket
      .upload(`project-${projectId}/${file.name}`, fileBuffer, {
        contentType: file.type,
        upsert: true,
      })

    if (error || !data) {
      console.error('Supabase storage upload error:', error)
      return NextResponse.json(
        { error: 'تعذر رفع الملف إلى التخزين.' },
        { status: 500 },
      )
    }

    // يمكن لاحقاً أن نخزّن هذا المسار في جدول studio_projects
    return NextResponse.json(
      {
        path: data.path,
      },
      { status: 200 },
    )
  } catch (err: any) {
    console.error('upload-source unexpected error:', err)
    return NextResponse.json(
      {
        error:
          err?.message || 'خطأ غير متوقع أثناء رفع الملف المصدر للمشروع.',
      },
      { status: 500 },
    )
  }
}