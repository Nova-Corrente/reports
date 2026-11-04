'use client'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import type { PhotoAnalisysType } from '@/lib/types'
import { zodResolver } from '@hookform/resolvers/zod'
import { ImagePlus, PenIcon, RotateCcw, RotateCw } from 'lucide-react'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState } from 'react'
import type { FileWithPath } from 'react-dropzone'
import { useDropzone } from 'react-dropzone'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { deletePhoto, saveDescriptionAnalisys, savePhotoAnalisys, upLoadPhotoAnalisys } from '../../actions'
import RichTextEditor from '../textEditor/rich-text-editor'

interface ImageProcessingProps {
  width?: number
  height?: number
  quality?: number
}

interface RemovePhotoProps {
  dialogTitle: string
  dialogDescription: string
  photoAnalisys: PhotoAnalisysType
  index: number
}

const formSchema = z.object({
  description: z.string().min(10, { message: 'A Descrição deve ter no mínimo 10 caracteres' }).trim(),
})

export default function EditPhoto({ dialogTitle, dialogDescription, photoAnalisys, index }: RemovePhotoProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const idReport = Number(pathname.split('/').pop())
  const [description, setDescription] = useState('')
  const [originalFileName, setOriginalFileName] = useState<string>('')
  const [processedImage, setProcessedImage] = useState<string | null>(null)
  const [rotation, setRotation] = useState<number>(0)

  if (imageUrl === '') {
    setImageUrl(photoAnalisys.url)
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    values: {
      description: photoAnalisys.description,
    },
  })

  const processImage = (
    image: HTMLImageElement,
    { width = 400, height = 300, quality = 0.8 }: ImageProcessingProps = {},
  ): string => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    canvas.width = width || image.width
    canvas.height = height || image.height

    ctx?.drawImage(image, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', quality)
  }

  const onDrop = (acceptedFiles: FileWithPath[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Guardar o nome original do arquivo
    setOriginalFileName(file.name)

    const reader = new FileReader()

    reader.onload = (e) => {
      const image = new Image()
      image.onload = () => {
        const resizedImage = processImage(image)
        setProcessedImage(resizedImage)
        setImageUrl(resizedImage)
      }
      image.src = e.target?.result as string
    }

    reader.readAsDataURL(file)
  }

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif'],
    },
    maxFiles: 1,
  })

  async function saveStorage(processedImage: string) {
    const fileExt = originalFileName.split('.').pop() || 'jpeg'
    const baseName = originalFileName.split('.')[0]
    const fileName = `${baseName}.${fileExt}`

    // Converter base64 para blob mantendo o tipo JPEG
    const base64Data = processedImage.split(',')[1]
    const blob = await fetch(`data:image/jpeg;base64,${base64Data}`).then((res) => res.blob())

    const formData = new FormData()
    formData.append('file', blob, fileName)

    const url = await upLoadPhotoAnalisys(formData, idReport)
    return url
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      if (processedImage) {
        const result = await deletePhoto(photoAnalisys.url)

        if (!result) {
          return
        }

        const urlImage = await saveStorage(processedImage as string)

        if (!urlImage) {
          return
        }
        const fileName = urlImage.split('/').pop() as string

        const data = {
          id: photoAnalisys.id,
          idReport,
          url: urlImage,
          name: fileName,
          index: photoAnalisys.index,
          description: values.description,
        }
        await savePhotoAnalisys(data)
      } else {
        await saveDescriptionAnalisys({
          id: photoAnalisys.id as number,
          description: values.description,
        })
      }
      setImageUrl('')
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error('Erro ao salvar:', error)
    }
  }

  const rotate = (direction: 'left' | 'right') => {
    setRotation((prev) => (direction === 'left' ? prev - 90 : prev + 90))
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          router.refresh()
        }
        setOpen(isOpen)
      }}
    >
      <Button onClick={() => setOpen(true)} variant={'outline'}>
        <PenIcon className="cursor-pointer" size={24} />
      </Button>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>
        <div className="flex items-center justify-center">
          <p>Deseja altera a foto de número {index} deste Relatório?</p>
        </div>
        <div className="flex flex-col items-center justify-start gap-2">
          <div
            {...getRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-lg p-5 cursor-pointer hover:border-gray-400 transition-colors h-[350px] flex flex-col justify-center items-center"
          >
            <input {...getInputProps()} />
            {imageUrl ? (
              // next/image passa pelo servidor: a URL gravada é do host interno do MinIO, que o navegador não resolve
              <Image
                src={imageUrl}
                alt="Imagem processada"
                width={400}
                height={300}
                className="border border-gray-200 rounded-lg mx-auto"
              />
            ) : (
              <div className="px-2 bg-muted rounded-lg flex flex-col h-full items-center justify-center w-full">
                <ImagePlus className="w-8 h-8 text-muted-foreground" />
                <p>Arraste e solte sua imagem ou clique para selecionar</p>
              </div>
            )}
            <p className="text-sm dark:text-white">{!isDragging && 'Arraste e solte sua imagem aqui'}</p>
          </div>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="icon" onClick={() => rotate('left')}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => rotate('right')}>
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
          <div>
            <div>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-4">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor
                            content={field.value}
                            onChange={(value) => {
                              field.onChange(value)
                              setDescription(value)
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit">Salvar</Button>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
