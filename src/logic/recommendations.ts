import type {
  ComponentImpact,
  ID,
  SupplierRecommendation,
  SupplyNetworkData,
} from '../types/supplyChain';

/**
 * Alternative-supplier scoring.
 *
 * For every component that is "blocked" or "partial" after a disruption, we
 * look at the suppliers still able to provide that component (the ones whose
 * capacity was NOT removed by the simulated event) and rank them with a
 * simple, explainable weighted score:
 *
 *   score = 45% x capacity headroom + 30% x lead time + 25% x cost
 *
 * Each sub-score is normalized against the best available alternative for
 * that same component (0-1), so the top candidate for a given shortage
 * always scores highest on that dimension. This is intentionally simple:
 * it does not model multi-period inventory, quality ratings, or contractual
 * terms. It is meant to explain *why* a supplier is recommended, not to be a
 * production procurement engine.
 */

const WEIGHT_CAPACITY = 0.45;
const WEIGHT_LEAD_TIME = 0.3;
const WEIGHT_COST = 0.25;

export function generateRecommendations(
  data: SupplyNetworkData,
  componentImpacts: ComponentImpact[],
  disruptedSupplierIds: ID[],
): SupplierRecommendation[] {
  const recommendations: SupplierRecommendation[] = [];

  const shortageImpacts = componentImpacts.filter(
    (c) => c.status === 'blocked' || c.status === 'partial',
  );

  for (const impact of shortageImpacts) {
    const component = data.components.find((c) => c.id === impact.componentId);
    if (!component) continue;

    // Candidate suppliers: still able to provide this component.
    const candidates = data.suppliers
      .filter((s) => impact.remainingSupplierIds.includes(s.id))
      .map((s) => ({
        supplier: s,
        link: s.supplies.find((l) => l.componentId === impact.componentId)!,
      }))
      .filter((c) => c.link);

    if (candidates.length === 0) continue;

    const maxCapacity = Math.max(...candidates.map((c) => c.link.capacityPerMonth));
    const minLeadTime = Math.min(...candidates.map((c) => c.link.leadTimeDays));
    const minCost = Math.min(...candidates.map((c) => c.link.unitCost));

    const disruptedSupplierLink = data.suppliers
      .find((s) => disruptedSupplierIds.includes(s.id))
      ?.supplies.find((l) => l.componentId === impact.componentId);

    for (const { supplier, link } of candidates) {
      const capacityScore = maxCapacity > 0 ? link.capacityPerMonth / maxCapacity : 0;
      const leadTimeScore = link.leadTimeDays > 0 ? minLeadTime / link.leadTimeDays : 1;
      const costScore = link.unitCost > 0 ? minCost / link.unitCost : 1;

      const score = Math.round(
        (WEIGHT_CAPACITY * capacityScore + WEIGHT_LEAD_TIME * leadTimeScore + WEIGHT_COST * costScore) * 100,
      );

      const reasonParts: string[] = [];
      reasonParts.push(
        `${link.isPrimary ? 'Primary' : 'Alternate'} source for ${component.name.toLowerCase()} with ${link.capacityPerMonth.toLocaleString(
          'en-IN',
        )} units/month of capacity`,
      );
      reasonParts.push(`${link.leadTimeDays}-day lead time`);
      reasonParts.push(`indicative cost ₹${link.unitCost.toLocaleString('en-IN')}/unit`);

      let limitation: string | undefined;
      if (impact.status === 'partial' && impact.totalCapacityAfter < impact.totalDemand) {
        limitation = `Combined remaining network capacity (${impact.totalCapacityAfter.toLocaleString(
          'en-IN',
        )}/mo) still falls short of demand (${impact.totalDemand.toLocaleString('en-IN')}/mo) by ${impact.shortfallUnits.toLocaleString(
          'en-IN',
        )} units — additional sourcing or inventory buffer is recommended.`;
      }
      if (disruptedSupplierLink && link.leadTimeDays > disruptedSupplierLink.leadTimeDays) {
        const diff = link.leadTimeDays - disruptedSupplierLink.leadTimeDays;
        const leadNote = `Lead time is ${diff} day${diff === 1 ? '' : 's'} longer than the disrupted supplier.`;
        limitation = limitation ? `${limitation} ${leadNote}` : leadNote;
      }

      recommendations.push({
        supplierId: supplier.id,
        componentId: impact.componentId,
        availableCapacity: link.capacityPerMonth,
        leadTimeDays: link.leadTimeDays,
        unitCost: link.unitCost,
        score,
        reason: reasonParts.join(' · '),
        limitation,
      });
    }
  }

  return recommendations.sort((a, b) => b.score - a.score);
}
