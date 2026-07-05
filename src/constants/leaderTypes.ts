export interface LeaderTypeConfig {
  label: string
  description: string
  emoji: string
  values: Record<string, string>
}

export const LEADER_TYPES: Record<string, LeaderTypeConfig> = {
  sales_driver: {
    label: 'Sales Driver',
    description: 'Hits numbers, builds urgency, and closes every gap',
    emoji: '🎯',
    values: {
      accountability:      'Accountability',
      urgency:             'Urgency',
      customer_focus:      'Customer Focus',
      goal_orientation:    'Goal Orientation',
      competitive_spirit:  'Competitive Spirit',
    },
  },
  team_builder: {
    label: 'Team Builder',
    description: 'Grows people, builds culture, and leads through others',
    emoji: '🤝',
    values: {
      development:    'Development',
      communication:  'Communication',
      recognition:    'Recognition',
      empowerment:    'Empowerment',
      inclusion:      'Inclusion',
    },
  },
  operator: {
    label: 'Operator',
    description: 'Drives execution, consistency, and process discipline',
    emoji: '⚙️',
    values: {
      execution:          'Execution',
      consistency:        'Consistency',
      process_discipline: 'Process Discipline',
      quality:            'Quality',
      follow_through:     'Follow-Through',
    },
  },
  floor_leader: {
    label: 'Floor Leader',
    description: 'Present, energetic, and owns the customer experience',
    emoji: '🏬',
    values: {
      presence:      'Presence',
      engagement:    'Engagement',
      energy:        'Energy',
      adaptability:  'Adaptability',
      ownership:     'Ownership',
    },
  },
}

export type LeaderTypeKey = keyof typeof LEADER_TYPES

export function getValues(leaderType: string | null | undefined): Record<string, string> {
  if (leaderType && leaderType in LEADER_TYPES) {
    return LEADER_TYPES[leaderType].values
  }
  // Fallback to a generic set if no type chosen yet
  return {
    accountability: 'Accountability',
    communication:  'Communication',
    execution:      'Execution',
    customer_focus: 'Customer Focus',
    development:    'Development',
  }
}
