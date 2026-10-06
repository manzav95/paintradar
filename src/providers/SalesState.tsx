import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { calculateFromFields, paymentSchedule } from '@/lib/estimateEngine'
import {
  createDefaultBusinessSettings,
  createDefaultCabinets,
  createDefaultCatalog,
  createDefaultExterior,
  createDefaultPricing,
  DEFAULT_REPAIR_LEVEL_CENTS,
  defaultRoomScope,
  emptyColors,
  normalizeColors,
  withScopeRates,
} from '@/data/pricingDefaults'
import { uid } from '@/lib/format'
import { nextDocumentNumber, normalizeLegacyPercent } from '@/lib/money'
import { loadSalesState, saveSalesState } from '@/lib/salesStorage'
import type {
  AddonKind,
  BusinessSalesSettings,
  CatalogMaterial,
  ChangeOrder,
  ChangeOrderLine,
  Customer,
  Estimate,
  EstimateAddon,
  EstimateRoom,
  EstimateSignature,
  Invoice,
  PaymentRecord,
  PricingSnapshot,
  RoomPreset,
} from '@/types/sales'
import { ADDON_LABELS } from '@/types/sales'

interface SalesContextValue {
  customers: Customer[]
  estimates: Estimate[]
  invoices: Invoice[]
  changeOrders: ChangeOrder[]
  payments: PaymentRecord[]
  pricing: PricingSnapshot
  catalog: CatalogMaterial[]
  business: BusinessSalesSettings
  saveStatus: 'saved' | 'saving' | 'pending'
  upsertCustomer: (input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => Customer
  deleteCustomer: (id: string) => void
  createEstimate: (customerId: string, type?: Estimate['type'], customer?: Customer, jobName?: string) => Estimate
  updateEstimate: (id: string, patch: Partial<Estimate>) => void
  duplicateEstimate: (id: string) => Estimate | null
  deleteEstimate: (id: string) => void
  addRoom: (estimateId: string, preset: RoomPreset, label?: string) => EstimateRoom | null
  updateRoom: (estimateId: string, roomId: string, patch: Partial<EstimateRoom>) => void
  duplicateRoom: (estimateId: string, roomId: string) => void
  removeRoom: (estimateId: string, roomId: string) => void
  addAddon: (estimateId: string, kind: AddonKind) => EstimateAddon | null
  updateAddon: (estimateId: string, addonId: string, patch: Partial<EstimateAddon>) => void
  removeAddon: (estimateId: string, addonId: string) => void
  signEstimate: (id: string, signature: EstimateSignature) => void
  convertToInvoice: (estimateId: string) => Invoice | null
  deleteInvoice: (id: string) => void
  addChangeOrderLine: (changeOrderId: string, line: Omit<ChangeOrderLine, 'id'>) => ChangeOrderLine | null
  updateChangeOrderLine: (changeOrderId: string, lineId: string, patch: Partial<ChangeOrderLine>) => void
  removeChangeOrderLine: (changeOrderId: string, lineId: string) => void
  updateChangeOrder: (id: string, patch: Partial<ChangeOrder>) => void
  createChangeOrder: (estimateId: string) => ChangeOrder | null
  ensureOpenChangeOrder: (estimateId: string) => ChangeOrder | null
  invoiceChangeOrder: (id: string) => Invoice | null
  deleteChangeOrder: (id: string) => void
  recordPayment: (payment: Omit<PaymentRecord, 'id'>) => void
  deletePayment: (id: string) => void
  updatePricing: (patch: Partial<PricingSnapshot>) => void
  updateBusiness: (patch: Partial<BusinessSalesSettings>) => void
  upsertCatalogItem: (item: CatalogMaterial) => void
  deleteCatalogItem: (id: string) => void
}

const SalesContext = createContext<SalesContextValue | null>(null)

function emptyCustomer(partial: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Customer {
  const now = new Date().toISOString()
  return {
    id: partial.id ?? uid('cust'),
    firstName: partial.firstName,
    lastName: partial.lastName,
    phone: partial.phone,
    email: partial.email,
    address: partial.address,
    city: partial.city,
    state: partial.state,
    zip: partial.zip,
    notes: partial.notes,
    createdAt: now,
    updatedAt: now,
  }
}

function createRoom(preset: RoomPreset, label?: string): EstimateRoom {
  return {
    id: uid('room'),
    label: label ?? preset,
    preset,
    lengthFt: 12,
    widthFt: 12,
    heightFt: 8,
    heightMode: 'preset',
    vaultedCeiling: false,
    peakHeightFt: null,
    vaultRidge: 'length',
    subtractOpenings: false,
    openingsSqFt: 0,
    scope: defaultRoomScope(),
    baseboardLf: null,
    doorCasingLf: 17,
    windowCasingLf: 0,
    crownLf: null,
    doors: [{ id: uid('door'), type: 'interior', quantity: 1, rateOverrideCents: null }],
    coatsWalls: 2,
    coatsCeiling: 2,
    coatsTrim: 2,
    drywallRepairLevel: null,
    textureLevel: null,
    colorOverride: '',
    status: 'included',
  }
}

function createAddon(kind: AddonKind): EstimateAddon {
  return {
    id: uid('addon'),
    kind,
    label: ADDON_LABELS[kind],
    quantity: 1,
    doorType: 'interior',
    paintRisers: false,
    riserQty: 0,
    handrailLf: 0,
    rateOverrideCents: null,
    status: 'included',
  }
}

export function SalesStateProvider({ children }: { children: ReactNode }) {
  const persisted = useMemo(() => loadSalesState(), [])
  const [customers, setCustomers] = useState<Customer[]>(() => persisted?.customers ?? [])
  const [estimates, setEstimates] = useState<Estimate[]>(() => persisted?.estimates ?? [])
  const [invoices, setInvoices] = useState<Invoice[]>(() => persisted?.invoices ?? [])
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>(() => persisted?.changeOrders ?? [])
  const [payments, setPayments] = useState<PaymentRecord[]>(() => persisted?.payments ?? [])
  const [pricing, setPricing] = useState<PricingSnapshot>(() => persisted?.pricing ?? createDefaultPricing())
  const [catalog, setCatalog] = useState<CatalogMaterial[]>(() => persisted?.catalog ?? createDefaultCatalog())
  const [business, setBusiness] = useState<BusinessSalesSettings>(() => persisted?.business ?? createDefaultBusinessSettings())
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'pending'>('saved')
  const timer = useRef<number | null>(null)

  useEffect(() => {
    setPricing((current) => ({
      ...current,
      wasteFactor: normalizeLegacyPercent(current.wasteFactor),
      paintMarkup: normalizeLegacyPercent(current.paintMarkup),
      repairLevelCents: current.repairLevelCents ?? DEFAULT_REPAIR_LEVEL_CENTS,
      stairFlightCents: current.stairFlightCents ?? 35000,
      stairRiserCents: current.stairRiserCents ?? 1500,
      handrailLfCents: current.handrailLfCents ?? 650,
      closetBuiltInCents: current.closetBuiltInCents ?? 22500,
    }))
    setPricing((current) => withScopeRates(current))
    setCatalog((current) =>
      current.map((item) => {
        const sheens = item.sheens ?? []
        const bundled = ['Eggshell,Satin,Semi-Gloss', 'Flat,Eggshell,Satin,Semi-Gloss', 'Flat,Matte', 'Satin,Semi-Gloss,Gloss']
        const cleared = bundled.includes(sheens.join(',')) ? [] : sheens
        return {
          ...item,
          sheens: cleared,
          finish: cleared.includes(item.finish) ? item.finish : '',
          markup: normalizeLegacyPercent(item.markup),
        }
      }),
    )
    setEstimates((current) =>
      current.map((item) => ({
        ...item,
        rates: {
          ...item.rates,
          wasteFactor: normalizeLegacyPercent(item.rates.wasteFactor),
          paintMarkup: normalizeLegacyPercent(item.rates.paintMarkup),
          repairLevelCents: item.rates.repairLevelCents ?? DEFAULT_REPAIR_LEVEL_CENTS,
          stairFlightCents: item.rates.stairFlightCents ?? 35000,
          stairRiserCents: item.rates.stairRiserCents ?? 1500,
          handrailLfCents: item.rates.handrailLfCents ?? 650,
          closetBuiltInCents: item.rates.closetBuiltInCents ?? 22500,
        },
        addons: (item.addons ?? []).map((addon) => ({
          ...addon,
          paintRisers: addon.paintRisers ?? false,
          riserQty: addon.riserQty ?? 0,
          handrailLf: addon.handrailLf ?? 0,
        })),
        exterior: item.exterior ?? (item.type === 'exterior' || item.type === 'mixed' ? createDefaultExterior() : null),
        cabinets: item.cabinets ?? (item.type === 'cabinets' || item.type === 'mixed' ? createDefaultCabinets(item.rates) : null),
        rooms: item.rooms.map((room) => ({
          ...room,
          heightMode: room.heightMode === 'vaulted' ? 'preset' : (room.heightMode ?? 'preset'),
          vaultedCeiling: room.vaultedCeiling ?? room.heightMode === 'vaulted',
          peakHeightFt: room.peakHeightFt ?? null,
          vaultRidge: room.vaultRidge ?? 'length',
          drywallRepairLevel: room.drywallRepairLevel ?? null,
          textureLevel: room.textureLevel ?? null,
        })),
      })),
    )
    setInvoices((current) =>
      current.map((item) => ({
        ...item,
        rates: {
          ...item.rates,
          wasteFactor: normalizeLegacyPercent(item.rates.wasteFactor),
          paintMarkup: normalizeLegacyPercent(item.rates.paintMarkup),
          repairLevelCents: item.rates.repairLevelCents ?? DEFAULT_REPAIR_LEVEL_CENTS,
          stairFlightCents: item.rates.stairFlightCents ?? 35000,
          stairRiserCents: item.rates.stairRiserCents ?? 1500,
          handrailLfCents: item.rates.handrailLfCents ?? 650,
          closetBuiltInCents: item.rates.closetBuiltInCents ?? 22500,
        },
        addons: (item.addons ?? []).map((addon) => ({
          ...addon,
          paintRisers: addon.paintRisers ?? false,
          riserQty: addon.riserQty ?? 0,
          handrailLf: addon.handrailLf ?? 0,
        })),
        exterior: item.exterior ?? null,
        cabinets: item.cabinets ?? null,
        rooms: item.rooms.map((room) => ({
          ...room,
          heightMode: room.heightMode === 'vaulted' ? 'preset' : (room.heightMode ?? 'preset'),
          vaultedCeiling: room.vaultedCeiling ?? room.heightMode === 'vaulted',
          peakHeightFt: room.peakHeightFt ?? null,
          vaultRidge: room.vaultRidge ?? 'length',
          drywallRepairLevel: room.drywallRepairLevel ?? null,
          textureLevel: room.textureLevel ?? null,
        })),
      })),
    )
  }, [])

  useEffect(() => {
    setSaveStatus('pending')
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      setSaveStatus('saving')
      saveSalesState({ customers, estimates, invoices, changeOrders, payments, pricing, catalog, business })
      setSaveStatus('saved')
    }, 350)
    return () => {
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [business, catalog, changeOrders, customers, estimates, invoices, payments, pricing])

  const upsertCustomer = useCallback((input: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
    const next = emptyCustomer(input)
    setCustomers((current) => {
      const index = current.findIndex((item) => item.id === next.id)
      if (index === -1) return [next, ...current]
      const copy = [...current]
      copy[index] = { ...current[index], ...next, createdAt: current[index].createdAt, updatedAt: new Date().toISOString() }
      return copy
    })
    return next
  }, [])

  const deleteCustomer = useCallback((id: string) => {
    setCustomers((current) => current.filter((item) => item.id !== id))
  }, [])

  const createEstimate = useCallback(
    (customerId: string, type: Estimate['type'] = 'interior', incoming?: Customer, jobName = '') => {
      const customer = incoming ?? customers.find((item) => item.id === customerId)
      const now = new Date().toISOString()
      const estimate: Estimate = {
        id: uid('est'),
        number: nextDocumentNumber('EST', estimates.map((item) => item.number)),
        type,
        status: 'draft',
        customerId,
        jobName: jobName.trim(),
        projectAddress: customer?.address ?? '',
        projectCity: customer?.city ?? 'Brentwood',
        projectState: customer?.state ?? 'CA',
        projectZip: customer?.zip ?? '',
        notes: '',
        extraColors: 0,
        waiveColorFee: false,
        colors: emptyColors(),
        discount: { label: '', kind: 'flat', value: 0 },
        rooms: [],
        addons: [],
        exterior: type === 'exterior' || type === 'mixed' ? createDefaultExterior() : null,
        cabinets: type === 'cabinets' || type === 'mixed' ? createDefaultCabinets(pricing) : null,
        rates: { ...pricing },
        clientView: 'bundled',
        fieldMode: true,
        signature: null,
        invoiceId: null,
        createdAt: now,
        updatedAt: now,
      }
      setEstimates((current) => [estimate, ...current])
      return estimate
    },
    [customers, estimates, pricing],
  )

  const updateEstimate = useCallback((id: string, patch: Partial<Estimate>) => {
    const now = new Date().toISOString()
    setEstimates((current) => current.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: now } : item)))
    if (patch.jobName !== undefined) {
      setInvoices((current) =>
        current.map((item) => (item.estimateId === id ? { ...item, jobName: patch.jobName ?? '', updatedAt: now } : item)),
      )
    }
  }, [])

  const duplicateEstimate = useCallback(
    (id: string) => {
      const current = estimates.find((item) => item.id === id)
      if (!current) return null
      const copy: Estimate = {
        ...current,
        id: uid('est'),
        number: nextDocumentNumber('EST', estimates.map((item) => item.number)),
        status: 'draft',
        signature: null,
        invoiceId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        rooms: current.rooms.map((room) => ({ ...room, id: uid('room'), doors: room.doors.map((door) => ({ ...door, id: uid('door') })) })),
        addons: (current.addons ?? []).map((addon) => ({ ...addon, id: uid('addon') })),
      }
      setEstimates((items) => [copy, ...items])
      return copy
    },
    [estimates],
  )

  const deleteEstimate = useCallback((id: string) => {
    setEstimates((current) => current.filter((item) => item.id !== id))
    setChangeOrders((current) => current.filter((item) => item.estimateId !== id))
  }, [])

  const addRoom = useCallback((estimateId: string, preset: RoomPreset, label?: string) => {
    const room = createRoom(preset, label)
    setEstimates((current) =>
      current.map((item) =>
        item.id === estimateId ? { ...item, rooms: [room, ...item.rooms], updatedAt: new Date().toISOString() } : item,
      ),
    )
    return room
  }, [])

  const updateRoom = useCallback((estimateId: string, roomId: string, patch: Partial<EstimateRoom>) => {
    setEstimates((current) =>
      current.map((item) =>
        item.id === estimateId
          ? {
              ...item,
              rooms: item.rooms.map((room) => (room.id === roomId ? { ...room, ...patch } : room)),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  }, [])

  const duplicateRoom = useCallback((estimateId: string, roomId: string) => {
    setEstimates((current) =>
      current.map((item) => {
        if (item.id !== estimateId) return item
        const room = item.rooms.find((entry) => entry.id === roomId)
        if (!room) return item
        const copy: EstimateRoom = {
          ...room,
          id: uid('room'),
          label: `${room.label} copy`,
          doors: room.doors.map((door) => ({ ...door, id: uid('door') })),
        }
        return { ...item, rooms: [copy, ...item.rooms], updatedAt: new Date().toISOString() }
      }),
    )
  }, [])

  const addAddon = useCallback((estimateId: string, kind: AddonKind) => {
    const addon = createAddon(kind)
    setEstimates((current) =>
      current.map((item) =>
        item.id === estimateId
          ? { ...item, addons: [addon, ...(item.addons ?? [])], updatedAt: new Date().toISOString() }
          : item,
      ),
    )
    return addon
  }, [])

  const updateAddon = useCallback((estimateId: string, addonId: string, patch: Partial<EstimateAddon>) => {
    setEstimates((current) =>
      current.map((item) =>
        item.id === estimateId
          ? {
              ...item,
              addons: (item.addons ?? []).map((addon) => (addon.id === addonId ? { ...addon, ...patch } : addon)),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  }, [])

  const removeAddon = useCallback((estimateId: string, addonId: string) => {
    setEstimates((current) =>
      current.map((item) =>
        item.id === estimateId
          ? { ...item, addons: (item.addons ?? []).filter((addon) => addon.id !== addonId), updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }, [])

  const removeRoom = useCallback((estimateId: string, roomId: string) => {
    setEstimates((current) =>
      current.map((item) =>
        item.id === estimateId
          ? { ...item, rooms: item.rooms.filter((room) => room.id !== roomId), updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }, [])

  const signEstimate = useCallback((id: string, signature: EstimateSignature) => {
    setEstimates((current) =>
      current.map((item) =>
        item.id === id ? { ...item, signature, status: 'accepted', updatedAt: new Date().toISOString() } : item,
      ),
    )
  }, [])

  const convertToInvoice = useCallback(
    (estimateId: string) => {
      const estimate = estimates.find((item) => item.id === estimateId)
      if (!estimate) return null
      const now = new Date().toISOString()
      const totals = calculateFromFields(estimate)
      const invoice: Invoice = {
        id: uid('inv'),
        number: nextDocumentNumber('INV', invoices.map((item) => item.number)),
        estimateId,
        customerId: estimate.customerId,
        status: 'draft',
        kind: 'original',
        parentInvoiceId: null,
        changeOrderId: null,
        jobName: estimate.jobName,
        projectAddress: `${estimate.projectAddress} ${estimate.projectCity} ${estimate.projectState} ${estimate.projectZip}`.trim(),
        rooms: estimate.rooms,
        addons: estimate.addons ?? [],
        exterior: estimate.exterior ?? null,
        cabinets: estimate.cabinets ?? null,
        rates: estimate.rates,
        extraColors: estimate.extraColors,
        waiveColorFee: estimate.waiveColorFee,
        colors: normalizeColors(estimate.colors),
        discount: estimate.discount,
        lineItems: [],
        notes: estimate.notes,
        signature: estimate.signature,
        createdAt: now,
        updatedAt: now,
      }
      const schedule = paymentSchedule(totals.totalCents, estimate.rates).map((item) => ({
        id: uid('pay'),
        invoiceId: invoice.id,
        kind: item.kind,
        label: item.label,
        amountDueCents: item.amountCents,
        amountPaidCents: 0,
        dueDate: '',
        paidAt: null,
        method: '',
        notes: item.dueLabel,
      }))
      setInvoices((current) => [invoice, ...current])
      setPayments((current) => [...schedule, ...current])
      setEstimates((current) =>
        current.map((item) => (item.id === estimateId ? { ...item, status: 'converted', invoiceId: invoice.id } : item)),
      )
      return invoice
    },
    [estimates, invoices],
  )

  const deleteInvoice = useCallback((id: string) => {
    setInvoices((current) => current.filter((item) => item.id !== id))
    setPayments((current) => current.filter((item) => item.invoiceId !== id))
    setEstimates((current) =>
      current.map((item) => (item.invoiceId === id ? { ...item, invoiceId: null, updatedAt: new Date().toISOString() } : item)),
    )
    setChangeOrders((current) =>
      current.map((item) => (item.invoiceId === id ? { ...item, invoiceId: null, updatedAt: new Date().toISOString() } : item)),
    )
  }, [])

  const ensureOpenChangeOrder = useCallback(
    (estimateId: string) => {
      const estimate = estimates.find((item) => item.id === estimateId)
      if (!estimate) return null
      let result: ChangeOrder | null = null
      setChangeOrders((current) => {
        const existing = current.find((item) => item.estimateId === estimateId && !item.invoiceId)
        if (existing) {
          result = existing
          return current
        }
        const parent = invoices.find((item) => item.estimateId === estimateId && item.kind !== 'change_order')
        const now = new Date().toISOString()
        const order: ChangeOrder = {
          id: uid('co'),
          number: nextDocumentNumber('CO', current.map((item) => item.number)),
          estimateId,
          parentInvoiceId: parent?.id ?? estimate.invoiceId,
          invoiceId: null,
          customerId: estimate.customerId,
          title: 'Change Order',
          notes: '',
          lines: [],
          createdAt: now,
          updatedAt: now,
        }
        result = order
        return [order, ...current]
      })
      return result
    },
    [estimates, invoices],
  )

  const createChangeOrder = useCallback((estimateId: string) => ensureOpenChangeOrder(estimateId), [ensureOpenChangeOrder])

  const updateChangeOrder = useCallback((id: string, patch: Partial<ChangeOrder>) => {
    setChangeOrders((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item)),
    )
  }, [])

  const addChangeOrderLine = useCallback((changeOrderId: string, line: Omit<ChangeOrderLine, 'id'>) => {
    const next: ChangeOrderLine = { ...line, id: uid('col') }
    let added = false
    setChangeOrders((current) =>
      current.map((item) => {
        if (item.id !== changeOrderId || item.invoiceId) return item
        added = true
        return { ...item, lines: [...item.lines, next], updatedAt: new Date().toISOString() }
      }),
    )
    return added ? next : null
  }, [])

  const updateChangeOrderLine = useCallback((changeOrderId: string, lineId: string, patch: Partial<ChangeOrderLine>) => {
    setChangeOrders((current) =>
      current.map((item) =>
        item.id === changeOrderId && !item.invoiceId
          ? {
              ...item,
              lines: item.lines.map((line) => (line.id === lineId ? { ...line, ...patch, id: line.id } : line)),
              updatedAt: new Date().toISOString(),
            }
          : item,
      ),
    )
  }, [])

  const removeChangeOrderLine = useCallback((changeOrderId: string, lineId: string) => {
    setChangeOrders((current) =>
      current.map((item) =>
        item.id === changeOrderId && !item.invoiceId
          ? { ...item, lines: item.lines.filter((line) => line.id !== lineId), updatedAt: new Date().toISOString() }
          : item,
      ),
    )
  }, [])

  const invoiceChangeOrder = useCallback(
    (id: string) => {
      const order = changeOrders.find((item) => item.id === id)
      const estimate = estimates.find((item) => item.id === order?.estimateId)
      if (!order || !estimate || order.invoiceId || order.lines.length === 0) return null
      const now = new Date().toISOString()
      const lineItems = order.lines.map((line) => ({
        id: line.id,
        label: line.label,
        detail: line.detail,
        amountCents: line.amountCents,
      }))
      const invoice: Invoice = {
        id: uid('inv'),
        number: nextDocumentNumber('INV', invoices.map((item) => item.number)),
        estimateId: estimate.id,
        customerId: estimate.customerId,
        status: 'draft',
        kind: 'change_order',
        parentInvoiceId: order.parentInvoiceId,
        changeOrderId: order.id,
        jobName: estimate.jobName,
        projectAddress: `${estimate.projectAddress} ${estimate.projectCity} ${estimate.projectState} ${estimate.projectZip}`.trim(),
        rooms: [],
        addons: [],
        exterior: null,
        cabinets: null,
        rates: estimate.rates,
        extraColors: 0,
        waiveColorFee: true,
        colors: normalizeColors(estimate.colors),
        discount: { label: '', kind: 'flat', value: 0 },
        lineItems,
        notes: order.notes,
        signature: null,
        createdAt: now,
        updatedAt: now,
      }
      const total = lineItems.reduce((sum, item) => sum + item.amountCents, 0)
      const payment: PaymentRecord = {
        id: uid('pay'),
        invoiceId: invoice.id,
        kind: 'custom',
        label: `${order.number} · Change Order`,
        amountDueCents: total,
        amountPaidCents: 0,
        dueDate: now.slice(0, 10),
        paidAt: null,
        method: '',
        notes: 'Due when change order is issued',
      }
      setInvoices((current) => [invoice, ...current])
      setPayments((current) => [payment, ...current])
      setChangeOrders((current) =>
        current.map((item) => (item.id === id ? { ...item, invoiceId: invoice.id, updatedAt: now } : item)),
      )
      return invoice
    },
    [changeOrders, estimates, invoices],
  )

  const deleteChangeOrder = useCallback((id: string) => {
    const order = changeOrders.find((item) => item.id === id)
    if (order?.invoiceId) deleteInvoice(order.invoiceId)
    setChangeOrders((current) => current.filter((item) => item.id !== id))
  }, [changeOrders, deleteInvoice])

  const refreshInvoiceStatus = (invoiceId: string, rows: PaymentRecord[]) => {
    setInvoices((current) =>
      current.map((invoice) => {
        if (invoice.id !== invoiceId) return invoice
        const paid = rows.filter((item) => item.invoiceId === invoice.id).reduce((sum, item) => sum + item.amountPaidCents, 0)
        const total = calculateFromFields(invoice).totalCents
        return {
          ...invoice,
          status: paid <= 0 ? (invoice.status === 'paid' || invoice.status === 'partial' ? 'draft' : invoice.status) : paid >= total ? 'paid' : 'partial',
          updatedAt: new Date().toISOString(),
        }
      }),
    )
  }

  const recordPayment = useCallback((payment: Omit<PaymentRecord, 'id'>) => {
    setPayments((current) => {
      const open = current.find(
        (item) =>
          item.invoiceId === payment.invoiceId &&
          item.kind === payment.kind &&
          item.amountPaidCents < item.amountDueCents,
      )
      const next = open
        ? current.map((item) =>
            item.id === open.id
              ? {
                  ...item,
                  amountPaidCents: Math.min(open.amountDueCents, open.amountPaidCents + payment.amountPaidCents),
                  method: payment.method || item.method,
                  paidAt: payment.paidAt ?? new Date().toISOString(),
                  notes: payment.notes || item.notes,
                }
              : item,
          )
        : [{ ...payment, id: uid('pay') }, ...current]
      refreshInvoiceStatus(payment.invoiceId, next)
      return next
    })
  }, [])

  const deletePayment = useCallback((id: string) => {
    setPayments((current) => {
      const target = current.find((item) => item.id === id)
      const next = current.filter((item) => item.id !== id)
      if (target) refreshInvoiceStatus(target.invoiceId, next)
      return next
    })
  }, [])

  const updatePricing = useCallback((patch: Partial<PricingSnapshot>) => {
    setPricing((current) => ({ ...current, ...patch }))
  }, [])

  const updateBusiness = useCallback((patch: Partial<BusinessSalesSettings>) => {
    setBusiness((current) => ({ ...current, ...patch }))
  }, [])

  const upsertCatalogItem = useCallback((item: CatalogMaterial) => {
    setCatalog((current) => {
      const index = current.findIndex((entry) => entry.id === item.id)
      if (index === -1) return [item, ...current]
      const copy = [...current]
      copy[index] = item
      return copy
    })
  }, [])

  const deleteCatalogItem = useCallback((id: string) => {
    setCatalog((current) => current.filter((item) => item.id !== id))
  }, [])

  const value: SalesContextValue = {
    customers,
    estimates,
    invoices,
    changeOrders,
    payments,
    pricing,
    catalog,
    business,
    saveStatus,
    upsertCustomer,
    deleteCustomer,
    createEstimate,
    updateEstimate,
    duplicateEstimate,
    deleteEstimate,
    addRoom,
    updateRoom,
    duplicateRoom,
    removeRoom,
    addAddon,
    updateAddon,
    removeAddon,
    signEstimate,
    convertToInvoice,
    deleteInvoice,
    createChangeOrder,
    ensureOpenChangeOrder,
    updateChangeOrder,
    addChangeOrderLine,
    updateChangeOrderLine,
    removeChangeOrderLine,
    invoiceChangeOrder,
    deleteChangeOrder,
    recordPayment,
    deletePayment,
    updatePricing,
    updateBusiness,
    upsertCatalogItem,
    deleteCatalogItem,
  }

  return <SalesContext.Provider value={value}>{children}</SalesContext.Provider>
}

export function useSales() {
  const context = useContext(SalesContext)
  if (!context) throw new Error('useSales must be used within SalesStateProvider')
  return context
}
