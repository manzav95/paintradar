import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { DocumentBrandHeader } from '@/components/sales/DocumentBrandHeader'
import { addonPricing, bundledAddonLabel, bundledRoomLabel, cabinetPricing, calculateFromFields, colorPaintLines, customerName, exteriorPricing, paintMaterialLine, paymentSchedule, roomPricing } from '@/lib/estimateEngine'
import { formatCents } from '@/lib/money'
import { useSales } from '@/providers/SalesState'

export function EstimatePrint() {
  const { id } = useParams()
  const { estimates, invoices, customers, business } = useSales()
  const invoice = invoices.find((item) => item.id === id)
  const estimate = estimates.find((item) => item.id === id) ?? invoice
  const customer = customers.find((item) => item.id === estimate?.customerId)
  const totals = useMemo(() => (estimate ? calculateFromFields(estimate) : null), [estimate])

  if (!estimate || !totals) return <p className="p-8">Document not found.</p>

  const schedule = paymentSchedule(totals.totalCents, estimate.rates)
  const number = 'number' in estimate ? estimate.number : ''
  const address =
    'projectCity' in estimate
      ? [estimate.projectAddress || customer?.address, estimate.projectCity || customer?.city, estimate.projectState, estimate.projectZip]
          .filter(Boolean)
          .join(', ')
      : estimate.projectAddress
  const clientView = 'clientView' in estimate ? estimate.clientView : 'bundled'
  const colorLines = colorPaintLines(
    'colors' in estimate ? estimate.colors : undefined,
    'type' in estimate ? estimate.type : undefined,
    totals,
  )
  const paintLine = paintMaterialLine(totals)

  return (
    <div className="print-document min-h-screen bg-white px-6 py-8 text-[#111111]">
      <div className="mx-auto max-w-3xl bg-white p-10 print:p-0">
        <DocumentBrandHeader
          documentTitle={invoice ? 'Invoice' : business.documentTerm}
          subtitle={[
            'jobName' in estimate && estimate.jobName ? estimate.jobName : null,
            number,
          ]
            .filter(Boolean)
            .join(' · ')}
          date={estimate.createdAt}
        />
        <div className="mt-6 flex items-start justify-between gap-6 border-b border-[#e8d9b0] pb-6 text-sm">
          <div>
            <p className="font-semibold">{customer ? customerName(customer.firstName, customer.lastName) : 'Client'}</p>
            <p className="text-[#6d695f]">{address}</p>
          </div>
        </div>

        {colorLines.length ? (
          <div className="mt-8 rounded-2xl bg-[#f6f3eb] px-5 py-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#8a6b24]">Selected Colors</p>
            <div className="mt-2 grid gap-1 text-sm">
              {colorLines.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-8 space-y-4">
          {('exterior' in estimate && estimate.exterior
            ? exteriorPricing(estimate.exterior, estimate.rates).lines
            : []
          ).map((line) => (
            <div key={line.id} className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">
                  {line.label}
                  {line.optional ? ' (Optional)' : ''}
                </p>
                <p className="text-sm text-[#6d695f]">{line.detail}</p>
              </div>
              <p className="font-semibold">{formatCents(line.cents)}</p>
            </div>
          ))}
          {('cabinets' in estimate && estimate.cabinets
            ? cabinetPricing(estimate.cabinets, estimate.rates).lines
            : []
          ).map((line) => (
            <div key={line.label} className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{line.label}</p>
                {line.detail ? <p className="text-sm text-[#6d695f]">{line.detail}</p> : null}
                {line.note ? <p className="mt-1 text-sm text-[#6d695f]">{line.note}</p> : null}
              </div>
              <div className="text-right">
                <p className="font-semibold">{formatCents(line.cents)}</p>
                {line.includesMaterial ? <p className="text-sm text-[#6d695f]">includes material</p> : null}
              </div>
            </div>
          ))}
          {('addons' in estimate ? estimate.addons ?? [] : [])
            .filter((addon) => addon.status !== 'excluded')
            .map((addon) => (
              <div key={addon.id} className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    {addon.label}
                    {addon.status === 'optional' ? ' (Optional)' : ''}
                  </p>
                  <p className="text-sm text-[#6d695f]">{bundledAddonLabel(addon)}</p>
                </div>
                <p className="font-semibold">{formatCents(addonPricing(addon, estimate.rates))}</p>
              </div>
            ))}
          {estimate.rooms
            .filter((room) => room.status !== 'excluded')
            .map((room) => {
              const priced = roomPricing(room, estimate.rates)
              return (
                <div key={room.id} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      {room.label} Painting
                      {room.status === 'optional' ? ' (Optional)' : ''}
                    </p>
                    {clientView === 'detailed' ? (
                      <p className="text-sm text-[#6d695f]">
                        Walls/Ceiling {formatCents(priced.surfaceCents)} · Trim {formatCents(priced.trimCents)}
                        {priced.crownCents ? ` · Crown ${formatCents(priced.crownCents)}` : ''}
                        {priced.doorsCents ? ` · Doors ${formatCents(priced.doorsCents)}` : ''}
                        {priced.drywallCents ? ` · Drywall ${formatCents(priced.drywallCents)}` : ''}
                        {priced.textureCents ? ` · Texture ${formatCents(priced.textureCents)}` : ''}
                      </p>
                    ) : (
                      <p className="text-sm text-[#6d695f]">{bundledRoomLabel(room)}</p>
                    )}
                  </div>
                  <p className="font-semibold">{formatCents(priced.totalCents)}</p>
                </div>
              )
            })}
          {paintLine ? (
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">{paintLine.label}</p>
                <p className="text-sm text-[#6d695f]">{paintLine.detail}</p>
              </div>
              <p className="font-semibold">{formatCents(paintLine.cents)}</p>
            </div>
          ) : null}
          <div className="flex justify-between text-sm">
            <span>Prep & Protection Materials</span>
            <span>{formatCents(totals.prepMaterialCents)}</span>
          </div>
          {totals.extrasCents ? (
            <div className="flex justify-between text-sm">
              <span>Additional Colors</span>
              <span>{formatCents(totals.extrasCents)}</span>
            </div>
          ) : null}
          {totals.discountCents ? (
            <div className="flex justify-between text-sm text-[#2f7a52]">
              <span>{estimate.discount.label || 'Discount'}</span>
              <span>-{formatCents(totals.discountCents)}</span>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex items-end justify-end border-t border-[#e8d9b0] pt-6">
          <p className="text-3xl font-semibold">{formatCents(totals.totalCents)}</p>
        </div>

        <div className="mt-8 grid gap-3 text-sm">
          <p className="font-semibold">Payment Schedule</p>
          {schedule.map((item) => (
            <div key={item.id} className="flex justify-between">
              <span>
                {item.label} · {item.dueLabel}
              </span>
              <span>{formatCents(item.amountCents)}</span>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm leading-6 text-[#6d695f]">{business.terms}</p>

        {estimate.signature ? (
          <div className="mt-10 border-t border-[#e8d9b0] pt-6">
            <p className="text-xs uppercase tracking-[0.16em] text-[#8a6b24]">Accepted</p>
            <img src={estimate.signature.imageData} alt="Client signature" className="mt-3 h-20" />
            <p className="mt-2 text-sm">
              {estimate.signature.printedName} · {formatCents(estimate.signature.acceptedAmountCents)} ·{' '}
              {new Date(estimate.signature.signedAt).toLocaleString()}
            </p>
          </div>
        ) : null}

        <button
          onClick={() => window.print()}
          className="mt-8 rounded-xl bg-[#e8b44a] px-5 py-3 font-semibold text-[#1a1406] print:hidden"
        >
          Print / Save PDF
        </button>
      </div>
    </div>
  )
}
