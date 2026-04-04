'use client';

type Unit = {
  unit_id: string;
  name: string;
  unit_type?: string;
  parent_unit_id?: string;
  commander_id?: string;
  description?: string;
  status?: string;
};

function buildTree(units: Unit[]): (Unit & { children: Unit[] })[] {
  const map: Record<string, Unit & { children: Unit[] }> = {};
  units.forEach(u => { map[u.unit_id] = { ...u, children: [] }; });
  const roots: (Unit & { children: Unit[] })[] = [];
  units.forEach(u => {
    if (u.parent_unit_id && map[u.parent_unit_id]) {
      map[u.parent_unit_id].children.push(map[u.unit_id]);
    } else {
      roots.push(map[u.unit_id]);
    }
  });
  return roots;
}

function UnitNode({ unit, depth = 0 }: { unit: Unit & { children: Unit[] }, depth?: number }) {
  const typeColors: Record<string, string> = {
    HQ: 'text-[#ffd100]', COMPANY: 'text-blue-400', PLATOON: 'text-purple-400',
    SECTION: 'text-green-400', TEAM: 'text-sky-400', DEPARTMENT: 'text-orange-400',
  };
  const typeColor = typeColors[(unit.unit_type || '').toUpperCase()] ?? 'text-[#6b7280]';

  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className={`bg-white border border-[#e5e9f0] rounded-xl p-4 mb-2 ${depth > 0 ? 'border-l-2 border-l-[#2e2e2e]' : ''}`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`text-xs font-mono uppercase ${typeColor}`}>{unit.unit_type || 'UNIT'}</span>
            </div>
            <p className="text-[#111827] font-medium">{unit.name}</p>
            {unit.description && <p className="text-[#6b7280] text-xs mt-0.5">{unit.description}</p>}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full ${unit.status === 'ACTIVE' ? 'bg-green-900/30 text-green-400' : 'bg-[#eef0f5] text-[#6b7280]'}`}>
            {unit.status || 'ACTIVE'}
          </span>
        </div>
      </div>
      {unit.children.map(child => (
        <UnitNode key={child.unit_id} unit={child as Unit & { children: Unit[] }} depth={depth + 1} />
      ))}
    </div>
  );
}

export default function UnitTree({ units }: { units: Unit[] }) {
  const tree = buildTree(units);

  if (units.length === 0) {
    return (
      <div className="bg-white border border-[#e5e9f0] rounded-xl p-8 text-center">
        <p className="text-[#6b7280] text-sm">No units configured yet.</p>
        <p className="text-[#333] text-xs mt-1">Units are the organisational structure — squads, teams, sections, departments.</p>
      </div>
    );
  }

  return (
    <div>
      {tree.map(root => (
        <UnitNode key={root.unit_id} unit={root} depth={0} />
      ))}
    </div>
  );
}
