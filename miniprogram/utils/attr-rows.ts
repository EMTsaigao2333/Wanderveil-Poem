/**
 * 属性面板数据（人生页与开局向导共用）
 *
 * 为什么放在 utils/：app.json 开了按需注入（lazyCodeLoading: requiredComponents），
 * **页面之间禁止互相 import**，共享代码必须落在 engine / data / utils。
 * 此前 play.ts 的 attrRows() 与 onboarding.ts 的 attrRowsOf() 是同一份逻辑写了两遍。
 *
 * 危险线依据 docs/design/09-fatality-and-consequence.md 第 3 节：
 * 引擎只有「致命属性归零即死」这一条生死线，界面必须让玩家提前看见信号。
 */

import type { AttrSystem } from '../data/attributes';

export interface AttrRow {
  key: string;
  name: string;
  /** 展示值（保留一位小数） */
  value: number;
  /** 属性条的宽度百分比 0~100 */
  pct: number;
  /** 危险档位：normal 正常 / warn 偏低 / low 危险 */
  level: 'normal' | 'warn' | 'low';
  /** 是否致命属性（归零即死）：界面上要更明显 */
  fatal: boolean;
}

/** 危险线阈值：低于 25% 变橙色，低于 10% 变红色 */
const WARN_PCT = 25;
const LOW_PCT = 10;

/** 按属性系统定义生成面板行（危险档位与致命标记都由 AttrDef 直接派生，不硬编码属性名） */
export function attrRowsOf(system: AttrSystem, values: Record<string, number>): AttrRow[] {
  return system.attrs.map((def) => {
    const value = Math.round((values[def.key] ?? 0) * 10) / 10;
    const span = def.max - def.min || 20;
    const pct = Math.max(0, Math.min(100, Math.round(((value - def.min) / span) * 100)));
    const level: AttrRow['level'] = pct < LOW_PCT ? 'low' : pct < WARN_PCT ? 'warn' : 'normal';
    return { key: def.key, name: def.name, value, pct, level, fatal: !!def.fatal };
  });
}