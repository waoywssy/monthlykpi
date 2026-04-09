export interface BonusInput {
  id: string;
  name: string;
  team: string;
  period: string;
  selfTotal: number;
  managerTotal: number;
  finalScore: number;
  rating: string;
}

export interface BonusAllocation extends BonusInput {
  share: number;
  shareText: string;
  bonus: number;
  bonusFormatted: string;
}

export function allocateBonuses(records: BonusInput[], totalPool: number): BonusAllocation[] {
  if (!Number.isFinite(totalPool) || totalPool <= 0 || records.length === 0) {
    return records
      .slice()
      .sort((left, right) => right.finalScore - left.finalScore)
      .map((record) => ({
        ...record,
        share: 0,
        shareText: '0.00%',
        bonus: 0,
        bonusFormatted: '0',
      }));
  }

  // Calculate total score for all records
  const allTeamsTotalScore = records.reduce((sum, record) => sum + Math.max(record.finalScore, 0), 0);
  
  if (allTeamsTotalScore <= 0) {
    return records
      .slice()
      .sort((left, right) => right.finalScore - left.finalScore)
      .map((record) => ({
        ...record,
        share: 0,
        shareText: '0.00%',
        bonus: 0,
        bonusFormatted: '0',
      }));
  }

  // Group by team and calculate each team's total score
  const teamScores = new Map<string, number>();
  records.forEach((record) => {
    const current = teamScores.get(record.team) || 0;
    teamScores.set(record.team, current + Math.max(record.finalScore, 0));
  });

  // Calculate each team's pool share based on their total score relative to all teams
  const teamPools = new Map<string, number>();
  teamScores.forEach((score, team) => {
    teamPools.set(team, (score / allTeamsTotalScore) * totalPool);
  });

  // Allocate bonuses within each team
  const exactAllocations = records.map((record, index) => {
    const teamScore = teamScores.get(record.team) || 0;
    const teamPool = teamPools.get(record.team) || 0;
    
    // Share within the team
    const shareInTeam = teamScore > 0 ? Math.max(record.finalScore, 0) / teamScore : 0;
    const exactBonus = teamPool * shareInTeam;
    
    // Overall share (for display purposes)
    const overallShare = Math.max(record.finalScore, 0) / allTeamsTotalScore;
    
    const floorBonus = Math.floor(exactBonus);

    return {
      record,
      index,
      share: overallShare,
      floorBonus,
      remainder: exactBonus - floorBonus,
      teamId: record.team
    };
  });

  // Since we use Math.floor, we might have remaining cents/dollars
  // We should distribute remainders per team to keep team pools exact, 
  // but for simplicity and since we only deal with integers, we'll distribute 
  // the global remainder to those with the highest remainders globally.
  const allocated = exactAllocations.reduce((sum, item) => sum + item.floorBonus, 0);
  let remaining = Math.round(totalPool - allocated);

  const bonuses = exactAllocations.map((item) => item.floorBonus);
  exactAllocations
    .slice()
    .sort((left, right) => {
      if (right.remainder !== left.remainder) {
        return right.remainder - left.remainder;
      }
      return right.record.finalScore - left.record.finalScore;
    })
    .forEach((item) => {
      if (remaining <= 0) {
        return;
      }

      bonuses[item.index] += 1;
      remaining -= 1;
    });

  return exactAllocations
    .map((item) => ({
      ...item.record,
      share: item.share,
      shareText: `${(item.share * 100).toFixed(2)}%`,
      bonus: bonuses[item.index],
      bonusFormatted: bonuses[item.index].toLocaleString('zh-CN'),
    }))
    .sort((left, right) => {
      // First sort by team to group them together
      if (left.team !== right.team) {
        return left.team.localeCompare(right.team);
      }
      // Then sort by bonus descending
      if (right.bonus !== left.bonus) {
        return right.bonus - left.bonus;
      }
      return right.finalScore - left.finalScore;
    });
}
