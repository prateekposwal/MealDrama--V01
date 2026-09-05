import { describe, it, expect } from 'vitest';
import { DISH_LIBRARY, type Dish } from '../meal/constants/dishLibrary';
import { regionForState, statesMatchRegion } from '../utils/regionConstants';
import { auditRegionStates } from '../tools/auditDishRecipes';
import { keepRegionTrayItems } from '../utils/dietQuota';

const byId = (id: string): Dish => {
  const d = DISH_LIBRARY.find(x => x.id === id);
  if (!d) throw new Error(`dish not found: ${id}`);
  return d;
};

describe('region seed — states ⊆ region per canonical map', () => {
  it('T9: every dish\'s states[] ⊆ its region, and every distinct state key resolves', () => {
    const distinctStates = new Set<string>();
    for (const d of DISH_LIBRARY) {
      for (const s of d.states ?? []) distinctStates.add(s.trim());
      expect(statesMatchRegion(d.region, d.states ?? []), `${d.id}: states ${JSON.stringify(d.states)} not ⊆ region ${d.region}`).toBe(true);
    }
    for (const s of distinctStates) {
      expect(regionForState(s), `unknown state key: ${s}`).not.toBeNull();
    }
  });

  it('T9b: the canonical audit (authoritative) returns zero mismatches', () => {
    const gaps = auditRegionStates();
    expect(gaps.map(g => `${g.id}:${g.state}`)).toEqual([]);
  });

  it('T10: specific reassignments locked', () => {
    // Goan fish → west
    expect(byId('mussel-stir-fry').region).toBe('west');
    expect(byId('kane-rava-fry').region).toBe('west');
    expect(byId('chiroti').region).toBe('west');
    // Dimer Devil (WB/Assam) → east, West Bengal
    expect(byId('dimer-devil').region).toBe('east');
    expect(byId('dimer-devil').states).toEqual(['West Bengal']);
    // Hyderabad dropped from the north biryanis/paya
    expect(byId('paya-shorba').states).not.toContain('Hyderabad');
    expect(byId('mutton-biryani').states).not.toContain('Hyderabad');
    expect(byId('chicken-biryani').states).not.toContain('Hyderabad');
    // UP/Lucknow/Delhi central → north
    expect(byId('lucknowi-biryani').region).toBe('north');
    expect(byId('paneer-pakora').region).toBe('north');
    // Gujarati dal drops foreign Delhi/Bangalore
    expect(byId('gujarati-dal').states).not.toContain('Delhi');
    expect(byId('gujarati-dal').states).not.toContain('Bangalore');
    // Gajar ka halwa drops Mumbai/Bangalore
    expect(byId('gajar-ka-halwa').states).not.toContain('Mumbai');
    expect(byId('gajar-ka-halwa').states).not.toContain('Bangalore');
    // Modern pan-India urban → 'all'
    expect(byId('avocado-sandwich').region).toBe('all');
    expect(byId('espresso').region).toBe('all');
    // Seven-colour tea drops Bihar
    expect(byId('seven-colour-tea').states).not.toContain('Bihar');
    // Darjeeling (WB) → east
    expect(byId('darjeeling-tea').region).toBe('east');
    // South-Indian snack
    expect(byId('aloo-bonda').region).toBe('south');
    // UP+Bihar street food → north
    expect(byId('sattu-sharbat').region).toBe('north');
    // Nagpur (Maharashtra) → west
    expect(byId('chicken-poha-nagpur').region).toBe('west');
  });

  it('T11: keepRegionTrayItems respects the corrected region data', () => {
    // A west-user's tray with a Goan dish (now west), a genuinely-foreign south
    // dish (Kerala), and a region:'all' dish. keepRegionTrayItems keeps what is
    // local or shared and drops genuinely foreign items.
    const tray = {
      breakfast: [
        { id: 'mussel-stir-fry', sourceRegion: 'west' },
        { id: 'balaleet', sourceRegion: 'south' },
        { id: 'gulab-jamun', sourceRegion: 'all' },
        { id: 'espresso', region: 'all' },
      ],
    };
    const kept = keepRegionTrayItems(tray as any, 'west').breakfast as Array<Record<string, unknown>>;
    const ids = kept.map(m => m.id);
    expect(ids).toContain('mussel-stir-fry');
    expect(ids).toContain('gulab-jamun');
    expect(ids).toContain('espresso');
    expect(ids).not.toContain('balaleet');
  });
});