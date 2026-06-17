// app/page.tsx — استبدل المحتوى كله بـ:
import { redirect } from 'next/navigation'
export default function Home() {
  redirect('/landing')
}