'use client'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { type ReportSchema, reportSchema } from '@/lib/formValidationSchemas'
import type { DialogReportProps } from '@/lib/types'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { CalendarIcon } from '@radix-ui/react-icons'

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { format } from 'date-fns'
import { Check, ChevronsUpDown, PlusCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { createReport } from '../actions'

export function DialogRelatorioForm({
  dialogButton,
  dialogTitle,
  technicianData,
  siteData,
  scopeServiceData,
}: DialogReportProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [openCalendar, setOpenCalendar] = useState(false)
  const [openPopoverTechnician, setOpenPopoverTechnician] = useState(false)
  const [openPopoverSite, setOpenPopoverSite] = useState(false)
  const [openPopoverScopeService, setOpenPopoverScopeService] = useState(false)

  const form = useForm<ReportSchema>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      scopeServiceId: 0,
      siteId: 0,
      technicianId: '',
    },
  })

  async function onSubmit(values: ReportSchema) {
    try {
      await createReport({
        scopeServiceId: values.scopeServiceId,
        siteId: values.siteId,
        technicianId: values.technicianId,
        dateService: values.dateService,
      })
      router.refresh()
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error(error)
    }
  }

  const dialogStart = () => {
    setOpen(true)
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button onClick={() => dialogStart()} variant="outline">
        {dialogButton}
      </Button>
      <DialogContent className="sm:max-h-[500px] sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="scopeServiceId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-3">
                      <FormLabel className="sr-only">Escopo de Serviço</FormLabel>
                      <Popover open={openPopoverScopeService} onOpenChange={setOpenPopoverScopeService}>
                        <PopoverTrigger asChild>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                // biome-ignore lint/a11y/useSemanticElements: <explanation>
                                role="combobox"
                                className={cn('w-[350px] justify-between', !field.value && 'text-muted-foreground')}
                              >
                                {field.value
                                  ? scopeServiceData?.find((scopeService) => scopeService.id === field.value)?.name
                                  : 'Escolha um Escopo de Serviço'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                            <Link href="/admin/scopeService">
                              <PlusCircleIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Link>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar escopo de serviço..." />
                            <CommandList>
                              <CommandEmpty>Nenhum escopo de serviço encontrado.</CommandEmpty>
                              <CommandGroup>
                                {scopeServiceData?.map((scopeService) => (
                                  <CommandItem
                                    key={scopeService.id}
                                    value={scopeService.name}
                                    onSelect={() => {
                                      form.setValue('scopeServiceId', scopeService.id || 0)
                                      setOpenPopoverScopeService(false)
                                    }}
                                  >
                                    {scopeService.name}
                                    <Check
                                      className={cn('ml-auto', scopeService.id === field.value ? 'opacity-100' : 'opacity-0')}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="siteId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-3">
                      <FormLabel className="sr-only">ID Site</FormLabel>
                      <Popover open={openPopoverSite} onOpenChange={setOpenPopoverSite}>
                        <PopoverTrigger asChild>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                // biome-ignore lint/a11y/useSemanticElements: <explanation>
                                role="combobox"
                                className={cn('w-[240px] justify-between', !field.value && 'text-muted-foreground')}
                              >
                                {field.value
                                  ? siteData?.find((site) => site.id === field.value)?.idSite
                                  : 'Escolha um Site'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                            <Link href="/admin/site">
                              <PlusCircleIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Link>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar site..." />
                            <CommandList>
                              <CommandEmpty>Nenhum site encontrado.</CommandEmpty>
                              <CommandGroup>
                                {siteData?.map((site) => (
                                  <CommandItem
                                    key={site.id}
                                    value={site.idSite}
                                    onSelect={() => {
                                      form.setValue('siteId', site.id)
                                      setOpenPopoverSite(false)
                                    }}
                                  >
                                    {site.idSite}
                                    <Check
                                      className={cn('ml-auto', site.id === field.value ? 'opacity-100' : 'opacity-0')}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="technicianId"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-3">
                      <FormLabel className="sr-only">Técnico</FormLabel>
                      <Popover open={openPopoverTechnician} onOpenChange={setOpenPopoverTechnician}>
                        <PopoverTrigger asChild>
                          <div className="flex items-center gap-2">
                            <FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                // biome-ignore lint/a11y/useSemanticElements: <explanation>
                                role="combobox"
                                className={cn('w-[240px] justify-between', !field.value && 'text-muted-foreground')}
                              >
                                {field.value
                                  ? technicianData?.find((technician) => technician.id === field.value)?.name
                                  : 'Escolha um Técnico'}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            </FormControl>
                            <Link href="/admin/technician">
                              <PlusCircleIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Link>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-[200px] p-0">
                          <Command>
                            <CommandInput placeholder="Buscar Técnico..." />
                            <CommandList>
                              <CommandEmpty>Nenhum Técnico encontrado.</CommandEmpty>
                              <CommandGroup>
                                {technicianData?.map((technician) => (
                                  <CommandItem
                                    key={technician.id}
                                    value={technician.name}
                                    onSelect={() => {
                                      form.setValue('technicianId', technician.id || '')
                                      setOpenPopoverTechnician(false)
                                    }}
                                  >
                                    {technician.name}
                                    <Check
                                      className={cn(
                                        'ml-auto',
                                        technician.name === field.value ? 'opacity-100' : 'opacity-0',
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dateService"
                  render={({ field }) => (
                    <FormItem className="flex flex-col pt-3">
                      <FormLabel className="sr-only">Data do Serviço</FormLabel>
                      <Popover open={openCalendar} onOpenChange={setOpenCalendar}>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              type="button"
                              variant={'outline'}
                              className={cn(
                                'w-[240px] pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground',
                              )}
                            >
                              {field.value ? format(field.value, 'dd/MM/yyyy') : <span>Informa a data</span>}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={(value) => {
                              field.onChange(value)
                              setOpenCalendar(false)
                            }}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
