'use client'
import { useRef, useState } from 'react'
import type { LessonFormState, LessonItem } from '@/types/lessons'
import { BRAND } from '@/lib/constants/theme'
import Button from '@/components/ui/Button'

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: BRAND.radiusSm,
  border: `1.5px solid ${BRAND.border}`, background: 'rgba(140,20,40,0.04)',
  color: BRAND.text, fontSize: 14, fontFamily: 'inherit',
}

type ArabicBranch = 'comprehension' | 'tharwa' | 'balagha' | 'nahw'

const ARABIC_FILE_DEFS: { key: ArabicBranch; label: string; icon: string; hint: string }[] = [
  { key: 'comprehension', label: 'فهم واستيعاب', icon: '📖', hint: 'نص + شرح + أسئلة' },
  { key: 'tharwa',        label: 'ثروة لغوية',   icon: '📚', hint: 'ترادف / جمع ومفرد / معنى سياقي' },
  { key: 'balagha',       label: 'بلاغة',         icon: '🎨', hint: 'شرح + أمثلة + أسئلة' },
  { key: 'nahw',          label: 'نحو',            icon: '🧩', hint: 'شرح + أمثلة + أسئلة' },
]

function getUrls(f: LessonFormState, k: ArabicBranch) {
  return k==='comprehension'?f.comprehensionFileUrls:k==='tharwa'?f.tharwaFileUrls:k==='balagha'?f.balaghaFileUrls:f.nahwFileUrls
}
function getNames(f: LessonFormState, k: ArabicBranch) {
  return k==='comprehension'?f.comprehensionFileNames:k==='tharwa'?f.tharwaFileNames:k==='balagha'?f.balaghaFileNames:f.nahwFileNames
}
function getNewFiles(f: LessonFormState, k: ArabicBranch) {
  return k==='comprehension'?f.newComprehensionFiles:k==='tharwa'?f.newTharwaFiles:k==='balagha'?f.newBalaghaFiles:f.newNahwFiles
}

export default function LessonFormModal({
  open,isArabic,form,editingLesson,saving,deleting,onClose,onSubmit,onChange,
}:{
  open:boolean;isArabic:boolean;form:LessonFormState;editingLesson:LessonItem|null
  saving:boolean;deleting:boolean;onClose:()=>void;onSubmit:()=>void
  onChange:<K extends keyof LessonFormState>(key:K,value:LessonFormState[K])=>void
}) {
  const videoFileRef=useRef<HTMLInputElement>(null)
  const filesRef=useRef<HTMLInputElement>(null)
  const [videoMode,setVideoMode]=useState<'link'|'upload'>('link')

  const comprehensionRef=useRef<HTMLInputElement>(null)
  const tharwaRef=useRef<HTMLInputElement>(null)
  const balaghaRef=useRef<HTMLInputElement>(null)
  const nahwRef=useRef<HTMLInputElement>(null)
  const branchRefs:Record<ArabicBranch,React.RefObject<HTMLInputElement|null>>={
    comprehension:comprehensionRef,tharwa:tharwaRef,balagha:balaghaRef,nahw:nahwRef
  }

  if(!open)return null
  const canSubmit=!saving&&form.name.trim().length>0

  function removeExistingBranchFile(key:ArabicBranch,idx:number){
    const urls=[...getUrls(form,key)];const names=[...getNames(form,key)]
    urls.splice(idx,1);names.splice(idx,1)
    if(key==='comprehension'){onChange('comprehensionFileUrls',urls);onChange('comprehensionFileNames',names)}
    else if(key==='tharwa'){onChange('tharwaFileUrls',urls);onChange('tharwaFileNames',names)}
    else if(key==='balagha'){onChange('balaghaFileUrls',urls);onChange('balaghaFileNames',names)}
    else{onChange('nahwFileUrls',urls);onChange('nahwFileNames',names)}
  }

  function removeNewBranchFile(key:ArabicBranch,idx:number){
    const files=[...getNewFiles(form,key)];files.splice(idx,1)
    if(key==='comprehension')onChange('newComprehensionFiles',files)
    else if(key==='tharwa')onChange('newTharwaFiles',files)
    else if(key==='balagha')onChange('newBalaghaFiles',files)
    else onChange('newNahwFiles',files)
  }

  function addNewBranchFiles(key:ArabicBranch,picked:File[]){
    const merged=[...getNewFiles(form,key),...picked]
    if(key==='comprehension')onChange('newComprehensionFiles',merged)
    else if(key==='tharwa')onChange('newTharwaFiles',merged)
    else if(key==='balagha')onChange('newBalaghaFiles',merged)
    else onChange('newNahwFiles',merged)
  }

  return (
    <div onClick={onClose} style={{position:'fixed',inset:0,background:'rgba(31,18,21,0.55)',backdropFilter:'blur(6px)',zIndex:120,display:'flex',alignItems:'center',justifyContent:'center',padding:16}}>
      <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:600,maxHeight:'92vh',overflowY:'auto',background:BRAND.bgSoft,borderRadius:BRAND.radiusXl,border:`1.5px solid ${BRAND.border}`,padding:24,boxShadow:BRAND.shadow}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <h2 style={{fontSize:18,fontWeight:BRAND.weightBlack,fontFamily:BRAND.fontHeading,color:BRAND.text,margin:0}}>
            {editingLesson?'✏️ تعديل درس':'➕ درس جديد'}
          </h2>
          <Button variant="ghost" size="sm" disabled={saving||deleting} onClick={onClose}>✕</Button>
        </div>

        <div style={{display:'grid',gap:14}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 90px',gap:10}}>
            <div>
              <label style={{fontSize:13,fontWeight:BRAND.weightBold,color:BRAND.sub,display:'block',marginBottom:6}}>اسم الدرس *</label>
              <input value={form.name} onChange={e=>onChange('name',e.target.value)} placeholder="مثال: النعت وأنواعه" style={inputStyle}/>
            </div>
            <div>
              <label style={{fontSize:13,fontWeight:BRAND.weightBold,color:BRAND.sub,display:'block',marginBottom:6}}>الترتيب</label>
              <input type="number" min={1} value={form.order_num} onChange={e=>onChange('order_num',Number(e.target.value)||1)} style={{...inputStyle,textAlign:'center'}}/>
            </div>
          </div>

          <div>
            <label style={{fontSize:13,fontWeight:BRAND.weightBold,color:BRAND.sub,display:'block',marginBottom:6}}>وصف مختصر</label>
            <textarea value={form.description} onChange={e=>onChange('description',e.target.value)} rows={2} style={{...inputStyle,resize:'vertical'}}/>
          </div>

          {!isArabic&&(
            <div>
              <label style={{fontSize:13,fontWeight:BRAND.weightBold,color:BRAND.sub,display:'block',marginBottom:6}}>محتوى الدرس (نصّي)</label>
              <textarea value={form.content} onChange={e=>onChange('content',e.target.value)} rows={6} style={{...inputStyle,resize:'vertical',lineHeight:1.7}}/>
            </div>
          )}

          {/* الفيديو */}
          <div style={{padding:16,borderRadius:BRAND.radiusMd,background:'rgba(220,140,60,0.05)',border:'1px solid rgba(220,140,60,0.16)'}}>
            <div style={{fontSize:14,fontWeight:BRAND.weightBlack,color:BRAND.text,marginBottom:10}}>🎬 فيديو الدرس</div>
            {form.currentVideoUrl&&!form.removeVideo&&(
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 14px',borderRadius:BRAND.radiusSm,background:'#fff',border:`1px solid ${BRAND.border}`,marginBottom:10,gap:10}}>
                <span style={{fontSize:13,color:'#059669',fontWeight:BRAND.weightBold}}>✅ يوجد فيديو حالياً</span>
                <button type="button" onClick={()=>onChange('removeVideo',true)} style={{background:'none',border:'none',color:BRAND.crimson,cursor:'pointer',fontSize:12,fontWeight:BRAND.weightBold}}>🗑️ إزالة</button>
              </div>
            )}
            {form.removeVideo&&(
              <div style={{padding:'10px 14px',borderRadius:BRAND.radiusSm,background:'rgba(140,20,40,0.06)',color:BRAND.crimson,fontSize:12,fontWeight:BRAND.weightBold,marginBottom:10}}>
                سيُحذَف الفيديو عند الحفظ.
                <button type="button" onClick={()=>onChange('removeVideo',false)} style={{marginRight:10,background:'none',border:'none',color:BRAND.crimson,cursor:'pointer',fontWeight:BRAND.weightBold,textDecoration:'underline'}}>تراجع</button>
              </div>
            )}
            <div style={{display:'flex',gap:8,marginBottom:10}}>
              {(['link','upload'] as const).map(mode=>(
                <button key={mode} type="button" onClick={()=>setVideoMode(mode)} style={{flex:1,padding:'8px',borderRadius:8,border:`1.5px solid ${videoMode===mode?BRAND.crimson:BRAND.border}`,background:videoMode===mode?'rgba(140,20,40,0.10)':'transparent',color:videoMode===mode?BRAND.crimson:BRAND.sub,fontWeight:BRAND.weightBold,fontSize:12,cursor:'pointer',fontFamily:'inherit'}}>
                  {mode==='link'?'🔗 رابط (يوتيوب/فيميو)':'📁 رفع ملف فيديو'}
                </button>
              ))}
            </div>
            {videoMode==='link'?(
              <input value={form.videoLink} onChange={e=>onChange('videoLink',e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={{...inputStyle,direction:'ltr',textAlign:'right'}}/>
            ):(
              <div>
                <input ref={videoFileRef} type="file" accept="video/*" style={{display:'none'}} onChange={e=>onChange('videoFile',e.target.files?.[0]||null)}/>
                <button type="button" onClick={()=>videoFileRef.current?.click()} style={{width:'100%',padding:'12px',borderRadius:BRAND.radiusSm,border:`2px dashed ${BRAND.border}`,background:'transparent',color:BRAND.sub,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
                  {form.videoFile?`✅ ${form.videoFile.name}`:'📁 اختر ملف فيديو'}
                </button>
              </div>
            )}
          </div>

          {/* ملفات اللغة العربية الأربعة — متعددة */}
          {isArabic&&(
            <div style={{padding:16,borderRadius:BRAND.radiusMd,background:'rgba(30,90,160,0.05)',border:'1px solid rgba(30,90,160,0.18)'}}>
              <div style={{fontSize:14,fontWeight:BRAND.weightBlack,color:BRAND.text,marginBottom:4}}>🗂️ ملفات الدرس المتخصصة (لغة عربية)</div>
              <div style={{fontSize:12,color:BRAND.sub,marginBottom:14}}>يمكن رفع أكثر من ملف لكل فرع — جميعها تُستخدم في التوليد الذكي</div>
              <div style={{display:'grid',gap:12}}>
                {ARABIC_FILE_DEFS.map(({key,label,icon,hint})=>{
                  const existingUrls=getUrls(form,key)
                  const existingNames=getNames(form,key)
                  const newFiles=getNewFiles(form,key)
                  const ref=branchRefs[key]
                  const total=existingUrls.length+newFiles.length
                  return(
                    <div key={key} style={{padding:14,borderRadius:BRAND.radiusSm,background:'#fff',border:`1px solid ${BRAND.border}`}}>
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
                        <div style={{fontSize:13,fontWeight:BRAND.weightBlack,color:BRAND.text}}>
                          {icon} {label}
                          {total>0&&<span style={{marginRight:8,fontSize:11,color:BRAND.crimson,background:'rgba(140,20,40,0.08)',padding:'2px 8px',borderRadius:999,fontWeight:BRAND.weightBold}}>{total} ملف</span>}
                        </div>
                        <span style={{fontSize:11,color:BRAND.sub}}>{hint}</span>
                      </div>

                      {existingUrls.map((url,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:8,background:'rgba(5,150,105,0.06)',border:'1px solid rgba(5,150,105,0.2)',marginBottom:6,fontSize:12,gap:8}}>
                          <a href={url} target="_blank" rel="noopener noreferrer" style={{color:'#059669',textDecoration:'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,fontWeight:BRAND.weightBold}}>
                            ✅ {existingNames[i]||`ملف ${i+1}`}
                          </a>
                          <button type="button" onClick={()=>removeExistingBranchFile(key,i)} style={{background:'none',border:'none',color:BRAND.crimson,cursor:'pointer',fontSize:12,flexShrink:0}}>🗑️</button>
                        </div>
                      ))}

                      {newFiles.map((file,i)=>(
                        <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',borderRadius:8,background:'rgba(140,20,40,0.08)',border:'1px solid rgba(140,20,40,0.25)',marginBottom:6,fontSize:12,color:BRAND.crimson}}>
                          <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1,fontWeight:BRAND.weightBold}}>＋ {file.name}</span>
                          <button type="button" onClick={()=>removeNewBranchFile(key,i)} style={{background:'none',border:'none',color:BRAND.crimson,cursor:'pointer',fontSize:12,flexShrink:0}}>✕</button>
                        </div>
                      ))}

                      <input ref={ref} type="file" accept=".doc,.docx,.pdf" multiple style={{display:'none'}}
                        onChange={e=>{const picked=Array.from(e.target.files||[]);if(picked.length>0)addNewBranchFiles(key,picked);if(ref.current)ref.current.value=''}}
                      />
                      <button type="button" onClick={()=>ref.current?.click()} style={{width:'100%',padding:'9px',borderRadius:8,border:`2px dashed ${BRAND.border}`,background:'transparent',color:BRAND.sub,cursor:'pointer',fontSize:12,fontFamily:'inherit',marginTop:total>0?4:0}}>
                        ＋ {total>0?'إضافة ملف آخر':'رفع ملف Word'}
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* الملفات المصاحبة */}
          <div style={{padding:16,borderRadius:BRAND.radiusMd,background:'rgba(140,20,40,0.05)',border:`1px solid ${BRAND.border}`}}>
            <div style={{fontSize:14,fontWeight:BRAND.weightBlack,color:BRAND.text,marginBottom:10}}>📎 الملفات المصاحبة للفيديو</div>
            {form.existingFileUrls.map((url,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:8,background:'#fff',border:`1px solid ${BRAND.border}`,marginBottom:6,fontSize:12}}>
                <a href={url} target="_blank" rel="noopener noreferrer" style={{color:BRAND.crimson,textDecoration:'none',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>📄 ملف {i+1}</a>
                <button type="button" onClick={()=>onChange('existingFileUrls',form.existingFileUrls.filter(u=>u!==url))} style={{background:'none',border:'none',color:BRAND.crimson,cursor:'pointer',fontSize:12}}>✕</button>
              </div>
            ))}
            {form.newFiles.map((file,i)=>(
              <div key={i} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'8px 12px',borderRadius:8,background:'rgba(140,20,40,0.08)',border:'1px solid rgba(140,20,40,0.25)',marginBottom:6,fontSize:12,color:BRAND.crimson}}>
                <span style={{overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',flex:1}}>＋ {file.name}</span>
                <button type="button" onClick={()=>onChange('newFiles',form.newFiles.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:BRAND.crimson,cursor:'pointer',fontSize:12}}>✕</button>
              </div>
            ))}
            <input ref={filesRef} type="file" multiple style={{display:'none'}} onChange={e=>{const picked=Array.from(e.target.files||[]);onChange('newFiles',[...form.newFiles,...picked]);if(filesRef.current)filesRef.current.value=''}}/>
            <button type="button" onClick={()=>filesRef.current?.click()} style={{width:'100%',padding:'10px',borderRadius:BRAND.radiusSm,border:`2px dashed ${BRAND.border}`,background:'transparent',color:BRAND.sub,cursor:'pointer',fontSize:13,fontFamily:'inherit'}}>
              ＋ إضافة ملف مصاحب (PDF، صورة، Word...)
            </button>
          </div>

          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:14,fontWeight:BRAND.weightBold,color:BRAND.text}}>
            <input type="checkbox" checked={form.is_active} onChange={e=>onChange('is_active',e.target.checked)}/>
            الدرس نشط
          </label>
        </div>

        <div style={{marginTop:20}}>
          <Button variant="primary" fullWidth disabled={!canSubmit} onClick={onSubmit}>
            {saving?'جارٍ الحفظ...':editingLesson?'حفظ التعديلات':'إنشاء الدرس'}
          </Button>
        </div>
      </div>
    </div>
  )
}
