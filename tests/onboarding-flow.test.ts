import { describe, it, expect } from 'vitest'
import { spiceLevelFromNumber } from '../utils/formatSpice'

describe('Onboarding Flow - isEditMode prefill mapping', () => {
  it('maps spice levels numerically to string labels', () => {
    expect(spiceLevelFromNumber(1)).toBe('mild')
    expect(spiceLevelFromNumber(2)).toBe('medium')
    expect(spiceLevelFromNumber(3)).toBe('hot')
  })
})
