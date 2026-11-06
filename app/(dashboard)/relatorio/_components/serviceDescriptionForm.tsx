'use client'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { createDescriptionAnalisys } from '../actions'

const formSchema = z.object({
  service: z.string().min(1, { message: 'Nome do serviço é obrigatório.' }),
  status: z.enum(['ok', 'na']),
})

type FormValues = z.infer<typeof formSchema>

interface ServiceDescriptionFormProps {
  id: number
  handleModal: () => void
}

export default function ServiceDescriptionForm({ id, handleModal }: ServiceDescriptionFormProps) {
  const router = useRouter()

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      service: '',
      status: 'ok',
    },
  })

  const onSubmit = form.handleSubmit((data) => {
    const status = data.status.toString()
    // console.log(data.services)

    const datas = {
      idReport: id,
      service: data.service,
      status,
    }

    createDescriptionAnalisys(datas)
    router.refresh()
    handleModal()
    form.reset()
  })

  return (
    <div className="mx-auto w-full max-w-4xl">
      <Form {...form}>
        <form onSubmit={onSubmit}>
          <div className="">
            <div className="">
              <div className="grid grid-cols-[1fr_40px_50px]">
                <p className="">NOME DO SERVIÇO:</p>
                <p className="">OK</p>
                <p className="">N/A</p>
              </div>
            </div>
            <div className="w-full">
              {
                <div className="grid grid-cols-[1fr_100px] items-center justify-center gap-2">
                  <div>
                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input {...field} placeholder="" maxLength={65} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="pl-4">
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem className="w-full space-y-3">
                          <FormControl className="w-full">
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex items-center space-x-3 space-y-0"
                            >
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="ok" />
                                </FormControl>
                              </FormItem>
                              <FormItem className="flex items-center space-x-3 space-y-0">
                                <FormControl>
                                  <RadioGroupItem value="na" />
                                </FormControl>
                              </FormItem>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              }
            </div>
          </div>
          <div className="flex w-full justify-end p-4">
            <button type="submit" className="rounded-lg bg-blue-500 px-4 py-1 text-white">
              Salvar
            </button>
          </div>
        </form>
      </Form>
    </div >
  )
}
