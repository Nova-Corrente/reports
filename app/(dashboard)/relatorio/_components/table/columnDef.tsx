'use client'
import { getAllScopeService } from '@/app/(dashboard)/admin/scopeService/actions'
import { getAllSites } from '@/app/(dashboard)/admin/site/actions'
import { getAllTechnician } from '@/app/(dashboard)/admin/technician/actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { ReportRelType, ScopeServiceType, SiteTypeRel, TechnicianType } from '@/lib/types'
import { cn } from '@/lib/utils'
import type { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ArrowUpDown, MoreHorizontal } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DialogRelatorio } from '../dialogRelatorio'
import { DataTableColumnHeader } from './data-table-column-header'

export const columns: ColumnDef<ReportRelType>[] = [
  {
    id: 'ID',
    accessorKey: 'id',
    header: 'Relatórios',
    cell: ({ row }) => <div className="text-left">{row.original.id}</div>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const { updatedAt, finishedAt } = row.original

      let status = 'Criado'
      let statusVariant = 'bg-blue-500'

      if (finishedAt) {
        status = 'Finalizado'
        statusVariant = 'bg-green-500'
      } else if (updatedAt) {
        status = 'Em andamento'
        statusVariant = 'bg-yellow-500'
      }

      return (
        <Badge variant="outline" className={cn(statusVariant, 'text-left text-white')}>
          {status}
        </Badge>
      )
    },
    filterFn: (row, id, filterValue) => {
      const { updatedAt, finishedAt } = row.original

      let status = 'created'
      if (finishedAt) {
        status = 'done'
      } else if (updatedAt) {
        status = 'in progress'
      }
      return filterValue.includes(status)
    },
  },
  {
    id: 'ScopeService',
    accessorKey: 'scopeService.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Escopo do Serviço" />,
    cell: ({ row }) => <div className="pl-4">{row.original.scopeService.name}</div>,
  },
  {
    id: 'Clientes',
    accessorKey: 'sites.client.name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Cliente" />,
    cell: ({ row }) => <div className="pl-4">{row.original.sites.client.name}</div>,
  },
  {
    id: 'Site ID',
    accessorKey: 'sites.idSite',
    header: 'Site ID',
    cell: ({ row }) => <div className="text-left">{row.original.sites.idSite}</div>,
  },
  {
    id: 'Técnico',
    accessorKey: 'technician.name',
    header: 'Técnico',
    cell: ({ row }) => <div className="text-left">{row.original.technician.name}</div>,
  },
  {
    id: 'Usuário',
    accessorKey: 'user.name',
    header: 'Usuario criador',
    cell: ({ row }) => <div className="text-left">{row.original.user.name}</div>,
  },
  {
    id: 'Analista',
    header: 'Analistas',
    accessorKey: 'analyst.name',

    filterFn: (row, id, filterValue) => {
      return row.original.analyst?.name?.toLowerCase().includes(filterValue.toLowerCase()) ?? false
    },
    cell: ({ row }) => {
      return <div className="text-left">{row.original.analyst === null ? 'N/A' : row.original.analyst.name}</div>
    },
  },
  {
    id: 'Data do Serviço',
    accessorKey: 'dateService',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Data do Serviço
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.original.dateService)
      return <div className="pl-4">{format(date, 'dd/MM/yyyy', { locale: ptBR })}</div>
    },
  },
  {
    id: 'Data de Criação',
    accessorKey: 'createdAt',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Data de Criação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = new Date(row.original.createdAt)
      return <div className="pl-4">{format(date, 'dd/MM/yyyy', { locale: ptBR })}</div>
    },
  },
  {
    id: 'Inicio da Análise',
    accessorKey: 'updatedAt',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Inicio da Análise
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.original.updatedAt ? new Date(row.original.updatedAt) : null
      return <div className="pl-4">{date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</div>
    },
  },
  {
    id: 'Data da Finalização',
    accessorKey: 'finishedAt',
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
          Análise Finalizada
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const date = row.original.finishedAt ? new Date(row.original.finishedAt) : null
      return <div className="pl-4">{date ? format(date, 'dd/MM/yyyy', { locale: ptBR }) : 'N/A'}</div>
    },
  },
  {
    id: 'Ações',
    enableHiding: false,
    cell: ({ row }) => {
      const relatorio = row.original
      const { finishedAt } = row.original
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            {!finishedAt && <EditReportCell row={row} />}
            <DropdownMenuSeparator />
            {!finishedAt && (
              <Link href={`/relatorio/${relatorio.id}`}>
                <DropdownMenuItem className="cursor-pointer">Analisar</DropdownMenuItem>
              </Link>
            )}
            {finishedAt && (
              <Link href={`/reportviewer/${relatorio.id}`} target="_blank">
                <DropdownMenuItem className="cursor-pointer">Visualizar</DropdownMenuItem>
              </Link>
            )}
            {finishedAt && (
              <Link href={`/api/reportpdf/${relatorio.id}`} target="_blank">
                <DropdownMenuItem className="cursor-pointer">Gerar PDF</DropdownMenuItem>
              </Link>
            )}
            {finishedAt && (
              <Link href={`/relatorio/${relatorio.id}`}>
                <DropdownMenuItem className="cursor-pointer">Reabrir Relatório</DropdownMenuItem>
              </Link>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]

const EditReportCell: React.FC<{ row: { original: ReportRelType } }> = ({ row }) => {
  const reports = row.original
  const [technicianData, setTechnicianData] = useState<TechnicianType[]>([])
  const [siteData, setSiteData] = useState<SiteTypeRel[]>([])
  const [scopeServiceData, setScopeServiceData] = useState<ScopeServiceType[]>([])

  useEffect(() => {
    const fetchTechnicianData = async () => {
      const data = await getAllTechnician()
      if (data) {
        setTechnicianData(data)
      }
    }
    const fetchSiteData = async () => {
      const data = await getAllSites()
      if (data) {
        setSiteData(data)
      }
    }
    const fetchScopeServiceData = async () => {
      const data = await getAllScopeService()
      if (data) {
        setScopeServiceData(data)
      }
    }
    fetchTechnicianData()
    fetchSiteData()
    fetchScopeServiceData()
  }, [])

  return (
    <DialogRelatorio
      dialogButton={'Editar'}
      dialogTitle={'Relatório'}
      dialogDescription={'Tela para Editar Relatório'}
      report={reports}
      siteData={siteData}
      technicianData={technicianData}
      scopeServiceData={scopeServiceData}
    />
  )
}
