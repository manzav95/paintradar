import { EAST_BAY_CITIES } from '@/data/cities'
import { Field, Input, Select } from '@/components/ui/Input'
import { useAppState } from '@/providers/AppState'
import { CATEGORY_LABELS, LEAD_SOURCES, PROJECT_CATEGORIES, SOURCE_LABELS, URGENCY_LEVELS, URGENCY_LABELS } from '@/types'

export function FilterBar() {
  const { filters, setFilters } = useAppState()

  return (
    <div className="rounded-2xl border border-line bg-surface p-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <Field label="Search">
          <Input
            value={filters.query}
            placeholder="Name, city, keyword..."
            onChange={(event) => setFilters({ query: event.target.value })}
          />
        </Field>
        <Field label="Project type">
          <Select
            value={filters.categories[0] ?? ''}
            onChange={(event) =>
              setFilters({ categories: event.target.value ? [event.target.value as typeof PROJECT_CATEGORIES[number]] : [] })
            }
          >
            <option value="">All services</option>
            {PROJECT_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {CATEGORY_LABELS[category]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Distance">
          <Select
            value={filters.maxDistance ?? ''}
            onChange={(event) => setFilters({ maxDistance: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">Any distance</option>
            {[10, 25, 50, 75].map((miles) => (
              <option key={miles} value={miles}>
                Within {miles} miles
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date posted">
          <Select
            value={filters.datePosted}
            onChange={(event) => setFilters({ datePosted: event.target.value as typeof filters.datePosted })}
          >
            <option value="any">Any time</option>
            <option value="1h">Last hour</option>
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
          </Select>
        </Field>
        <Field label="Lead score">
          <Select value={filters.minScore} onChange={(event) => setFilters({ minScore: Number(event.target.value) })}>
            <option value={0}>Any score</option>
            <option value={70}>70+</option>
            <option value={80}>80+</option>
            <option value={90}>90+</option>
          </Select>
        </Field>
        <Field label="Urgency">
          <Select
            value={filters.urgency[0] ?? ''}
            onChange={(event) =>
              setFilters({ urgency: event.target.value ? [event.target.value as (typeof URGENCY_LEVELS)[number]] : [] })
            }
          >
            <option value="">All urgency</option>
            {URGENCY_LEVELS.map((level) => (
              <option key={level} value={level}>
                {URGENCY_LABELS[level]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Source">
          <Select
            value={filters.sources[0] ?? ''}
            onChange={(event) =>
              setFilters({ sources: event.target.value ? [event.target.value as (typeof LEAD_SOURCES)[number]] : [] })
            }
          >
            <option value="">All sources</option>
            {LEAD_SOURCES.map((source) => (
              <option key={source} value={source}>
                {SOURCE_LABELS[source]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estimated value">
          <Select
            value={filters.minValue ?? ''}
            onChange={(event) => setFilters({ minValue: event.target.value ? Number(event.target.value) : null })}
          >
            <option value="">Any value</option>
            <option value={1500}>$1,500+</option>
            <option value={3000}>$3,000+</option>
            <option value={5000}>$5,000+</option>
            <option value={8000}>$8,000+</option>
          </Select>
        </Field>
        <Field label="City">
          <Select value={filters.city} onChange={(event) => setFilters({ city: event.target.value })}>
            <option value="">All cities</option>
            {EAST_BAY_CITIES.map((city) => (
              <option key={city.name} value={city.name}>
                {city.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Photos">
          <Select
            value={filters.hasPhotos === null ? '' : filters.hasPhotos ? 'yes' : 'no'}
            onChange={(event) =>
              setFilters({
                hasPhotos: event.target.value === '' ? null : event.target.value === 'yes',
              })
            }
          >
            <option value="">Any</option>
            <option value="yes">Has photos</option>
            <option value="no">No photos</option>
          </Select>
        </Field>
        <Field label="Sort">
          <Select
            value={filters.sort}
            onChange={(event) => setFilters({ sort: event.target.value as typeof filters.sort })}
          >
            <option value="newest">Newest</option>
            <option value="closest">Closest</option>
            <option value="highest_score">Highest score</option>
            <option value="highest_value">Highest value</option>
            <option value="most_urgent">Most urgent</option>
          </Select>
        </Field>
      </div>
    </div>
  )
}
