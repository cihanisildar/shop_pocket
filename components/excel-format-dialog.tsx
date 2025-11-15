'use client'

import { useState } from 'react'
import { Info, FileSpreadsheet } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useTranslations } from 'next-intl'

export default function ExcelFormatDialog() {
  const [open, setOpen] = useState(false)
  const t = useTranslations('excel')

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-indigo-600 transition-colors duration-200"
          title={t('formatRequirements')}
        >
          <Info className="w-4 h-4" />
          <span>{t('info')}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
            <DialogTitle>{t('formatRequirements')}</DialogTitle>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('fileStructure')}</h3>
                <p className="text-gray-700 mb-4">
                  {t('fileStructureDescription')}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('requiredColumns')}</h3>
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-700 mb-2">{t('requiredColumnsDescription')}</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    <li><strong>{t('codeColumn')}</strong> {t('codeColumnDescription')}</li>
                    <li><strong>{t('nameColumn')}</strong> {t('nameColumnDescription')}</li>
                    <li><strong>{t('unitColumn')}</strong> {t('unitColumnDescription')}</li>
                  </ul>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('tableLocation')}</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-gray-800 mb-2">
                    <strong>{t('tableLocationImportant')}</strong> {t('tableLocationDescription')}
                  </p>
                  <p className="text-sm text-gray-700">
                    {t('tableLocationNote')}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('exampleFormat')}</h3>
                <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-300">
                        <th className="px-3 py-2 text-left font-semibold text-gray-900">{t('columnB')}</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-900">{t('columnC')}</th>
                        <th className="px-3 py-2 text-left font-semibold text-gray-900">{t('columnD')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 text-gray-700">ÜRÜN KODU</td>
                        <td className="px-3 py-2 text-gray-700">ÜRÜN ADI</td>
                        <td className="px-3 py-2 text-gray-700">KOLİ ADET İÇERİĞİ</td>
                      </tr>
                      <tr className="border-b border-gray-200">
                        <td className="px-3 py-2 text-gray-600">401741</td>
                        <td className="px-3 py-2 text-gray-600">PİRİNÇ OSMANCIK 2,5 KG</td>
                        <td className="px-3 py-2 text-gray-600">8 adet kolide</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 text-gray-600">1100793</td>
                        <td className="px-3 py-2 text-gray-600">DON. SOĞAN HALKASI 450 GR</td>
                        <td className="px-3 py-2 text-gray-600">12 adet kolide</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('additionalNotes')}</h3>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>{t('note1')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>{t('note2')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>{t('note3')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>{t('note4')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-indigo-600 mr-2">•</span>
                    <span>{t('note5')}</span>
                  </li>
                </ul>
              </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}

