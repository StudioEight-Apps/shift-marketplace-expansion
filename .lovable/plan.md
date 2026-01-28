
# Dynamic Filter Labels Enhancement

## Overview
Update the Tier 3 filter pills to display contextual selection summaries instead of static labels when filters are active. This provides immediate visual feedback about applied filters without requiring users to click into each popover.

## Design Approach
**Hybrid Label Strategy**: Keep the icon as a visual anchor, but replace the text with a compact value summary when active. This is the cleanest approach for a luxury UI because:
- Users can scan applied filters at a glance
- Icons provide consistent visual anchoring
- Compact labels prevent horizontal overflow on mobile
- Maintains the premium minimalist aesthetic

## Label Formats by Filter Type

| Filter | Inactive | Active Examples |
|--------|----------|-----------------|
| Price (Stays) | "Price" | "Under $2k/day", "$1k-$5k", "$5k+/day" |
| Price (Cars) | "Price" | "Under $500/day", "$200-$800" |
| Price (Yachts) | "Price" | "Under $10k/hr", "$5k-$20k" |
| Guests | "Guests" | "8+ guests" |
| Beds | "Beds" | "4+ beds" |
| Seats | "Seats" | "4+ seats" |
| Brand | "Brand" | "Ferrari", "2 brands", "3 brands" |
| Body Style | "Body Style" | "SUV", "2 styles" |
| Length | "Length" | "50-100 ft", "80+ ft" |

## Technical Implementation

### 1. Create Label Generator Functions

Add helper functions that generate smart labels based on filter state:

```text
getPriceLabel(price, max, assetType):
  - If min is 0 and max < ceiling: "Under $Xk"
  - If min > 0 and max = ceiling: "$Xk+"
  - Otherwise: "$Xk-$Yk"
  - Append "/day" for Stays/Cars, "/hr" for Yachts

getCounterLabel(value, suffix):
  - Returns "{value}+ {suffix}" (e.g., "12+ guests")

getMultiSelectLabel(selected, singular, plural):
  - 1 item: show the item name (e.g., "Ferrari")
  - 2+ items: show count + plural (e.g., "3 brands")

getLengthLabel(range):
  - Similar logic to price but with "ft" suffix
```

### 2. Update FilterPill Component

Modify the FilterPill to accept both a base label and an active label:

```text
interface FilterPillProps {
  icon: React.ReactNode
  label: string           // Base label (e.g., "Price")
  activeLabel?: string    // Override when active (e.g., "Under $2k")
  isActive: boolean
  children: React.ReactNode
}
```

The pill will display `activeLabel` when provided and `isActive` is true, otherwise fall back to `label`.

### 3. Update Each Filter Instance

Update each FilterPill usage to compute and pass the `activeLabel`:

**Stays example:**
- Price: `activeLabel={getPriceLabel(filters.price, 10000, 'Stays')}`
- Guests: `activeLabel={filters.guests ? `${filters.guests}+ guests` : undefined}`
- Beds: `activeLabel={filters.beds ? `${filters.beds}+ beds` : undefined}`

**Cars example:**
- Price: `activeLabel={getPriceLabel(filters.price, 2000, 'Cars')}`
- Brand: `activeLabel={getBrandLabel(filters.brand)}`
- Seats: `activeLabel={filters.seats ? `${filters.seats}+ seats` : undefined}`
- Body Style: `activeLabel={getStyleLabel(filters.bodyStyle)}`

**Yachts example:**
- Price: `activeLabel={getPriceLabel(filters.price, 50000, 'Yachts')}`
- Guests: `activeLabel={filters.guests ? `${filters.guests}+ guests` : undefined}`
- Length: `activeLabel={getLengthLabel(filters.length)}`

### 4. Mobile Optimization

For mobile (smaller screens), ensure labels truncate gracefully:
- Use `max-w-[100px]` or similar with `truncate` class on the label span
- Shorter format variants for very small screens if needed

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/shift/QuickFilters.tsx` | Add label generator functions, update FilterPill props, update all filter instances |

## Visual Result

**Before (current):**
```text
[$ Price] [Users Guests] [Bed Beds] [x Reset]
```

**After (with selections):**
```text
[$ Under $2k] [Users 12+ guests] [Bed 4+ beds] [x Reset]
```

The pills remain the same size when inactive but expand slightly to accommodate the value text when active, maintaining the clean visual hierarchy.
