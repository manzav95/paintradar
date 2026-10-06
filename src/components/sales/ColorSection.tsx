import { Field, Input, Select } from '@/components/ui/Input'
import type { CatalogMaterial, ColorChoice, EstimateColors, EstimateType } from '@/types/sales'
import { PAINT_SHEENS } from '@/types/sales'

function productLabel(item: CatalogMaterial) {
  return `${item.manufacturer} ${item.productName}`.trim()
}

function ColorRow({
  label,
  placeholder,
  value,
  catalog,
  gallons,
  onChange,
}: {
  label: string
  placeholder: string
  value: ColorChoice
  catalog: CatalogMaterial[]
  gallons?: number
  onChange: (next: ColorChoice) => void
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_minmax(0,1.2fr)_5.5rem]">
      <Field label={label}>
        <Input value={value.color} onChange={(event) => onChange({ ...value, color: event.target.value })} placeholder={placeholder} />
      </Field>
      <Field label="Sheen">
        <Select value={value.sheen} onChange={(event) => onChange({ ...value, sheen: event.target.value })}>
          <option value="">Sheen</option>
          {PAINT_SHEENS.map((sheen) => (
            <option key={sheen} value={sheen}>
              {sheen}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Product">
        <Select
          value={value.productId}
          onChange={(event) => {
            const item = catalog.find((entry) => entry.id === event.target.value)
            onChange({
              ...value,
              productId: item?.id ?? '',
              productName: item ? productLabel(item) : '',
            })
          }}
        >
          <option value="">Product</option>
          {catalog.map((item) => (
            <option key={item.id} value={item.id}>
              {productLabel(item)}
              {item.category ? ` · ${item.category}` : ''}
            </option>
          ))}
        </Select>
      </Field>
      {typeof gallons === 'number' ? (
        <Field label="Qty">
          <p className="flex h-11 items-center text-sm font-semibold tabular-nums">{gallons ? `${gallons} gal` : '—'}</p>
        </Field>
      ) : null}
    </div>
  )
}

export function ColorSection({
  type,
  colors,
  catalog,
  gallons,
  onChange,
}: {
  type: EstimateType
  colors: EstimateColors
  catalog: CatalogMaterial[]
  gallons?: { walls?: number; ceiling?: number; trim?: number; primer?: number; paint?: number }
  onChange: (next: EstimateColors) => void
}) {
  const products = catalog.filter((item) => item.active)

  return (
    <>
      {type === 'interior' || type === 'mixed' ? (
        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Interior Colors</h2>
          <p className="mt-1 text-sm text-muted">
            Client-selected wall, ceiling, and trim colors plus the product we will use. Gallons come from the room square footage.
          </p>
          <div className="mt-4 grid gap-4">
            <ColorRow
              label="Walls"
              placeholder="Swiss Coffee"
              value={colors.interior.walls}
              catalog={products}
              gallons={gallons?.walls}
              onChange={(walls) => onChange({ ...colors, interior: { ...colors.interior, walls } })}
            />
            <ColorRow
              label="Ceiling"
              placeholder="Ceiling White"
              value={colors.interior.ceiling}
              catalog={products}
              gallons={gallons?.ceiling}
              onChange={(ceiling) => onChange({ ...colors, interior: { ...colors.interior, ceiling } })}
            />
            <ColorRow
              label="Trim"
              placeholder="Pure White"
              value={colors.interior.trim}
              catalog={products}
              gallons={gallons?.trim}
              onChange={(trim) => onChange({ ...colors, interior: { ...colors.interior, trim } })}
            />
            <Field label="Anything else">
              <Input
                value={colors.interior.other}
                onChange={(event) => onChange({ ...colors, interior: { ...colors.interior, other: event.target.value } })}
                placeholder="Accent wall, stain, doors..."
              />
            </Field>
          </div>
        </div>
      ) : null}

      {type === 'exterior' || type === 'mixed' ? (
        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Exterior Colors</h2>
          <p className="mt-1 text-sm text-muted">Body, fascia, trim, doors, and garage door — each with its own product and sheen.</p>
          <div className="mt-4 grid gap-4">
            <ColorRow
              label="Walls"
              placeholder="Naval"
              value={colors.exterior.walls}
              catalog={products}
              gallons={type === 'exterior' ? gallons?.walls : undefined}
              onChange={(walls) => onChange({ ...colors, exterior: { ...colors.exterior, walls } })}
            />
            <ColorRow
              label="Fascia"
              placeholder="White Dove"
              value={colors.exterior.fascia}
              catalog={products}
              onChange={(fascia) => onChange({ ...colors, exterior: { ...colors.exterior, fascia } })}
            />
            <ColorRow
              label="Trim"
              placeholder="White Dove"
              value={colors.exterior.trim}
              catalog={products}
              gallons={type === 'exterior' ? gallons?.trim : undefined}
              onChange={(trim) => onChange({ ...colors, exterior: { ...colors.exterior, trim } })}
            />
            <ColorRow
              label="Doors"
              placeholder="Heritage Red"
              value={colors.exterior.doors}
              catalog={products}
              onChange={(doors) => onChange({ ...colors, exterior: { ...colors.exterior, doors } })}
            />
            <ColorRow
              label="Garage Door"
              placeholder="Match body"
              value={colors.exterior.garageDoor}
              catalog={products}
              onChange={(garageDoor) => onChange({ ...colors, exterior: { ...colors.exterior, garageDoor } })}
            />
            <Field label="Anything else">
              <Input
                value={colors.exterior.other}
                onChange={(event) => onChange({ ...colors, exterior: { ...colors.exterior, other: event.target.value } })}
                placeholder="Soffit, fence, shutters..."
              />
            </Field>
          </div>
        </div>
      ) : null}

      {type === 'cabinets' || type === 'mixed' ? (
        <div className="rounded-3xl border border-line bg-surface p-5">
          <h2 className="font-semibold">Cabinet Color</h2>
          <p className="mt-1 text-sm text-muted">Cabinet color, sheen, and the product we will spray. Primer and paint gallons use the 1.5× cabinet mix.</p>
          <div className="mt-4 grid gap-4">
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_150px_minmax(0,1.2fr)_5.5rem_5.5rem]">
              <Field label="Cabinet Color">
                <Input
                  value={colors.cabinets.color}
                  onChange={(event) => onChange({ ...colors, cabinets: { ...colors.cabinets, color: event.target.value } })}
                  placeholder="Hale Navy"
                />
              </Field>
              <Field label="Sheen">
                <Select
                  value={colors.cabinets.sheen}
                  onChange={(event) => onChange({ ...colors, cabinets: { ...colors.cabinets, sheen: event.target.value } })}
                >
                  <option value="">Sheen</option>
                  {PAINT_SHEENS.map((sheen) => (
                    <option key={sheen} value={sheen}>
                      {sheen}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Product">
                <Select
                  value={colors.cabinets.productId}
                  onChange={(event) => {
                    const item = products.find((entry) => entry.id === event.target.value)
                    onChange({
                      ...colors,
                      cabinets: {
                        ...colors.cabinets,
                        productId: item?.id ?? '',
                        productName: item ? productLabel(item) : '',
                      },
                    })
                  }}
                >
                  <option value="">Product</option>
                  {products.map((item) => (
                    <option key={item.id} value={item.id}>
                      {productLabel(item)}
                      {item.category ? ` · ${item.category}` : ''}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Primer">
                <p className="flex h-11 items-center text-sm font-semibold tabular-nums">{gallons?.primer ? `${gallons.primer} gal` : '—'}</p>
              </Field>
              <Field label="Paint">
                <p className="flex h-11 items-center text-sm font-semibold tabular-nums">{gallons?.paint ? `${gallons.paint} gal` : '—'}</p>
              </Field>
            </div>
            <Field label="Anything else">
              <Input
                value={colors.cabinets.other}
                onChange={(event) => onChange({ ...colors, cabinets: { ...colors.cabinets, other: event.target.value } })}
                placeholder="Island color, glaze, hardware finish..."
              />
            </Field>
          </div>
        </div>
      ) : null}
    </>
  )
}
