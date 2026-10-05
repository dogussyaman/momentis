import { ResetPasswordForm } from '@/components/auth/password-forms'

export const metadata = { title: 'Şifre Sıfırla | MOMENTIS' }

export default async function ResetPasswordPage({ searchParams }) {
  const params = await searchParams
  return <ResetPasswordForm token={params?.token || ''} />
}
