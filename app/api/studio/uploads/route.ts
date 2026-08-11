// app/api/studio/uploads/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getCurrentUserFromRequest } from '@/lib/studio/auth'

type StudioAssetType = 'pdf' | 'text' | 'image' | 'video'

function detectAssetTypeFromMime(mime: string): StudioAssetType {
  if (!mime) return 'pdf'

  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('image/')) return 'image'
  if (mime.startsWith('video/')) return 'video'

  // النصوص يمكن أن تكون text/plain أو application/msword أو غيرها
  if (mime.startsWith('text/')) return 'text'

  return 'pdf'
}

// نفترض وجود bucket في Supabase Storage باسم 'studio'
// يمكنك تغيير الاسم حسب إعداداتك.
const STUDIO_BUCKET = 'studio' as const

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUserFromRequest(req)

    // currentUser may have an unknown type; narrow safely to check id
    if (!currentUser || !(currentUser as any).id) {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول لرفع مادة إلى مِداد استديو.' },
        { status: 401 }
      )
    }

    const userId = (currentUser as any).id

    const formData = await req.formData()
    const projectId = formData.get('projectId') as string | null
    const file = formData.get('file') as File | null

    if (!projectId) {
      return NextResponse.json(
        { error: 'معرّف المشروع مفقود أو غير صالح.' },
        { status: 400 }
      )
    }

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم استلام أي ملف في حقل file.' },
        { status: 400 }
      )
    }

    // التحقق من أن المشروع يخص هذا المعلم
    const { data: project, error: projectError } = await supabaseAdmin
      .from('studio_projects')
      .select('id, user_id')
      .eq('id', projectId)
      .single()

    if (projectError || !project) {
      console.error('studio_projects check error:', projectError)
      return NextResponse.json(
        { error: 'تعذر العثور على المشروع المحدد.' },
        { status: 404 }
      )
    }

    if (project.user_id !== userId) {
      return NextResponse.json(
        { error: 'لا تملك صلاحية رفع مادة لهذا المشروع.' },
        { status: 403 }
      )
    }

    const fileName = file.name || `asset-${Date.now()}`
    const mimeType = file.type || 'application/octet-stream'
    const assetType = detectAssetTypeFromMime(mimeType)

    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // مسار داخل البكت: studio/projects/{projectId}/{fileName}
    const filePath = `projects/${projectId}/${fileName}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from(STUDIO_BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError)
      return NextResponse.json(
        { error: 'تعذر رفع الملف إلى التخزين.' },
        { status: 500 }
      )
    }

    // حفظ سجل المادة في جدول studio_assets
    const { data: asset, error: assetError } = await supabaseAdmin
      .from('studio_assets')
      .insert({
        project_id: projectId,
        asset_type: assetType,
        file_name: fileName,
        file_path: filePath,
        mime_type: mimeType,
      })
      .select('id, asset_type, file_name, file_path, mime_type, uploaded_at')
      .single()

    if (assetError || !asset) {
      console.error('studio_assets insert error:', assetError)
      return NextResponse.json(
        { error: 'تم رفع الملف لكن تعذر حفظ بياناته في قاعدة البيانات.' },
        { status: 500 }
      )
    }

    // تحديث حالة المشروع إلى uploaded
    const { error: updateProjectError } = await supabaseAdmin
      .from('studio_projects')
      .update({
        status: 'uploaded',
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)

    if (updateProjectError) {
      console.error('studio_projects status update error:', updateProjectError)
    }

    return NextResponse.json(
      {
        message: 'تم رفع المادة بنجاح.',
        asset,
      },
      { status: 200 }
    )
  } catch (err: any) {
    console.error('studio/uploads POST unexpected error:', err)
    return NextResponse.json(
      {
        error:
          err?.message ||
          'حدث خطأ غير متوقع أثناء رفع المادة.',
      },
      { status: 500 }
    )
  }
}