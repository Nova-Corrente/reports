import HeaderPage from '@/components/header-page'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { columns } from './_components/columns'
import { DataTable } from './_components/data-table'
import { DialogUser } from './_components/dialogUser'
import { getData } from './actions'

export default async function UserPage() {
  const session = await auth()
  if (!session) {
    redirect('/signin')
  }
  if (session.user.role !== 'ADMIN') {
    redirect('/')
  }
  const data = await getData()
  return (
    <main>
      <HeaderPage pageName={'Usuários'} />
      <div className="flex items-center justify-end space-y-2 pt-2">
        <DialogUser
          dialogButton={'Novo usuario'}
          dialogTitle={'Usuário'}
          dialogDescription={'Tela para Salvar um novo Usuário'}
        />
      </div>
      <div>
        <DataTable columns={columns} data={data} />
      </div>
    </main>
  )
}
