import HeaderPage from '@/components/header-page'
import { Separator } from '@/components/ui/separator'
import { auth } from '@/lib/auth'
import type { User } from '@/lib/types'
import { DialogUserRePwd } from '../_components/dialogUserRePwd'
import { getUserByEmail } from '../actions'

export default async function ProfilePage() {
  const session = await auth()
  const user = session?.user as User
  let dataUser: User | null = null
  if (session) {
    dataUser = await getUserByEmail(user.email)
  }
  return (
    <main>
      <HeaderPage pageName={'Perfil'} />
      <div className="space-y-2 pl-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div>
            <div className="text-sm font-semibold text-muted-foreground">Nome</div>
            <div className="text-lg font-semibold">{dataUser?.name}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-muted-foreground">Email</div>
            <div className="text-lg font-semibold">{dataUser?.email}</div>
          </div>
          <div>
            <div className="text-sm font-semibold text-muted-foreground">Função</div>
            <div className="text-lg font-semibold">{dataUser?.role}</div>
          </div>
        </div>
        <Separator />
        <DialogUserRePwd
          dialogButton={'Redefinir Senha'}
          dialogTitle={'Redefinir Senha'}
          dialogDescription={'Tela para Redefinir Senha'}
          UserId={dataUser?.id ?? null}
          askCurrentPassword
        />
      </div>
    </main>
  )
}
