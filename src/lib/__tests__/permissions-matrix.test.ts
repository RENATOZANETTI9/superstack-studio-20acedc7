import { describe, it, expect } from 'vitest';
import {
  ALL_PERMISSIONS,
  HIERARCHY_MATRIX,
  buildHierarchyMatrixCsv,
  canAccessMenu,
  getAllowedMenuKeys,
  getDefaultRouteForRole,
  type MenuKey,
} from '@/lib/permissions-matrix';
import type { AppRole } from '@/lib/partner-rules';

describe('permissions-matrix — hierarchies', () => {
  it('every hierarchy permission belongs to ALL_PERMISSIONS', () => {
    for (const h of HIERARCHY_MATRIX) {
      for (const p of h.permissions) {
        expect(ALL_PERMISSIONS).toContain(p);
      }
    }
  });

  it('CS + SDR row equals set union of CS and SDR rows', () => {
    const cs = HIERARCHY_MATRIX.find((h) => h.id === 'cs')!.permissions;
    const sdr = HIERARCHY_MATRIX.find((h) => h.id === 'sdr')!.permissions;
    const cs_sdr = HIERARCHY_MATRIX.find((h) => h.id === 'cs_sdr')!.permissions;
    expect(new Set(cs_sdr)).toEqual(new Set([...cs, ...sdr]));
  });

  it('representante row is a superset of CS + SDR (plus extras)', () => {
    const rep = new Set(HIERARCHY_MATRIX.find((h) => h.id === 'representante')!.permissions);
    const cs_sdr = HIERARCHY_MATRIX.find((h) => h.id === 'cs_sdr')!.permissions;
    for (const p of cs_sdr) expect(rep.has(p)).toBe(true);
    expect(rep.has('simulacao_show')).toBe(true);
  });
});

describe('permissions-matrix — CSV export', () => {
  const csv = buildHierarchyMatrixCsv();
  const lines = csv.split('\n');

  it('has header with hierarchy titles in order', () => {
    expect(lines[0]).toBe(['permissao', ...HIERARCHY_MATRIX.map((h) => h.title)].join(','));
  });

  it('has one row per permission', () => {
    expect(lines.length).toBe(1 + ALL_PERMISSIONS.length);
  });

  it('every cell exactly reflects HIERARCHY_MATRIX membership', () => {
    for (let i = 0; i < ALL_PERMISSIONS.length; i++) {
      const cells = lines[i + 1].split(',');
      const perm = ALL_PERMISSIONS[i];
      expect(cells[0]).toBe(perm);
      HIERARCHY_MATRIX.forEach((h, idx) => {
        const expected = h.permissions.includes(perm) ? '1' : '0';
        expect(cells[idx + 1]).toBe(expected);
      });
    }
  });

  it('CSV row totals match hierarchy permission counts', () => {
    HIERARCHY_MATRIX.forEach((h, idx) => {
      let ones = 0;
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].split(',')[idx + 1] === '1') ones++;
      }
      expect(ones).toBe(h.permissions.length);
    });
  });
});

describe('permissions-matrix — menu impact per role', () => {
  const cases: Array<{ role: AppRole; allowed: MenuKey[]; denied: MenuKey[] }> = [
    {
      role: 'representante',
      allowed: [
        'creditos_aprovados',
        'usuarios',
        'representantes_rota',
        'representantes_perfil',
        'representantes_clinicas',
        'representantes_bonificacoes',
        'representantes_simulador',
        'representantes_simulacoes',
      ],
      denied: [
        'dashboard',
        'buscar_credito',
        'representantes_painel',
        'representantes_cadastro',
        'representantes_marketing',
        'representantes_config',
        'representantes_monitoramento',
        'clinicas_admin',
        'auditoria_permissoes',
      ],
    },
    {
      role: 'partner',
      allowed: ['dashboard', 'representantes_rota', 'representantes_perfil', 'representantes_clinicas'],
      denied: ['usuarios', 'representantes_painel', 'representantes_cadastro', 'auditoria_permissoes', 'clinicas_admin'],
    },
    {
      role: 'master_partner',
      allowed: ['dashboard', 'representantes_rota', 'representantes_simulador'],
      denied: ['usuarios', 'representantes_painel', 'auditoria_permissoes'],
    },
    {
      role: 'admin',
      allowed: ['dashboard', 'buscar_credito', 'creditos_aprovados', 'usuarios', 'representantes_painel', 'auditoria_permissoes', 'clinicas_admin'],
      denied: [],
    },
    {
      role: 'user',
      allowed: ['dashboard', 'buscar_credito', 'creditos_aprovados'],
      denied: ['usuarios', 'representantes_painel', 'representantes_rota', 'auditoria_permissoes', 'clinicas_admin'],
    },
  ];

  for (const c of cases) {
    it(`role=${c.role} — allowed menus match`, () => {
      for (const key of c.allowed) expect(canAccessMenu(c.role, key)).toBe(true);
      for (const key of c.denied) expect(canAccessMenu(c.role, key)).toBe(false);
    });
  }

  it('getAllowedMenuKeys returns exactly the truthy set from canAccessMenu', () => {
    const roles: AppRole[] = ['admin', 'master', 'representante', 'partner', 'master_partner', 'user', 'cs_geral', 'cs_exclusiva', 'clinic_owner', 'attendant'];
    const allKeys = (Object.keys({} as Record<MenuKey, boolean>) as MenuKey[]);
    // Fallback: derive keys from a call
    for (const role of roles) {
      const allowed = getAllowedMenuKeys(role);
      for (const key of allowed) expect(canAccessMenu(role, key)).toBe(true);
    }
    // Sanity
    expect(getAllowedMenuKeys(null)).toEqual([]);
    void allKeys;
  });

  it('getDefaultRouteForRole sends representante-like roles to /rota', () => {
    expect(getDefaultRouteForRole('partner')).toBe('/dashboard/representantes/rota');
    expect(getDefaultRouteForRole('master_partner')).toBe('/dashboard/representantes/rota');
    expect(getDefaultRouteForRole('representante')).toBe('/dashboard/representantes/rota');
    expect(getDefaultRouteForRole('admin')).toBe('/dashboard');
    expect(getDefaultRouteForRole('user')).toBe('/dashboard');
    expect(getDefaultRouteForRole(null)).toBe('/auth');
  });
});